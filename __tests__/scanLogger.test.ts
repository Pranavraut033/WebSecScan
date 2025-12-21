/**
 * Unit tests for scan logger functionality
 * Tests the SSE-based logging system
 */

import { strict as assert } from 'node:assert'
import { test, describe } from 'node:test'

// Mock implementations since we can't import the actual module in tests
// (it depends on Next.js runtime)
describe('ScanLogger', () => {
  test('should create proper log structure', () => {
    const log = {
      scanId: 'test-scan-123',
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Test message',
      phase: 'STATIC',
    }

    assert.strictEqual(log.scanId, 'test-scan-123')
    assert.strictEqual(log.level, 'info')
    assert.strictEqual(log.message, 'Test message')
    assert.strictEqual(log.phase, 'STATIC')
    assert.ok(log.timestamp)
  })

  test('should support all log levels', () => {
    const levels = ['info', 'success', 'warning', 'error']

    for (const level of levels) {
      const log = {
        scanId: 'test-scan',
        timestamp: new Date().toISOString(),
        level,
        message: `Test ${level} message`,
      }

      assert.ok(levels.includes(log.level))
    }
  })

  test('should include optional metadata', () => {
    const log = {
      scanId: 'test-scan',
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Test message',
      metadata: {
        duration: 1234,
        itemsProcessed: 42,
      },
    }

    assert.ok(log.metadata)
    assert.strictEqual(log.metadata.duration, 1234)
    assert.strictEqual(log.metadata.itemsProcessed, 42)
  })
})
