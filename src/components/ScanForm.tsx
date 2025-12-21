'use client'

import { useState } from 'react'
import { ScanMode } from '@prisma/client'

interface ScanFormProps {
  onScanComplete?: () => void
}

export default function ScanForm({ onScanComplete }: ScanFormProps) {
  const [scanUrl, setScanUrl] = useState('')
  const [scanMode, setScanMode] = useState<ScanMode>(ScanMode.BOTH)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)

  const handleScan = async () => {
    if (!scanUrl.trim()) {
      setError('Please enter a valid URL')
      return
    }

    if (!consent) {
      setError('You must confirm that you own or have permission to scan this website')
      return
    }

    setError(null)
    setScanning(true)

    try {
      const response = await fetch('/api/scan/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUrl: scanUrl.trim(),
          mode: scanMode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start scan')
      }

      // Poll for scan completion
      const scanId = data.scanId
      let attempts = 0
      const maxAttempts = 60 // 60 seconds max

      const pollInterval = setInterval(async () => {
        attempts++
        
        try {
          const statusResponse = await fetch(`/api/scan/${scanId}/status`)
          const statusData = await statusResponse.json()

          if (statusData.status === 'COMPLETED' || statusData.status === 'FAILED') {
            clearInterval(pollInterval)
            setScanning(false)
            setScanUrl('')
            setConsent(false)
            
            if (onScanComplete) {
              onScanComplete()
            }
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            setScanning(false)
            setError('Scan is taking longer than expected. Please check results page.')
          }
        } catch (err) {
          clearInterval(pollInterval)
          setScanning(false)
          setError('Error checking scan status')
        }
      }, 2000) // Check every 2 seconds

    } catch (err) {
      console.error('Error scanning website:', err)
      setError(err instanceof Error ? err.message : 'Failed to start scan')
      setScanning(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Start New Scan</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target URL
          </label>
          <input
            id="url"
            type="url"
            value={scanUrl}
            onChange={(e) => setScanUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={scanning}
          />
        </div>

        <div>
          <label htmlFor="mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Scan Mode
          </label>
          <select
            id="mode"
            value={scanMode}
            onChange={(e) => setScanMode(e.target.value as ScanMode)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={scanning}
          >
            <option value={ScanMode.STATIC}>Static Analysis Only</option>
            <option value={ScanMode.DYNAMIC}>Dynamic Analysis Only</option>
            <option value={ScanMode.BOTH}>Both (Recommended)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {scanMode === ScanMode.STATIC && 'Analyzes code structure and dependencies'}
            {scanMode === ScanMode.DYNAMIC && 'Tests runtime behavior and responses'}
            {scanMode === ScanMode.BOTH && 'Comprehensive analysis combining both methods'}
          </p>
        </div>

        <div className="flex items-start">
          <input
            id="consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            disabled={scanning}
          />
          <label htmlFor="consent" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            I confirm that I own this website or have explicit permission to scan it. 
            Scanning websites without permission may be illegal.
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={scanning || !scanUrl.trim() || !consent}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {scanning ? 'Scanning...' : 'Start Security Scan'}
        </button>

        {scanning && (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Scan in progress... This may take a few moments</span>
          </div>
        )}
      </div>
    </div>
  )
}
