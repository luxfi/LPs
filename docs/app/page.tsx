import Link from 'next/link';
import { Logo } from '../components/logo';
import { FileText, GitPullRequest, Search, Users, ArrowRight, BookOpen, Shield, Zap } from 'lucide-react';
import { source } from '@/lib/source';

export default function HomePage() {
  const stats = source.getStats();
  const recentLPs = source.getAllPages().slice(0, 6);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={32} variant="white" />
            <span className="font-bold text-xl">Lux Proposals</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
              Browse LPs
            </Link>
            <Link href="/contribute" className="text-muted-foreground hover:text-foreground transition-colors">
              Contribute
            </Link>
            <a
              href="https://github.com/luxfi/lps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold mb-6 tracking-tight">
            Lux Proposals
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Community-driven standards and improvements for the Lux Network.
            Browse, contribute, and shape the future of decentralized infrastructure.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-6 py-3 font-medium hover:opacity-90 transition-opacity"
            >
              <FileText className="size-4" />
              Browse Proposals
            </Link>
            <Link
              href="/contribute"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-medium hover:bg-accent transition-colors"
            >
              <GitPullRequest className="size-4" />
              Contribute
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Proposals</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-500">{stats.byStatus['Final'] || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">Final</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-500">{stats.byStatus['Review'] || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">In Review</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-500">{stats.byStatus['Draft'] || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">Draft</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Open Governance</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                <Search className="size-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Browse & Search</h3>
              <p className="text-muted-foreground text-sm">
                Explore all proposals by category, status, or full-text search.
                Find standards for tokens, consensus, bridges, and more.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                <GitPullRequest className="size-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Contribution</h3>
              <p className="text-muted-foreground text-sm">
                Submit proposals via GitHub pull requests. Use our templates
                and validation tools to ensure your LP meets all requirements.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                <Users className="size-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Community Driven</h3>
              <p className="text-muted-foreground text-sm">
                Discuss proposals on the forum, provide feedback, and
                participate in the review process. Your voice matters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">Proposal Categories</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            LPs are organized by number ranges that indicate their category and purpose.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { range: '0-99', name: 'Core Architecture', icon: Shield, desc: 'Network fundamentals and infrastructure' },
              { range: '100-199', name: 'Consensus', icon: Zap, desc: 'Consensus protocols and algorithms' },
              { range: '200-299', name: 'Cryptography', icon: Shield, desc: 'Cryptographic standards and primitives' },
              { range: '1000-1999', name: 'P-Chain', icon: BookOpen, desc: 'Platform chain specifications' },
              { range: '2000-2999', name: 'C-Chain', icon: FileText, desc: 'Contract chain and EVM standards' },
              { range: '3000-3999', name: 'X-Chain', icon: ArrowRight, desc: 'Exchange chain protocols' },
            ].map((cat) => (
              <Link
                key={cat.range}
                href="/docs"
                className="p-4 rounded-lg border border-border hover:border-foreground/20 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <cat.icon className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">LP {cat.range}</span>
                </div>
                <p className="text-sm text-muted-foreground">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent LPs */}
      <section className="py-20 px-4 border-t border-border bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Recent Proposals</h2>
            <Link
              href="/docs"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentLPs.map((lp) => (
              <Link
                key={lp.slug.join('/')}
                href={`/docs/${lp.slug.join('/')}`}
                className="p-4 rounded-lg border border-border bg-background hover:border-foreground/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    LP-{lp.data.frontmatter.lp}
                  </span>
                  {lp.data.frontmatter.status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      lp.data.frontmatter.status === 'Final' ? 'bg-green-500/10 text-green-500' :
                      lp.data.frontmatter.status === 'Draft' ? 'bg-yellow-500/10 text-yellow-500' :
                      lp.data.frontmatter.status === 'Review' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-gray-500/10 text-gray-500'
                    }`}>
                      {lp.data.frontmatter.status}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-sm line-clamp-2">{lp.data.title}</h3>
                {lp.data.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {lp.data.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-border">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Contribute?</h2>
          <p className="text-muted-foreground mb-8">
            Have an idea for improving the Lux Network? Start by reading the
            contribution guidelines, then submit your proposal.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/contribute"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-6 py-3 font-medium hover:opacity-90 transition-opacity"
            >
              Read Guidelines
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo size={20} variant="white" />
            <span>Lux Network</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://lux.network" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              Website
            </a>
            <a href="https://docs.lux.network" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              Docs
            </a>
            <a href="https://github.com/luxfi" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              GitHub
            </a>
            <a href="https://forum.lux.network" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              Forum
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
