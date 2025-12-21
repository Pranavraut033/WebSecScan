# Real-time Scan Logging

This document describes the real-time logging feature for WebSecScan that allows users to monitor scan progress in real-time.

## Architecture

The implementation uses **Server-Sent Events (SSE)** instead of WebSockets for better compatibility with Next.js and serverless deployments.

### Components

1. **Central Logger Library** (`src/lib/scanLogger.ts`)
   - Manages SSE connections per scan
   - Provides type-safe logging interface
   - Helper functions for different log levels (info, success, warning, error)

2. **SSE API Route** (`src/app/api/scan/logs/route.ts`)
   - Establishes SSE connection with client
   - Streams log messages to connected clients
   - Handles connection cleanup

3. **ScanLogs Component** (`src/components/ScanLogs.tsx`)
   - Client-side component that displays logs
   - Fixed height container with scrolling
   - Auto-scrolls to latest log entry
   - Displays connection status indicator

4. **Updated Scan Actions** (`src/app/actions.ts`)
   - Static and dynamic analysis functions emit logs
   - Logs include phase information and progress updates

5. **Updated Scan Flow**
   - ScanForm now redirects to scan page immediately after starting
   - Scan page displays real-time logs during scan execution
   - Logs component only visible when scan is PENDING or RUNNING

## Usage

### Emitting Logs from Scanner Code

```typescript
import { ScanLogger } from '@/lib/scanLogger'

// Info log
ScanLogger.info(scanId, 'Starting analysis...', 'PHASE_NAME')

// Success log
ScanLogger.success(scanId, 'Analysis completed', 'PHASE_NAME')

// Warning log
ScanLogger.warning(scanId, 'Potential issue detected', 'PHASE_NAME')

// Error log
ScanLogger.error(scanId, 'Analysis failed', 'PHASE_NAME')
```

### Log Structure

Each log entry contains:
- `scanId`: ID of the scan
- `timestamp`: ISO 8601 timestamp
- `level`: 'info' | 'success' | 'warning' | 'error'
- `message`: Human-readable message
- `phase`: Optional phase identifier (e.g., 'STATIC', 'DYNAMIC')
- `metadata`: Optional additional data

## UI Features

- **Fixed Height**: Log container has a fixed height (h-32) and scrolls internally
- **Auto-scroll**: Automatically scrolls to the latest log entry
- **Color Coding**: Different log levels have distinct colors
- **Phase Labels**: Phase information displayed in blue
- **Connection Status**: Live indicator shows SSE connection status
- **Timestamps**: Each log shows the time it was emitted

## User Flow

1. User enters URL and clicks "Start Scan"
2. Immediately redirected to `/scan/{scanId}`
3. Scan page shows:
   - Blue banner indicating scan is in progress
   - Real-time logs component showing scan progress
   - Auto-refreshing scan status (every 3 seconds)
4. Logs update in real-time as scan progresses
5. When scan completes:
   - Logs component disappears
   - Full results are displayed

## Technical Details

### Why SSE over WebSocket?

- **Simpler**: SSE is unidirectional (server → client) which is all we need
- **Better Support**: Works well with Next.js and serverless environments
- **Auto-reconnect**: Browser handles reconnection automatically
- **Firewall Friendly**: Uses standard HTTP, no special protocols

### Performance Considerations

- Logs are kept in-memory per scan (not persisted)
- Maximum of 50 logs per client (configurable via `maxLogs` prop)
- SSE connections are cleaned up when scan completes or client disconnects
- No database writes for logs (keeps scan fast)

## Future Enhancements

- [ ] Add log filtering by level
- [ ] Add ability to pause/resume auto-scroll
- [ ] Add download logs feature
- [ ] Add log search functionality
- [ ] Persist logs to database for historical viewing
