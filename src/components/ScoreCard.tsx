/**
 * ScoreCard - Display overall security score and grade
 */

'use client'

import { getGradeColor, getScoreColor } from '@/lib/scoring'

interface ScoreCardProps {
  score: number
  grade: string
  passedTests: number
  totalTests: number
}

export function ScoreCard({ score, grade, passedTests, totalTests }: ScoreCardProps) {
  const gradeColor = getGradeColor(grade)
  const scoreColor = getScoreColor(score)
  const percentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Security Score</h2>

        {/* Grade Badge */}
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${gradeColor} mb-4`}>
          <span className="text-4xl font-bold">{grade}</span>
        </div>

        {/* Numeric Score */}
        <div className={`text-5xl font-bold mb-2 ${scoreColor}`}>
          {score}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">out of 100</p>

        {/* Test Summary */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{passedTests}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Passed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalTests - passedTests}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Failed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{percentage}%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Pass Rate</div>
            </div>
          </div>
        </div>

        {/* Grade Explanation */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>Grade Scale: A+ (135+) | A (100+) | B (85+) | C (70+) | D (50+) | F (0-49)</p>
        </div>
      </div>
    </div>
  )
}
