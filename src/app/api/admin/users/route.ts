import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { nome, username, senha, role, tenantId } = await req.json()

  if (!nome || !username || !senha) {
    return NextResponse.json({ error: 'Nome, username e senha são obrigatórios' }, { status: 400 })
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10)
    const user = await prisma.user.create({
      data: {
        nome,
        username,
        senha: senhaHash,
        role: role || 'ANALISTA',
        tenantId: tenantId || null,
      }
    })
    return NextResponse.json({ success: true, user: { id: user.id, nome: user.nome, username: user.username } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
