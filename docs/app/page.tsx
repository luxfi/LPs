import Link from 'next/link';
import { Logo, LogoWithText } from '../components/logo';
import { FileText, GitPullRequest, Search, Users, ArrowRight, Shield, Zap, Lock, Database } from 'lucide-react';
import { source } from '@/lib/source';

export default function HomePage() {
  const stats = source.getStats();
  const recentLPs = source.getAllPages().slice(0, 6);

  return (
    <div className="min-h-screen lux-noise">
      {/* Background layers */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 lux-grid" />
        {/* Top glow */}
        <div className="absolute -top-48 left-1/2 h-[680px] w-[980px] -translate-x-1/2 rounded-full blur-3xl
                      bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_60%)]
                      dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_60%)]" />
        {/* Bottom glow */}
        <div className="absolute -bottom-56 left-1/2 h-[760px] w-[980px] -translate-x-1/2 rounded-full blur-3xl
                      bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10),transparent_60%)]
                      dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10),transparent_60%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 dark:border-white/10 bg-background/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="group flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <Logo size={16} />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Lux Proposals
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-foreground/70 md:flex">
            <Link href="/docs" className="hover:text-foreground transition-colors">Browse</Link>
            <Link href="/contribute" className="hover:text-foreground transition-colors">Contribute</Link>
            <a
              href="https://github.com/luxfi/lps"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/docs"
              className="hidden sm:inline-flex items-center justify-center rounded-lg border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 px-3 py-2 text-sm font-medium text-foreground/80
                       hover:border-white/15 hover:bg-white/10 dark:hover:border-white/15 dark:hover:bg-white/10 hover:text-foreground transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/contribute"
              className="inline-flex items-center justify-center rounded-lg bg-foreground px-3 py-2 text-sm font-semibold text-background
                       hover:opacity-90 transition-opacity"
            >
              Submit LP
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative">
          <div className="mx-auto max-w-6xl px-4 pb-14 pt-14 md:pb-18 md:pt-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 px-3 py-1 text-xs text-foreground/70">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground motion-reduce:animate-none animate-pulse" />
                <span><span className="font-medium text-foreground">{stats.byStatus['Final'] || 0}</span> standards finalized</span>
              </div>

              <h1 className="mt-6 text-5xl font-semibold tracking-tight md:text-6xl">
                Lux Proposals
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-foreground/70 md:text-xl">
                Open, community-driven standards for the Lux ecosystem of OSS AI blockchains.
                Browse proposals, submit improvements, and evolve the protocol in public.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background
                           hover:opacity-90 transition-opacity"
                >
                  Browse proposals
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>

                <Link
                  href="/contribute"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 px-5 py-3 text-sm font-semibold text-foreground
                           hover:border-white/15 hover:bg-white/10 dark:hover:border-white/15 dark:hover:bg-white/10 transition-colors"
                >
                  Submit an LP
                </Link>

                <a
                  href="https://github.com/luxfi/lps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-1 py-3 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  View on GitHub
                  <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M7 17L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M10 7h7v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="text-3xl font-semibold tracking-tight">{stats.total}</div>
                <div className="mt-1 text-sm text-foreground/60">Total proposals</div>
              </div>
              <div className="rounded-2xl border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="text-3xl font-semibold tracking-tight">{stats.byStatus['Final'] || 0}</div>
                <div className="mt-1 text-sm text-foreground/60">Final</div>
              </div>
              <div className="rounded-2xl border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="text-3xl font-semibold tracking-tight">{stats.byStatus['Review'] || 0}</div>
                <div className="mt-1 text-sm text-foreground/60">In review</div>
              </div>
              <div className="rounded-2xl border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="text-3xl font-semibold tracking-tight">{stats.byStatus['Draft'] || 0}</div>
                <div className="mt-1 text-sm text-foreground/60">Draft</div>
              </div>
            </div>
          </div>
        </section>

        {/* Open Governance */}
        <section className="border-t border-white/10 dark:border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Open governance</h2>
              <p className="mt-3 text-foreground/70">
                LPs define standards and improvements across tokens, consensus, interoperability, EVM, and more—reviewed in public and shipped with clarity.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { icon: Search, title: 'Browse & search', desc: 'Find proposals by number range, status, or keyword. Quickly locate specs for core architecture, consensus, cryptography, and chain standards.' },
                { icon: GitPullRequest, title: 'Ship proposals via GitHub', desc: 'Submit LPs as pull requests. Use templates and validation to keep discussions structured, reviewable, and easy to merge.' },
                { icon: Users, title: 'Community reviewed', desc: 'Discuss tradeoffs, iterate, and converge on standards together. LPs are the public record of how Lux evolves.' },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 p-6
                           shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_60px_rgba(0,0,0,0.55)]
                           hover:shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_24px_80px_rgba(0,0,0,0.60)]
                           hover:border-white/15 dark:hover:border-white/15 transition-all"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 dark:border-white/10 bg-black/30 dark:bg-black/30">
                    <feature.icon className="h-5 w-5 text-foreground/80" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Process strip */}
            <div className="mt-10 rounded-2xl border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold">Lifecycle</div>
                  <div className="mt-1 text-sm text-foreground/70">
                    Draft → Discussion → Review → Final
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 dark:border-white/10 bg-black/30 dark:bg-black/30 px-3 py-1.5 text-foreground/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/50" />
                    Draft
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 dark:border-white/10 bg-black/30 dark:bg-black/30 px-3 py-1.5 text-foreground/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />
                    Review
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 dark:border-white/10 bg-black/30 dark:bg-black/30 px-3 py-1.5 text-foreground/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    Final
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="border-t border-white/10 dark:border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Proposal categories</h2>
              <p className="mt-3 text-foreground/70">
                LPs are organized by number ranges that indicate their category and purpose.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { range: '0–99', name: 'Core architecture', icon: Shield, desc: 'Network fundamentals and infrastructure' },
                { range: '100–199', name: 'Consensus', icon: Zap, desc: 'Consensus protocols and algorithms' },
                { range: '200–299', name: 'Cryptography', icon: Lock, desc: 'Cryptographic standards and primitives' },
                { range: '1000–1999', name: 'P-Chain', icon: Database, desc: 'Platform chain specifications' },
                { range: '2000–2999', name: 'C-Chain', icon: FileText, desc: 'Contract chain and EVM standards' },
                { range: '3000–3999', name: 'X-Chain', icon: ArrowRight, desc: 'Exchange chain protocols' },
              ].map((cat) => (
                <Link
                  key={cat.range}
                  href="/docs"
                  className="group rounded-2xl border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 p-5
                           shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_60px_rgba(0,0,0,0.55)]
                           hover:shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_24px_80px_rgba(0,0,0,0.60)]
                           hover:border-white/15 dark:hover:border-white/15 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 dark:border-white/10 bg-black/30 dark:bg-black/30">
                      <cat.icon className="h-4 w-4 text-foreground/80" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-semibold">{cat.name}</div>
                        <div className="ml-auto text-xs font-mono text-foreground/50">LP {cat.range}</div>
                      </div>
                      <div className="mt-1 text-sm text-foreground/70">{cat.desc}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Recent LPs */}
        <section className="border-t border-white/10 dark:border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Recent proposals</h2>
                <p className="mt-3 text-foreground/70">A snapshot of what's being specified and reviewed right now.</p>
              </div>

              <Link
                href="/docs"
                className="hidden items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors sm:inline-flex"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentLPs.map((lp) => (
                <Link
                  key={lp.slug.join('/')}
                  href={`/docs/${lp.slug.join('/')}`}
                  className="group rounded-2xl border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 p-5
                           shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_60px_rgba(0,0,0,0.55)]
                           hover:shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_24px_80px_rgba(0,0,0,0.60)]
                           hover:border-white/15 dark:hover:border-white/15 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xs font-mono text-foreground/50">
                      LP-{String(lp.data.frontmatter.lp).padStart(4, '0')}
                    </div>
                    {lp.data.frontmatter.status && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 dark:border-white/10 bg-black/30 dark:bg-black/30 px-2.5 py-1 text-[11px] font-medium ${
                        lp.data.frontmatter.status === 'Final' ? 'text-foreground/80' :
                        lp.data.frontmatter.status === 'Review' ? 'text-foreground/70' :
                        'text-foreground/70'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          lp.data.frontmatter.status === 'Final' ? 'bg-foreground' :
                          lp.data.frontmatter.status === 'Review' ? 'bg-foreground/60' :
                          'bg-foreground/50'
                        }`} />
                        {lp.data.frontmatter.status}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 text-sm font-semibold leading-snug">
                    {lp.data.title}
                  </div>
                  {lp.data.description && (
                    <p className="mt-2 text-sm leading-relaxed text-foreground/70 line-clamp-2">
                      {lp.data.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>

            <div className="mt-8 sm:hidden">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/10 dark:border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <div className="rounded-3xl border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_60px_rgba(0,0,0,0.55)] md:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Ready to contribute?</h2>
                  <p className="mt-3 text-foreground/70">
                    Have an idea that improves Lux? Start with the guidelines, then open a pull request for your LP.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/contribute"
                    className="inline-flex items-center justify-center rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background hover:opacity-90 transition-opacity"
                  >
                    Read guidelines
                  </Link>
                  <a
                    href="https://github.com/luxfi/lps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 dark:border-white/10 bg-black/40 dark:bg-black/40 px-5 py-3 text-sm font-semibold text-foreground
                             hover:border-white/15 hover:bg-black/30 dark:hover:border-white/15 dark:hover:bg-black/30 transition-colors"
                  >
                    Open on GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5">
                  <Logo size={16} />
                </span>
                <div className="text-sm font-semibold">Lux Network</div>
              </div>
              <p className="mt-3 text-sm text-foreground/70">
                Building the future of decentralized infrastructure—open-source, verifiable, and community governed.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <div>
                <div className="text-sm font-semibold">LPs</div>
                <ul className="mt-3 space-y-2 text-sm text-foreground/70">
                  <li><Link className="hover:text-foreground transition-colors" href="/docs">Browse</Link></li>
                  <li><Link className="hover:text-foreground transition-colors" href="/contribute">Contribute</Link></li>
                  <li><a className="hover:text-foreground transition-colors" href="https://github.com/luxfi/lps" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                </ul>
              </div>

              <div>
                <div className="text-sm font-semibold">Network</div>
                <ul className="mt-3 space-y-2 text-sm text-foreground/70">
                  <li><a className="hover:text-foreground transition-colors" href="https://lux.network" target="_blank" rel="noopener noreferrer">Home</a></li>
                  <li><a className="hover:text-foreground transition-colors" href="https://explorer.lux.network" target="_blank" rel="noopener noreferrer">Explorer</a></li>
                  <li><a className="hover:text-foreground transition-colors" href="https://bridge.lux.network" target="_blank" rel="noopener noreferrer">Bridge</a></li>
                  <li><a className="hover:text-foreground transition-colors" href="https://wallet.lux.network" target="_blank" rel="noopener noreferrer">Wallet</a></li>
                </ul>
              </div>

              <div>
                <div className="text-sm font-semibold">Docs</div>
                <ul className="mt-3 space-y-2 text-sm text-foreground/70">
                  <li><a className="hover:text-foreground transition-colors" href="https://docs.lux.network" target="_blank" rel="noopener noreferrer">Network docs</a></li>
                  <li><a className="hover:text-foreground transition-colors" href="https://docs.lux.network/consensus" target="_blank" rel="noopener noreferrer">Consensus</a></li>
                  <li><a className="hover:text-foreground transition-colors" href="https://docs.lux.network/evm" target="_blank" rel="noopener noreferrer">EVM / C-Chain</a></li>
                </ul>
              </div>

              <div>
                <div className="text-sm font-semibold">Community</div>
                <ul className="mt-3 space-y-2 text-sm text-foreground/70">
                  <li><a className="hover:text-foreground transition-colors" href="https://github.com/luxfi" target="_blank" rel="noopener noreferrer">GitHub org</a></li>
                  <li><a className="hover:text-foreground transition-colors" href="https://forum.lux.network" target="_blank" rel="noopener noreferrer">Forum</a></li>
                  <li><a className="hover:text-foreground transition-colors" href="https://discord.gg/lux" target="_blank" rel="noopener noreferrer">Discord</a></li>
                  <li><a className="hover:text-foreground transition-colors" href="https://twitter.com/luxfi" target="_blank" rel="noopener noreferrer">X / Twitter</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 dark:border-white/10 pt-8 text-sm text-foreground/60 md:flex-row md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} Lux Network. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <a className="hover:text-foreground transition-colors" href="https://lux.network/privacy" target="_blank" rel="noopener noreferrer">Privacy</a>
              <a className="hover:text-foreground transition-colors" href="https://lux.network/terms" target="_blank" rel="noopener noreferrer">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
