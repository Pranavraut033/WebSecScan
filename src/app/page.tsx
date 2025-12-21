'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Scan, Vulnerability } from '@prisma/client'
import { getRecentScans } from './actions'
import ScanForm from '@/components/ScanForm'
import ScanSummaryCard from '@/components/ScanSummaryCard'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'

export default function Home() {
  const [recentScans, setRecentScans] = useState<(Scan & { results: Vulnerability[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalScans: 0,
    totalVulnerabilities: 0,
    criticalCount: 0,
    highCount: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const scans = await getRecentScans()
      setRecentScans(scans)

      // Calculate statistics
      const totalScans = scans.length
      const totalVulnerabilities = scans.reduce((sum, scan) => sum + scan.results.length, 0)
      const criticalCount = scans.reduce((sum, scan) =>
        sum + scan.results.filter(v => v.severity === 'CRITICAL').length, 0)
      const highCount = scans.reduce((sum, scan) =>
        sum + scan.results.filter(v => v.severity === 'HIGH').length, 0)

      setStats({ totalScans, totalVulnerabilities, criticalCount, highCount })
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-scan mb-4">
            WebSecScan
          </h1>
          <p className="text-cyber-gray-700 dark:text-cyber-gray-300 text-lg max-w-2xl mx-auto">
            Advanced security vulnerability scanner for modern web applications
          </p>
        </div>

        {/* Statistics Dashboard */}
        {!loading && recentScans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card variant="bordered" padding="md" className="bg-white dark:bg-cyber-dark/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-cyber-gray-600 dark:text-cyber-gray-400">Total Scans</h3>
                  <p className="text-3xl font-bold text-cyber-gray-900 dark:text-cyber-gray-50 mt-2">{stats.totalScans}</p>
                </div>
                <svg className="h-12 w-12 text-cyber-blue dark:text-cyber-blue-light opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </Card>

            <Card variant="bordered" padding="md" className="bg-white dark:bg-cyber-dark/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-cyber-gray-600 dark:text-cyber-gray-400">Total Issues</h3>
                  <p className="text-3xl font-bold text-cyber-gray-900 dark:text-cyber-gray-50 mt-2">{stats.totalVulnerabilities}</p>
                </div>
                <svg className="h-12 w-12 text-cyber-purple dark:text-cyber-purple-light opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </Card>

            <Card variant="bordered" padding="md" className="border-red-200 dark:border-severity-critical/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-cyber-gray-600 dark:text-cyber-gray-400">Critical</h3>
                  <p className="text-3xl font-bold text-cyber-red-dark dark:text-severity-critical mt-2">{stats.criticalCount}</p>
                </div>
                <svg className="h-12 w-12 text-red-500 dark:text-severity-critical opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </Card>

            <Card variant="bordered" padding="md" className="border-orange-200 dark:border-orange-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-cyber-gray-600 dark:text-cyber-gray-400">High Severity</h3>
                  <p className="text-3xl font-bold text-severity-high dark:text-severity-high mt-2">{stats.highCount}</p>
                </div>
                <svg className="h-12 w-12 text-orange-500 dark:text-orange-400 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scan Form */}
          <div className="lg:col-span-1">
            <ScanForm onScanComplete={loadData} />
          </div>

          {/* Recent Scans */}
          <div className="lg:col-span-2">
            <Card variant="glow">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-cyber-gray-900 dark:text-cyber-blue-light">Recent Scans</CardTitle>
                {recentScans.length > 0 && (
                  <Link href="/results">
                    <Button variant="ghost" size="sm">
                      View All
                      <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </Link>
                )}
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Spinner size="lg" variant="primary" className="mx-auto" />
                    <p className="text-cyber-gray-600 dark:text-cyber-gray-300 mt-4">Loading scans...</p>
                  </div>
                ) : recentScans.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="h-16 w-16 text-cyber-gray-400 dark:text-cyber-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-cyber-gray-600 dark:text-cyber-gray-300">No scans yet. Start your first scan!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentScans.slice(0, 5).map((scan) => (
                      <ScanSummaryCard key={scan.id} scan={scan} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
