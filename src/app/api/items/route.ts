import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

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
  
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const sistema = searchParams.get('sistema')
  const modulo = searchParams.get('modulo')
  const status = searchParams.get('status')
  const responsavel = searchParams.get('responsavel')
  const busca = searchParams.get('busca')
  const somentePendentes = searchParams.get('somentePendentes') === 'true'
  const mostrarArquivados = searchParams.get('mostrarArquivados') === 'true'
  const versaoIdParam = searchParams.get('versaoId')

  try {
    let targetVersao = null;
    let targetVersaoId = null;
    if (versaoIdParam) {
      targetVersaoId = parseInt(versaoIdParam);
      targetVersao = await prisma.roteiroVersao.findUnique({ where: { id: targetVersaoId } });
    } else {
      // Find latest version
      const latestVersion = await prisma.roteiroVersao.findFirst({
        where: { tenantId },
        orderBy: { id: 'desc' }
      });
      if (latestVersion) {
        targetVersaoId = latestVersion.id;
        targetVersao = latestVersion;
      }
    }

    const where: any = { tenantId }
    if (targetVersaoId) {
      where.roteiroVersaoId = targetVersaoId
    }

    if (!mostrarArquivados) {
      where.arquivado = false
    }

    if (sistema) where.sistema = sistema
    if (modulo) where.modulo = modulo
    if (status) where.status = status
    if (responsavel) where.responsavel = responsavel
    if (somentePendentes) where.status = 'PENDENTE'

    if (busca) {
      where.OR = [
        { tela: { contains: busca } },
        { cenario: { contains: busca } },
        { requisitos: { contains: busca } },
        { chamado: { contains: busca } }
      ]
    }

    const [items, total] = await Promise.all([
      prisma.testItem.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { numeroRoteiro: 'asc' },
        select: {
          id: true,
          numeroRoteiro: true,
          sistema: true,
          modulo: true,
          tela: true,
          cenario: true,
          status: true,
          responsavel: true,
          arquivado: true
        }
      }),
      prisma.testItem.count({ where })
    ])

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      versao: targetVersao
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao buscar itens' }, { status: 500 })
  }
}


