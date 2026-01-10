/**
 * Unit tests for scoring system
 * Tests numeric scoring (0-100) with risk-based assessment
 */

import { strict as assert } from 'node:assert'
import { test, describe } from 'node:test'
import { calculateScore, getRiskLevel, getRiskColor, type RiskLevel } from '../src/lib/scoring.ts'
import type { HeaderTestResult } from '../src/security/dynamic/headerAnalyzer.ts'

describe('Scoring System', () => {
  describe('getRiskLevel', () => {
    test('should return LOW for scores >= 80', () => {
      assert.strictEqual(getRiskLevel(100), 'LOW')
      assert.strictEqual(getRiskLevel(90), 'LOW')
      assert.strictEqual(getRiskLevel(80), 'LOW')
    })

    test('should return MEDIUM for scores 60-79', () => {
      assert.strictEqual(getRiskLevel(79), 'MEDIUM')
      assert.strictEqual(getRiskLevel(70), 'MEDIUM')
      assert.strictEqual(getRiskLevel(60), 'MEDIUM')
    })

    test('should return HIGH for scores 40-59', () => {
      assert.strictEqual(getRiskLevel(59), 'HIGH')
      assert.strictEqual(getRiskLevel(50), 'HIGH')
      assert.strictEqual(getRiskLevel(40), 'HIGH')
    })

    test('should return CRITICAL for scores < 40', () => {
      assert.strictEqual(getRiskLevel(39), 'CRITICAL')
      assert.strictEqual(getRiskLevel(20), 'CRITICAL')
      assert.strictEqual(getRiskLevel(0), 'CRITICAL')
    })

    test('should handle edge cases', () => {
      assert.strictEqual(getRiskLevel(80), 'LOW')
      assert.strictEqual(getRiskLevel(79.9), 'MEDIUM')
      assert.strictEqual(getRiskLevel(60), 'MEDIUM')
      assert.strictEqual(getRiskLevel(59.9), 'HIGH')
      assert.strictEqual(getRiskLevel(40), 'HIGH')
      assert.strictEqual(getRiskLevel(39.9), 'CRITICAL')
    })
  })

  describe('getRiskColor', () => {
    test('should return correct color for LOW risk', () => {
      const color = getRiskColor('LOW')
      assert.ok(color.includes('green'))
    })

    test('should return correct color for MEDIUM risk', () => {
      const color = getRiskColor('MEDIUM')
      assert.ok(color.includes('yellow'))
    })

    test('should return correct color for HIGH risk', () => {
      const color = getRiskColor('HIGH')
      assert.ok(color.includes('orange'))
    })

    test('should return correct color for CRITICAL risk', () => {
      const color = getRiskColor('CRITICAL')
      assert.ok(color.includes('red'))
    })

    test('should include dark mode classes', () => {
      const color = getRiskColor('LOW')
      assert.ok(color.includes('dark:'))
    })
  })

  describe('calculateScore', () => {
    test('should calculate score from test results', () => {
      const tests: HeaderTestResult[] = [
        {
          testName: 'Test 1',
          passed: true,
          score: 0,
          result: 'Passed',
          reason: 'Good',
        },
        {
          testName: 'Test 2',
          passed: false,
          score: -10,
          result: 'Failed',
          reason: 'Bad',
        },
      ]

      const result = calculateScore(tests)
      assert.strictEqual(result.score, 90) // 100 + 0 - 10
      assert.strictEqual(result.riskLevel, 'LOW')
    })

    test('should cap score at 100', () => {
      const tests: HeaderTestResult[] = [
        {
          testName: 'Bonus test',
          passed: true,
          score: 50,
          result: 'Passed',
          reason: 'Extra credit',
        },
      ]

      const result = calculateScore(tests)
      assert.strictEqual(result.score, 100) // capped at 100
    })

    test('should cap score at 0', () => {
      const tests: HeaderTestResult[] = [
        {
          testName: 'Major failure',
          passed: false,
          score: -150,
          result: 'Failed',
          reason: 'Critical issue',
        },
      ]

      const result = calculateScore(tests)
      assert.strictEqual(result.score, 0) // capped at 0
    })

    test('should include breakdown of test results', () => {
      const tests: HeaderTestResult[] = [
        {
          testName: 'Test 1',
          passed: true,
          score: 0,
          result: 'Passed',
          reason: 'Good',
        },
        {
          testName: 'Test 2',
          passed: false,
          score: -10,
          result: 'Failed',
          reason: 'Bad',
        },
      ]

      const result = calculateScore(tests)
      assert.strictEqual(result.breakdown.length, 2)
      assert.strictEqual(result.breakdown[0].testName, 'Test 1')
      assert.strictEqual(result.breakdown[0].passed, true)
      assert.strictEqual(result.breakdown[1].testName, 'Test 2')
      assert.strictEqual(result.breakdown[1].passed, false)
    })

    test('should set grade to null (deprecated)', () => {
      const tests: HeaderTestResult[] = []
      const result = calculateScore(tests)
      assert.strictEqual(result.grade, null)
    })

    test('should handle empty test array', () => {
      const tests: HeaderTestResult[] = []
      const result = calculateScore(tests)
      assert.strictEqual(result.score, 100) // base score
      assert.strictEqual(result.riskLevel, 'LOW')
      assert.strictEqual(result.breakdown.length, 0)
    })
  })

  describe('Risk Level Integration', () => {
    test('should assign correct risk level to calculated score - LOW', () => {
      const tests: HeaderTestResult[] = [
        {
          testName: 'Good test',
          passed: true,
          score: -10,
          result: 'Passed',
          reason: 'Minor issue',
        },
      ]

      const result = calculateScore(tests)
      assert.strictEqual(result.score, 90)
      assert.strictEqual(result.riskLevel, 'LOW')
    })

    test('should assign correct risk level to calculated score - MEDIUM', () => {
      const tests: HeaderTestResult[] = [
        {
          testName: 'Moderate issue',
          passed: false,
          score: -30,
          result: 'Failed',
          reason: 'Some issues',
        },
      ]

      const result = calculateScore(tests)
      assert.strictEqual(result.score, 70)
      assert.strictEqual(result.riskLevel, 'MEDIUM')
    })

    test('should assign correct risk level to calculated score - HIGH', () => {
      const tests: HeaderTestResult[] = [
        {
          testName: 'Significant issue',
          passed: false,
          score: -50,
          result: 'Failed',
          reason: 'Major problems',
        },
      ]

      const result = calculateScore(tests)
      assert.strictEqual(result.score, 50)
      assert.strictEqual(result.riskLevel, 'HIGH')
    })

    test('should assign correct risk level to calculated score - CRITICAL', () => {
      const tests: HeaderTestResult[] = [
        {
          testName: 'Critical issue',
          passed: false,
          score: -70,
          result: 'Failed',
          reason: 'Severe vulnerabilities',
        },
      ]

      const result = calculateScore(tests)
      assert.strictEqual(result.score, 30)
      assert.strictEqual(result.riskLevel, 'CRITICAL')
    })
  })

  describe('Risk Band Boundaries', () => {
    test('should correctly classify boundary scores', () => {
      // Test exact boundary values
      const boundaries = [
        { score: 80, expected: 'LOW' as RiskLevel },
        { score: 79, expected: 'MEDIUM' as RiskLevel },
        { score: 60, expected: 'MEDIUM' as RiskLevel },
        { score: 59, expected: 'HIGH' as RiskLevel },
        { score: 40, expected: 'HIGH' as RiskLevel },
        { score: 39, expected: 'CRITICAL' as RiskLevel },
      ]

      for (const { score, expected } of boundaries) {
        assert.strictEqual(getRiskLevel(score), expected, `Score ${score} should be ${expected}`)
      }
    })

    test('should handle decimal scores near boundaries', () => {
      assert.strictEqual(getRiskLevel(79.99), 'MEDIUM')
      assert.strictEqual(getRiskLevel(80.01), 'LOW')
      assert.strictEqual(getRiskLevel(59.99), 'HIGH')
      assert.strictEqual(getRiskLevel(60.01), 'MEDIUM')
      assert.strictEqual(getRiskLevel(39.99), 'CRITICAL')
      assert.strictEqual(getRiskLevel(40.01), 'HIGH')
    })
  })
})
