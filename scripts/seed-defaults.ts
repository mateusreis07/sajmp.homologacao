import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { parseCSV, decodeBuffer } from '../src/lib/csv-parser'
import { rowsToItems } from '../src/lib/diff-engine'

const prisma = new PrismaClient()

async function main() {
  const filePath = path.join(__dirname, '..', 'Planilha homologação versão.csv')
  const buffer = fs.readFileSync(filePath)
  const csvText = decodeBuffer(buffer)

  const rows = parseCSV(csvText, ';')
  const { items, error } = rowsToItems(rows)

  if (error) {
    console.error('Error parsing CSV:', error)
    return
  }

  console.log(`Parsed ${items.length} items from CSV.`)

  const tenants = await prisma.tenant.findMany({
    include: {
      _count: {
        select: { testItems: true }
      }
    }
  })

  for (const tenant of tenants) {
    if (tenant._count.testItems === 0) {
      console.log(`Tenant ${tenant.slug} has 0 items. Seeding 1911 default items...`)

      const roteiro = await prisma.roteiroVersao.create({
        data: {
          titulo: 'Roteiro de Homologação SAJMP',
          versao: '5.0',
          tenantId: tenant.id
        }
      })

      const dataToInsert = items.map(raw => {
        return {
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
        }
      })

      // Prisma createMany is very fast
      const res = await prisma.testItem.createMany({
        data: dataToInsert
      })

      console.log(`Seeded ${res.count} items for tenant ${tenant.slug}.`)
    } else {
      console.log(`Tenant ${tenant.slug} already has ${tenant._count.testItems} items. Skipping.`)
    }
  }

  console.log('Done.')
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
