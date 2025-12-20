import { source } from '@/lib/source';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import hljs from 'highlight.js/lib/core';
// Import common languages
import go from 'highlight.js/lib/languages/go';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import sql from 'highlight.js/lib/languages/sql';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
// @ts-expect-error - no types available
import solidity from 'highlightjs-solidity';
import Link from 'next/link';

// Register all languages
hljs.registerLanguage('go', go);
hljs.registerLanguage('golang', go);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('css', css);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('solidity', solidity.solidity);
hljs.registerLanguage('sol', solidity.solidity);
hljs.registerLanguage('yul', solidity.yul);
import { ArrowLeft, ArrowRight, ExternalLink, Calendar, User, Tag } from 'lucide-react';
import { DocsPage, DocsBody } from '@hanzo/docs/ui/page';
import { extractHeadings } from '@/lib/toc';
import { FilteredView } from './filtered-view';

// LP Index/Overview Page Component
function LPIndexPage() {
  const categories = source.getCategorizedPages();
  const stats = source.getStats();
  const allPages = source.getAllPages();

  return (
    <div className="pt-6 pb-12 px-6 md:px-8">
      {/* Client-side filtered view - reads URL params and shows/hides based on filter presence */}
      <FilteredView allPages={allPages} />

      {/* Default view - categories (hidden by default, shown when no filter) */}
      <div className="max-w-4xl mx-auto hidden" id="lp-index">
        <h1 className="text-3xl font-bold mb-4">All Lux Proposals</h1>
        <p className="text-muted-foreground mb-8">
          Browse all {stats.total} proposals organized by category. Use the sidebar to navigate
          or press <kbd className="px-2 py-0.5 rounded bg-accent text-xs font-mono">Ctrl+K</kbd> to search.
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-12 p-4 rounded-lg border border-border bg-card">
          <div className="text-center p-2">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2">
            <div className="text-xl sm:text-2xl font-bold text-green-500">{stats.byStatus['Final'] || 0}</div>
            <div className="text-xs text-muted-foreground">Final</div>
          </div>
          <div className="text-center p-2">
            <div className="text-xl sm:text-2xl font-bold text-blue-500">{stats.byStatus['Review'] || 0}</div>
            <div className="text-xs text-muted-foreground">Review</div>
          </div>
          <div className="text-center p-2">
            <div className="text-xl sm:text-2xl font-bold text-yellow-500">{stats.byStatus['Draft'] || 0}</div>
            <div className="text-xs text-muted-foreground">Draft</div>
          </div>
        </div>

        {/* Categories */}
        {categories.map((cat) => (
          <section key={cat.name} className="mb-12">
            <Link
              href={`/docs/category/${cat.slug}`}
              className="flex items-center gap-3 mb-4 group w-fit"
            >
              <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">{cat.name}</h2>
              <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-accent group-hover:bg-primary/10 transition-colors">
                {cat.lps.length} proposals
              </span>
              <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
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

    const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    return <Tag id={id} {...props}>{children}</Tag>;
  };
  HeadingComponent.displayName = `Heading${level}`;
  return HeadingComponent;
}

// Custom code component that strips erroneous backticks from inline code
function CodeComponent({ children, className, ...props }: any) {
  // Handle inline code (no className) - strip backticks if present
  if (!className) {
    let content = typeof children === 'string' ? children : String(children);
    // Strip leading/trailing backticks that may appear due to GFM table parsing
    content = content.replace(/^`+|`+$/g, '');
    return <code {...props}>{content}</code>;
  }
  // Code blocks keep className for syntax highlighting
  return <code className={className} {...props}>{children}</code>;
}

const markdownComponents = {
  h2: createHeadingComponent(2),
  h3: createHeadingComponent(3),
  h4: createHeadingComponent(4),
  code: CodeComponent,
};

// Author link component - parses "Name (@username)" format and links to GitHub
function AuthorLink({ author }: { author: string }) {
  // Parse author string - formats: "Name (@username)", "@username", "Name"
  const match = author.match(/@([a-zA-Z0-9_-]+)/);
  const username = match ? match[1] : null;

  if (username) {
    // Extract display name (everything before the @username part)
    const displayName = author.replace(`(@${username})`, '').replace(`@${username}`, '').trim();
    const finalDisplay = displayName || `@${username}`;

    return (
      <a
        href={`https://github.com/${username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium hover:text-primary transition-colors"
      >
        {finalDisplay}
      </a>
    );
  }

  // No username found - link to luxfi org as fallback
  return (
    <a
      href="https://github.com/luxfi"
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium hover:text-primary transition-colors"
    >
      {author}
    </a>
  );
}

// Individual LP Page Component
function LPDetailPage({ page }: { page: any }) {
  const { frontmatter } = page.data;
  const tocItems = extractHeadings(page.data.content);

  return (
    <DocsPage toc={tocItems}>
      {/* Header */}
      <div className="mb-6 pb-6 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Link
            href="/docs"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="size-3" />
            All Proposals
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <span className="text-xs font-mono text-muted-foreground">
              LP-{String(frontmatter.lp).padStart(4, '0')}
            </span>
            <h1 className="text-2xl font-bold mt-1">{page.data.title}</h1>
          </div>
          {frontmatter.status && (
            <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
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
          <p className="text-sm text-muted-foreground">{page.data.description}</p>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 p-3 rounded-lg bg-card border border-border text-xs">
          {frontmatter.type && (
            <div>
              <div className="text-muted-foreground mb-0.5">Type</div>
              <Link
                href={`/docs?type=${encodeURIComponent(frontmatter.type)}`}
                className="font-medium hover:text-primary transition-colors"
              >
                {frontmatter.type}
              </Link>
            </div>
          )}
          {frontmatter.category && (
            <div>
              <div className="text-muted-foreground mb-0.5">Category</div>
              <Link
                href={`/docs/category/${frontmatter.category.toLowerCase().replace(/\s+/g, '-')}`}
                className="font-medium hover:text-primary transition-colors"
              >
                {frontmatter.category}
              </Link>
            </div>
          )}
          {frontmatter.author && (
            <div>
              <div className="text-muted-foreground mb-0.5 flex items-center gap-1">
                <User className="size-3" /> Author
              </div>
              <AuthorLink author={frontmatter.author} />
            </div>
          )}
          {frontmatter.created && (
            <div>
              <div className="text-muted-foreground mb-0.5 flex items-center gap-1">
                <Calendar className="size-3" /> Created
              </div>
              <div className="font-medium">{frontmatter.created}</div>
            </div>
          )}
        </div>

        {/* Tags */}
        {frontmatter.tags && frontmatter.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <Tag className="size-3 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {frontmatter.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/docs?tag=${encodeURIComponent(tag)}`}
                  className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* External Links */}
        <div className="flex flex-wrap items-center gap-4 mt-3">
          {frontmatter['discussions-to'] && (
            <a
              href={frontmatter['discussions-to']}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3" />
              Discussions
            </a>
          )}
          <a
            href={`https://github.com/luxfi/lps/edit/main/LPs/${page.slug.join('/')}.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3" />
            Edit on GitHub
          </a>
        </div>
      </div>

      {/* Content */}
      <DocsBody>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[[rehypeHighlight, { detect: true }]]}
          components={markdownComponents}
        >
          {page.data.content}
        </ReactMarkdown>
      </DocsBody>
    </DocsPage>
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
