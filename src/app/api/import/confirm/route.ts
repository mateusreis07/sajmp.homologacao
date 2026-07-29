import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { RawParsedItem } from '@/lib/diff-engine'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

function parseStatus(raw: string): string {
  if (raw === 'FUNCIONA') return 'FUNCIONA'
  if (raw === 'FUNCIONA COM RESSALVAS' || raw === 'FUNCIONA_COM_RESSALVAS') return 'FUNCIONA_COM_RESSALVAS'
  if (raw === 'ERRO IMPEDITIVO' || raw === 'ERRO_IMPEDITIVO') return 'ERRO_IMPEDITIVO'
  if (raw === 'ITEM DESABILITADO' || raw === 'ITEM_DESABILITADO') return 'ITEM_DESABILITADO'
  return 'PENDENTE'
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { parsedItems, versionLabel, usuario, importarStatuses, tenantId: bodyTenantId } = await request.json()

    let tenantId = session.user.tenantId
    if (session.user.role === 'SUPER_ADMIN' && bodyTenantId) {
      const t = await prisma.tenant.findUnique({ where: { slug: bodyTenantId } })
      if (t) tenantId = t.id
      else return NextResponse.json({ error: 'Tenant nao encontrado' }, { status: 404 })
    }

    if (!tenantId) return NextResponse.json({ error: 'Tenant invalido' }, { status: 400 })
    if (!parsedItems || !Array.isArray(parsedItems)) return NextResponse.json({ error: 'Itens invalidos' }, { status: 400 })

    const items: RawParsedItem[] = parsedItems
    const user = usuario || 'sistema'
    const currentVersionLabel = versionLabel || 'Nova Importacao'

    // 1. Encontrar ou criar roteiro
    let roteiro = await prisma.roteiroVersao.findFirst({ where: { tenantId }, orderBy: { id: 'desc' } })
    if (!roteiro) {
      roteiro = await prisma.roteiroVersao.create({
        data: { titulo: 'Roteiro de Homologacao SAJ5', versao: currentVersionLabel, tenantId: tenantId as string, status: 'EM_ANDAMENTO' }
      })
    }

    // 2. Buscar itens atuais
    const oldItems = await prisma.testItem.findMany({ where: { tenantId, roteiroVersaoId: roteiro.id } })
    const oldById = new Map(oldItems.map((i) => [i.numeroRoteiro.toString(), i]))
    const newIds = new Set(items.map((i) => i.id))

    // 3. Classificar operacoes
    const toCreate: any[] = []
    const toUpdateIds: number[] = []
    const toUpdateSistema: string[] = []
    const toUpdateModulo: string[] = []
    const toUpdateTela: string[] = []
    const toUpdateCenario: string[] = []
    const toUpdateRequisitos: string[] = []
    const toUpdateStatus: string[] = []
    const toUpdateResponsavel: string[] = []
    const toUpdateChamado: string[] = []
    const toUpdateStatusChamado: string[] = []
    const toUpdateObservacao: string[] = []
    const toUpdateSubsidio: string[] = []
    const toArchiveIds: number[] = []
    const historyToCreate: any[] = []

    for (const raw of items) {
      const old = oldById.get(raw.id)
      const status = parseStatus(raw.status || '')

      if (!old) {
        toCreate.push({
          numeroRoteiro: parseInt(raw.id, 10),
          sistema: raw.sistema, modulo: raw.modulo, tela: raw.tela,
          cenario: raw.cenario, requisitos: raw.requisitos,
          responsavel: raw.responsavel, status,
          chamado: raw.chamado, statusChamado: raw.statusChamado,
          observacao: raw.observacao, subsidio: raw.subsidio,
          arquivado: false, roteiroVersaoId: roteiro.id, tenantId: tenantId as string,
        })
      } else {
        const descrChanged = old.sistema !== raw.sistema || old.modulo !== raw.modulo || old.tela !== raw.tela || old.cenario !== raw.cenario || old.requisitos !== raw.requisitos

        toUpdateIds.push(old.id)
        toUpdateSistema.push(raw.sistema)
        toUpdateModulo.push(raw.modulo)
        toUpdateTela.push(raw.tela)
        toUpdateCenario.push(raw.cenario)
        toUpdateRequisitos.push(raw.requisitos || '')
        toUpdateStatus.push(importarStatuses ? status : old.status)
        toUpdateResponsavel.push(importarStatuses ? (raw.responsavel || old.responsavel) : old.responsavel)
        toUpdateChamado.push(importarStatuses ? (raw.chamado || old.chamado) : old.chamado)
        toUpdateStatusChamado.push(importarStatuses ? (raw.statusChamado || old.statusChamado) : old.statusChamado)
        toUpdateObservacao.push(importarStatuses ? (raw.observacao || old.observacao) : old.observacao)
        toUpdateSubsidio.push(importarStatuses ? (raw.subsidio || old.subsidio) : old.subsidio)

        if (descrChanged) {
          historyToCreate.push({ testItemId: old.id, usuario: user, descricao: 'Descricao do item atualizada na nova importacao.' })
        }
      }
    }

    // Itens removidos -> arquivar
    for (const old of oldItems) {
      if (!newIds.has(old.numeroRoteiro.toString()) && !old.arquivado) {
        toArchiveIds.push(old.id)
        historyToCreate.push({ testItemId: old.id, usuario: user, descricao: 'Item nao esta mais presente na versao importada (arquivado).' })
      }
    }

    // 4. Criar novos em lote (1 query)
    if (toCreate.length > 0) {
      await prisma.testItem.createMany({ data: toCreate, skipDuplicates: true })
    }

    // 5. Arquivar removidos (1 query)
    if (toArchiveIds.length > 0) {
      await prisma.$executeRaw`UPDATE "TestItem" SET "arquivado" = true WHERE id = ANY(${toArchiveIds}::int[])`
    }

    // 6. Atualizar estrutura + status via UNNEST (1 query)
    if (toUpdateIds.length > 0) {
      await prisma.$executeRaw`
        UPDATE "TestItem" t
        SET
          sistema            = v.sistema,
          modulo             = v.modulo,
          tela               = v.tela,
          cenario            = v.cenario,
          requisitos         = v.requisitos,
          status             = v.status,
          responsavel        = v.responsavel,
          chamado            = v.chamado,
          "statusChamado"    = v.status_chamado,
          observacao         = v.observacao,
          subsidio           = v.subsidio,
          arquivado          = false,
          "roteiroVersaoId"  = ${roteiro.id}
        FROM (
          SELECT
            UNNEST(${toUpdateIds}::int[])          AS id,
            UNNEST(${toUpdateSistema}::text[])     AS sistema,
            UNNEST(${toUpdateModulo}::text[])      AS modulo,
            UNNEST(${toUpdateTela}::text[])        AS tela,
            UNNEST(${toUpdateCenario}::text[])     AS cenario,
            UNNEST(${toUpdateRequisitos}::text[])  AS requisitos,
            UNNEST(${toUpdateStatus}::text[])      AS status,
            UNNEST(${toUpdateResponsavel}::text[]) AS responsavel,
            UNNEST(${toUpdateChamado}::text[])     AS chamado,
            UNNEST(${toUpdateStatusChamado}::text[]) AS status_chamado,
            UNNEST(${toUpdateObservacao}::text[])  AS observacao,
            UNNEST(${toUpdateSubsidio}::text[])    AS subsidio
        ) v
        WHERE t.id = v.id
      `
    }

    // 7. Historico dos novos criados
    if (toCreate.length > 0) {
      const createdNums = toCreate.map((c) => c.numeroRoteiro)
      const newlyCreated = await prisma.testItem.findMany({
        where: { numeroRoteiro: { in: createdNums }, roteiroVersaoId: roteiro.id, tenantId: tenantId as string },
        select: { id: true }
      })
      for (const nc of newlyCreated) {
        historyToCreate.push({ testItemId: nc.id, usuario: user, descricao: 'Item incluido na importacao.' })
      }
    }

    // 8. Historico em lote (1 query)
    if (historyToCreate.length > 0) {
      await prisma.testItemHistory.createMany({ data: historyToCreate })
    }

    return NextResponse.json({ success: true, versionId: roteiro.id })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao confirmar importacao', details: String(error) }, { status: 500 })
  }
}

