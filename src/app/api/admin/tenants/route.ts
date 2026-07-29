import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import defaultItems from '@/lib/data/default-items.json'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { nome, slug } = await req.json()

    if (!nome || !slug) {
      return NextResponse.json({ error: 'Nome e slug são obrigatórios' }, { status: 400 })
    }

    // 1. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { nome, slug }
    })

    // 2. Create the default Roteiro Versao
    const roteiro = await prisma.roteiroVersao.create({
      data: {
        titulo: 'Carga Inicial de Itens',
        versao: 'Base de Itens',
        status: 'BASE',
        tenantId: tenant.id
      }
    })

    // 3. Prepare default items (zeroed out)
    const dataToInsert = defaultItems.map((raw: any) => ({
      numeroRoteiro: parseInt(raw.id, 10),
      sistema: raw.sistema,
      modulo: raw.modulo,
      tela: raw.tela,
      cenario: raw.cenario,
      requisitos: raw.requisitos,
      responsavel: '',
      status: 'PENDENTE',
      chamado: '',
      statusChamado: '',
      observacao: '',
      subsidio: '',
      arquivado: false,
      roteiroVersaoId: roteiro.id,
      tenantId: tenant.id
    }))

    // 4. Insert items
    await prisma.testItem.createMany({
      data: dataToInsert
    })

    return NextResponse.json({ success: true, tenant })
  } catch (error: any) {
    console.error('Error creating tenant:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
