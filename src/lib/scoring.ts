/**
 * Scoring System - Calculate overall security score with risk-based assessment
 * Numeric scoring (0-100) with risk level categorization
 * Replaces letter grades with industry-standard risk bands
 */

import type { HeaderTestResult } from '@/security/dynamic/headerAnalyzer';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ScoringResult {
  score: number; // 0-100
  riskLevel: RiskLevel; // LOW, MEDIUM, HIGH, CRITICAL
  grade: string | null; // Deprecated, kept for backward compatibility
  breakdown: {
    testName: string;
    score: number;
    passed: boolean;
  }[];
}

/**
 * Calculate overall score from test results
 * Base score starts at 100, tests can add or subtract points
 */
export function calculateScore(tests: HeaderTestResult[]): ScoringResult {
  const baseScore = 100;
  let totalScore = baseScore;

  const breakdown = tests.map((test) => {
    totalScore += test.score;
    return {
      testName: test.testName,
      score: test.score,
      passed: test.passed,
    };
  });

  // Ensure score is within 0-100 range
  const finalScore = Math.max(0, Math.min(100, totalScore));
  const riskLevel = getRiskLevel(finalScore);

  return {
    score: finalScore,
    riskLevel,
    grade: null, // Deprecated, use riskLevel instead
    breakdown,
  };
}

/**
 * Calculate risk level from numeric score
 * Risk bands based on Phase 3 requirements:
 * - LOW:      Score ≥ 80 (good security posture)
 * - MEDIUM:   Score 60-79 (moderate concerns)
 * - HIGH:     Score 40-59 (significant issues)
 * - CRITICAL: Score < 40 (severe vulnerabilities)
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'LOW';
  if (score >= 60) return 'MEDIUM';
  if (score >= 40) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Get color class for risk level display
 * Returns Tailwind CSS classes for consistent visual representation
 */
export function getRiskColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'LOW':
      return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
    case 'HIGH':
      return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800';
    case 'CRITICAL':
      return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
  }
}

/**
 * @deprecated Use getRiskLevel() instead
 * Calculate letter grade from numeric score (deprecated for Phase 3)
 */
export function calculateGrade(score: number): string {
  if (score >= 135) return 'A+';
  if (score >= 100) return 'A';
  if (score >= 85) return 'B';
  if (score >= 70) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * @deprecated Use getRiskColor() instead
 * Get color class for grade display (deprecated for Phase 3)
 */
export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'text-green-600 bg-green-50';
    case 'B':
      return 'text-blue-600 bg-blue-50';
    case 'C':
      return 'text-yellow-600 bg-yellow-50';
    case 'D':
      return 'text-orange-600 bg-orange-50';
    case 'F':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Get badge color class for test result
 */
export function getResultColor(
  result: 'Passed' | 'Failed' | 'Info' | 'N/A'
): string {
  switch (result) {
    case 'Passed':
      return 'bg-green-100 text-green-800';
    case 'Failed':
      return 'bg-red-100 text-red-800';
    case 'Info':
      return 'bg-blue-100 text-blue-800';
    case 'N/A':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get score color class for display
 */
export function getScoreColor(score: number): string {
  if (score >= 100) return 'text-green-600';
  if (score >= 85) return 'text-blue-600';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
}
