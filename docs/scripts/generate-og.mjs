#!/usr/bin/env node
/**
 * Generate static OG images for the LPs docs site
 * Run: node scripts/generate-og.mjs
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Ensure public directory exists
mkdirSync(publicDir, { recursive: true });

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

// OG Image component (as React-like object)
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

async function generateImage(jsx, width, height, outputPath) {
  console.log(`Generating ${outputPath}...`);

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
  console.log(`  ✓ Generated ${outputPath} (${pngBuffer.length} bytes)`);
}

async function main() {
  console.log('Generating OG images...\n');

  // Generate OG image (1200x630)
  await generateImage(
    ogImageJsx,
    1200,
    630,
    join(publicDir, 'og.png')
  );

  // Generate Twitter image (1200x600)
  await generateImage(
    twitterImageJsx,
    1200,
    600,
    join(publicDir, 'twitter.png')
  );

  console.log('\n✓ All OG images generated successfully!');
}

main().catch(console.error);
