import Link from 'next/link';
import { source } from '@/lib/source';

type ProposalStatus = 'Final' | 'Draft' | 'Review';

// Lux logo - downward-pointing triangle per @luxfi/logo
function LuxLogo({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor" className={className}>
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

function StatusBadge({ status }: { status: ProposalStatus }) {
  const colors = {
    Final: 'bg-black text-white',
    Review: 'bg-neutral-200 text-neutral-700',
    Draft: 'bg-neutral-100 text-neutral-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  );
}

// Icons
function IconLayers({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function IconNodes({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="3" /><circle cx="12" cy="5" r="1.5" /><circle cx="19" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /><circle cx="5" cy="12" r="1.5" />
    </svg>
  );
}

function IconLock({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function IconMonitor({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function IconFile({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" /><path d="M14 2v6h6M9 15h6" />
    </svg>
  );
}

function IconExchange({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" />
    </svg>
  );
}

const categories = [
  { title: 'Core', range: '0–99', desc: 'Network fundamentals', Icon: IconLayers },
  { title: 'Consensus', range: '100–199', desc: 'Protocols & safety', Icon: IconNodes },
  { title: 'Cryptography', range: '200–299', desc: 'Signatures & proofs', Icon: IconLock },
  { title: 'P-Chain', range: '1000–1999', desc: 'Platform chain', Icon: IconMonitor },
  { title: 'C-Chain', range: '2000–2999', desc: 'EVM & contracts', Icon: IconFile },
  { title: 'X-Chain', range: '3000–3999', desc: 'Exchange chain', Icon: IconExchange },
] as const;

const footerLinks = {
  ecosystem: [
    { title: 'Ecosystem', href: 'https://lux.link', header: true },
    { title: 'Lux AI', href: 'https://lux.chat' },
    { title: 'Lux Credit', href: 'https://lux.credit' },
    { title: 'Lux Exchange', href: 'https://lux.exchange' },
    { title: 'Lux Finance', href: 'https://lux.finance' },
    { title: 'Lux Market', href: 'https://lux.market' },
    { title: 'Lux Shop', href: 'https://lux.shop' },
    { title: 'Lux Quest', href: 'https://lux.quest' },
  ],
  network: [
    { title: 'Network', href: 'https://lux.network', header: true },
    { title: 'Bridge', href: 'https://bridge.lux.network' },
    { title: 'Explorer', href: 'https://explore.lux.network' },
    { title: 'Wallet', href: 'https://wallet.lux.network' },
    { title: 'Safe', href: 'https://safe.lux.network' },
    { title: 'Validator', href: 'https://lux.network/validator' },
    { title: 'Governance', href: 'https://lux.vote' },
    { title: 'Open Source', href: 'https://github.com/luxfi' },
  ],
  company: [
    { title: 'Company', href: 'https://lux.partners', header: true },
    { title: 'About', href: 'https://lux.partners' },
    { title: 'Brand', href: 'https://drive.google.com/drive/folders/14OJtKLVakGY6883XO9yGbiHtlFxQUUm5' },
    { title: 'Careers', href: 'https://docs.google.com/document/d/1SCt0Hg7EIs06TootKCA1am1xo4mcXoKF/edit' },
    { title: 'Partnerships', href: 'https://apply.lux.partners' },
    { title: 'Press', href: 'mailto:ai@lux.partners?subject=Press' },
    { title: 'Help', href: 'mailto:ai@lux.partners?subject=Help' },
  ],
  community: [
    { title: 'Community', href: '#', header: true },
    { title: 'Discord', href: 'https://discord.gg/sxaS7FFHwh' },
    { title: 'Telegram', href: 'https://t.me/luxdefi' },
    { title: '@luxdefi', href: 'https://twitter.com/luxdefi' },
    { title: 'Discussions', href: 'https://github.com/orgs/luxfi/discussions' },
  ],
};

export default function HomePage() {
  const stats = source.getStats();
  const recentLPs = source.getAllPages().slice(0, 6);

  return (
    <div className="min-h-screen bg-white text-black antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <LuxLogo size={18} />
            <span className="font-semibold">Lux Proposals</span>
          </Link>
          <Link href="/docs" className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-800">
            Browse →
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <p className="text-sm text-neutral-500">
            {stats.byStatus['Final'] || 0} standards finalized
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Lux Proposals
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-neutral-500">
            Open, community-driven standards for the Lux ecosystem.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/docs" className="w-full rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 sm:w-auto">
              Browse proposals
            </Link>
            <a href="https://github.com/luxfi/lps" target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200 px-6 py-2.5 text-sm font-medium hover:bg-neutral-50 sm:w-auto">
              <GitHubIcon size={16} />
              GitHub
            </a>
          </div>

          {/* Search */}
          <div className="mx-auto mt-10 max-w-md">
            <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
              <SearchIcon size={16} />
              <input type="text" placeholder="Search LPs..." className="flex-1 bg-transparent text-sm focus:outline-none" />
              <kbd className="hidden rounded bg-neutral-200 px-1.5 py-0.5 text-xs text-neutral-500 sm:block">⌘K</kbd>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-neutral-200 bg-neutral-50">
          <div className="mx-auto grid max-w-6xl grid-cols-4 divide-x divide-neutral-200">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Final', value: stats.byStatus['Final'] || 0 },
              { label: 'Review', value: stats.byStatus['Review'] || 0 },
              { label: 'Draft', value: stats.byStatus['Draft'] || 0 },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-6 text-center sm:px-6">
                <div className="text-2xl font-semibold tabular-nums sm:text-3xl">{stat.value}</div>
                <div className="mt-0.5 text-xs text-neutral-500 sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-xl font-semibold sm:text-2xl">Categories</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link key={cat.title} href="/docs" className="flex items-center gap-4 rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50">
                <div className="flex size-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                  <cat.Icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{cat.title}</span>
                    <span className="font-mono text-xs text-neutral-400">{cat.range}</span>
                  </div>
                  <p className="text-sm text-neutral-500">{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent */}
        <section className="border-t border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold sm:text-2xl">Recent proposals</h2>
              <Link href="/docs" className="text-sm font-medium text-neutral-500 hover:text-black">View all →</Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentLPs.map((lp) => {
                const lpNum = String(lp.data.frontmatter.lp || '0').padStart(4, '0');
                const status = (lp.data.frontmatter.status || 'Draft') as ProposalStatus;
                return (
                  <Link key={lp.slug.join('/')} href={`/docs/${lp.slug.join('/')}`} className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-neutral-400">LP-{lpNum}</span>
                      <StatusBadge status={status} />
                    </div>
                    <h3 className="mt-2 font-medium leading-snug line-clamp-2">{lp.data.title}</h3>
                    {lp.data.description && <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{lp.data.description}</p>}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-xl bg-black p-8 text-white sm:p-12">
            <h2 className="text-xl font-semibold sm:text-2xl">Ready to contribute?</h2>
            <p className="mt-2 text-neutral-400">Have an idea? Start with the guidelines, then open a PR.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/contribute" className="rounded-full bg-white px-6 py-2.5 text-center text-sm font-medium text-black hover:bg-neutral-100">
                Read guidelines
              </Link>
              <a href="https://github.com/luxfi/lps" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-full border border-neutral-600 px-6 py-2.5 text-sm font-medium hover:bg-neutral-800">
                <GitHubIcon size={16} />
                Open on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-5">
            <div className="col-span-2 sm:col-span-1">
              <LuxLogo size={24} />
            </div>
            {Object.entries(footerLinks).map(([key, links]) => (
              <div key={key}>
                {links.map((link) => (
                  <a
                    key={link.title}
                    href={link.href}
                    target={link.header ? undefined : '_blank'}
                    rel={link.header ? undefined : 'noreferrer'}
                    className={`block text-sm ${link.header ? 'mb-2 font-medium text-neutral-700' : 'mb-1.5 text-neutral-500 hover:text-black'}`}
                  >
                    {link.title}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-8 sm:flex-row">
            <div className="flex gap-4 text-sm text-neutral-500">
              <a href="https://lux.network/terms" target="_blank" rel="noreferrer" className="hover:text-black">Terms</a>
              <a href="https://lux.network/privacy" target="_blank" rel="noreferrer" className="hover:text-black">Privacy</a>
            </div>
            <p className="text-sm text-neutral-400">© {new Date().getFullYear()} Lux Industries Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
