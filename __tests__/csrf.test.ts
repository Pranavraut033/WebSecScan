/**
 * Tests for CSRF protection and same-origin validation
 */

import { validateSameOrigin, validateApiRequest } from '../src/lib/csrf.ts'
import { NextRequest } from 'next/server'

describe('CSRF Protection', () => {
  describe('validateSameOrigin', () => {
    it('should allow requests from same origin', () => {
      const request = new NextRequest('http://localhost:3000/api/scan/start', {
        method: 'POST',
        headers: {
          'origin': 'http://localhost:3000',
          'host': 'localhost:3000',
        },
      })

      expect(validateSameOrigin(request)).toBe(true)
    })

    it('should reject requests from different origin', () => {
      const request = new NextRequest('http://localhost:3000/api/scan/start', {
        method: 'POST',
        headers: {
          'origin': 'http://evil.com',
          'host': 'localhost:3000',
        },
      })

      expect(validateSameOrigin(request)).toBe(false)
    })

    it('should allow GET requests without origin header', () => {
      const request = new NextRequest('http://localhost:3000/api/scan/status', {
        method: 'GET',
        headers: {
          'host': 'localhost:3000',
        },
      })

      // GET requests without origin should be allowed (direct navigation)
      expect(validateSameOrigin(request)).toBe(true)
    })

    it('should reject POST requests without origin or referer', () => {
      const request = new NextRequest('http://localhost:3000/api/scan/start', {
        method: 'POST',
        headers: {
          'host': 'localhost:3000',
        },
      })

      expect(validateSameOrigin(request)).toBe(false)
    })

    it('should validate using referer when origin is not present', () => {
      const request = new NextRequest('http://localhost:3000/api/scan/start', {
        method: 'POST',
        headers: {
          'referer': 'http://localhost:3000/scan',
          'host': 'localhost:3000',
        },
      })

      expect(validateSameOrigin(request)).toBe(true)
    })

    it('should reject when referer is from different origin', () => {
      const request = new NextRequest('http://localhost:3000/api/scan/start', {
        method: 'POST',
        headers: {
          'referer': 'http://evil.com/attack',
          'host': 'localhost:3000',
        },
      })

      expect(validateSameOrigin(request)).toBe(false)
    })

    it('should handle port numbers correctly', () => {
      const request = new NextRequest('http://localhost:3000/api/scan/start', {
        method: 'POST',
        headers: {
          'origin': 'http://localhost:3000',
          'host': 'localhost:3000',
        },
      })

      expect(validateSameOrigin(request)).toBe(true)
    })

    it('should reject when hostnames differ', () => {
      const request = new NextRequest('http://example.com/api/scan/start', {
        method: 'POST',
        headers: {
          'origin': 'http://example.com',
          'host': 'different.com',
        },
      })

      expect(validateSameOrigin(request)).toBe(false)
    })
  })

  describe('validateApiRequest', () => {
    it('should validate POST requests with same origin', async () => {
      const request = new NextRequest('http://localhost:3000/api/scan/start', {
        method: 'POST',
        headers: {
          'origin': 'http://localhost:3000',
          'host': 'localhost:3000',
          'content-type': 'application/json',
        },
      })

      const result = await validateApiRequest(request)
      expect(result.valid).toBe(true)
    })

    it('should reject POST requests from different origin', async () => {
      const request = new NextRequest('http://localhost:3000/api/scan/start', {
        method: 'POST',
        headers: {
          'origin': 'http://attacker.com',
          'host': 'localhost:3000',
        },
      })

      const result = await validateApiRequest(request)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Cross-origin')
    })

    it('should allow GET requests from same origin', async () => {
      const request = new NextRequest('http://localhost:3000/api/scan/status', {
        method: 'GET',
        headers: {
          'origin': 'http://localhost:3000',
          'host': 'localhost:3000',
        },
      })

      const result = await validateApiRequest(request)
      expect(result.valid).toBe(true)
    })
  })
})
