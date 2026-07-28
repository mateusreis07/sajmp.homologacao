import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('admin123', 10)

  // Upsert Super Admin
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      senha: hash,
      role: 'SUPER_ADMIN',
    },
    create: {
      nome: 'Administrador do Sistema',
      username: 'admin',
      senha: hash,
      role: 'SUPER_ADMIN',
    },
  })

  console.log('Super Admin criado:', admin.username)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
