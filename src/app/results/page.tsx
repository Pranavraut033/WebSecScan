'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { getRecentScans } from '../actions'

interface ScanResult {
  id: string
  url: string
  host: string
  timestamp: Date
  status: string
  vulnerabilities?: Vulnerability[] | Prisma.JsonValue | null
  scanDuration?: number | null
}

interface Vulnerability {
  id: string
  name: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  owaspTop10?: boolean
  owaspCategory?: string
  owaspLink?: string
}

export default function ResultsPage() {
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null)

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      const results = await getRecentScans()
      setScanResults(results)
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600 bg-green-100'
      case 'vulnerable': return 'text-red-600 bg-red-100'
      case 'error': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-agent/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-agent">WebSecScan - Results</h1>
            <p className="text-sm text-foreground/70">Detailed security scan results</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-agent/20 text-agent rounded hover:bg-agent/30 transition-colors"
          >
            New Scan
          </Link>
        </div>
      </header>
      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-8">
              <p>Loading scan results...</p>
            </div>
          ) : scanResults.length === 0 ? (
            <div className="text-center py-8">
              <p>No scan results found.</p>
              <Link href="/" className="text-agent hover:underline mt-2 inline-block">
                Go back to scan a website
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Results List */}
              <div className="lg:col-span-1">
                <h2 className="text-xl font-semibold mb-4">Scan History</h2>
                <div className="space-y-4">
                  {scanResults.map((scan) => (
                    <div
                      key={scan.id}
                      className={`p-4 border rounded cursor-pointer transition-colors ${selectedScan?.id === scan.id
                          ? 'border-agent bg-agent/10'
                          : 'border-agent/20 bg-agent/5 hover:bg-agent/10'
                        }`}
                      onClick={() => setSelectedScan(scan)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(scan.status)}`}>
                          {scan.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-foreground/50">
                          {new Date(scan.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-medium text-sm truncate">{scan.url}</p>
                      <p className="text-xs text-foreground/70">
                        {Array.isArray(scan.vulnerabilities) ? scan.vulnerabilities.length : 0} vulnerabilities found
                      </p>
                      {scan.scanDuration && (
                        <p className="text-xs text-foreground/50">
                          Duration: {scan.scanDuration}ms
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Results */}
              <div className="lg:col-span-2">
                {selectedScan ? (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Scan Details</h2>
                    <div className="bg-agent/5 border border-agent/20 rounded p-6 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">{selectedScan.url}</h3>
                        <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(selectedScan.status)}`}>
                          {selectedScan.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-foreground/70">Host</p>
                          <p className="font-medium">{selectedScan.host}</p>
                        </div>
                        <div>
                          <p className="text-foreground/70">Scan Date</p>
                          <p className="font-medium">{new Date(selectedScan.timestamp).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-foreground/70">Duration</p>
                          <p className="font-medium">{selectedScan.scanDuration || 'N/A'} ms</p>
                        </div>
                        <div>
                          <p className="text-foreground/70">Vulnerabilities</p>
                          <p className="font-medium">{Array.isArray(selectedScan.vulnerabilities) ? selectedScan.vulnerabilities.length : 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vulnerabilities */}
                    {Array.isArray(selectedScan.vulnerabilities) && selectedScan.vulnerabilities.length > 0 ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Vulnerabilities Found</h3>
                        <div className="space-y-4">
                          {(selectedScan.vulnerabilities as Vulnerability[]).map((vuln: Vulnerability) => (
                            <div key={vuln.id} className="p-4 border border-vulnerability/20 rounded bg-vulnerability/5">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{vuln.name}</h4>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                                    {vuln.severity.toUpperCase()}
                                  </span>
                                  {vuln.owaspTop10 && (
                                    <a
                                      href={vuln.owaspLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded hover:bg-blue-200"
                                    >
                                      OWASP Top 10
                                    </a>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-foreground/70 mb-2">{vuln.description}</p>
                              {vuln.owaspCategory && (
                                <p className="text-xs text-foreground/50">Category: {vuln.owaspCategory}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-green-600 font-medium">No vulnerabilities found!</p>
                        <p className="text-sm text-foreground/70 mt-2">
                          This website appears to be secure based on our automated scan.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-foreground/70">Select a scan from the history to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}