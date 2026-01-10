/**
 * ScoreCard - Display overall security score with risk-based assessment
 * Uses numeric scoring (0-100) with risk level categorization
 */

'use client'

import { getRiskLevel, getRiskColor, type RiskLevel } from '@/lib/scoring'

interface ScoreCardProps {
  score: number
  passedTests: number
  totalTests: number
}

export function ScoreCard({ score, passedTests, totalTests }: ScoreCardProps) {
  const riskLevel = getRiskLevel(score)
  const riskColor = getRiskColor(riskLevel)
  const percentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0

  // Risk level descriptions
  const riskDescriptions: Record<RiskLevel, string> = {
    LOW: 'Good security posture',
    MEDIUM: 'Moderate security concerns',
    HIGH: 'Significant security issues',
    CRITICAL: 'Severe vulnerabilities detected'
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Security Score</h2>

        {/* Numeric Score */}
        <div className="mb-4">
          <div className={`text-6xl font-bold ${riskLevel === 'LOW' ? 'text-green-600' : riskLevel === 'MEDIUM' ? 'text-yellow-600' : riskLevel === 'HIGH' ? 'text-orange-600' : 'text-red-600'}`}>
            {score}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">out of 100</p>
        </div>

        {/* Risk Level Badge */}
        <div className={`inline-flex items-center justify-center px-4 py-2 rounded-lg border-2 ${riskColor} mb-3`}>
          <span className="text-lg font-bold">{riskLevel} RISK</span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {riskDescriptions[riskLevel]}
        </p>

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

        {/* Risk Band Explanation */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>Risk Bands: Low (≥80) | Medium (60-79) | High (40-59) | Critical (&lt;40)</p>
        </div>
      </div>
    </div>
  )
}
