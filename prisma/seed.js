const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      senha: passwordHash,
      role: 'SUPER_ADMIN',
    },
    create: {
      username: 'admin',
      nome: 'Super Admin',
      senha: passwordHash,
      role: 'SUPER_ADMIN',
    },
  })

  console.log('Super Admin user seeded:', admin.username)

  const mppa = await prisma.tenant.upsert({
    where: { slug: 'mppa' },
    update: {},
    create: {
      nome: 'Ministério Público do Estado do Pará',
      slug: 'mppa',
    }
  })

  console.log('Tenant MPPA seeded:', mppa.slug)

  const userMppa = await prisma.user.upsert({
    where: { username: 'analista.mppa' },
    update: {
      senha: passwordHash,
      tenantId: mppa.id
    },
    create: {
      username: 'analista.mppa',
      nome: 'Analista MPPA',
      senha: passwordHash,
      role: 'ANALISTA',
      tenantId: mppa.id
    }
  })

  console.log('User MPPA seeded:', userMppa.username)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
