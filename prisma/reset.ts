import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Limpando os status e responsáveis para zerar a homologação...')

  await prisma.testItem.updateMany({
    data: {
      status: 'PENDENTE',
      responsavel: '',
      chamado: '',
      statusChamado: '',
      observacao: '',
      subsidio: ''
    }
  })

  console.log('Apagando o histórico antigo para iniciar do zero...')
  await prisma.testItemHistory.deleteMany({})

  // Criando um histórico inicial novo para todos os itens
  const items = await prisma.testItem.findMany()
  const historyData = items.map(i => ({
    testItemId: i.id,
    usuario: 'sistema',
    descricao: 'Item carregado e zerado para nova homologação.'
  }))

  await prisma.testItemHistory.createMany({
    data: historyData
  })

  console.log('Homologação zerada com sucesso!')
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
