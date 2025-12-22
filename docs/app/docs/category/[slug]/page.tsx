import { source } from '@/lib/source';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Layers, Lock, Coins, BarChart3, Vote, Rocket,
  FlaskConical, Cpu, Code, Link2, Key, Shield, Wallet, User, Leaf, Heart,
  Boxes, Zap, FileCode, CircleDollarSign, Microchip
} from 'lucide-react';

// Icon mapping - expanded for all topics
const iconMap: Record<string, React.ReactNode> = {
  layers: <Layers className="size-6" />,
  consensus: <Cpu className="size-6" />,
  lock: <Lock className="size-6" />,
  token: <Coins className="size-6" />,
  coins: <CircleDollarSign className="size-6" />,
  cpu: <Microchip className="size-6" />,
  chart: <BarChart3 className="size-6" />,
  vote: <Vote className="size-6" />,
  upgrade: <Rocket className="size-6" />,
  research: <FlaskConical className="size-6" />,
  code: <Code className="size-6" />,
  link: <Link2 className="size-6" />,
  bridge: <Link2 className="size-6" />,
  key: <Key className="size-6" />,
  shield: <Shield className="size-6" />,
  wallet: <Wallet className="size-6" />,
  user: <User className="size-6" />,
  leaf: <Leaf className="size-6" />,
  heart: <Heart className="size-6" />,
  platform: <Boxes className="size-6" />,
  vm: <FileCode className="size-6" />,
  extension: <Zap className="size-6" />,
  advanced: <Cpu className="size-6" />,
  flask: <FlaskConical className="size-6" />,
};

