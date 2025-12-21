'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Scan, Vulnerability } from '@prisma/client'
import { getRecentScans } from '../actions'
import ScanSummaryCard from '@/components/ScanSummaryCard'
import AppLayout from '@/components/AppLayout'

export default function ResultsPage() {
  const [scanResults, setScanResults] = useState<(Scan & { results: Vulnerability[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'COMPLETED' | 'RUNNING' | 'FAILED'>('ALL')

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

  const filteredScans = filterStatus === 'ALL'
    ? scanResults
    : scanResults.filter(scan => scan.status === filterStatus)

  const statusCounts = {
    all: scanResults.length,
    completed: scanResults.filter(s => s.status === 'COMPLETED').length,
    running: scanResults.filter(s => s.status === 'RUNNING').length,
    failed: scanResults.filter(s => s.status === 'FAILED').length,
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Dashboard */}
        {!loading && scanResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Scans</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{statusCounts.all}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{statusCounts.completed}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Running</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{statusCounts.running}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</h3>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{statusCounts.failed}</p>
            </div>
          </div>
        )}

        {/* All Scans Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Scan Results</h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 mb-6 overflow-x-auto">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${filterStatus === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              onClick={() => setFilterStatus('COMPLETED')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${filterStatus === 'COMPLETED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              Completed ({statusCounts.completed})
            </button>
            <button
              onClick={() => setFilterStatus('RUNNING')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${filterStatus === 'RUNNING'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              Running ({statusCounts.running})
            </button>
            <button
              onClick={() => setFilterStatus('FAILED')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${filterStatus === 'FAILED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              Failed ({statusCounts.failed})
            </button>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Loading scans...</p>
            </div>
          ) : filteredScans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                {filterStatus === 'ALL'
                  ? 'No scans yet. Start your first scan!'
                  : `No ${filterStatus.toLowerCase()} scans found.`}
              </p>
              <Link
                href="/"
                className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Start New Scan
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredScans.map((scan) => (
                <ScanSummaryCard key={scan.id} scan={scan} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
