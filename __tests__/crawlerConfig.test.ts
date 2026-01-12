/**
 * Unit tests for crawler configuration validation
 * 
 * Tests enforce safety constraints and prevent misconfiguration
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { validateCrawlerOptions, getSafeCrawlerOptions } from '../src/lib/crawlerConfig.ts'

// Mock expect to use node:assert
const expect = (value: any) => ({
  toBe: (expected: any) => assert.strictEqual(value, expected),
  toEqual: (expected: any) => assert.deepStrictEqual(value, expected),
  toHaveLength: (expected: number) => assert.strictEqual(value.length, expected),
  toBeGreaterThanOrEqual: (expected: number) => assert.ok(value >= expected),
  toHaveProperty: (property: string) => assert.ok(property in value),
  toThrow: (pattern?: RegExp) => {
    if (typeof value !== 'function') {
      throw new Error('expect().toThrow() requires a function')
    }
    try {
      value()
      throw new Error('Expected function to throw but it did not')
    } catch (error: any) {
      if (pattern && !pattern.test(error.message)) {
        throw new Error(`Expected error message "${error.message}" to match ${pattern}`)
      }
    }
  }
})

describe('Crawler Configuration Validation', () => {
  describe('validateCrawlerOptions', () => {
    it('should accept valid options within constraints', () => {
      const result = validateCrawlerOptions({
        maxDepth: 3,
        maxPages: 100,
        rateLimit: 1000,
        respectRobotsTxt: true,
        allowExternalLinks: false,
        timeout: 10000
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.sanitized.maxDepth).toBe(3)
      expect(result.sanitized.maxPages).toBe(100)
    })

    it('should reject maxDepth below minimum', () => {
      const result = validateCrawlerOptions({ maxDepth: 0 })

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('maxDepth'))).toBe(true)
      expect(result.sanitized.maxDepth).toBe(2) // Fallback to default
    })

    it('should reject maxDepth above maximum', () => {
      const result = validateCrawlerOptions({ maxDepth: 10 })

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('maxDepth'))).toBe(true)
      expect(result.sanitized.maxDepth).toBe(2)
    })

    it('should reject maxPages below minimum', () => {
      const result = validateCrawlerOptions({ maxPages: 0 })

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('maxPages'))).toBe(true)
      expect(result.sanitized.maxPages).toBe(50)
    })

    it('should reject maxPages above maximum', () => {
      const result = validateCrawlerOptions({ maxPages: 500 })

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('maxPages'))).toBe(true)
      expect(result.sanitized.maxPages).toBe(50)
    })

    it('should reject rateLimit below minimum', () => {
      const result = validateCrawlerOptions({ rateLimit: 50 })

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('rateLimit'))).toBe(true)
      expect(result.sanitized.rateLimit).toBe(1000)
    })

    it('should reject rateLimit above maximum', () => {
      const result = validateCrawlerOptions({ rateLimit: 10000 })

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('rateLimit'))).toBe(true)
      expect(result.sanitized.rateLimit).toBe(1000)
    })

    it('should warn when rateLimit is below recommended threshold', () => {
      const result = validateCrawlerOptions({ rateLimit: 300 })

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.toLowerCase().includes('warning'))).toBe(true)
      expect(result.errors.some(e => e.includes('WAF'))).toBe(true)
    })

    it('should reject timeout below minimum', () => {
      const result = validateCrawlerOptions({ timeout: 2000 })

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('timeout'))).toBe(true)
      expect(result.sanitized.timeout).toBe(10000)
    })

    it('should reject timeout above maximum', () => {
      const result = validateCrawlerOptions({ timeout: 60000 })

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('timeout'))).toBe(true)
      expect(result.sanitized.timeout).toBe(10000)
    })

    it('should require consent to disable respectRobotsTxt', () => {
      const result = validateCrawlerOptions(
        { respectRobotsTxt: false },
        true // requiresConsent = true
      )

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('robots.txt'))).toBe(true)
      expect(result.errors.some(e => e.includes('consent'))).toBe(true)
      expect(result.sanitized.respectRobotsTxt).toBe(true) // Forced to true
    })

    it('should allow disabling respectRobotsTxt with consent', () => {
      const result = validateCrawlerOptions(
        { respectRobotsTxt: false },
        false // requiresConsent = false (consent provided)
      )

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.sanitized.respectRobotsTxt).toBe(false)
    })

    it('should use safe defaults for undefined options', () => {
      const result = validateCrawlerOptions({})

      expect(result.valid).toBe(true)
      expect(result.sanitized.maxDepth).toBe(2)
      expect(result.sanitized.maxPages).toBe(50)
      expect(result.sanitized.rateLimit).toBe(1000)
      expect(result.sanitized.respectRobotsTxt).toBe(true)
      expect(result.sanitized.allowExternalLinks).toBe(false)
      expect(result.sanitized.timeout).toBe(10000)
    })

    it('should handle partial configuration', () => {
      const result = validateCrawlerOptions({
        maxDepth: 3,
        rateLimit: 2000
        // Other options omitted
      })

      expect(result.valid).toBe(true)
      expect(result.sanitized.maxDepth).toBe(3)
      expect(result.sanitized.rateLimit).toBe(2000)
      expect(result.sanitized.maxPages).toBe(50) // Default
      expect(result.sanitized.respectRobotsTxt).toBe(true) // Default
    })

    it('should accumulate multiple errors', () => {
      const result = validateCrawlerOptions({
        maxDepth: 0,
        maxPages: 0,
        rateLimit: 10,
        timeout: 1000
      })

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('getSafeCrawlerOptions', () => {
    it('should return validated options for valid configuration', () => {
      const options = getSafeCrawlerOptions({
        maxDepth: 3,
        maxPages: 100
      })

      expect(options.maxDepth).toBe(3)
      expect(options.maxPages).toBe(100)
      expect(options.rateLimit).toBe(1000) // Default
    })

    it('should throw error for invalid configuration', () => {
      expect(() => {
        getSafeCrawlerOptions({
          maxDepth: 10, // Above maximum
          maxPages: 500 // Above maximum
        })
      }).toThrow(/Invalid crawler configuration/)
    })

    it('should enforce robots.txt consent requirement', () => {
      expect(() => {
        getSafeCrawlerOptions(
          { respectRobotsTxt: false },
          false // allowRobotsTxtOverride = false
        )
      }).toThrow(/robots.txt/)
    })

    it('should allow robots.txt override with consent', () => {
      const options = getSafeCrawlerOptions(
        { respectRobotsTxt: false },
        true // allowRobotsTxtOverride = true
      )

      expect(options.respectRobotsTxt).toBe(false)
    })

    it('should return complete configuration from partial input', () => {
      const options = getSafeCrawlerOptions({ maxDepth: 4 })

      expect(options).toHaveProperty('maxDepth')
      expect(options).toHaveProperty('maxPages')
      expect(options).toHaveProperty('rateLimit')
      expect(options).toHaveProperty('respectRobotsTxt')
      expect(options).toHaveProperty('allowExternalLinks')
      expect(options).toHaveProperty('timeout')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null and undefined gracefully', () => {
      const result1 = validateCrawlerOptions(undefined)
      const result2 = validateCrawlerOptions({})

      expect(result1.valid).toBe(true)
      expect(result2.valid).toBe(true)
      expect(result1.sanitized).toEqual(result2.sanitized)
    })

    it('should handle boundary values correctly', () => {
      // Minimum valid values
      const result1 = validateCrawlerOptions({
        maxDepth: 1,
        maxPages: 1,
        rateLimit: 500,  // Above warning threshold
        timeout: 5000
      })

      expect(result1.valid).toBe(true)
      expect(result1.sanitized.maxDepth).toBe(1)
      expect(result1.sanitized.maxPages).toBe(1)

      // Maximum valid values
      const result2 = validateCrawlerOptions({
        maxDepth: 5,
        maxPages: 200,
        rateLimit: 5000,
        timeout: 30000
      })

      expect(result2.valid).toBe(true)
      expect(result2.sanitized.maxDepth).toBe(5)
      expect(result2.sanitized.maxPages).toBe(200)
    })

    it('should handle boolean flags correctly', () => {
      const result = validateCrawlerOptions({
        respectRobotsTxt: true,
        allowExternalLinks: true
      })

      expect(result.valid).toBe(true)
      expect(result.sanitized.respectRobotsTxt).toBe(true)
      expect(result.sanitized.allowExternalLinks).toBe(true)
    })
  })

  describe('Security Constraints', () => {
    it('should prevent DoS through excessive maxPages', () => {
      const result = validateCrawlerOptions({ maxPages: 1000 })

      expect(result.valid).toBe(false)
      expect(result.sanitized.maxPages).toBe(50) // Safe default
    })

    it('should prevent aggressive crawling through low rateLimit', () => {
      const result = validateCrawlerOptions({ rateLimit: 10 })

      expect(result.valid).toBe(false)
      expect(result.sanitized.rateLimit).toBe(1000) // Safe default
    })

    it('should prevent infinite depth crawling', () => {
      const result = validateCrawlerOptions({ maxDepth: 100 })

      expect(result.valid).toBe(false)
      expect(result.sanitized.maxDepth).toBe(2) // Safe default
    })

    it('should require explicit consent for ethical violations', () => {
      const result = validateCrawlerOptions(
        { respectRobotsTxt: false },
        true // Consent required
      )

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.toLowerCase().includes('consent'))).toBe(true)
    })
  })
})
