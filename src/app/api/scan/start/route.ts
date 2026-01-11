import { NextRequest, NextResponse } from 'next/server'
import { createScan, runStaticAnalysis, runDynamicAnalysis, recordProtocolVulnerability } from '@/app/actions'
import { ScanMode } from '@prisma/client'
import { normalizeUrl, validateUrlFormat } from '@/lib/urlNormalizer'
import { validateApiRequest } from '@/lib/csrf'
import { CrawlerOptions } from '@/security/dynamic/crawler'
import { getSafeCrawlerOptions } from '@/lib/crawlerConfig'
import { AuthConfig, validateAuthConfig } from '@/security/dynamic/authScanner'

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF and same-origin
    const validation = await validateApiRequest(request)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid request origin' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      targetUrl,
      mode,
      crawlerOptions,
      allowRobotsTxtOverride,
      authConfig
    }: {
      targetUrl: string;
      mode: string;
      crawlerOptions?: Partial<CrawlerOptions>;
      allowRobotsTxtOverride?: boolean;
      authConfig?: AuthConfig;
    } = body

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

    // Validate and sanitize crawler options
    let validatedCrawlerOptions: Required<CrawlerOptions> | undefined;
    if (crawlerOptions) {
      try {
        validatedCrawlerOptions = getSafeCrawlerOptions(
          crawlerOptions,
          allowRobotsTxtOverride ?? false
        );
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Invalid crawler configuration' },
          { status: 400 }
        );
      }
    }

    // Validate auth configuration if provided
    let validatedAuthConfig: AuthConfig | undefined;
    if (authConfig) {
      const authValidation = validateAuthConfig(authConfig);
      if (!authValidation.valid) {
        return NextResponse.json(
          { error: `Invalid authentication config: ${authValidation.errors.join(', ')}` },
          { status: 400 }
        );
      }
      
      // Ensure auth is only used for dynamic/both modes
      if (mode === ScanMode.STATIC) {
        return NextResponse.json(
          { error: 'Authenticated scanning requires DYNAMIC or BOTH mode' },
          { status: 400 }
        );
      }
      
      validatedAuthConfig = authConfig;
    }

    // Quick format validation
    const formatValidation = validateUrlFormat(targetUrl)
    if (!formatValidation.valid) {
      return NextResponse.json(
        { error: formatValidation.error },
        { status: 400 }
      )
    }

    // Normalize URL: try HTTPS first, detect redirects, identify HTTP threats
    let normalizeResult
    try {
      normalizeResult = await normalizeUrl(targetUrl, {
        preferHttps: true,
        checkRedirects: true,
        timeout: 10000,
      })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to connect to target URL' },
        { status: 400 }
      )
    }

    const sanitizedUrl = normalizeResult.normalizedUrl

    // Security checks on normalized URL
    const urlObj = new URL(sanitizedUrl)
    const hostname = urlObj.hostname.toLowerCase()

    // Prevent scanning link-local addresses
    const isLocalhost = hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.endsWith('.local')

    if (!isLocalhost && hostname.includes('169.254.')) {
      return NextResponse.json(
        { error: 'Link-local addresses are not allowed' },
        { status: 400 }
      )
    }

    // Create scan record with crawler options and auth config
    const { scanId } = await createScan(
      sanitizedUrl, 
      mode as ScanMode, 
      validatedCrawlerOptions,
      validatedAuthConfig
    )

    // Start analysis asynchronously using waitUntil (better than setImmediate for Next.js)
    // This ensures the work continues even after response is sent
    const analysisPromise = (async () => {
      try {
        // Record HTTP protocol vulnerability if detected
        if (normalizeResult.securityThreats.length > 0) {
          for (const threat of normalizeResult.securityThreats) {
            await recordProtocolVulnerability(scanId, threat)
          }
        }

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
      mode,
      urlInfo: {
        protocol: normalizeResult.protocol,
        redirected: normalizeResult.redirected,
        redirectedTo: normalizeResult.redirectedTo,
        isWwwRedirect: normalizeResult.isWwwRedirect,
        warnings: normalizeResult.warnings,
        securityThreats: normalizeResult.securityThreats.map(t => t.type),
      }
    })
  } catch (error) {
    console.error('Error starting scan:', error)
    return NextResponse.json(
      { error: 'Failed to start scan' },
      { status: 500 }
    )
  }
}