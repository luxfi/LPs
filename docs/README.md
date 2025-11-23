# Lux Proposals Documentation Site

This directory contains the fumadocs-based documentation site for browsing Lux Proposals (LPs).

## Setup

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Development

The documentation site automatically reads LP files from the `../LPs` directory. Any changes to LP markdown files will be reflected in the site.

### Adding New LPs

1. Create your LP file in the `../LPs/` directory with the format `lp-NUMBER-title.md`
2. Ensure the file includes proper YAML frontmatter (see TEMPLATE.md)
3. The LP will automatically appear in the documentation site

### Local Development

Run `pnpm dev` to start the development server at http://localhost:3002

## Structure

- `app/` - Next.js app directory with layouts and pages
- `source.config.ts` - Fumadocs configuration pointing to `../LPs`
- `next.config.mjs` - Next.js configuration
- `package.json` - Dependencies and scripts

## Technologies

- **Next.js 16** - React framework
- **Fumadocs** - Documentation framework
- **Tailwind CSS 4** - Styling
- **TypeScript** - Type safety
