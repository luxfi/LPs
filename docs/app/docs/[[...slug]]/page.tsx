import { source } from '@/lib/source';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ExternalLink, Calendar, User, Tag } from 'lucide-react';
import { TableOfContents } from '@/components/toc';
import { extractHeadings } from '@/lib/toc';

// LP Index/Overview Page Component
function LPIndexPage() {
  const categories = source.getCategorizedPages();
  const stats = source.getStats();

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">All Lux Proposals</h1>
      <p className="text-muted-foreground mb-8">
        Browse all {stats.total} proposals organized by category. Use the sidebar to navigate
        or press <kbd className="px-2 py-0.5 rounded bg-accent text-xs font-mono">Ctrl+K</kbd> to search.
      </p>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-12 p-4 rounded-lg border border-border bg-card">
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{stats.byStatus['Final'] || 0}</div>
          <div className="text-xs text-muted-foreground">Final</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">{stats.byStatus['Review'] || 0}</div>
          <div className="text-xs text-muted-foreground">Review</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-500">{stats.byStatus['Draft'] || 0}</div>
          <div className="text-xs text-muted-foreground">Draft</div>
        </div>
      </div>

      {/* Categories */}
      {categories.map((cat) => (
        <section key={cat.name} className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold">{cat.name}</h2>
            <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-accent">
              {cat.lps.length} proposals
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{cat.description}</p>
          <div className="space-y-2">
            {cat.lps.map((lp) => (
              <Link
                key={lp.slug.join('/')}
                href={`/docs/${lp.slug.join('/')}`}
                className="flex items-center gap-4 p-3 rounded-lg border border-border hover:border-foreground/20 hover:bg-accent/50 transition-colors group"
              >
                <span className="text-sm font-mono text-muted-foreground w-20 shrink-0">
                  LP-{String(lp.data.frontmatter.lp).padStart(4, '0')}
                </span>
                <span className="flex-1 font-medium text-sm truncate group-hover:text-foreground">
                  {lp.data.title}
                </span>
                {lp.data.frontmatter.status && (
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    lp.data.frontmatter.status === 'Final' ? 'bg-green-500/10 text-green-500' :
                    lp.data.frontmatter.status === 'Draft' ? 'bg-yellow-500/10 text-yellow-500' :
                    lp.data.frontmatter.status === 'Review' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-gray-500/10 text-gray-500'
                  }`}>
                    {lp.data.frontmatter.status}
                  </span>
                )}
                <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// Custom heading components with IDs for TOC linking
function createHeadingComponent(level: number) {
  const HeadingComponent = ({ children, ...props }: any) => {
    const text = typeof children === 'string' ? children : String(children);
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const Tag = `h${level}` as keyof JSX.IntrinsicElements;
    return <Tag id={id} {...props}>{children}</Tag>;
  };
  HeadingComponent.displayName = `Heading${level}`;
  return HeadingComponent;
}

const markdownComponents = {
  h2: createHeadingComponent(2),
  h3: createHeadingComponent(3),
  h4: createHeadingComponent(4),
};

// Individual LP Page Component
function LPDetailPage({ page }: { page: any }) {
  const { frontmatter } = page.data;
  const tocItems = extractHeadings(page.data.content);

  return (
    <div className="flex gap-8">
      {/* Main Content */}
      <article className="flex-1 min-w-0 max-w-4xl">
        {/* Header */}
        <div className="mb-8 pb-8 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/docs"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="size-3" />
            All Proposals
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="text-sm font-mono text-muted-foreground">
              LP-{String(frontmatter.lp).padStart(4, '0')}
            </span>
            <h1 className="text-3xl font-bold mt-1">{page.data.title}</h1>
          </div>
          {frontmatter.status && (
            <span className={`text-sm px-3 py-1 rounded-full shrink-0 ${
              frontmatter.status === 'Final' ? 'bg-green-500/10 text-green-500' :
              frontmatter.status === 'Draft' ? 'bg-yellow-500/10 text-yellow-500' :
              frontmatter.status === 'Review' ? 'bg-blue-500/10 text-blue-500' :
              frontmatter.status === 'Last Call' ? 'bg-purple-500/10 text-purple-500' :
              'bg-gray-500/10 text-gray-500'
            }`}>
              {frontmatter.status}
            </span>
          )}
        </div>

        {page.data.description && (
          <p className="text-muted-foreground">{page.data.description}</p>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 rounded-lg bg-card border border-border">
          {frontmatter.type && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Type</div>
              <div className="text-sm font-medium">{frontmatter.type}</div>
            </div>
          )}
          {frontmatter.category && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Category</div>
              <div className="text-sm font-medium">{frontmatter.category}</div>
            </div>
          )}
          {frontmatter.author && (
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <User className="size-3" /> Author
              </div>
              <div className="text-sm font-medium">{frontmatter.author}</div>
            </div>
          )}
          {frontmatter.created && (
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="size-3" /> Created
              </div>
              <div className="text-sm font-medium">{frontmatter.created}</div>
            </div>
          )}
        </div>

        {/* Tags */}
        {frontmatter.tags && frontmatter.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <Tag className="size-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              {frontmatter.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full bg-accent text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* External Links */}
        {frontmatter['discussions-to'] && (
          <a
            href={frontmatter['discussions-to']}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-4" />
            Join Discussion
          </a>
        )}
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {page.data.content}
          </ReactMarkdown>
        </div>
      </article>

      {/* Table of Contents Sidebar */}
      {tocItems.length > 0 && (
        <aside className="hidden xl:block w-64 shrink-0">
          <div className="sticky top-24">
            <TableOfContents items={tocItems} />
          </div>
        </aside>
      )}
    </div>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;

  // Show index page if no slug
  if (!slug || slug.length === 0) {
    return <LPIndexPage />;
  }

  const page = source.getPage(slug);
  if (!page) notFound();

  return <LPDetailPage page={page} />;
}

export async function generateStaticParams() {
  const params = source.generateParams();
  // Add empty slug for index page
  return [{ slug: [] }, ...params];
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return {
      title: 'All Proposals',
      description: 'Browse all Lux Proposals (LPs) - standards and improvements for the Lux Network',
    };
  }

  const page = source.getPage(slug);
  if (!page) return {};

  return {
    title: `LP-${page.data.frontmatter.lp}: ${page.data.title}`,
    description: page.data.description || `Lux Proposal ${page.data.frontmatter.lp}`,
  };
}
