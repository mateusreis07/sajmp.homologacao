import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const report = await prisma.versionReport.findUnique({
      where: { id: parseInt(id) },
      include: { tenant: true }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && session.user.tenantId !== report.tenantId) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ report })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  try {
    const existing = await prisma.versionReport.findUnique({ where: { id: parseInt(id) } })
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && session.user.tenantId !== existing.tenantId) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const report = await prisma.versionReport.update({
      where: { id: parseInt(id) },
      data: body
    })

    return NextResponse.json({ success: true, report })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.versionReport.findUnique({ where: { id: parseInt(id) } })
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && session.user.tenantId !== existing.tenantId) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.versionReport.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
