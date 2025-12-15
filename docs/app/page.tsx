import Link from 'next/link';
import { Logo, LogoWithText } from '@/components/logo';
import { source } from '@/lib/source';
import { ThemeToggle } from '@/components/theme-toggle';

type ProposalStatus = 'Final' | 'Draft' | 'Review';

function StatusBadge({ status }: { status: ProposalStatus }) {
  const styles = {
    Final: 'bg-foreground text-background',
    Review: 'bg-muted text-muted-foreground',
    Draft: 'bg-muted/50 text-muted-foreground',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const categories = [
  { title: 'Core', range: '0-99', desc: 'Network fundamentals', icon: '1' },
  { title: 'Consensus', range: '100-199', desc: 'Protocols & safety', icon: '2' },
  { title: 'Cryptography', range: '200-299', desc: 'Signatures & proofs', icon: '3' },
  { title: 'P-Chain', range: '1000-1999', desc: 'Platform chain', icon: '4' },
  { title: 'C-Chain', range: '2000-2999', desc: 'EVM & contracts', icon: '5' },
  { title: 'X-Chain', range: '3000-3999', desc: 'Exchange chain', icon: '6' },
];

const footerLinks = {
  network: [
    { title: 'Network', href: 'https://lux.network', header: true },
    { title: 'Documentation', href: 'https://docs.lux.network' },
    { title: 'Bridge', href: 'https://bridge.lux.network' },
    { title: 'Explorer', href: 'https://explore.lux.network' },
    { title: 'Wallet', href: 'https://wallet.lux.network' },
    { title: 'Safe', href: 'https://safe.lux.network' },
    { title: 'Governance', href: 'https://lux.vote' },
  ],
  ecosystem: [
    { title: 'Ecosystem', href: 'https://lux.link', header: true },
    { title: 'Lux AI', href: 'https://lux.chat' },
    { title: 'Lux Credit', href: 'https://lux.credit' },
    { title: 'Lux Exchange', href: 'https://lux.exchange' },
    { title: 'Lux Finance', href: 'https://lux.finance' },
    { title: 'Lux Market', href: 'https://lux.market' },
  ],
  company: [
    { title: 'Company', href: 'https://lux.partners', header: true },
    { title: 'About', href: 'https://lux.partners' },
    { title: 'Brand', href: 'https://drive.google.com/drive/folders/14OJtKLVakGY6883XO9yGbiHtlFxQUUm5' },
    { title: 'Careers', href: 'https://docs.google.com/document/d/1SCt0Hg7EIs06TootKCA1am1xo4mcXoKF/edit' },
    { title: 'Open Source', href: 'https://github.com/luxfi' },
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <LogoWithText size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/docs"
              className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Browse
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <p className="text-sm font-medium text-muted-foreground">
            {stats.byStatus['Final'] || 0} standards finalized
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Lux Proposals
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Open, community-driven standards for the Lux ecosystem.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/docs"
              className="w-full rounded-full bg-foreground px-8 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 sm:w-auto"
            >
              Browse proposals
            </Link>
            <a
              href="https://github.com/luxfi/lps"
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-8 py-3 text-sm font-semibold transition-colors hover:bg-muted sm:w-auto"
            >
              <GitHubIcon size={16} />
              GitHub
            </a>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
              {[
                { label: 'Total', value: stats.total },
                { label: 'Final', value: stats.byStatus['Final'] || 0 },
                { label: 'Review', value: stats.byStatus['Review'] || 0 },
                { label: 'Draft', value: stats.byStatus['Draft'] || 0 },
              ].map((stat) => (
                <div key={stat.label} className="px-4 py-8 text-center sm:px-6">
                  <div className="text-3xl font-bold tabular-nums sm:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h2 className="text-2xl font-bold">Categories</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.title}
                href="/docs"
                className="group flex items-center gap-4 rounded-xl border border-border p-4 transition-all hover:border-border/80 hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground transition-colors group-hover:bg-muted/80">
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{cat.title}</span>
                    <span className="font-mono text-xs text-muted-foreground">{cat.range}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Proposals */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Recent proposals</h2>
              <Link href="/docs" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                View all &rarr;
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentLPs.map((lp) => {
                const lpNum = String(lp.data.frontmatter.lp || '0').padStart(4, '0');
                const status = (lp.data.frontmatter.status || 'Draft') as ProposalStatus;
                return (
                  <Link
                    key={lp.slug.join('/')}
                    href={`/docs/${lp.slug.join('/')}`}
                    className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-border/80 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-muted-foreground">LP-{lpNum}</span>
                      <StatusBadge status={status} />
                    </div>
                    <h3 className="mt-3 font-semibold leading-snug line-clamp-2 group-hover:text-muted-foreground">
                      {lp.data.title}
                    </h3>
                    {lp.data.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {lp.data.description}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="rounded-2xl bg-foreground p-8 text-background sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to contribute?</h2>
            <p className="mt-3 max-w-xl text-background/70">
              Have an idea for improving the Lux ecosystem? Start with the guidelines, then open a PR.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/contribute"
                className="rounded-full bg-background px-8 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:bg-background/90"
              >
                Read guidelines
              </Link>
              <a
                href="https://github.com/luxfi/lps"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-full border border-background/30 px-8 py-3 text-sm font-semibold transition-colors hover:bg-background/10"
              >
                <GitHubIcon size={16} />
                Open on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-5">
            <div className="col-span-2 sm:col-span-1">
              <Logo size={32} />
            </div>
            {Object.entries(footerLinks).map(([key, links]) => (
              <div key={key}>
                {links.map((link) => (
                  <a
                    key={link.title}
                    href={link.href}
                    target={link.header ? undefined : '_blank'}
                    rel={link.header ? undefined : 'noreferrer'}
                    className={`block text-sm ${
                      link.header
                        ? 'mb-3 font-semibold text-foreground'
                        : 'mb-2 text-muted-foreground transition-colors hover:text-foreground'
                    }`}
                  >
                    {link.title}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="https://lux.network/terms" target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">
                Terms
              </a>
              <a href="https://lux.network/privacy" target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">
                Privacy
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Lux Industries Inc.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
