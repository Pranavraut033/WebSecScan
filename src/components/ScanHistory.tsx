'use client'

import { useEffect, useState } from 'react'
import { getRiskLevel, getRiskColor } from '@/lib/scoring'

interface HistoryItem {
  id: string
  createdAt: string
  status: string
  score: number | null
  grade: string | null
  mode: string
}

export function ScanHistory({ hostname }: { hostname: string }) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/history/${encodeURIComponent(hostname)}`)
        const data = await res.json()
        const scans = (data.scans || []).map((s: any) => ({
          id: s.id,
          createdAt: s.createdAt,
          status: s.status,
          score: s.score ?? null,
          grade: s.grade ?? null,
          mode: s.mode,
        }))
        setItems(scans)
      } catch (e) {
        console.error('Failed to load history', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [hostname])

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Scan History for {hostname}</h2>
      {loading ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">Loading history...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">No prior scans for this host.</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-400">
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">Mode</th>
                  <th className="py-2 px-2">Score</th>
                  <th className="py-2 px-2">Risk Level</th>
                  <th className="py-2 px-2">Open</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const riskLevel = item.score !== null ? getRiskLevel(item.score) : null
                  const riskColor = riskLevel ? getRiskColor(riskLevel) : ''

                  return (
                    <tr key={item.id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{new Date(item.createdAt).toLocaleString()}</td>
                      <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{item.status}</td>
                      <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{item.mode}</td>
                      <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{item.score ?? '-'}</td>
                      <td className="py-2 px-2">
                        {riskLevel ? (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${riskColor}`}>
                            {riskLevel}
                          </span>
                        ) : (
                          <span className="text-gray-900 dark:text-gray-100">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <a href={`/scan/${item.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">View</a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
