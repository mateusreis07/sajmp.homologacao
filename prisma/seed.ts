import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

function parseCSV(text: string, delimiter: string = ';'): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else {
      if (c === '"') {
        inQuotes = true
      } else if (c === delimiter) {
        row.push(field)
        field = ''
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') {
          i++
        }
        row.push(field)
        rows.push(row)
        row = []
        field = ''
      } else {
        field += c
      }
    }
  }
  if (row.length > 0 || field !== '') {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function tryDecode(encoding: string, buffer: Buffer): string | null {
  try {
    const dec = new TextDecoder(encoding, { fatal: true })
    return dec.decode(buffer)
  } catch (e) {
    return null
  }
}

function decodeBuffer(buffer: Buffer): string {
  // Try UTF-8 first
  const utf8 = tryDecode('utf-8', buffer)
  if (utf8) {
    const replacementCount = (utf8.match(/\uFFFD/g) || []).length
    if (replacementCount === 0) return utf8
  }
  // Fallback to Windows-1252
  const latin1 = tryDecode('windows-1252', buffer)
  return latin1 || utf8 || buffer.toString('utf-8')
}

async function main() {
  const csvPath = path.join(__dirname, 'seed-data.csv')
  console.log(`Reading CSV from ${csvPath}`)
  const buffer = fs.readFileSync(csvPath)
  const text = decodeBuffer(buffer)
  const rows = parseCSV(text, ';')

  let headerIdx = -1
  for (let i = 0; i < rows.length; i++) {
    const upper = rows[i].map(c => (c || '').trim().toUpperCase())
    if (upper.includes('ID') && upper.includes('SISTEMA') && upper.includes('STATUS')) {
      headerIdx = i
      break
    }
  }

  if (headerIdx === -1) {
    throw new Error('Header row not found in CSV')
  }

  const header = rows[headerIdx].map(c => (c || '').trim().toUpperCase())
  const colIndex = (name: string) => header.indexOf(name)

  const idx = {
    id: colIndex('ID'),
    sistema: colIndex('SISTEMA'),
    modulo: colIndex('MÓDULO') >= 0 ? colIndex('MÓDULO') : colIndex('MODULO'),
    tela: header.findIndex(h => h.startsWith('TELA')),
    cenario: colIndex('CENÁRIO') >= 0 ? colIndex('CENÁRIO') : colIndex('CENARIO'),
    requisitos: colIndex('REQUISITOS'),
    responsavel: colIndex('RESPONSÁVEL') >= 0 ? colIndex('RESPONSÁVEL') : colIndex('RESPONSAVEL'),
    status: colIndex('STATUS'),
    chamado: colIndex('CHAMADO'),
    statusChamado: header.findIndex(h => h.startsWith('STATUS CHAMADO')),
    observacao: colIndex('OBSERVAÇÃO') >= 0 ? colIndex('OBSERVAÇÃO') : colIndex('OBSERVACAO'),
    subsidio: colIndex('SUBSÍDIO') >= 0 ? colIndex('SUBSÍDIO') : colIndex('SUBSIDIO')
  }

  const items = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || !r.length) continue
    const rawId = (r[idx.id] || '').trim()
    if (!/^\d+$/.test(rawId)) continue

    const get = (key: keyof typeof idx) => (idx[key] >= 0 && r[idx[key]] !== undefined ? r[idx[key]].trim() : '')

    const rawStatus = get('status').toUpperCase()
    let status = 'PENDENTE'
    if (rawStatus === 'FUNCIONA') status = 'FUNCIONA'
    if (rawStatus === 'FUNCIONA COM RESSALVAS' || rawStatus === 'FUNCIONA_COM_RESSALVAS') status = 'FUNCIONA_COM_RESSALVAS'
    if (rawStatus === 'ERRO IMPEDITIVO' || rawStatus === 'ERRO_IMPEDITIVO') status = 'ERRO_IMPEDITIVO'
    if (rawStatus === 'ITEM DESABILITADO' || rawStatus === 'ITEM_DESABILITADO') status = 'ITEM_DESABILITADO'

    items.push({
      numeroRoteiro: parseInt(rawId, 10),
      sistema: get('sistema'),
      modulo: get('modulo'),
      tela: get('tela'),
      cenario: get('cenario'),
      requisitos: get('requisitos'),
      responsavel: '',
      status: 'PENDENTE',
      chamado: '',
      statusChamado: '',
      observacao: '',
      subsidio: '',
      arquivado: false
    })
  }

  console.log(`Found ${items.length} items to insert`)

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'mpsp' },
    update: {},
    create: { nome: 'MPSP', slug: 'mpsp' }
  })

  const roteiroVersao = await prisma.roteiroVersao.create({
    data: {
      titulo: 'Roteiro de Homologação SAJMP',
      versao: '5.0',
      tenantId: tenant.id,
    }
  })

  // We can use createMany for TestItem
  await prisma.testItem.createMany({
    data: items.map(i => ({ ...i, roteiroVersaoId: roteiroVersao.id, tenantId: tenant.id }))
  })

  // We need to fetch inserted items to get their database IDs for History
  const insertedItems = await prisma.testItem.findMany()

  // Prepare history entries
  const historyData = insertedItems.map(i => ({
    testItemId: i.id,
    usuario: 'sistema',
    tenantId: tenant.id,
    descricao: 'Item carregado da base inicial (planilha SAJ5).'
  }))

  await prisma.testItemHistory.createMany({
    data: historyData
  })

  console.log('Seed finished successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
