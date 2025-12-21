/**
 * Server-Sent Events (SSE) API route for real-time scan logs
 * Streams scan progress updates to connected clients
 */

import { NextRequest } from 'next/server'
import { registerSSEConnection, unregisterSSEConnection } from '@/lib/scanLogger'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const scanId = searchParams.get('scanId')

  if (!scanId) {
    return new Response('Missing scanId parameter', { status: 400 })
  }

  // Create a readable stream for SSE
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initialMsg = `data: ${JSON.stringify({
        scanId,
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Connected to scan log stream',
      })}\n\n`
      controller.enqueue(encoder.encode(initialMsg))

      // Register callback for this connection
      const callback = (log: any) => {
        const message = `data: ${JSON.stringify(log)}\n\n`
        try {
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('Error sending SSE message:', error)
        }
      }

      registerSSEConnection(scanId, callback)

      // Handle cleanup
      const cleanup = () => {
        unregisterSSEConnection(scanId, callback)
        try {
          controller.close()
        } catch (e) {
          // Already closed
        }
      }

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', cleanup)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
