import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { nome, username, senha, role, tenantId } = await req.json()

  try {
    const data: any = { nome, username, role, tenantId: tenantId || null }
    // Only update password if a new one was provided
    if (senha && senha.trim() !== '') {
      data.senha = await bcrypt.hash(senha, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data
    })
    return NextResponse.json({ success: true, user: { id: user.id, nome: user.nome } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Protect the main super admin from being deleted
  const user = await prisma.user.findUnique({ where: { id } })
  if (user?.username === 'admin') {
    return NextResponse.json({ error: 'O usuário admin principal não pode ser excluído.' }, { status: 403 })
  }

  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
