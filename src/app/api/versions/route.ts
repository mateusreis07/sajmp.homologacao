import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tenantSlugQuery = searchParams.get('tenantId')
  let tenantId = session.user.tenantId

  if (session.user.role === 'SUPER_ADMIN' && tenantSlugQuery) {
     const t = await prisma.tenant.findUnique({ where: { slug: tenantSlugQuery }})
     if (t) tenantId = t.id
  }

  if (!tenantId) {
     return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 400 })
  }

  try {
    const versions = await prisma.roteiroVersao.findMany({
      where: { tenantId },
      orderBy: { id: 'desc' }
    })

    return NextResponse.json(versions)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao buscar versões' }, { status: 500 })
  }
}

// Criar nova versão zerando itens
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { versao, titulo, tenantId: bodyTenantId, force } = await request.json()

    if (!versao) {
      return NextResponse.json({ error: 'Número da versão é obrigatório' }, { status: 400 })
    }

    let tenantId = session.user.tenantId
    if (session.user.role === 'SUPER_ADMIN' && bodyTenantId) {
       const t = await prisma.tenant.findUnique({ where: { slug: bodyTenantId } })
       if (t) tenantId = t.id
       else return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
    }

    if (!tenantId) {
       return NextResponse.json({ error: 'Tenant inválido' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find the latest active version
      const currentVersion = await tx.roteiroVersao.findFirst({
        where: { tenantId },
        orderBy: { id: 'desc' }
      })

      // If current is EM_ANDAMENTO and not forced, ask for confirmation
      if (currentVersion?.status === 'EM_ANDAMENTO' && !force) {
        throw new Error('REQUIRE_CONFIRMATION')
      }

      // Create new version
      const newVersion = await tx.roteiroVersao.create({
        data: {
          versao,
          titulo: titulo || 'Roteiro de Homologação SAJ5',
          tenantId,
          versaoAnteriorId: currentVersion?.id,
          status: 'EM_ANDAMENTO'
        }
      })

      // If there was a previous version, duplicate its active items
      if (currentVersion) {
        // Mark old version as completed ONLY IF IT IS NOT BASE
        if (currentVersion.status !== 'BASE') {
          await tx.roteiroVersao.update({
            where: { id: currentVersion.id },
            data: { status: 'CONCLUIDO', dataFim: new Date() }
          })
        }

        // Fetch old items
        const oldItems = await tx.testItem.findMany({
          where: {
            roteiroVersaoId: currentVersion.id,
            arquivado: false,
            tenantId
          }
        })

        // Insert duplicated items with reset fields
        const newItemsData = oldItems.map(item => ({
          numeroRoteiro: item.numeroRoteiro,
          sistema: item.sistema,
          modulo: item.modulo,
          tela: item.tela,
          cenario: item.cenario,
          requisitos: item.requisitos,
          responsavel: '', // Reset
          status: 'PENDENTE', // Reset
          chamado: '', // Reset
          statusChamado: '', // Reset
          observacao: '', // Reset
          subsidio: '', // Reset
          arquivado: false,
          roteiroVersaoId: newVersion.id,
          tenantId
        }))

        if (newItemsData.length > 0) {
          await tx.testItem.createMany({
            data: newItemsData
          })
        }
      }

      return newVersion
    }, {
      maxWait: 15000,
      timeout: 60000
    })

    return NextResponse.json({ success: true, version: result })
  } catch (error: any) {
    console.error(error)
    if (error.message === 'REQUIRE_CONFIRMATION') {
      return NextResponse.json({ confirm_conclude: true }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro ao criar nova versão', details: error.message }, { status: 500 })
  }
}
