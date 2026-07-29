import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
       return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 400 })
    }

    const item = await prisma.testItem.findUnique({
      where: { id: parseInt(id), tenantId },
      include: {
        history: {
          orderBy: { timestamp: 'desc' }
        },
        roteiroVersao: {
          select: { status: true }
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao buscar item' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await request.json()
  
  const itemId = parseInt(id)
  
  if (!data.usuario) {
    return NextResponse.json({ error: 'Usuário é obrigatório' }, { status: 400 })
  }

  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantSlugQuery = searchParams.get('tenantId') || data.tenantId
    let tenantId = session.user.tenantId

    if (session.user.role === 'SUPER_ADMIN' && tenantSlugQuery) {
       const t = await prisma.tenant.findUnique({ where: { slug: tenantSlugQuery }})
       if (t) tenantId = t.id
    }

    if (!tenantId) {
       return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 400 })
    }

    // We use a transaction to ensure concurrency safety and history recording
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.testItem.findUnique({
        where: { id: itemId, tenantId },
        include: { roteiroVersao: true }
      })

      if (!current) {
        throw new Error('Item não encontrado')
      }

      if (current.roteiroVersao?.status === 'CONCLUIDO') {
        throw new Error('Não é possível editar itens de uma versão concluída.')
      }

      const updates: any = {}
      const changes: string[] = []

      const checkField = (field: keyof typeof current, label: string) => {
        if (data[field] !== undefined && data[field] !== current[field]) {
          updates[field] = data[field]
          changes.push(`${label} alterado(a): ${current[field] || '(vazio)'} → ${data[field] || '(vazio)'}`)
        }
      }

      checkField('responsavel', 'Responsável')
      checkField('status', 'Status')
      checkField('chamado', 'Chamado')
      checkField('statusChamado', 'Status do Chamado')
      checkField('observacao', 'Observação')
      checkField('subsidio', 'Subsídio')

      if (changes.length === 0) {
        return current // No changes
      }

      const updated = await tx.testItem.update({
        where: { id: itemId },
        data: updates
      })

      await tx.testItemHistory.create({
        data: {
          testItemId: itemId,
          usuario: data.usuario,
          descricao: changes.join(' | ')
        }
      })

      return updated
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error(error)
    if (error.message === 'Item não encontrado') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error.message === 'Não é possível editar itens de uma versão concluída.') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar item' }, { status: 500 })
  }
}
