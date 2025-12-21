/**
 * Real-time scan logs component
 * Displays streaming logs from the active scan with auto-scroll and fixed height
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import type { ScanLog, ScanLogLevel } from '@/lib/scanLogger'

interface ScanLogsProps {
  scanId: string
  maxLogs?: number
}

export default function ScanLogs({ scanId, maxLogs = 50 }: ScanLogsProps) {
  const [logs, setLogs] = useState<ScanLog[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource(`/api/scan/logs?scanId=${scanId}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const log: ScanLog = JSON.parse(event.data)
        setLogs((prev) => {
          const updated = [...prev, log]
          // Keep only the last maxLogs entries
          return updated.slice(-maxLogs)
        })
      } catch (error) {
        console.error('Error parsing log message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      setIsConnected(false)
      eventSource.close()
    }

    // Cleanup on unmount
    return () => {
      eventSource.close()
    }
  }, [scanId, maxLogs])

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getLevelColor = (level: ScanLogLevel): string => {
    switch (level) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-700 dark:text-gray-300'
    }
  }

  const getLevelIcon = (level: ScanLogLevel): string => {
    switch (level) {
      case 'success':
        return '✓'
      case 'warning':
        return '⚠'
      case 'error':
        return '✗'
      default:
        return '•'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Scan Progress
        </h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnected
                ? 'bg-green-500 animate-pulse'
                : 'bg-gray-400'
              }`}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="h-32 overflow-y-auto bg-gray-50 dark:bg-gray-900 px-4 py-2 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            Waiting for scan logs...
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div
                key={`${log.timestamp}-${index}`}
                className={`flex items-start gap-2 ${getLevelColor(log.level)}`}
              >
                <span className="shrink-0 w-4">
                  {getLevelIcon(log.level)}
                </span>
                <span className="text-gray-400 dark:text-gray-500 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                {log.phase && (
                  <span className="text-blue-600 dark:text-blue-400 shrink-0 font-semibold">
                    [{log.phase}]
                  </span>
                )}
                <span className="flex-1">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}
