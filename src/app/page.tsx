'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { getRecentScans, getTrendingSites, scanWebsite } from './actions'

interface ScanResult {
  id: string
  url: string
  host: string
  timestamp: Date
  status: string
  vulnerabilities?: Vulnerability[] | Prisma.JsonValue | null
  scanDuration?: number | null
}

interface TrendingSite {
  id: string
  url: string
  name: string
  rank: number
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

export default function Home() {
  const [recentScans, setRecentScans] = useState<ScanResult[]>([])
  const [trendingSites, setTrendingSites] = useState<TrendingSite[]>([])
  const [loading, setLoading] = useState(true)
  const [scanUrl, setScanUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanResults, setScanResults] = useState<Vulnerability[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [scans, sites] = await Promise.all([
        getRecentScans(),
        getTrendingSites(),
      ])
      setRecentScans(scans)
      setTrendingSites(sites)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async () => {
    if (!scanUrl.trim()) return

    setScanning(true)
    try {
      const result = await scanWebsite(scanUrl.trim())
      setScanResults((result.vulnerabilities as unknown as Vulnerability[]) || [])
      // Reload recent scans to include the new one
      await loadData()
      setScanUrl('')
    } catch (error) {
      console.error('Error scanning website:', error)
      alert('Error scanning website. Please try again.')
    } finally {
      setScanning(false)
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-agent/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-agent">WebSecScan</h1>
            <p className="text-sm text-foreground/70">Automated Security Scanner for Web Applications</p>
          </div>
          <Link
            href="/results"
            className="px-4 py-2 bg-agent/20 text-agent rounded hover:bg-agent/30 transition-colors"
          >
            View Results
          </Link>
        </div>
      </header>
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Scan Form */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Scan a Website</h2>
            <div className="flex gap-4">
              <input
                type="url"
                value={scanUrl}
                onChange={(e) => setScanUrl(e.target.value)}
                placeholder="Enter website URL (e.g., https://example.com)"
                className="flex-1 px-4 py-2 border border-agent/20 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-agent/50"
                disabled={scanning}
              />
              <button
                onClick={handleScan}
                disabled={scanning || !scanUrl.trim()}
                className="px-6 py-2 bg-agent text-white rounded hover:bg-agent/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scanning ? 'Scanning...' : 'Scan'}
              </button>
            </div>
          </section>

          {/* Scan Results */}
          {scanResults.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Scan Results</h2>
              <div className="space-y-4">
                {scanResults.map((vuln) => (
                  <div key={vuln.id} className="p-4 border border-vulnerability/20 rounded bg-vulnerability/5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{vuln.name}</h3>
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
                    <p className="text-sm text-foreground/70">{vuln.description}</p>
                    {vuln.owaspCategory && (
                      <p className="text-xs text-foreground/50 mt-1">Category: {vuln.owaspCategory}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Trending Sites</h2>
            {trendingSites.length === 0 ? (
              <p>No trending sites available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingSites.map((site) => (
                  <div
                    key={site.id}
                    className="p-4 border border-agent/20 rounded bg-agent/5 hover:bg-agent/10 cursor-pointer"
                    onClick={() => setScanUrl(site.url)}
                  >
                    <p className="font-medium">{site.name}</p>
                    <p className="text-sm text-foreground/70">{site.url}</p>
                    <p className="text-xs text-foreground/50">Rank #{site.rank}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-4">Recent Scans</h2>
            {loading ? (
              <p>Loading recent scans...</p>
            ) : recentScans.length === 0 ? (
              <p>No recent scans found.</p>
            ) : (
              <div className="space-y-4">
                {recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className={`p-4 border rounded ${scan.status === 'safe'
                      ? 'border-safe/20 bg-safe/5'
                      : 'border-vulnerability/20 bg-vulnerability/5'
                      }`}
                  >
                    <p className="font-medium">
                      {scan.url} - {scan.status === 'safe' ? 'Safe' : 'Vulnerabilities Detected'}
                    </p>
                    <p className="text-sm text-foreground/70">
                      {scan.status === 'safe'
                        ? 'No vulnerabilities found.'
                        : `Vulnerabilities: ${Array.isArray(scan.vulnerabilities) ? scan.vulnerabilities.length : 0} found.`}
                    </p>
                    <p className="text-xs text-foreground/50">
                      {new Date(scan.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
