'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function NotFound() {
  const [redirecting, setRedirecting] = useState(false)
  const [targetUrl, setTargetUrl] = useState<string | null>(null)

  useEffect(() => {
    // Check if this is an old-style LP URL that needs redirecting
    const path = window.location.pathname

    // Match patterns like /docs/lp-20, /docs/lp-0020, /docs/LP-20
    const lpMatch = path.match(/\/docs\/lp-?(\d+)$/i)

    if (lpMatch) {
      const lpNumber = parseInt(lpMatch[1], 10)

      // Fetch the LP index to find the correct slug
      fetch('/lp-index.json')
        .then(res => res.json())
        .then((index: Record<string, string>) => {
          const fullSlug = index[lpNumber.toString()]
          if (fullSlug) {
            setTargetUrl(`/docs/${fullSlug}`)
            setRedirecting(true)
            // Redirect after a brief delay to show the message
            setTimeout(() => {
              window.location.href = `/docs/${fullSlug}`
            }, 1500)
          }
        })
        .catch(() => {
          // Index not found, just show 404
        })
    }
  }, [])

  if (redirecting && targetUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <div className="text-center max-w-md px-6">
          <div className="mb-6">
            <svg
              className="w-16 h-16 mx-auto text-blue-500 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
          <p className="text-gray-400 mb-4">
            Found the LP you&apos;re looking for. Redirecting to the full URL.
          </p>
          <Link
            href={targetUrl}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Click here if not redirected
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <div className="text-center max-w-md px-6">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/docs"
            className="px-6 py-3 bg-white text-black rounded-md hover:bg-gray-200 transition-colors font-medium"
          >
            Browse All LPs
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-white/30 rounded-md hover:bg-white/10 transition-colors"
          >
            Go Home
          </Link>
        </div>
        <div className="mt-12 text-sm text-gray-500">
          <p>Looking for a specific LP?</p>
          <p className="mt-2">
            Try searching at{' '}
            <Link href="/docs" className="text-blue-400 hover:underline">
              /docs
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
