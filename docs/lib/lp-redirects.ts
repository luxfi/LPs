// LP number to full slug mapping for redirects
// This allows old links like /docs/lp-20 to redirect to /docs/lp-0020-fungible-token-standard

import fs from 'fs'
import path from 'path'

const LPS_DIR = path.join(process.cwd(), '../LPs')

export interface LPRedirect {
  number: number
  slug: string
}

// Generate LP redirects at build time
export function generateLPRedirects(): Record<number, string> {
  const redirects: Record<number, string> = {}

  try {
    const files = fs.readdirSync(LPS_DIR)
    const lpFiles = files.filter(f => f.startsWith('lp-') && f.endsWith('.md'))

    for (const file of lpFiles) {
      // Extract number from filename like lp-0020-fungible-token-standard.md
      const match = file.match(/^lp-(\d+)/)
      if (match) {
        const num = parseInt(match[1], 10)
        const slug = file.replace(/\.md$/, '')
        redirects[num] = slug
      }
    }
  } catch (error) {
    console.error('Error generating LP redirects:', error)
  }

  return redirects
}

// Static redirects for common short-form LP references
export const lpRedirects = generateLPRedirects()
