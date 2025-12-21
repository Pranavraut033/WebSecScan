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
      include: { results: true },
    })

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
    }

    // Calculate summary
    const summary = {
      critical: scan.results.filter(v => v.severity === 'CRITICAL').length,
      high: scan.results.filter(v => v.severity === 'HIGH').length,
      medium: scan.results.filter(v => v.severity === 'MEDIUM').length,
      low: scan.results.filter(v => v.severity === 'LOW').length,
    }

    return NextResponse.json({
      scanId: scan.id,
      summary,
      vulnerabilities: scan.results,
    })
  } catch (error) {
    console.error('Error fetching scan results:', error)
    return NextResponse.json({ error: 'Failed to fetch scan results' }, { status: 500 })
  }
}