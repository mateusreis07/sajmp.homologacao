import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.tenantId && session?.user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const tenantSlug = searchParams.get('tenantSlug')

  if (!tenantSlug) {
    return NextResponse.json({ error: 'tenantSlug is required' }, { status: 400 })
  }

  try {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && session.user.tenantId !== tenant.id) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const reports = await prisma.versionReport.findMany({
      where: { tenantId: tenant.id },
      orderBy: { dataAtualizacao: 'desc' }
    })

    return NextResponse.json({ reports })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { tenantSlug, ...data } = body

    if (!tenantSlug) {
      return NextResponse.json({ error: 'tenantSlug is required' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && session.user.tenantId !== tenant.id) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const report = await prisma.versionReport.create({
      data: {
        ...data,
        tenantId: tenant.id
      }
    })

    return NextResponse.json({ success: true, report })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


