/**
 * SecurityTestCard - Display individual security test results
 */

'use client'

import { getResultColor } from '@/lib/scoring'

interface CSPCheck {
  name: string
  passed: boolean
  description: string
  severity: 'high' | 'medium' | 'low' | 'info'
}

interface SecurityTestCardProps {
  testName: string
  passed: boolean
  score: number
  result: 'Passed' | 'Failed' | 'Info' | 'N/A'
  reason: string
  recommendation?: string
  details?: {
    checks?: CSPCheck[]
    [key: string]: any
  }
}

export function SecurityTestCard({
  testName,
  passed,
  score,
  result,
  reason,
  recommendation,
  details,
}: SecurityTestCardProps) {
  const resultColor = getResultColor(result)
  const scoreColor = score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-gray-600'

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{testName}</h3>
        <div className="flex gap-2 items-center">
          <span className={`px-2 py-1 text-xs font-medium rounded ${resultColor}`}>
            {result}
          </span>
          <span className={`text-sm font-bold ${scoreColor}`}>
            {score > 0 ? '+' : ''}{score}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{reason}</p>

      {recommendation && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-600 text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-100">Recommendation:</p>
          <p className="text-blue-800 dark:text-blue-200">{recommendation}</p>
        </div>
      )}

      {/* CSP Detailed Checks */}
      {details?.checks && details.checks.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Detailed Checks:</h4>
          <div className="space-y-2">
            {details.checks.map((check: CSPCheck, index: number) => (
              <div
                key={index}
                className={`p-2 rounded text-sm ${check.passed ? 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500 dark:border-green-600' : 'bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500 dark:border-red-600'
                  }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">
                    {check.passed ? '✓' : '✗'}
                  </span>
                  <div className="flex-1">
                    <p className={`font-medium ${check.passed ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                      {check.name}
                    </p>
                    <p className={`text-xs mt-1 ${check.passed ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                      {check.description}
                    </p>
                    {check.severity !== 'info' && (
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${check.severity === 'high' ? 'bg-red-200 dark:bg-red-900/40 text-red-900 dark:text-red-200' :
                        check.severity === 'medium' ? 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200' :
                          'bg-blue-200 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200'
                        }`}>
                        {check.severity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Details */}
      {details && !details.checks && Object.keys(details).length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
            Technical Details
          </summary>
          <pre className="mt-2 text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto text-gray-900 dark:text-gray-100">
            {JSON.stringify(details, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}
