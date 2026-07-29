import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { parseCSV, decodeBuffer } from '@/lib/csv-parser'
import { rowsToItems, computeDiff } from '@/lib/diff-engine'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    let csvText: string

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      // Arquivo enviado como FormData — decodificamos corretamente no servidor
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json({ error: 'Arquivo não encontrado no form.' }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      csvText = decodeBuffer(buffer)
    } else {
      // Texto colado diretamente como JSON
      const body = await request.json()
      csvText = body.csvText
    }

    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json({ error: 'Texto CSV inválido' }, { status: 400 })
    }

    const rows = parseCSV(csvText, ';')

    // DEBUG: mostrar as primeiras linhas e a linha de cabeçalho detectada
    const debugRows = rows.slice(0, 15).map((r, i) => `[${i}] ${JSON.stringify(r)}`)

    const { items, error } = rowsToItems(rows)

    if (error) {
      return NextResponse.json({ error, debug: debugRows }, { status: 400 })
    }

    const currentItems = await prisma.testItem.findMany({
      where: { arquivado: false, tenantId }
    })

    const diff = computeDiff(currentItems, items)

    // DEBUG: IDs dos primeiros itens parsed
    const debugItems = items.slice(0, 5).map(i => ({ id: i.id, sistema: i.sistema, tela: i.tela }))
    const debugDbItems = currentItems.slice(0, 5).map(i => ({ id: i.numeroRoteiro, sistema: i.sistema }))

    return NextResponse.json({
      parsedItems: items,
      diff,
      _debug: {
        totalRows: rows.length,
        totalParsed: items.length,
        totalInDb: currentItems.length,
        firstRows: debugRows,
        firstParsed: debugItems,
        firstInDb: debugDbItems,
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao analisar CSV', detail: String(error) }, { status: 500 })
  }
}


