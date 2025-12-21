'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Scan, Vulnerability } from '@prisma/client'
import { ScanMode } from '@prisma/client'
import { getRecentScans, createScan, runStaticAnalysis, runDynamicAnalysis } from './actions'

export default function Home() {
  const [recentScans, setRecentScans] = useState<(Scan & { results: Vulnerability[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [scanUrl, setScanUrl] = useState('')
  const [scanMode, setScanMode] = useState<ScanMode>(ScanMode.BOTH)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const scans = await getRecentScans()
      setRecentScans(scans)
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
      const { scanId } = await createScan(scanUrl.trim(), scanMode)

      // Run analysis based on mode
      if (scanMode === ScanMode.STATIC || scanMode === ScanMode.BOTH) {
        await runStaticAnalysis(scanId)
      }
      if (scanMode === ScanMode.DYNAMIC || scanMode === ScanMode.BOTH) {
        await runDynamicAnalysis(scanId)
      }

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
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'running': return 'text-blue-600 bg-blue-100'
      case 'pending': return 'text-gray-600 bg-gray-100'
      case 'failed': return 'text-red-600 bg-red-100'
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
            <div className="flex gap-4 items-center">
              <input
                type="url"
                value={scanUrl}
                onChange={(e) => setScanUrl(e.target.value)}
                placeholder="Enter website URL (e.g., https://example.com)"
                className="flex-1 px-4 py-2 border border-agent/20 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-agent/50"
                disabled={scanning}
              />
              <select
                value={scanMode}
                onChange={(e) => setScanMode(e.target.value as ScanMode)}
                className="px-4 py-2 border border-agent/20 rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-agent/50"
                disabled={scanning}
              >
                <option value={ScanMode.STATIC}>Static Only</option>
                <option value={ScanMode.DYNAMIC}>Dynamic Only</option>
                <option value={ScanMode.BOTH}>Both</option>
              </select>
              <button
                onClick={handleScan}
                disabled={scanning || !scanUrl.trim()}
                className="px-6 py-2 bg-agent text-white rounded hover:bg-agent/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scanning ? 'Scanning...' : 'Scan'}
              </button>
            </div>
          </section>

          {/* Recent Scans */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Recent Scans</h2>
            {loading ? (
              <p className="text-foreground/70">Loading recent scans...</p>
            ) : recentScans.length === 0 ? (
              <p className="text-foreground/70">No recent scans found.</p>
            ) : (
              <div className="space-y-4">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="p-4 border border-agent/20 rounded bg-agent/5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{scan.targetUrl}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(scan.status)}`}>
                          {scan.status}
                        </span>
                        <span className="text-xs text-foreground/50">{scan.mode}</span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/70">Created: {new Date(scan.createdAt).toLocaleString()}</p>
                    {scan.results.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Vulnerabilities: {scan.results.length}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(severity => {
                            const count = scan.results.filter(v => v.severity === severity).length
                            if (count === 0) return null
                            return (
                              <span key={severity} className={`px-2 py-1 rounded text-xs ${getSeverityColor(severity)}`}>
                                {severity}: {count}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
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
