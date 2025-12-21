/**
 * Scoring System - Calculate overall security score and grade
 * Based on Mozilla Observatory scoring methodology
 */

import type { HeaderTestResult } from '@/security/dynamic/headerAnalyzer';

export interface ScoringResult {
  score: number; // 0-100
  grade: string; // A+, A, B, C, D, F
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
  const grade = calculateGrade(finalScore);

  return {
    score: finalScore,
    grade,
    breakdown,
  };
}

/**
 * Calculate letter grade from numeric score
 * Grading scale based on Mozilla Observatory:
 * A+ = 135+ (extra credit)
 * A  = 100-134
 * B  = 85-99
 * C  = 70-84
 * D  = 50-69
 * F  = 0-49
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
 * Get color class for grade display
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
