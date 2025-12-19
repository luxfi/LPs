#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const LPS_DIR = path.join(__dirname, '../../LPs')
const OUTPUT_FILE = path.join(__dirname, '../public/lp-index.json')

function generateLPIndex() {
  const index = {}

  try {
    const files = fs.readdirSync(LPS_DIR)
    const lpFiles = files.filter(f => f.startsWith('lp-') && f.endsWith('.md'))

    for (const file of lpFiles) {
      // Extract number from filename like lp-0020-fungible-token-standard.md
      const match = file.match(/^lp-(\d+)/)
      if (match) {
        const num = parseInt(match[1], 10)
        const slug = file.replace(/\.md$/, '')
        index[num] = slug
      }
    }

    // Ensure public directory exists
    const publicDir = path.dirname(OUTPUT_FILE)
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2))
    console.log(`Generated LP index with ${Object.keys(index).length} entries`)
    console.log(`Output: ${OUTPUT_FILE}`)
  } catch (error) {
    console.error('Error generating LP index:', error)
    process.exit(1)
  }
}

generateLPIndex()
