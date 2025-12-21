'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import Button from './ui/Button'

interface AppLayoutProps {
  children: React.ReactNode
  showBackButton?: boolean
  backButtonLabel?: string
  backButtonHref?: string
}

export default function AppLayout({ children, showBackButton, backButtonLabel, backButtonHref }: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const isHome = pathname === '/'
  const isResults = pathname === '/results'

  const handleBack = () => {
    if (backButtonHref) {
      router.push(backButtonHref)
    } else {
      router.back()
    }
  }

  return (
    <div className="min-h-screen bg-cyber-gray-50 dark:bg-cyber-black flex flex-col">
      <header className="bg-white dark:bg-cyber-darker/95 backdrop-blur-sm border-b border-cyber-gray-200 dark:border-cyber-blue/30 shadow-sm dark:shadow-cyber">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <Link href="/" className="block group">
                  <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-scan hover:glow-text transition-all duration-200">
                    WebSecScan
                  </h1>
                </Link>
                <p className="text-sm text-cyber-gray-600 dark:text-cyber-gray-400 mt-1 flex items-center gap-2">
                  <svg className="h-3 w-3 text-cyber-blue dark:text-cyber-blue-light animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="5" />
                  </svg>
                  Automated Web Application Security Scanner
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isHome ? (
                <Link href="/results">
                  <Button variant="primary" size="md">
                    View All Results
                    <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </Link>
              ) : !showBackButton && (
                <Link href="/">
                  <Button variant="ghost" size="md">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white dark:bg-cyber-darker/95 backdrop-blur-sm border-t border-cyber-gray-200 dark:border-cyber-blue/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-sm text-cyber-gray-600 dark:text-cyber-gray-400">
              <p className="flex items-center gap-2">
                <svg className="h-4 w-4 text-cyber-blue dark:text-cyber-blue-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                © 2025 WebSecScan. Academic Security Testing Project.
              </p>
              <p className="mt-1.5 flex items-center gap-2">
                <svg className="h-4 w-4 text-severity-warning dark:text-cyber-yellow flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-severity-warning dark:text-cyber-yellow font-medium">Warning:</span> Only scan systems you own or have explicit permission to test.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-gray-100 dark:bg-cyber-dark/70 border border-cyber-gray-300 dark:border-cyber-blue/30 hover:border-cyber-gray-400 dark:hover:border-cyber-blue/60 transition-all duration-200 text-cyber-gray-700 dark:text-cyber-gray-300 hover:text-cyber-gray-900 dark:hover:text-cyber-blue-light"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-sm font-mono">Light</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span className="text-sm font-mono">Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
