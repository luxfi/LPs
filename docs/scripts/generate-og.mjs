#!/usr/bin/env node
/**
 * Generate static OG images for the LPs docs site
 *
 * Features:
 * - Generates default site OG image
 * - Generates per-LP OG images for social sharing
 * - Idempotent: Uses content hashing to only regenerate changed LPs
 *
 * Run: node scripts/generate-og.mjs
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const ogDir = join(publicDir, 'og');
const lpsDir = join(__dirname, '..', '..', 'LPs');
const cacheFile = join(ogDir, '.cache.json');

// Ensure directories exist
mkdirSync(publicDir, { recursive: true });
mkdirSync(ogDir, { recursive: true });

// Load Inter fonts from local files
const fontsDir = join(__dirname, 'fonts');
const regularFontPath = join(fontsDir, 'Inter-Regular.ttf');
const boldFontPath = join(fontsDir, 'Inter-SemiBold.ttf');

const fonts = [
  {
    name: 'Inter',
    data: readFileSync(regularFontPath),
    weight: 400,
    style: 'normal',
  },
  {
    name: 'Inter',
    data: readFileSync(boldFontPath),
    weight: 600,
    style: 'normal',
  },
];
console.log(`Loaded ${fonts.length} fonts from ${fontsDir}`);

// Status colors
const STATUS_COLORS = {
  'Final': '#22c55e',     // green-500
  'Draft': '#eab308',     // yellow-500
  'Review': '#3b82f6',    // blue-500
  'Last Call': '#a855f7', // purple-500
  'Withdrawn': '#6b7280', // gray-500
  'Stagnant': '#6b7280',  // gray-500
  'Superseded': '#6b7280', // gray-500
};

// Load cache for idempotent generation
function loadCache() {
  try {
    if (existsSync(cacheFile)) {
      return JSON.parse(readFileSync(cacheFile, 'utf8'));
    }
  } catch {
    // Ignore cache errors
  }
  return {};
}

function saveCache(cache) {
  writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
}

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

// Default OG Image component (as React-like object)
const ogImageJsx = {
  type: 'div',
  props: {
    style: {
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000',
      position: 'relative',
    },
    children: [
      // Gradient overlay
      {
        type: 'div',
        props: {
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.08) 0%, transparent 60%)',
          },
        },
      },
      // Content
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          },
          children: [
            // Logo container
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  marginBottom: 32,
                },
                children: [
                  // Triangle logo (downward-pointing per @luxfi/logo)
                  {
                    type: 'svg',
                    props: {
                      width: 40,
                      height: 40,
                      viewBox: '0 0 100 100',
                      children: {
                        type: 'path',
                        props: {
                          d: 'M50 85 L15 25 L85 25 Z',
                          fill: 'white',
                        },
                      },
                    },
                  },
                ],
              },
            },
            // Title
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 72,
                  fontWeight: 600,
                  color: 'white',
                  letterSpacing: '-0.02em',
                  marginBottom: 16,
                },
                children: 'Lux Proposals',
              },
            },
            // Tagline
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 28,
                  color: 'rgba(255,255,255,0.5)',
                  maxWidth: 700,
                  textAlign: 'center',
                  lineHeight: 1.4,
                },
                children: 'Open, community-driven standards for the Lux Network ecosystem',
              },
            },
            // Stats badge
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 40,
                  padding: '12px 24px',
                  borderRadius: 100,
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                },
                children: [
                  // Dot
                  {
                    type: 'div',
                    props: {
                      style: {
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'white',
                      },
                    },
                  },
                  // Stats text
                  {
                    type: 'span',
                    props: {
                      style: { fontSize: 18, color: 'rgba(255,255,255,0.7)' },
                      children: '177 proposals',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      // Bottom branding
      {
        type: 'div',
        props: {
          style: {
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 16,
            color: 'rgba(255,255,255,0.4)',
          },
          children: 'lps.lux.network',
        },
      },
    ],
  },
};

// Twitter image (slightly different dimensions)
const twitterImageJsx = {
  type: 'div',
  props: {
    style: {
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000',
      position: 'relative',
    },
    children: [
      // Gradient
      {
        type: 'div',
        props: {
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.08) 0%, transparent 60%)',
          },
        },
      },
      // Content
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          },
          children: [
            // Logo
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  marginBottom: 28,
                },
                children: [
                  {
                    type: 'svg',
                    props: {
                      width: 36,
                      height: 36,
                      viewBox: '0 0 100 100',
                      children: {
                        type: 'path',
                        props: {
                          d: 'M50 85 L15 25 L85 25 Z',
                          fill: 'white',
                        },
                      },
                    },
                  },
                ],
              },
            },
            // Title
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 64,
                  fontWeight: 600,
                  color: 'white',
                  letterSpacing: '-0.02em',
                  marginBottom: 12,
                },
                children: 'Lux Proposals',
              },
            },
            // Tagline
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 24,
                  color: 'rgba(255,255,255,0.5)',
                  maxWidth: 600,
                  textAlign: 'center',
                },
                children: 'Open standards for the Lux Network ecosystem',
              },
            },
          ],
        },
      },
    ],
  },
};

// Create LP-specific OG image JSX
function createLPOGImageJsx({ lpNumber, title, description, status, category }) {
  const statusColor = STATUS_COLORS[status] || '#6b7280';
  const truncatedTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
  const truncatedDesc = description && description.length > 120
    ? description.substring(0, 117) + '...'
    : description;

  return {
    type: 'div',
    props: {
      style: {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000',
        position: 'relative',
        padding: 60,
      },
      children: [
        // Gradient overlay
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(ellipse at top left, rgba(255,255,255,0.06) 0%, transparent 50%)',
            },
          },
        },
        // Header row: Logo + LP number + Status
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 40,
              zIndex: 1,
            },
            children: [
              // Left: Logo + LP number
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  },
                  children: [
                    // Logo
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          border: '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                        },
                        children: [
                          {
                            type: 'svg',
                            props: {
                              width: 24,
                              height: 24,
                              viewBox: '0 0 100 100',
                              children: {
                                type: 'path',
                                props: {
                                  d: 'M50 85 L15 25 L85 25 Z',
                                  fill: 'white',
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                    // LP number
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 24,
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.6)',
                          letterSpacing: '0.05em',
                        },
                        children: `LP-${lpNumber}`,
                      },
                    },
                  ],
                },
              },
              // Right: Status badge
              status ? {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 100,
                    backgroundColor: `${statusColor}20`,
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: statusColor,
                        },
                      },
                    },
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontSize: 16,
                          color: statusColor,
                          fontWeight: 600,
                        },
                        children: status,
                      },
                    },
                  ],
                },
              } : null,
            ].filter(Boolean),
          },
        },
        // Main content
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
              zIndex: 1,
            },
            children: [
              // Title
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 56,
                    fontWeight: 600,
                    color: 'white',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    marginBottom: truncatedDesc ? 24 : 0,
                  },
                  children: truncatedTitle,
                },
              },
              // Description
              truncatedDesc ? {
                type: 'div',
                props: {
                  style: {
                    fontSize: 24,
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.4,
                    maxWidth: 900,
                  },
                  children: truncatedDesc,
                },
              } : null,
            ].filter(Boolean),
          },
        },
        // Footer
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 1,
            },
            children: [
              // Category
              category ? {
                type: 'div',
                props: {
                  style: {
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  },
                  children: category,
                },
              } : null,
              // Site
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.4)',
                  },
                  children: 'lps.lux.network',
                },
              },
            ].filter(Boolean),
          },
        },
      ],
    },
  };
}

async function generateImage(jsx, width, height, outputPath) {
  console.log(`  Generating ${outputPath}...`);

  const svg = await satori(jsx, {
    width,
    height,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  writeFileSync(outputPath, pngBuffer);
  console.log(`  ✓ ${outputPath} (${pngBuffer.length} bytes)`);
}

// Get all LP files
function getAllLPFiles() {
  try {
    const files = readdirSync(lpsDir);
    return files
      .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))
      .filter(file => file.startsWith('lp-'));
  } catch (error) {
    console.error('Error reading LPs directory:', error);
    return [];
  }
}

// Read LP frontmatter
function readLPFrontmatter(filename) {
  try {
    const filePath = join(lpsDir, filename);
    const fileContents = readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);

    // Extract LP number from filename
    const lpMatch = filename.match(/lp-(\d+)/);
    const lpNumber = lpMatch ? parseInt(lpMatch[1], 10) : (data.lp || 0);

    return {
      lpNumber,
      title: data.title || filename.replace(/\.mdx?$/, ''),
      description: data.description || '',
      status: data.status || '',
      category: data.category || '',
      contentHash: hashContent(fileContents),
    };
  } catch (error) {
    console.error(`Error reading LP file ${filename}:`, error);
    return null;
  }
}

async function main() {
  console.log('Generating OG images...\n');

  // Generate default OG images
  console.log('Default images:');
  await generateImage(
    ogImageJsx,
    1200,
    630,
    join(publicDir, 'og.png')
  );

  await generateImage(
    twitterImageJsx,
    1200,
    600,
    join(publicDir, 'twitter.png')
  );

  // Generate per-LP OG images
  console.log('\nPer-LP images:');
  const cache = loadCache();
  const newCache = {};
  const lpFiles = getAllLPFiles();

  let generated = 0;
  let skipped = 0;

  for (const file of lpFiles) {
    const lp = readLPFrontmatter(file);
    if (!lp) continue;

    const lpSlug = `lp-${String(lp.lpNumber).padStart(4, '0')}`;
    const ogPath = join(ogDir, `${lpSlug}.png`);

    // Check cache for idempotent generation
    if (cache[lpSlug] === lp.contentHash && existsSync(ogPath)) {
      newCache[lpSlug] = lp.contentHash;
      skipped++;
      continue;
    }

    console.log(`\n${lpSlug}: ${lp.title}`);

    // Generate OG image
    const jsx = createLPOGImageJsx({
      lpNumber: lp.lpNumber,
      title: lp.title,
      description: lp.description,
      status: lp.status,
      category: lp.category,
    });

    await generateImage(jsx, 1200, 630, ogPath);

    newCache[lpSlug] = lp.contentHash;
    generated++;
  }

  // Save updated cache
  saveCache(newCache);

  console.log(`\n✓ Generated ${generated} new images, skipped ${skipped} unchanged`);
  console.log('✓ All OG images generated successfully!');
}

main().catch(console.error);
