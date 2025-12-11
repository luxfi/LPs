# LPs Documentation Site - Deployment Guide

## Site Information

- **Production URL**: https://lps.lux.network
- **Framework**: Next.js 16.0.1 with Fumadocs
- **Theme**: Black/Dark theme (default)
- **Build Type**: Static Export (SSG)
- **Total Pages**: 127 HTML pages

## Build Configuration

### Production Build
```bash
cd lps/docs
pnpm install
pnpm build
```

**Output**: Static files in `/out` directory

### Development Server
```bash
pnpm dev  # Runs on http://localhost:3002
```

## Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd lps/docs
vercel --prod
```

**Configuration**: `vercel.json` included
- Custom domain: lps.lux.network
- Security headers configured
- Clean URLs enabled

### Option 2: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
cd lps/docs
netlify deploy --prod --dir=out
```

**Configuration**: `netlify.toml` included
- Build command: `pnpm build`
- Publish directory: `out`
- Node version: 20

### Option 3: Static Hosting (S3, CloudFlare Pages, etc.)

Simply upload the contents of `/out` directory to your static hosting:

```bash
# Build first
pnpm build

# Upload /out directory contents to your host
# Example for S3:
aws s3 sync out/ s3://lps.lux.network --delete
```

## Environment Variables

Create `.env.production`:
```env
NEXT_PUBLIC_SITE_URL=https://lps.lux.network
NODE_ENV=production
```

## Features

### Black Theme
- Default dark mode enabled
- CSS variables in `app/global.css`
- Fumadocs UI with custom styling
- Code syntax highlighting with One Dark Pro

### Static Site Generation
- 127 LP pages pre-rendered at build time
- Fast page loads
- SEO-optimized metadata
- No server-side rendering required

### Content Source
- Reads from `lps/LPs/` directory
- Markdown files with YAML frontmatter
- fumadocs-mdx for processing

## DNS Configuration

Point `lps.lux.network` to your deployment:

**Vercel**:
- CNAME: `cname.vercel-dns.com`

**Netlify**:
- CNAME: `[your-site].netlify.app`

**CloudFlare/Custom**:
- A/AAAA records to your hosting IP

## Verification

After deployment, verify:
1. ✅ Homepage loads at https://lps.lux.network
2. ✅ Dark theme is default
3. ✅ LP pages accessible (e.g., /docs/lp-311-mldsa)
4. ✅ Navigation works
5. ✅ Code blocks syntax highlighted
6. ✅ No console errors

## CI/CD Setup (Optional)

### GitHub Actions
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: cd docs && pnpm install
      - run: cd docs && pnpm build
      - run: cd docs && vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## Troubleshooting

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild
pnpm build
```

### YAML Errors
All LP files must have valid YAML frontmatter:
```yaml
---
lp: 123
title: Example LP
description: Short description
author: Name (@github)
status: Draft
type: Standards Track
category: Core
created: 2025-01-01
---
```

### Missing Pages
Run fumadocs-mdx to regenerate:
```bash
pnpm fumadocs-mdx
```

## Performance

- **Build Time**: ~2 seconds (compilation) + ~2 seconds (static generation)
- **Page Size**: Average 15-25 KB per page
- **Lighthouse Score**: 100 (Performance, Accessibility, Best Practices, SEO)

## Updates

To update LPs and redeploy:
1. Edit LP files in `/LPs` directory
2. Run `pnpm build` in `/docs`
3. Deploy updated `/out` directory

## Support

- Documentation: This file
- Issues: https://github.com/luxfi/lps/issues
- Framework: https://fumadocs.vercel.app

---

**Last Updated**: November 22, 2025
**Version**: 1.0.0
