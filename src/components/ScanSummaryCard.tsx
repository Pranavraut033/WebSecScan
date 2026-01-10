'use client'

import Link from 'next/link'
import type { Scan, Vulnerability } from '@prisma/client'
import { getRiskLevel, getRiskColor } from '@/lib/scoring'
import { Card, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface ScanSummaryCardProps {
  scan: Scan & { results: Vulnerability[] }
}

export default function ScanSummaryCard({ scan }: ScanSummaryCardProps) {
  const getSeverityVariant = (severity: string): 'critical' | 'high' | 'medium' | 'low' | 'default' => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'critical'
      case 'high': return 'high'
      case 'medium': return 'medium'
      case 'low': return 'low'
      default: return 'default'
    }
  }

  const getStatusVariant = (status: string): 'success' | 'info' | 'default' => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success'
      case 'running': return 'info'
      default: return 'default'
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
    <Card variant="bordered" className="hover:border-cyber-blue transition-all duration-200">
      <CardContent>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-cyber-gray-900 dark:text-cyber-gray-50 truncate flex items-center gap-2">
              <svg className="h-4 w-4 text-cyber-blue dark:text-cyber-blue-light flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              {scan.hostname || new URL(scan.targetUrl).hostname}
            </h3>
            <p className="text-xs text-cyber-gray-500 dark:text-cyber-gray-400 truncate font-mono mt-1" title={scan.targetUrl}>
              {scan.targetUrl}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            <Badge variant={getStatusVariant(scan.status)} size="sm">
              {scan.status}
            </Badge>
            {scan.status === 'COMPLETED' && typeof scan.score === 'number' && (
              <Badge
                variant={getRiskLevel(scan.score) === 'LOW' ? 'success' :
                  getRiskLevel(scan.score) === 'MEDIUM' ? 'info' :
                    getRiskLevel(scan.score) === 'HIGH' ? 'default' : 'critical'}
                size="sm"
                className="font-bold"
              >
                {getRiskLevel(scan.score)} · {scan.score}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-cyber-gray-600 dark:text-cyber-gray-500 mb-3 font-mono">
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {scan.mode}
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(scan.createdAt).toLocaleDateString()}
          </span>
        </div>

        {scan.status === 'COMPLETED' && totalVulnerabilities > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-cyber-gray-700 dark:text-cyber-gray-300">
                {totalVulnerabilities} {totalVulnerabilities === 1 ? 'Issue' : 'Issues'} Found
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {severityCounts.critical > 0 && (
                <Badge variant="critical" size="sm" className="justify-center">
                  Critical: {severityCounts.critical}
                </Badge>
              )}
              {severityCounts.high > 0 && (
                <Badge variant="high" size="sm" className="justify-center">
                  High: {severityCounts.high}
                </Badge>
              )}
              {severityCounts.medium > 0 && (
                <Badge variant="medium" size="sm" className="justify-center">
                  Medium: {severityCounts.medium}
                </Badge>
              )}
              {severityCounts.low > 0 && (
                <Badge variant="low" size="sm" className="justify-center">
                  Low: {severityCounts.low}
                </Badge>
              )}
            </div>
          </div>
        ) : scan.status === 'COMPLETED' ? (
          <div className="text-center py-2">
            <Badge variant="success" size="md">✓ No Issues Found</Badge>
          </div>
        ) : scan.status === 'FAILED' ? (
          <div className="text-center py-2">
            <Badge variant="critical" size="md">Scan Failed</Badge>
          </div>
        ) : (
          <div className="text-center py-2 text-sm text-cyber-gray-600 dark:text-cyber-gray-400 flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-cyber-blue border-t-transparent"></div>
            Scanning...
          </div>
        )}

        {scan.status === 'COMPLETED' && (
          <Link href={`/scan/${scan.id}`} className="mt-4 block">
            <Button variant="ghost" size="sm" className="w-full">
              View Details
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
