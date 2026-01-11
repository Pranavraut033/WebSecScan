'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

interface AuthConfig {
  enabled: boolean
  loginUrl: string
  usernameSelector: string
  passwordSelector: string
  submitSelector: string
  username: string
  password: string
  successSelector?: string
}

export default function ScanForm({ onScanComplete }: ScanFormProps) {
  const router = useRouter()
  const [scanUrl, setScanUrl] = useState('')
  const [scanMode, setScanMode] = useState<ScanMode>(ScanMode.BOTH)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [authConsent, setAuthConsent] = useState(false)
  const [showAuthConfig, setShowAuthConfig] = useState(false)
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
    enabled: false,
    loginUrl: '',
    usernameSelector: '#username',
    passwordSelector: '#password',
    submitSelector: 'button[type="submit"]',
    username: '',
    password: '',
    successSelector: ''
  })
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

    if (authConfig.enabled && !authConsent) {
      setError('You must confirm authorization for authenticated scanning')
      return
    }

    setError(null)
    setScanning(true)

    try {
      const requestBody: any = {
        targetUrl: scanUrl.trim(),
        mode: scanMode,
      }

      // Add auth config if enabled and valid
      if (authConfig.enabled) {
        if (!authConfig.loginUrl || !authConfig.username || !authConfig.password) {
          throw new Error('Authentication requires login URL, username, and password')
        }
        
        requestBody.authConfig = {
          loginUrl: authConfig.loginUrl,
          usernameSelector: authConfig.usernameSelector,
          passwordSelector: authConfig.passwordSelector,
          submitSelector: authConfig.submitSelector,
          credentials: {
            username: authConfig.username,
            password: authConfig.password
          },
          successSelector: authConfig.successSelector || undefined
        }
      }

      const response = await fetch('/api/scan/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start scan')
      }

      // Store URL normalization info
      if (data.urlInfo) {
        setUrlInfo(data.urlInfo)
      }

      // Redirect to scan page to watch progress in real-time
      const scanId = data.scanId
      router.push(`/scan/${scanId}`)

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

        <div className="border-t border-cyber-gray-700 pt-4">
          <Checkbox
            id="enable-auth"
            checked={showAuthConfig}
            onChange={(e) => {
              setShowAuthConfig(e.target.checked)
              setAuthConfig(prev => ({ ...prev, enabled: e.target.checked }))
            }}
            disabled={scanning}
            label="Enable Authenticated Scanning (Optional)"
          />
          <p className="mt-1 text-xs text-cyber-gray-400">
            Test security of pages behind login barriers. Only use test accounts you own.
          </p>
        </div>

        {showAuthConfig && (
          <div className="space-y-3 border border-cyber-blue-dark/30 rounded-lg p-4 bg-cyber-dark/50">
            <Alert variant="warning" title="Security Notice">
              Only use dedicated test accounts. Never use real credentials. All authentication 
              is performed safely in isolated browser contexts with no credential persistence.
            </Alert>

            <Input
              id="loginUrl"
              type="url"
              label="Login Page URL"
              value={authConfig.loginUrl}
              onChange={(e) => setAuthConfig(prev => ({ ...prev, loginUrl: e.target.value }))}
              placeholder="https://example.com/login"
              disabled={scanning}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                id="username"
                type="text"
                label="Test Username"
                value={authConfig.username}
                onChange={(e) => setAuthConfig(prev => ({ ...prev, username: e.target.value }))}
                placeholder="testuser"
                disabled={scanning}
              />

              <Input
                id="password"
                type="password"
                label="Test Password"
                value={authConfig.password}
                onChange={(e) => setAuthConfig(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                disabled={scanning}
              />
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-cyber-blue-light hover:text-cyber-blue mb-2">
                Advanced: CSS Selectors
              </summary>
              <div className="space-y-2 pl-4">
                <Input
                  id="usernameSelector"
                  type="text"
                  label="Username Field Selector"
                  value={authConfig.usernameSelector}
                  onChange={(e) => setAuthConfig(prev => ({ ...prev, usernameSelector: e.target.value }))}
                  placeholder="#username"
                  disabled={scanning}
                />
                <Input
                  id="passwordSelector"
                  type="text"
                  label="Password Field Selector"
                  value={authConfig.passwordSelector}
                  onChange={(e) => setAuthConfig(prev => ({ ...prev, passwordSelector: e.target.value }))}
                  placeholder="#password"
                  disabled={scanning}
                />
                <Input
                  id="submitSelector"
                  type="text"
                  label="Submit Button Selector"
                  value={authConfig.submitSelector}
                  onChange={(e) => setAuthConfig(prev => ({ ...prev, submitSelector: e.target.value }))}
                  placeholder='button[type="submit"]'
                  disabled={scanning}
                />
                <Input
                  id="successSelector"
                  type="text"
                  label="Success Indicator (Optional)"
                  value={authConfig.successSelector}
                  onChange={(e) => setAuthConfig(prev => ({ ...prev, successSelector: e.target.value }))}
                  placeholder=".dashboard or #welcome"
                  disabled={scanning}
                />
              </div>
            </details>

            <Checkbox
              id="auth-consent"
              checked={authConsent}
              onChange={(e) => setAuthConsent(e.target.checked)}
              disabled={scanning}
              label="I confirm this is a test account I own and authorize automated login testing. No brute force will be attempted."
            />
          </div>
        )}

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
          disabled={scanning || !scanUrl.trim() || !consent || (authConfig.enabled && !authConsent)}
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
          {scanning ? 'Scanning in Progress...' : (authConfig.enabled ? 'Start Authenticated Scan' : 'Start Security Scan')}
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
