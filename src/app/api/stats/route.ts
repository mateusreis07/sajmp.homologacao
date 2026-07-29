import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tenantSlugQuery = searchParams.get('tenantId') // might be the slug
    let tenantId = session.user.tenantId

    if (session.user.role === 'SUPER_ADMIN' && tenantSlugQuery) {
       const t = await prisma.tenant.findUnique({ where: { slug: tenantSlugQuery }})
       if (t) tenantId = t.id
    }

    if (!tenantId) {
       return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 400 })
    }

    const versaoIdParam = searchParams.get('versaoId')
    let targetVersaoId = null;
    
    if (versaoIdParam) {
      targetVersaoId = parseInt(versaoIdParam);
    } else {
      const latestVersion = await prisma.roteiroVersao.findFirst({
        where: { tenantId },
        orderBy: { id: 'desc' }
      });
      if (latestVersion) targetVersaoId = latestVersion.id;
    }

    const where: any = { arquivado: false, tenantId }
    if (targetVersaoId) {
      where.roteiroVersaoId = targetVersaoId
    }

    const items = await prisma.testItem.findMany({
      where,
      select: { sistema: true, status: true }
    })

    const total = items.length
    const byStatus = {
      PENDENTE: 0,
      FUNCIONA: 0,
      FUNCIONA_COM_RESSALVAS: 0,
      ERRO_IMPEDITIVO: 0,
      ITEM_DESABILITADO: 0
    }

    const sistemaMap = new Map<string, { total: number; testados: number }>()

    for (const item of items) {
      if (item.status in byStatus) {
        byStatus[item.status as keyof typeof byStatus]++
      }

      const sys = item.sistema || '(sem sistema)'
      if (!sistemaMap.has(sys)) {
        sistemaMap.set(sys, { total: 0, testados: 0 })
      }
      const s = sistemaMap.get(sys)!
      s.total++
      if (item.status !== 'PENDENTE') {
        s.testados++
      }
    }

    const homologados = total - byStatus.PENDENTE
    const restantes = byStatus.PENDENTE

    const sistemas = Array.from(sistemaMap.entries())
      .map(([sistema, v]) => ({
        sistema,
        total: v.total,
        testados: v.testados,
        pct: v.total ? Math.round((v.testados / v.total) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.total - a.total)

    return NextResponse.json({
      total,
      homologados,
      restantes,
      byStatus,
      sistemas
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}


