'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Scan, Vulnerability, SecurityTest } from '@prisma/client'
import VulnerabilityCard from '@/components/VulnerabilityCard'
import { ScoreCard } from '@/components/ScoreCard'
import { SecurityTestCard } from '@/components/SecurityTestCard'
import { createScan } from '@/app/actions'
import { ScanHistory } from '@/components/ScanHistory'
import AppLayout from '@/components/AppLayout'

type ScanWithDetails = Scan & {
  results: Vulnerability[]
  securityTests: SecurityTest[]
}

export default function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [scan, setScan] = useState<ScanWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [rescanning, setRescanning] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [activeTab, setActiveTab] = useState<'overview' | 'vulnerabilities' | 'security-tests'>('overview')

  useEffect(() => {
    loadScanDetails()
  }, [id])

  useEffect(() => {
    if (!scan) return

    // Continue polling until scan is completed or failed
    if (scan.status === 'RUNNING' || scan.status === 'PENDING') {
      const interval = setInterval(() => {
        loadScanDetails()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [scan?.status])

  const loadScanDetails = async () => {
    try {
      const response = await fetch(`/api/scan/${id}/results`)
      if (!response.ok) throw new Error('Failed to load scan data')

      const data = await response.json()
      setScan(data.scan)
    } catch (error) {
      console.error('Error loading scan:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRescan = async () => {
    if (!scan) return

    setRescanning(true)
    try {
      const { scanId } = await createScan(scan.targetUrl, scan.mode)
      router.push(`/scan/${scanId}`)
    } catch (error) {
      console.error('Error creating rescan:', error)
      alert('Failed to create new scan')
    } finally {
      setRescanning(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading scan details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!scan) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Scan not found</p>
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
              Go back home
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  const filteredVulnerabilities = filter === 'ALL'
    ? scan.results
    : scan.results.filter(v => v.severity === filter)

  const severityCounts = {
    critical: scan.results.filter(v => v.severity === 'CRITICAL').length,
    high: scan.results.filter(v => v.severity === 'HIGH').length,
    medium: scan.results.filter(v => v.severity === 'MEDIUM').length,
    low: scan.results.filter(v => v.severity === 'LOW').length,
  }

  const passedTests = scan.securityTests?.filter(t => t.passed).length || 0
  const totalTests = scan.securityTests?.length || 0
  const rawHeaders = (scan.scanSummary as any)?.rawHeaders || null
  const setCookieHeaders = (scan.scanSummary as any)?.setCookieHeaders || []
  const cspValue = (scan.scanSummary as any)?.csp || null

  return (
    <AppLayout showBackButton backButtonLabel="Back to Results" backButtonHref="/">
      {/* Progress Banner - shown when scan is running */}
      {(scan.status === 'RUNNING' || scan.status === 'PENDING') && (
        <div className="bg-blue-600 dark:bg-blue-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                <div className="text-white">
                  <p className="font-medium">
                    {scan.status === 'PENDING' ? 'Scan queued and waiting to start...' : 'Scan in progress...'}
                  </p>
                  <p className="text-sm text-blue-100">Results will update automatically</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white text-sm">
                <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Refreshing every 3s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-b-2 border-blue-200 dark:border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Scan Report</h2>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{scan.targetUrl}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(scan.createdAt).toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  {scan.mode} Mode
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRescan}
                disabled={rescanning || scan.status === 'RUNNING' || scan.status === 'PENDING'}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md hover:shadow-lg transition-all"
              >
                {rescanning ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Rescanning...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Rescan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('security-tests')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'security-tests'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              Security Tests ({totalTests})
            </button>
            <button
              onClick={() => setActiveTab('vulnerabilities')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'vulnerabilities'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              Vulnerabilities ({scan.results.length})
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* In-progress message */}
            {(scan.status === 'RUNNING' || scan.status === 'PENDING') && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="animate-spin h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {scan.status === 'PENDING' ? 'Scan Pending' : 'Scan Running'}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {scan.status === 'PENDING'
                        ? 'Your scan is queued and will start shortly. Please wait while we initialize the security scan.'
                        : 'Security analysis is currently in progress. This page will automatically update as results become available.'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Partial results may be visible below and will update automatically</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Score Card */}
            {scan.score !== null && scan.grade && scan.status === 'COMPLETED' && (
              <ScoreCard
                score={scan.score}
                grade={scan.grade}
                passedTests={passedTests}
                totalTests={totalTests}
              />
            )}

            {/* Scan Info */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Scan Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Scan ID</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white truncate">{scan.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className={`text-sm font-medium ${scan.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400' :
                    scan.status === 'RUNNING' ? 'text-blue-600 dark:text-blue-400' :
                      scan.status === 'FAILED' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                    }`}>{scan.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mode</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{scan.mode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {scan.completedAt ? new Date(scan.completedAt).toLocaleString() : 'In Progress'}
                  </p>
                </div>
              </div>
            </div>

            {/* Severity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-900 rounded-lg p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical</h3>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{severityCounts.critical}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-900 rounded-lg p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">High</h3>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{severityCounts.high}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border-2 border-yellow-200 dark:border-yellow-900 rounded-lg p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Medium</h3>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{severityCounts.medium}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-900 rounded-lg p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Low</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{severityCounts.low}</p>
              </div>
            </div>

            {/* Raw Server Headers */}
            {rawHeaders && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Raw Server Headers</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Captured from initial request without following redirects.</p>
                <div className="max-h-64 overflow-auto bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs">
                  <pre className="text-gray-900 dark:text-gray-100">{JSON.stringify(rawHeaders, null, 2)}</pre>
                </div>
                {setCookieHeaders && setCookieHeaders.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Set-Cookie</h3>
                    <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-300">
                      {setCookieHeaders.map((c: string, idx: number) => (
                        <li key={idx} className="break-all">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {cspValue && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Content-Security-Policy</h3>
                    <div className="text-xs bg-gray-50 dark:bg-gray-900 rounded p-2 break-all text-gray-900 dark:text-gray-100">{cspValue}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Security Tests Tab */}
        {activeTab === 'security-tests' && (
          <div className="space-y-4">
            {scan.securityTests && scan.securityTests.length > 0 ? (
              scan.securityTests.map((test) => (
                <SecurityTestCard
                  key={test.id}
                  testName={test.testName}
                  passed={test.passed}
                  score={test.score}
                  result={test.result as any}
                  reason={test.reason || ''}
                  recommendation={test.recommendation || undefined}
                  details={test.details as any}
                />
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">No security tests available. Run a DYNAMIC or BOTH scan to see security tests.</p>
              </div>
            )}

            {/* Scan History for Hostname */}
            <ScanHistory hostname={scan.hostname || new URL(scan.targetUrl).hostname} />
          </div>
        )}

        {/* Vulnerabilities Tab */}
        {activeTab === 'vulnerabilities' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((severity) => (
                  <button
                    key={severity}
                    onClick={() => setFilter(severity)}
                    className={`px-3 py-1 text-sm rounded-lg border ${filter === severity
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    {severity} {severity !== 'ALL' && `(${severityCounts[severity.toLowerCase() as keyof typeof severityCounts]})`}
                  </button>
                ))}
              </div>
            </div>

            {filteredVulnerabilities.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  {filter === 'ALL'
                    ? 'No vulnerabilities found. Great job!'
                    : `No ${filter} severity vulnerabilities found.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredVulnerabilities.map((vulnerability) => (
                  <VulnerabilityCard key={vulnerability.id} vulnerability={vulnerability} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </AppLayout>
  )
}
