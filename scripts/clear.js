const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
p.testItem.deleteMany({}).then(() => p.roteiroVersao.deleteMany({})).then(() => console.log('Cleared DB')).finally(() => p.$disconnect())
