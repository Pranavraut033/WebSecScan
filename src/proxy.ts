/**
 * Next.js Middleware for global security enforcement
 * Applies to all API routes and prevents CSRF attacks
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl
  
  // Apply security headers to all responses
  const response = NextResponse.next()
  
  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval in dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )
  
  // For API routes, enforce same-origin policy
  if (pathname.startsWith('/api/')) {
    const requestOrigin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')
    
    // For state-changing methods, require same-origin
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      if (!requestOrigin && !referer) {
        return NextResponse.json(
          { error: 'Missing origin header' },
          { status: 403 }
        )
      }
      
      let originHostname: string | null = null
      try {
        if (requestOrigin) {
          originHostname = new URL(requestOrigin).hostname
        } else if (referer) {
          originHostname = new URL(referer).hostname
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid origin or referer' },
          { status: 403 }
        )
      }
      
      const hostHostname = host?.split(':')[0]
      
      if (originHostname !== hostHostname) {
        return NextResponse.json(
          { error: 'Cross-origin requests not allowed' },
          { status: 403 }
        )
      }
    }
    
    // For GET requests to sensitive endpoints, also check origin
    if (request.method === 'GET' && (
      pathname.includes('/status') ||
      pathname.includes('/results') ||
      pathname.includes('/history')
    )) {
      // Allow GET from same origin or no origin (direct navigation)
      if (requestOrigin) {
        try {
          const originHostname = new URL(requestOrigin).hostname
          const hostHostname = host?.split(':')[0]
          
          if (originHostname !== hostHostname) {
            return NextResponse.json(
              { error: 'Cross-origin requests not allowed' },
              { status: 403 }
            )
          }
        } catch {
          return NextResponse.json(
            { error: 'Invalid origin' },
            { status: 403 }
          )
        }
      }
    }
  }
  
  return response
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
