import { NextRequest, NextResponse } from 'next/server'
import { createScan, runStaticAnalysis, runDynamicAnalysis } from '@/app/actions'
import { ScanMode } from '@prisma/client'

/**
 * Validate and sanitize target URL
 */
function validateTargetUrl(url: string): { valid: boolean; error?: string; sanitized?: string } {
  // Check for empty or whitespace-only
  if (!url || url.trim().length === 0) {
    return { valid: false, error: 'URL cannot be empty' }
  }

  const trimmed = url.trim()

  // Check URL format
  let urlObj: URL
  try {
    urlObj = new URL(trimmed)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  // Only allow HTTP(S) protocols
  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' }
  }

  // Security: Prevent scanning of local/private IPs in production
  const hostname = urlObj.hostname.toLowerCase()

  // Allow localhost and 127.0.0.1 for development/testing
  const isLocalhost = hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.16.') ||
    hostname.endsWith('.local')

  // In production, you might want to restrict localhost scanning
  // For educational purposes, we allow it
  if (!isLocalhost && hostname.includes('169.254.')) {
    return { valid: false, error: 'Link-local addresses are not allowed' }
  }

  // Check for suspicious patterns
  if (urlObj.username || urlObj.password) {
    return { valid: false, error: 'URLs with embedded credentials are not allowed' }
  }

  // Sanitize: Remove fragment
  urlObj.hash = ''

  return { valid: true, sanitized: urlObj.toString() }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetUrl, mode }: { targetUrl: string; mode: string } = body

    // Validate required fields
    if (!targetUrl || !mode) {
      return NextResponse.json(
        { error: 'targetUrl and mode are required' },
        { status: 400 }
      )
    }

    // Validate scan mode
    if (!Object.values(ScanMode).includes(mode as ScanMode)) {
      return NextResponse.json(
        { error: `Invalid mode. Must be one of: ${Object.values(ScanMode).join(', ')}` },
        { status: 400 }
      )
    }

    // Validate and sanitize URL
    const urlValidation = validateTargetUrl(targetUrl)
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: urlValidation.error },
        { status: 400 }
      )
    }

    const sanitizedUrl = urlValidation.sanitized!

    // Create scan record
    const { scanId } = await createScan(sanitizedUrl, mode as ScanMode)

    // Start analysis asynchronously using waitUntil (better than setImmediate for Next.js)
    // This ensures the work continues even after response is sent
    const analysisPromise = (async () => {
      try {
        if (mode === ScanMode.STATIC || mode === ScanMode.BOTH) {
          await runStaticAnalysis(scanId)
        }
        if (mode === ScanMode.DYNAMIC || mode === ScanMode.BOTH) {
          // Only run dynamic if static completed successfully (for BOTH mode)
          if (mode === ScanMode.BOTH) {
            // Wait a bit to allow static to complete first
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          await runDynamicAnalysis(scanId)
        }
      } catch (error) {
        console.error('Error in background analysis:', error)
      }
    })()

    // Use waitUntil if available (Vercel/edge runtime)
    if ('waitUntil' in request) {
      (request as any).waitUntil(analysisPromise)
    } else {
      // Fallback for local development
      analysisPromise.catch(err => console.error('Background scan error:', err))
    }

    return NextResponse.json({
      scanId,
      status: 'RUNNING',
      targetUrl: sanitizedUrl,
      mode
    })
  } catch (error) {
    console.error('Error starting scan:', error)
    return NextResponse.json(
      { error: 'Failed to start scan' },
      { status: 500 }
    )
  }
}