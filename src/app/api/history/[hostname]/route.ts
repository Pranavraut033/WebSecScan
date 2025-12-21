import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hostname: string }> }
) {
  try {
    const { hostname } = await params

    const scans = await prisma.scan.findMany({
      where: { hostname },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        status: true,
        score: true,
        grade: true,
        mode: true,
        scanSummary: true,
      }
    })

    return NextResponse.json({ hostname, scans })
  } catch (error) {
    console.error('Error fetching scan history:', error)
    return NextResponse.json({ error: 'Failed to fetch scan history' }, { status: 500 })
  }
}