// Color mapping for backgrounds and accents
const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', badge: 'bg-blue-500/20 text-blue-400' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20', badge: 'bg-purple-500/20 text-purple-400' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', badge: 'bg-amber-500/20 text-amber-400' },
  green: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20', badge: 'bg-green-500/20 text-green-400' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20', badge: 'bg-indigo-500/20 text-indigo-400' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20', badge: 'bg-orange-500/20 text-orange-400' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/20', badge: 'bg-pink-500/20 text-pink-400' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20', badge: 'bg-violet-500/20 text-violet-400' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20', badge: 'bg-cyan-500/20 text-cyan-400' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-500/20', badge: 'bg-teal-500/20 text-teal-400' },
  fuchsia: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-500', border: 'border-fuchsia-500/20', badge: 'bg-fuchsia-500/20 text-fuchsia-400' },
  sky: { bg: 'bg-sky-500/10', text: 'text-sky-500', border: 'border-sky-500/20', badge: 'bg-sky-500/20 text-sky-400' },
  lime: { bg: 'bg-lime-500/10', text: 'text-lime-500', border: 'border-lime-500/20', badge: 'bg-lime-500/20 text-lime-400' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20', badge: 'bg-yellow-500/20 text-yellow-400' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20', badge: 'bg-rose-500/20 text-rose-400' },
  red: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', badge: 'bg-red-500/20 text-red-400' },
  slate: { bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20', badge: 'bg-slate-500/20 text-slate-400' },
  neutral: { bg: 'bg-neutral-500/10', text: 'text-neutral-500', border: 'border-neutral-500/20', badge: 'bg-neutral-500/20 text-neutral-400' },
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = source.getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const colors = colorMap[category.color] || colorMap.blue;
  const icon = iconMap[category.icon] || iconMap.layers;

  // Get adjacent categories for navigation
  const { prev, next } = source.getAdjacentCategories(slug);

  // Group LPs by status
  const lpsByStatus = {
    final: category.lps.filter(lp => lp.data.frontmatter.status === 'Final'),
    review: category.lps.filter(lp => lp.data.frontmatter.status === 'Review'),
    draft: category.lps.filter(lp => lp.data.frontmatter.status === 'Draft'),
    other: category.lps.filter(lp => !['Final', 'Review', 'Draft'].includes(lp.data.frontmatter.status || '')),
  };

  return (
    <div className="pt-6 pb-12 px-6 md:px-8">
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/docs"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit"
        >
          <ArrowLeft className="size-3" />
          All Proposals
        </Link>
      </div>

      {/* Header */}
      <div className={`rounded-xl border ${colors.border} ${colors.bg} p-6 mb-8`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${colors.bg} ${colors.text}`}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold">{category.name}</h1>
              {/* Show range badge if range exists, otherwise show tag count */}
              {category.range ? (
                <span className={`text-xs px-2 py-1 rounded-full ${colors.badge}`}>
                  LP-{category.range[0]} to LP-{category.range[1]}
                </span>
              ) : (
                <span className={`text-xs px-2 py-1 rounded-full ${colors.badge}`}>
                  {category.lps.length} proposals
                </span>
              )}
            </div>
            <p className="text-muted-foreground mb-4">
              {category.description}
            </p>
            <p className="text-sm text-foreground/80">
              {category.learnMore}
            </p>
          </div>
        </div>

        {/* Matching Tags */}
        {category.tags && category.tags.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="text-xs font-medium text-muted-foreground mb-2">Matching Tags</div>
            <div className="flex flex-wrap gap-2">
              {category.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/docs?tag=${encodeURIComponent(tag)}`}
                  className="text-xs px-2 py-1 rounded-full bg-background/50 text-foreground/80 border border-border/50 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Key Topics */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="text-xs font-medium text-muted-foreground mb-2">Key Topics</div>
          <div className="flex flex-wrap gap-2">
            {category.keyTopics.map((topic) => (
              <span
                key={topic}
                className="text-xs px-2 py-1 rounded-full bg-background/50 text-foreground/80 border border-border/50"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 p-4 rounded-lg border border-border bg-card">
        <div className="text-center p-2">
          <div className="text-xl sm:text-2xl font-bold">{category.lps.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="text-center p-2">
          <div className="text-xl sm:text-2xl font-bold text-green-500">{lpsByStatus.final.length}</div>
          <div className="text-xs text-muted-foreground">Final</div>
        </div>
        <div className="text-center p-2">
          <div className="text-xl sm:text-2xl font-bold text-blue-500">{lpsByStatus.review.length}</div>
          <div className="text-xs text-muted-foreground">Review</div>
        </div>
        <div className="text-center p-2">
          <div className="text-xl sm:text-2xl font-bold text-yellow-500">{lpsByStatus.draft.length}</div>
          <div className="text-xs text-muted-foreground">Draft</div>
        </div>
      </div>

      {/* LPs List */}
      {category.lps.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold mb-4">
            All {category.name} Proposals
          </h2>
          {category.lps.map((lp) => (
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
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-2">No proposals in this category yet.</p>
          <p className="text-sm">Be the first to propose a LP in the {category.name} area!</p>
        </div>
      )}

      {/* Category Navigation */}
      <div className="mt-12 pt-6 border-t border-border">
        <div className="flex justify-between items-start gap-4">
          {prev ? (
            <Link
              href={`/docs/category/${prev.slug}`}
              className="group flex-1 p-4 rounded-lg border border-border hover:border-foreground/20 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <ArrowLeft className="size-3" />
                Previous
              </div>
              <div className="font-medium group-hover:text-foreground">{prev.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{prev.lps.length} proposals</div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          <Link
            href="/docs"
            className="shrink-0 px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent/50 transition-colors"
          >
            All Categories
          </Link>

          {next ? (
            <Link
              href={`/docs/category/${next.slug}`}
              className="group flex-1 p-4 rounded-lg border border-border hover:border-foreground/20 hover:bg-accent/50 transition-colors text-right"
            >
              <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mb-1">
                Next
                <ArrowRight className="size-3" />
              </div>
              <div className="font-medium group-hover:text-foreground">{next.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{next.lps.length} proposals</div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

export async function generateStaticParams() {
  const slugs = source.getAllCategorySlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = source.getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.name} - Lux Proposals`,
    description: category.description,
  };
}
