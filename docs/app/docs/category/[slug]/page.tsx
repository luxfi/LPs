import { source } from '@/lib/source';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Layers, Lock, Coins, BarChart3, Vote, Rocket, FlaskConical, Cpu } from 'lucide-react';

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  layers: <Layers className="size-6" />,
  consensus: <Cpu className="size-6" />,
  lock: <Lock className="size-6" />,
  token: <Coins className="size-6" />,
  chart: <BarChart3 className="size-6" />,
  vote: <Vote className="size-6" />,
  upgrade: <Rocket className="size-6" />,
  research: <FlaskConical className="size-6" />,
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

  // Group LPs by status
  const lpsByStatus = {
    final: category.lps.filter(lp => lp.data.frontmatter.status === 'Final'),
    review: category.lps.filter(lp => lp.data.frontmatter.status === 'Review'),
    draft: category.lps.filter(lp => lp.data.frontmatter.status === 'Draft'),
    other: category.lps.filter(lp => !['Final', 'Review', 'Draft'].includes(lp.data.frontmatter.status || '')),
  };

  return (
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
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{category.name}</h1>
              <span className={`text-xs px-2 py-1 rounded-full ${colors.badge}`}>
                LP-{category.range[0]} to LP-{category.range[1]}
              </span>
            </div>
            <p className="text-muted-foreground mb-4">
              {category.description}
            </p>
            <p className="text-sm text-foreground/80">
              {category.learnMore}
            </p>
          </div>
        </div>

        {/* Key Topics */}
        <div className="mt-6 pt-4 border-t border-border/50">
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
      <div className="grid grid-cols-4 gap-4 mb-8 p-4 rounded-lg border border-border bg-card">
        <div className="text-center">
          <div className="text-2xl font-bold">{category.lps.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{lpsByStatus.final.length}</div>
          <div className="text-xs text-muted-foreground">Final</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">{lpsByStatus.review.length}</div>
          <div className="text-xs text-muted-foreground">Review</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-500">{lpsByStatus.draft.length}</div>
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
          <p className="text-sm">Be the first to propose a LP in the {category.name} range!</p>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-12 pt-6 border-t border-border">
        <div className="flex justify-between">
          <Link
            href="/docs"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="size-3" />
            Back to All Proposals
          </Link>
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
