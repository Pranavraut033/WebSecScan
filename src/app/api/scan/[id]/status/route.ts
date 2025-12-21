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
      select: {
        id: true,
        status: true,
        createdAt: true,
        targetUrl: true,
        hostname: true,
        mode: true
      },
    })

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
    }

    return NextResponse.json({
      scanId: scan.id,
      status: scan.status,
      createdAt: scan.createdAt,
      targetUrl: scan.targetUrl,
      hostname: scan.hostname,
      mode: scan.mode
    })
  } catch (error) {
    console.error('Error fetching scan status:', error)
    return NextResponse.json({ error: 'Failed to fetch scan status' }, { status: 500 })
  }
}