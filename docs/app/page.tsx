import Link from 'next/link';
import { source } from '@/lib/source';

type ProposalStatus = 'Final' | 'Draft' | 'Review';

function StatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-white/60 ring-1 ring-inset ring-white/10">
      <span className={`size-1.5 rounded-full ${
        status === 'Final' ? 'bg-white' :
        status === 'Review' ? 'bg-white/60' : 'bg-white/40'
      }`} />
      {status}
    </span>
  );
}

// Lux logo - downward-pointing triangle per @luxfi/logo
function LuxLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 85 L15 25 L85 25 Z" />
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

function SearchIcon({ size = 18 }: { size?: number }) {
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

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {/* Ambient effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-b from-white/[0.07] to-transparent blur-3xl" />
        <div className="absolute top-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-b from-white/[0.04] to-transparent blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6">
          <nav className="flex h-16 items-center justify-between border-b border-white/[0.08]">
            <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-70">
              <div className="flex size-8 items-center justify-center rounded-lg bg-white/[0.08]">
                <LuxLogo size={14} />
              </div>
              <span className="text-sm font-semibold">Lux Proposals</span>
            </Link>

            <div className="flex items-center gap-6">
              <div className="hidden items-center gap-6 md:flex">
                <Link href="/docs" className="text-sm text-white/50 transition-colors hover:text-white">
                  Browse
                </Link>
                <Link href="/contribute" className="text-sm text-white/50 transition-colors hover:text-white">
                  Contribute
                </Link>
                <a href="https://github.com/luxfi/lps" target="_blank" rel="noreferrer" className="text-sm text-white/50 transition-colors hover:text-white">
                  GitHub
                </a>
              </div>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-all hover:bg-white/90"
              >
                Browse
                <ArrowIcon size={14} />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="relative">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 md:pb-32 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-4 py-2 ring-1 ring-inset ring-white/[0.1]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/40" style={{ animationDuration: '2s' }} />
                <span className="relative inline-flex size-2 rounded-full bg-white" />
              </span>
              <span className="text-sm text-white/70">
                <span className="font-medium text-white">{stats.byStatus['Final'] || 0}</span> standards finalized
              </span>
            </div>

            <h1 className="mt-8 bg-gradient-to-b from-white to-white/70 bg-clip-text text-5xl font-semibold tracking-tight text-transparent md:text-6xl lg:text-7xl">
              Lux Proposals
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/50">
              Open, community-driven standards and improvements for the Lux ecosystem of open-source AI blockchains.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/docs"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-semibold text-black transition-all hover:bg-white/90 sm:w-auto"
              >
                Browse proposals
              </Link>
              <a
                href="https://github.com/luxfi/lps"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-white/[0.05] px-8 text-sm font-semibold text-white ring-1 ring-inset ring-white/[0.1] transition-all hover:bg-white/[0.08] sm:w-auto"
              >
                <GitHubIcon size={16} />
                View on GitHub
              </a>
            </div>

            {/* Search */}
            <div className="mx-auto mt-14 max-w-xl">
              <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-5 py-4 ring-1 ring-inset ring-white/[0.08] transition-all focus-within:ring-white/20">
                <SearchIcon size={18} />
                <input
                  type="text"
                  placeholder="Search LPs by number, title, or keyword..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                />
                <kbd className="hidden rounded-md bg-white/[0.05] px-2 py-1 text-xs font-medium text-white/40 ring-1 ring-inset ring-white/[0.1] md:block">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/[0.06] md:grid-cols-4">
              {[
                { label: 'Total proposals', value: stats.total },
                { label: 'Final', value: stats.byStatus['Final'] || 0 },
                { label: 'In review', value: stats.byStatus['Review'] || 0 },
                { label: 'Draft', value: stats.byStatus['Draft'] || 0 },
              ].map((stat) => (
                <div key={stat.label} className="bg-black p-8 text-center">
                  <div className="text-4xl font-semibold tracking-tight">{stat.value}</div>
                  <div className="mt-1 text-sm text-white/40">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Proposal categories</h2>
            <p className="mt-3 text-base text-white/50">
              LPs are organized by number ranges that indicate category and purpose.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.title}
                href="/docs"
                className="group relative rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent p-6 ring-1 ring-inset ring-white/[0.08] transition-all hover:from-white/[0.06] hover:ring-white/[0.15]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-white/[0.05] text-white/60 ring-1 ring-inset ring-white/[0.1] transition-colors group-hover:text-white/80">
                    <cat.Icon size={22} />
                  </div>
                  <span className="rounded-full bg-white/[0.05] px-3 py-1 font-mono text-xs text-white/50 ring-1 ring-inset ring-white/[0.08]">
                    {cat.range}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold">{cat.title}</h3>
                <p className="mt-1.5 text-sm text-white/40">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent proposals */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.015] to-transparent">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Recent proposals</h2>
                <p className="mt-2 text-base text-white/50">Latest LPs across protocol, tooling, and standards.</p>
              </div>
              <Link
                href="/docs"
                className="hidden items-center gap-2 rounded-full bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white ring-1 ring-inset ring-white/[0.1] transition-all hover:bg-white/[0.08] sm:inline-flex"
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
                    className="group rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent p-6 ring-1 ring-inset ring-white/[0.06] transition-all hover:from-white/[0.05] hover:ring-white/[0.12]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-sm text-white/50 transition-colors group-hover:text-white/70">LP-{lpNum}</span>
                      <StatusBadge status={status} />
                    </div>
                    <h3 className="mt-4 text-base font-semibold leading-snug line-clamp-2">
                      {lp.data.title}
                    </h3>
                    {lp.data.description && (
                      <p className="mt-2 text-sm leading-relaxed text-white/40 line-clamp-2">
                        {lp.data.description}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="mt-10 text-center sm:hidden">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-6 py-3 text-sm font-medium text-white ring-1 ring-inset ring-white/[0.1]"
              >
                View all proposals
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] ring-1 ring-inset ring-white/[0.1]">
            <div className="px-8 py-14 md:px-14 md:py-16">
              <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Ready to contribute?</h2>
                  <p className="mt-3 text-base leading-relaxed text-white/50">
                    Have an idea that improves Lux? Start with the guidelines, then open a pull request for your LP.
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-col gap-3 sm:flex-row">
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
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white/[0.05] px-6 text-sm font-semibold text-white ring-1 ring-inset ring-white/[0.1] transition-all hover:bg-white/[0.08]"
                  >
                    <GitHubIcon size={16} />
                    Open on GitHub
                  </a>
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
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-inset ring-white/[0.1]">
                  <LuxLogo size={16} />
                </div>
                <span className="text-base font-semibold">Lux Network</span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/40">
                Building the future of decentralized infrastructure—open-source, verifiable, and community governed.
              </p>
              <div className="mt-6 flex items-center gap-2">
                {[
                  { href: 'https://github.com/luxfi', icon: GitHubIcon, label: 'GitHub' },
                  { href: 'https://discord.gg/lux', icon: DiscordIcon, label: 'Discord' },
                  { href: 'https://twitter.com/luxfi', icon: XIcon, label: 'X' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-10 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.05] hover:text-white"
                    aria-label={social.label}
                  >
                    <social.icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: 'LPs',
                links: [
                  { label: 'Browse', href: '/docs' },
                  { label: 'Contribute', href: '/contribute' },
                  { label: 'GitHub', href: 'https://github.com/luxfi/lps', external: true },
                ],
              },
              {
                title: 'Network',
                links: [
                  { label: 'Home', href: 'https://lux.network', external: true },
                  { label: 'Explorer', href: 'https://explorer.lux.network', external: true },
                  { label: 'Docs', href: 'https://docs.lux.network', external: true },
                ],
              },
              {
                title: 'Community',
                links: [
                  { label: 'GitHub org', href: 'https://github.com/luxfi', external: true },
                  { label: 'Discord', href: 'https://discord.gg/lux', external: true },
                  { label: 'X / Twitter', href: 'https://twitter.com/luxfi', external: true },
                ],
              },
            ].map((group) => (
              <div key={group.title}>
                <h4 className="text-sm font-semibold text-white/70">{group.title}</h4>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a href={link.href} target="_blank" rel="noreferrer" className="text-sm text-white/40 transition-colors hover:text-white">
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="text-sm text-white/40 transition-colors hover:text-white">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 md:flex-row">
            <div className="text-sm text-white/30">© {new Date().getFullYear()} Lux Network. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <a href="https://lux.network/privacy" target="_blank" rel="noreferrer" className="text-sm text-white/30 transition-colors hover:text-white">
                Privacy
              </a>
              <a href="https://lux.network/terms" target="_blank" rel="noreferrer" className="text-sm text-white/30 transition-colors hover:text-white">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
