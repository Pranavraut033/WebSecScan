'use client'

import Link from 'next/link'
import type { Scan, Vulnerability } from '@prisma/client'

interface ScanSummaryCardProps {
  scan: Scan & { results: Vulnerability[] }
}

export default function ScanSummaryCard({ scan }: ScanSummaryCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const severityCounts = {
    critical: scan.results.filter(v => v.severity === 'CRITICAL').length,
    high: scan.results.filter(v => v.severity === 'HIGH').length,
    medium: scan.results.filter(v => v.severity === 'MEDIUM').length,
    low: scan.results.filter(v => v.severity === 'LOW').length,
  }

  const totalVulnerabilities = scan.results.length

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {scan.hostname || new URL(scan.targetUrl).hostname}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={scan.targetUrl}>
            {scan.targetUrl}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${getStatusColor(scan.status)}`}>
          {scan.status}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-3">
        <span>{scan.mode} scan</span>
        <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
      </div>

      {scan.status === 'COMPLETED' && totalVulnerabilities > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {totalVulnerabilities} {totalVulnerabilities === 1 ? 'Issue' : 'Issues'} Found
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {severityCounts.critical > 0 && (
              <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor('critical')}`}>
                Critical: {severityCounts.critical}
              </div>
            )}
            {severityCounts.high > 0 && (
              <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor('high')}`}>
                High: {severityCounts.high}
              </div>
            )}
            {severityCounts.medium > 0 && (
              <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor('medium')}`}>
                Medium: {severityCounts.medium}
              </div>
            )}
            {severityCounts.low > 0 && (
              <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor('low')}`}>
                Low: {severityCounts.low}
              </div>
            )}
          </div>
        </div>
      ) : scan.status === 'COMPLETED' ? (
        <div className="text-center py-2">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">✓ No Issues Found</p>
        </div>
      ) : scan.status === 'FAILED' ? (
        <div className="text-center py-2">
          <p className="text-sm text-red-600 dark:text-red-400">Scan Failed</p>
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">Scan in progress...</p>
        </div>
      )}

      {scan.status === 'COMPLETED' && (
        <Link
          href={`/scan/${scan.id}`}
          className="mt-3 block text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
        >
          View Details
        </Link>
      )}
    </div>
  )
}
