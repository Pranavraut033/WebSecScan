/**
 * Central logger for real-time scan progress updates using Server-Sent Events (SSE)
 * Provides a type-safe interface for emitting scan logs to connected clients
 */

export type ScanLogLevel = 'info' | 'success' | 'warning' | 'error'

export interface ScanLog {
  scanId: string
  timestamp: string
  level: ScanLogLevel
  message: string
  phase?: string
  metadata?: Record<string, any>
}

// Type for SSE callback function
type SSECallback = (log: ScanLog) => void

// In-memory store of active SSE connections per scan
const scanConnections = new Map<string, Set<SSECallback>>()

/**
 * Register an SSE callback for a specific scan
 */
export function registerSSEConnection(scanId: string, callback: SSECallback): void {
  if (!scanConnections.has(scanId)) {
    scanConnections.set(scanId, new Set())
  }
  scanConnections.get(scanId)!.add(callback)
}

/**
 * Unregister an SSE callback
 */
export function unregisterSSEConnection(scanId: string, callback: SSECallback): void {
  const connections = scanConnections.get(scanId)
  if (connections) {
    connections.delete(callback)
    if (connections.size === 0) {
      scanConnections.delete(scanId)
    }
  }
}

/**
 * Emit a log message to all connected clients for a specific scan
 */
export function emitScanLog(
  scanId: string,
  level: ScanLogLevel,
  message: string,
  phase?: string,
  metadata?: Record<string, any>
): void {
  const log: ScanLog = {
    scanId,
    timestamp: new Date().toISOString(),
    level,
    message,
    phase,
    metadata,
  }

  const connections = scanConnections.get(scanId)
  if (!connections || connections.size === 0) {
    // No active connections; log server-side only
    console.log(`[ScanLog ${scanId}] ${message}`)
    return
  }

  // Broadcast to all connected clients
  connections.forEach((callback) => {
    try {
      callback(log)
    } catch (error) {
      console.error('Error sending log via SSE:', error)
    }
  })

  // Also log server-side
  console.log(`[ScanLog ${scanId}] ${message}`)
}

/**
 * Get the number of active connections for a scan
 */
export function getConnectionCount(scanId: string): number {
  return scanConnections.get(scanId)?.size || 0
}

/**
 * Helper functions for common log patterns
 */
export const ScanLogger = {
  info: (scanId: string, message: string, phase?: string, metadata?: Record<string, any>) =>
    emitScanLog(scanId, 'info', message, phase, metadata),

  success: (scanId: string, message: string, phase?: string, metadata?: Record<string, any>) =>
    emitScanLog(scanId, 'success', message, phase, metadata),

  warning: (scanId: string, message: string, phase?: string, metadata?: Record<string, any>) =>
    emitScanLog(scanId, 'warning', message, phase, metadata),

  error: (scanId: string, message: string, phase?: string, metadata?: Record<string, any>) =>
    emitScanLog(scanId, 'error', message, phase, metadata),

  phase: (scanId: string, phaseName: string, message: string) =>
    emitScanLog(scanId, 'info', message, phaseName),
}
