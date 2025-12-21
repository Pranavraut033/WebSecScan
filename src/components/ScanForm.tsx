'use client'

import { useState } from 'react'
import { ScanMode } from '@prisma/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import Alert from '@/components/ui/Alert'
import Spinner from '@/components/ui/Spinner'

interface ScanFormProps {
  onScanComplete?: () => void
}

export default function ScanForm({ onScanComplete }: ScanFormProps) {
  const [scanUrl, setScanUrl] = useState('')
  const [scanMode, setScanMode] = useState<ScanMode>(ScanMode.BOTH)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [urlInfo, setUrlInfo] = useState<{
    protocol: string
    warnings: string[]
    securityThreats: string[]
    redirected: boolean
  } | null>(null)

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

      // Store URL normalization info
      if (data.urlInfo) {
        setUrlInfo(data.urlInfo)
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
            setUrlInfo(null)

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
    <Card variant="glow">
      <CardHeader>
        <CardTitle className="text-cyber-blue-light glow-text">Start New Scan</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Input
          id="url"
          type="url"
          label="Target URL"
          value={scanUrl}
          onChange={(e) => setScanUrl(e.target.value)}
          placeholder="https://example.com"
          disabled={scanning}
          leftIcon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          }
        />

        <div>
          <Select
            id="mode"
            label="Scan Mode"
            value={scanMode}
            onChange={(e) => setScanMode(e.target.value as ScanMode)}
            disabled={scanning}
          >
            <option value={ScanMode.STATIC}>Static Analysis Only</option>
            <option value={ScanMode.DYNAMIC}>Dynamic Analysis Only</option>
            <option value={ScanMode.BOTH}>Both (Recommended)</option>
          </Select>
          <p className="mt-1.5 text-xs text-cyber-gray-400">
            {scanMode === ScanMode.STATIC && '🔍 Analyzes code structure and dependencies'}
            {scanMode === ScanMode.DYNAMIC && '🚀 Tests runtime behavior and responses'}
            {scanMode === ScanMode.BOTH && '⚡ Comprehensive analysis combining both methods'}
          </p>
        </div>

        <Checkbox
          id="consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={scanning}
          label="I confirm that I own this website or have explicit permission to scan it. Scanning websites without permission may be illegal."
        />

        {error && (
          <Alert variant="danger" title="Error">
            {error}
          </Alert>
        )}

        {urlInfo && !scanning && (
          <Alert
            variant={urlInfo.securityThreats.length > 0 ? 'warning' : 'info'}
            title="URL Information"
          >
            <ul className="space-y-1">
              <li>• Protocol: <span className="font-mono font-bold">{urlInfo.protocol.toUpperCase()}</span></li>
              {urlInfo.redirected && <li>• URL redirects detected</li>}
              {urlInfo.warnings.map((warning, i) => (
                <li key={i}>• {warning}</li>
              ))}
              {urlInfo.securityThreats.length > 0 && (
                <li className="font-medium">
                  ⚠️ Security threats: {urlInfo.securityThreats.join(', ')}
                </li>
              )}
            </ul>
          </Alert>
        )}

        <Button
          onClick={handleScan}
          disabled={scanning || !scanUrl.trim() || !consent}
          isLoading={scanning}
          variant="primary"
          size="lg"
          className="w-full"
          leftIcon={
            !scanning && (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )
          }
        >
          {scanning ? 'Scanning in Progress...' : 'Start Security Scan'}
        </Button>

        {scanning && (
          <div className="flex items-center justify-center space-x-3 text-sm text-cyber-gray-400">
            <Spinner size="sm" variant="primary" />
            <span>Analyzing security vulnerabilities...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
