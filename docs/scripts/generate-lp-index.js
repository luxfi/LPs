#!/usr/bin/env node
/**
 * LP Index Generator (JavaScript version)
 * 
 * Generates lp-index.json with proper sorting:
 *   1. tier (ranked: core=0, chain=1, product=2, research=3)
 *   2. order (explicit or computed as lp * 10)
 *   3. lp (canonical identifier, never changes)
 * 
 * Note: The Python version (scripts/build-lp-index-json.py) is the primary generator.
 * This JS version provides the same output for Node.js environments.
 */

const fs = require('fs')
const path = require('path')

const LPS_DIR = path.join(__dirname, '../../LPs')
const OUTPUT_FILE = path.join(__dirname, '../public/lp-index.json')

// Tier ranking for sorting (lower = earlier in browse order)
const TIER_RANK = {
  'core': 0,
  'chain': 1,
  'product': 2,
  'research': 3,
}
const DEFAULT_TIER_RANK = 99

function getTierRank(tier) {
  if (!tier) return DEFAULT_TIER_RANK
  return TIER_RANK[tier.toLowerCase()] ?? DEFAULT_TIER_RANK
}

function getOrder(frontmatter, lpNumber) {
  // Rule: If order missing, default to lp * 10
  const orderStr = frontmatter.order
  if (orderStr) {
    const parsed = parseInt(orderStr, 10)
    if (!isNaN(parsed)) return parsed
  }
  return lpNumber * 10
}

function extractFrontmatter(content) {
  if (!content.startsWith('---')) return {}
  
  const endIdx = content.indexOf('\n---', 3)
  if (endIdx === -1) return {}
  
  const fmText = content.slice(3, endIdx).trim()
  const data = {}
  
  for (const line of fmText.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    
    const key = line.slice(0, colonIdx).trim()
    let val = line.slice(colonIdx + 1).trim()
    
    // Strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || 
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    
    data[key] = val
  }
  
  return data
}

function generateLPIndex() {
  const items = []

  try {
    const files = fs.readdirSync(LPS_DIR)
    const lpFiles = files.filter(f => f.startsWith('lp-') && f.endsWith('.md'))

    for (const file of lpFiles) {
      const match = file.match(/^lp-(\d+)/)
      if (!match) continue
      
      const lpNumber = parseInt(match[1], 10)
      const filePath = path.join(LPS_DIR, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const fm = extractFrontmatter(content)
      
      const tier = fm.tier || ''
      const order = getOrder(fm, lpNumber)
      const tierRank = getTierRank(tier)
      const slug = file.replace(/\.md$/, '')
      
      items.push({
        lp: lpNumber,
        slug,
        file: `LPs/${file}`,
        title: fm.title || 'Untitled',
        description: fm.description || '',
        author: fm.author || '',
        status: fm.status || '',
        type: fm.type || '',
        category: fm.category || '',
        tier,
        order,
        tier_rank: tierRank,
        tags: fm.tags || '',
        created: fm.created || '',
        updated: fm.updated || '',
        requires: fm.requires || '',
        replaces: fm.replaces || '',
        discussions_to: fm['discussions-to'] || '',
      })
    }

    // Sort by: tier_rank → order → lp
    items.sort((a, b) => {
      if (a.tier_rank !== b.tier_rank) return a.tier_rank - b.tier_rank
      if (a.order !== b.order) return a.order - b.order
      return a.lp - b.lp
    })

    // Build output structure
    const output = {
      generated: true,
      lp_count: items.length,
      sort_order: ['tier_rank', 'order', 'lp'],
      tier_ranks: TIER_RANK,
      lps: items,
      by_lp: Object.fromEntries(items.map(item => [item.lp, item.slug])),
    }

    // Ensure public directory exists
    const publicDir = path.dirname(OUTPUT_FILE)
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2))
    console.log(`Generated LP index with ${items.length} entries`)
    console.log(`Sort order: tier_rank → order → lp`)
    console.log(`Output: ${OUTPUT_FILE}`)
    
    // Show first 10 entries
    console.log('\nFirst 10 entries (sorted):')
    items.slice(0, 10).forEach(item => {
      const tierStr = item.tier ? `[${item.tier}]` : '[no tier]'
      console.log(`  LP-${String(item.lp).padStart(4, '0')} order=${String(item.order).padStart(4)} ${tierStr.padEnd(12)} ${item.title.slice(0, 50)}`)
    })
    
  } catch (error) {
    console.error('Error generating LP index:', error)
    process.exit(1)
  }
}

generateLPIndex()
