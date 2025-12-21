import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scanId } = await params

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      select: { id: true, status: true, createdAt: true },
    })

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
    }

    return NextResponse.json({
      scanId: scan.id,
      status: scan.status,
      createdAt: scan.createdAt,
    })
  } catch (error) {
    console.error('Error fetching scan status:', error)
    return NextResponse.json({ error: 'Failed to fetch scan status' }, { status: 500 })
  }
}