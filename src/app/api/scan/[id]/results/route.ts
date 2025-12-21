import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateApiRequest } from '@/lib/csrf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate same-origin
    const validation = await validateApiRequest(request)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid request origin' },
        { status: 403 }
      )
    }

    const { id: scanId } = await params

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        results: true,
        securityTests: true,
      },
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
      scan,
      summary,
      vulnerabilities: scan.results,
    })
  } catch (error) {
    console.error('Error fetching scan results:', error)
    return NextResponse.json({ error: 'Failed to fetch scan results' }, { status: 500 })
  }
}