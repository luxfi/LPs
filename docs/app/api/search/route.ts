import { NextRequest, NextResponse } from 'next/server';
import { source } from '@/lib/source';

export const dynamic = 'force-static';
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || '';

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const results = source.search(query);

  // Format results for fumadocs search
  const formattedResults = results.slice(0, 20).map((page) => ({
    id: page.slug.join('/'),
    type: 'page' as const,
    url: `/docs/${page.slug.join('/')}`,
    title: page.data.title,
    description: page.data.description || '',
    content: page.data.content.substring(0, 200) + '...',
    structuredData: {
      lp: page.data.frontmatter.lp,
      status: page.data.frontmatter.status,
      type: page.data.frontmatter.type,
      category: page.data.frontmatter.category,
    },
  }));

  return NextResponse.json(formattedResults);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const query = body.query || '';

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = source.search(query);

  // Format results for fumadocs search
  const formattedResults = results.slice(0, 20).map((page) => ({
    id: page.slug.join('/'),
    type: 'page' as const,
    url: `/docs/${page.slug.join('/')}`,
    title: page.data.title,
    description: page.data.description || '',
    content: page.data.content.substring(0, 200) + '...',
    structuredData: {
      lp: page.data.frontmatter.lp,
      status: page.data.frontmatter.status,
      type: page.data.frontmatter.type,
      category: page.data.frontmatter.category,
    },
  }));

  return NextResponse.json({ results: formattedResults });
}
