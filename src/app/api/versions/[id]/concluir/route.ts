import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  try {
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
       return NextResponse.json({ error: 'Tenant inválido' }, { status: 400 })
    }

    const version = await prisma.roteiroVersao.findUnique({
      where: { id: parseInt(id), tenantId }
    })

    if (!version) {
      return NextResponse.json({ error: 'Versão não encontrada' }, { status: 404 })
    }

    if (version.status === 'CONCLUIDO') {
      return NextResponse.json({ error: 'A versão já está concluída' }, { status: 400 })
    }

    const updated = await prisma.roteiroVersao.update({
      where: { id: parseInt(id) },
      data: {
        status: 'CONCLUIDO',
        dataFim: new Date()
      }
    })

    return NextResponse.json({ success: true, version: updated })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao concluir versão', details: error.message }, { status: 500 })
  }
}
