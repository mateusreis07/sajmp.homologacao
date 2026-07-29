import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse('Não autorizado', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantSlugQuery = searchParams.get('tenantId')
    let tenantId = session.user.tenantId

    if (session.user.role === 'SUPER_ADMIN' && tenantSlugQuery) {
       const t = await prisma.tenant.findUnique({ where: { slug: tenantSlugQuery }})
       if (t) tenantId = t.id
    }

    if (!tenantId) {
       return new NextResponse('Tenant não encontrado', { status: 400 })
    }

    const items = await prisma.testItem.findMany({
      where: { tenantId },
      orderBy: { numeroRoteiro: 'asc' }
    })

    const header = [
      'ID',
      'SISTEMA',
      'MÓDULO',
      'TELA/FUNCIONALIDADE',
      'CENÁRIO',
      'REQUISITOS',
      'RESPONSÁVEL',
      'STATUS',
      'CHAMADO',
      'STATUS CHAMADO',
      'OBSERVAÇÃO',
      'SUBSÍDIO',
      'ARQUIVADO'
    ]

    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`

    const lines = [header.join(';')]

    items.forEach((i) => {
      let statusStr = i.status
      if (statusStr === 'PENDENTE') statusStr = ''
      else if (statusStr === 'FUNCIONA_COM_RESSALVAS') statusStr = 'FUNCIONA COM RESSALVAS'
      else if (statusStr === 'ERRO_IMPEDITIVO') statusStr = 'ERRO IMPEDITIVO'
      else if (statusStr === 'ITEM_DESABILITADO') statusStr = 'ITEM DESABILITADO'

      lines.push(
        [
          i.numeroRoteiro,
          i.sistema,
          i.modulo,
          i.tela,
          i.cenario,
          i.requisitos,
          i.responsavel,
          statusStr,
          i.chamado,
          i.statusChamado,
          i.observacao,
          i.subsidio,
          i.arquivado ? 'SIM' : ''
        ]
          .map(esc)
          .join(';')
      )
    })

    const csvContent = '\uFEFF' + lines.join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="roteiro_homologacao.csv"'
      }
    })
  } catch (error) {
    console.error(error)
    return new NextResponse('Erro ao exportar CSV', { status: 500 })
  }
}


