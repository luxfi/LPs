import Link from 'next/link';
import { source } from '@/lib/source';

type ProposalStatus = 'Final' | 'Draft' | 'Review';

function StatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium tracking-wide text-white/60">
      <span className={`h-1.5 w-1.5 rounded-full ${
        status === 'Final' ? 'bg-white' :
        status === 'Review' ? 'bg-white/70' : 'bg-white/40'
      }`} />
      {status}
    </span>
  );
}

// Icon components with explicit sizing
function LuxLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 10 L95 90 L5 90 Z" />
    </svg>
  );
}

function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function SearchIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function DiscordIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Category icons
function IconLayers({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function IconNodes({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
    </svg>
  );
}

function IconLock({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function IconMonitor({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function IconFile({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path d="M14 2v6h6" />
      <path d="M9 15h6" />
    </svg>
  );
}

function IconExchange({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M16 3l4 4-4 4" />
      <path d="M20 7H4" />
      <path d="M8 21l-4-4 4-4" />
      <path d="M4 17h16" />
    </svg>
  );
}

const categories = [
  { title: 'Core', range: '0–99', desc: 'Network fundamentals and infrastructure', Icon: IconLayers },
  { title: 'Consensus', range: '100–199', desc: 'Protocols, safety, liveness', Icon: IconNodes },
  { title: 'Cryptography', range: '200–299', desc: 'Primitives, signatures, proofs', Icon: IconLock },
  { title: 'P-Chain', range: '1000–1999', desc: 'Platform chain specifications', Icon: IconMonitor },
  { title: 'C-Chain', range: '2000–2999', desc: 'EVM & contract standards', Icon: IconFile },
  { title: 'X-Chain', range: '3000–3999', desc: 'Exchange chain protocols', Icon: IconExchange },
] as const;

export default function HomePage() {
  const stats = source.getStats();
  const recentLPs = source.getAllPages().slice(0, 6);

  const statsData = [
    { label: 'Total proposals', value: stats.total },
    { label: 'Final', value: stats.byStatus['Final'] || 0 },
    { label: 'In review', value: stats.byStatus['Review'] || 0 },
    { label: 'Draft', value: stats.byStatus['Draft'] || 0 },
  ];

  return (
    <div className="min-h-screen bg-black text-white antialiased selection:bg-white/20">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Top glow */}
        <div className="absolute -top-[50%] left-1/2 h-[1000px] w-[1600px] -translate-x-1/2 rounded-full bg-white/[0.03] blur-[150px]" />
        {/* Secondary glow */}
        <div className="absolute top-[20%] right-0 h-[600px] w-[600px] translate-x-1/2 rounded-full bg-white/[0.02] blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl backdrop-saturate-150">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
              <LuxLogo size={14} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Lux Proposals</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/docs" className="text-[13px] text-white/50 transition-colors hover:text-white">
              Browse
            </Link>
            <Link href="/contribute" className="text-[13px] text-white/50 transition-colors hover:text-white">
              Contribute
            </Link>
            <a
              href="https://github.com/luxfi/lps"
              target="_blank"
              rel="noreferrer"
              className="text-[13px] text-white/50 transition-colors hover:text-white"
            >
              GitHub
            </a>
          </div>

          <Link
            href="/docs"
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black transition-all hover:bg-white/90 hover:shadow-lg hover:shadow-white/10"
          >
            Browse
            <ArrowIcon size={14} />
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative">
          <div className="mx-auto max-w-6xl px-6 pb-20 pt-24 md:pb-28 md:pt-32">
            <div className="mx-auto max-w-3xl text-center">
              {/* Status pill */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60" style={{ animationDuration: '2s' }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                <span className="text-[13px] text-white/60">
                  <span className="font-semibold text-white">{stats.byStatus['Final'] || 0}</span> standards finalized
                </span>
              </div>

              <h1 className="mt-8 text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
                Lux Proposals
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/50 md:text-lg">
                Open, community-driven standards and improvements for the Lux ecosystem of OSS AI blockchains.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/docs"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-semibold text-black transition-all hover:bg-white/90 hover:shadow-lg hover:shadow-white/10 sm:w-auto"
                >
                  Browse proposals
                </Link>
                <a
                  href="https://github.com/luxfi/lps"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-8 text-sm font-semibold text-white transition-all hover:border-white/20 hover:bg-white/[0.05] sm:w-auto"
                >
                  <GitHubIcon size={16} />
                  View on GitHub
                </a>
              </div>

              {/* Search */}
              <div className="mx-auto mt-12 max-w-xl">
                <div className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 transition-all focus-within:border-white/20 focus-within:bg-white/[0.04] hover:border-white/15">
                  <SearchIcon size={20} />
                  <input
                    type="text"
                    placeholder="Search LPs by number, title, or keyword..."
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 focus:outline-none"
                  />
                  <kbd className="hidden flex-shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] font-medium text-white/40 md:block">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
              {statsData.map((stat) => (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.03]"
                >
                  <div className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-[13px] text-white/40">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Proposal categories</h2>
              <p className="mt-3 text-[15px] text-white/50">
                LPs are organized by number ranges that indicate category and purpose.
              </p>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <Link
                  key={cat.title}
                  href="/docs"
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 transition-all hover:border-white/15 hover:bg-white/[0.03]"
                >
                  {/* Hover glow effect */}
                  <div className="pointer-events-none absolute -right-12 -top-12 h-24 w-24 rounded-full bg-white/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />

                  <div className="relative flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 transition-colors group-hover:border-white/15 group-hover:text-white/80">
                      <cat.Icon size={20} />
                    </div>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 font-mono text-[11px] text-white/40 transition-colors group-hover:text-white/60">
                      {cat.range}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold transition-colors group-hover:text-white">{cat.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/40">{cat.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Recent proposals */}
        <section className="border-t border-white/[0.06] bg-white/[0.01]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Recent proposals</h2>
                <p className="mt-2 text-[15px] text-white/50">Latest LPs across protocol, tooling, and standards.</p>
              </div>
              <Link
                href="/docs"
                className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:border-white/20 hover:bg-white/[0.05] sm:inline-flex"
              >
                View all
                <ArrowIcon size={14} />
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentLPs.map((lp) => {
                const lpNum = String(lp.data.frontmatter.lp || '0').padStart(4, '0');
                const status = (lp.data.frontmatter.status || 'Draft') as ProposalStatus;
                return (
                  <Link
                    key={lp.slug.join('/')}
                    href={`/docs/${lp.slug.join('/')}`}
                    className="group rounded-2xl border border-white/[0.06] bg-black/50 p-6 transition-all hover:border-white/12 hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[13px] text-white/40 transition-colors group-hover:text-white/60">LP-{lpNum}</span>
                      <StatusBadge status={status} />
                    </div>
                    <h3 className="mt-4 text-[15px] font-semibold leading-snug transition-colors group-hover:text-white line-clamp-2">
                      {lp.data.title}
                    </h3>
                    {lp.data.description && (
                      <p className="mt-2 text-[13px] leading-relaxed text-white/40 line-clamp-2">
                        {lp.data.description}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-[13px] font-semibold text-white"
              >
                View all proposals
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent">
              {/* Decorative elements */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/[0.03] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/[0.02] blur-2xl" />

              <div className="relative px-8 py-12 md:px-16 md:py-16">
                <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-lg">
                    <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Ready to contribute?</h2>
                    <p className="mt-3 text-[15px] leading-relaxed text-white/50">
                      Have an idea that improves Lux? Start with the guidelines, then open a pull request for your LP.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/contribute"
                      className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-all hover:bg-white/90"
                    >
                      Read guidelines
                    </Link>
                    <a
                      href="https://github.com/luxfi/lps"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-6 text-sm font-semibold text-white transition-all hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <GitHubIcon size={16} />
                      Open on GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-5">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                  <LuxLogo size={16} />
                </div>
                <span className="text-[15px] font-semibold">Lux Network</span>
              </div>
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/40">
                Building the future of decentralized infrastructure—open-source, verifiable, and community governed.
              </p>
              {/* Social icons */}
              <div className="mt-6 flex items-center gap-3">
                <a
                  href="https://github.com/luxfi"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/40 transition-all hover:border-white/15 hover:bg-white/[0.05] hover:text-white"
                  aria-label="GitHub"
                >
                  <GitHubIcon size={16} />
                </a>
                <a
                  href="https://discord.gg/lux"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/40 transition-all hover:border-white/15 hover:bg-white/[0.05] hover:text-white"
                  aria-label="Discord"
                >
                  <DiscordIcon size={16} />
                </a>
                <a
                  href="https://twitter.com/luxfi"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/40 transition-all hover:border-white/15 hover:bg-white/[0.05] hover:text-white"
                  aria-label="X / Twitter"
                >
                  <XIcon size={16} />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-[13px] font-semibold text-white/70">LPs</h4>
              <ul className="mt-4 space-y-3 text-[13px]">
                <li><Link href="/docs" className="text-white/40 transition-colors hover:text-white">Browse</Link></li>
                <li><Link href="/contribute" className="text-white/40 transition-colors hover:text-white">Contribute</Link></li>
                <li><a href="https://github.com/luxfi/lps" target="_blank" rel="noreferrer" className="text-white/40 transition-colors hover:text-white">GitHub</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[13px] font-semibold text-white/70">Network</h4>
              <ul className="mt-4 space-y-3 text-[13px]">
                <li><a href="https://lux.network" target="_blank" rel="noreferrer" className="text-white/40 transition-colors hover:text-white">Home</a></li>
                <li><a href="https://explorer.lux.network" target="_blank" rel="noreferrer" className="text-white/40 transition-colors hover:text-white">Explorer</a></li>
                <li><a href="https://docs.lux.network" target="_blank" rel="noreferrer" className="text-white/40 transition-colors hover:text-white">Docs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[13px] font-semibold text-white/70">Community</h4>
              <ul className="mt-4 space-y-3 text-[13px]">
                <li><a href="https://github.com/luxfi" target="_blank" rel="noreferrer" className="text-white/40 transition-colors hover:text-white">GitHub org</a></li>
                <li><a href="https://discord.gg/lux" target="_blank" rel="noreferrer" className="text-white/40 transition-colors hover:text-white">Discord</a></li>
                <li><a href="https://twitter.com/luxfi" target="_blank" rel="noreferrer" className="text-white/40 transition-colors hover:text-white">X / Twitter</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-[13px] text-white/30 md:flex-row">
            <div>© {new Date().getFullYear()} Lux Network. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <a href="https://lux.network/privacy" target="_blank" rel="noreferrer" className="transition-colors hover:text-white">Privacy</a>
              <a href="https://lux.network/terms" target="_blank" rel="noreferrer" className="transition-colors hover:text-white">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
