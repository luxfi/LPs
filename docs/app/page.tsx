import Link from 'next/link';
import { Logo, LogoWithText } from '../components/logo';
import { FileText, GitPullRequest, Search, Users, ArrowRight, Shield, Zap, Lock, Database } from 'lucide-react';
import { source } from '@/lib/source';

export default function HomePage() {
  const stats = source.getStats();
  const recentLPs = source.getAllPages().slice(0, 6);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <LogoWithText size={28} />
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/docs"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Browse
            </Link>
            <Link
              href="/contribute"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Contribute
            </Link>
            <a
              href="https://github.com/luxfi/lps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/50 text-sm text-muted-foreground mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {stats.byStatus['Final'] || 0} standards finalized
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Lux Proposals
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Community-driven standards and improvements for the Lux Network.
            Browse, contribute, and shape the future of decentralized infrastructure.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-6 py-3 font-medium hover:scale-105 active:scale-95 transition-transform duration-200"
            >
              <FileText className="size-4" />
              Browse Proposals
            </Link>
            <Link
              href="/contribute"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-medium hover:bg-accent hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <GitPullRequest className="size-4" />
              Contribute
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-4xl font-bold transition-transform duration-200 group-hover:scale-110">{stats.total}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Proposals</div>
            </div>
            <div className="group">
              <div className="text-4xl font-bold text-green-500 transition-transform duration-200 group-hover:scale-110">{stats.byStatus['Final'] || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">Final</div>
            </div>
            <div className="group">
              <div className="text-4xl font-bold text-blue-500 transition-transform duration-200 group-hover:scale-110">{stats.byStatus['Review'] || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">In Review</div>
            </div>
            <div className="group">
              <div className="text-4xl font-bold text-yellow-500 transition-transform duration-200 group-hover:scale-110">{stats.byStatus['Draft'] || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">Draft</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Open Governance</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Search, title: 'Browse & Search', desc: 'Explore all proposals by category, status, or full-text search. Find standards for tokens, consensus, bridges, and more.' },
              { icon: GitPullRequest, title: 'Easy Contribution', desc: 'Submit proposals via GitHub pull requests. Use our templates and validation tools to ensure your LP meets all requirements.' },
              { icon: Users, title: 'Community Driven', desc: 'Discuss proposals on the forum, provide feedback, and participate in the review process. Your voice matters.' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-border bg-card hover:border-foreground/20 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <feature.icon className="size-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
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
              { range: '200-299', name: 'Cryptography', icon: Lock, desc: 'Cryptographic standards and primitives' },
              { range: '1000-1999', name: 'P-Chain', icon: Database, desc: 'Platform chain specifications' },
              { range: '2000-2999', name: 'C-Chain', icon: FileText, desc: 'Contract chain and EVM standards' },
              { range: '3000-3999', name: 'X-Chain', icon: ArrowRight, desc: 'Exchange chain protocols' },
            ].map((cat) => (
              <Link
                key={cat.range}
                href="/docs"
                className="p-4 rounded-xl border border-border hover:border-foreground/20 hover:bg-accent/30 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <cat.icon className="size-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto font-mono">LP {cat.range}</span>
                </div>
                <p className="text-sm text-muted-foreground">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent LPs */}
      <section className="py-20 px-4 border-t border-border bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Recent Proposals</h2>
            <Link
              href="/docs"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 group"
            >
              View all <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentLPs.map((lp) => (
              <Link
                key={lp.slug.join('/')}
                href={`/docs/${lp.slug.join('/')}`}
                className="p-4 rounded-xl border border-border bg-background hover:border-foreground/20 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    LP-{lp.data.frontmatter.lp}
                  </span>
                  {lp.data.frontmatter.status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full transition-colors duration-200 ${
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
          <Link
            href="/contribute"
            className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-6 py-3 font-medium hover:scale-105 active:scale-95 transition-transform duration-200"
          >
            Read Guidelines
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-card/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Logo size={24} />
                <span className="font-bold">Lux Network</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Building the future of decentralized infrastructure.
              </p>
            </div>

            {/* Network */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">Network</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://lux.network" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Home</a></li>
                <li><a href="https://explorer.lux.network" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Explorer</a></li>
                <li><a href="https://bridge.lux.network" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Bridge</a></li>
                <li><a href="https://wallet.lux.network" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Wallet</a></li>
              </ul>
            </div>

            {/* Documentation */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">Documentation</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://docs.lux.network" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Network Docs</a></li>
                <li><a href="https://docs.lux.network/consensus" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Consensus</a></li>
                <li><a href="https://docs.lux.network/evm" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">EVM / C-Chain</a></li>
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Proposals (LPs)</Link></li>
              </ul>
            </div>

            {/* AI & Research */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">AI & Research</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://hanzo.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Hanzo AI</a></li>
                <li><a href="https://zoo.ngo" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Zoo Labs</a></li>
                <li><a href="https://docs.lux.network/ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">AI Integration</a></li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://github.com/luxfi" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a></li>
                <li><a href="https://forum.lux.network" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Forum</a></li>
                <li><a href="https://discord.gg/lux" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Discord</a></li>
                <li><a href="https://twitter.com/luxfi" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Twitter</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Lux Network. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://lux.network/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="https://lux.network/terms" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
