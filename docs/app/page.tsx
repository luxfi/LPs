import React from 'react';
import Link from 'next/link';
import { Logo, LogoWithText } from '@/components/logo';
import { source, type LPCategory } from '@/lib/source';
import { ThemeToggle } from '@/components/theme-toggle';
import { SearchDialog } from '@/components/search-dialog';

type ProposalStatus = 'Final' | 'Draft' | 'Review' | 'Last Call' | 'Withdrawn' | 'Stagnant';

function StatusBadge({ status }: { status: ProposalStatus }) {
  const styles: Record<string, string> = {
    Final: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    Review: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
    'Last Call': 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    Draft: 'bg-muted/50 text-muted-foreground border-border',
    Withdrawn: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
    Stagnant: 'bg-muted/30 text-muted-foreground/70 border-border',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status] || styles.Draft}`}>
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

function SocialIcon({ icon, size = 14 }: { icon: string; size?: number }) {
  const icons: Record<string, React.ReactElement> = {
    warpcast: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.24 2.4H5.76C3.87 2.4 2.4 3.87 2.4 5.76v12.48c0 1.89 1.47 3.36 3.36 3.36h12.48c1.89 0 3.36-1.47 3.36-3.36V5.76c0-1.89-1.47-3.36-3.36-3.36zm-2.22 14.28h-1.44v-4.68L12 14.76l-2.58-2.76v4.68H7.98V7.32h1.44l2.58 2.76 2.58-2.76h1.44v9.36z"/>
      </svg>
    ),
    github: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    x: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    facebook: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    instagram: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    linkedin: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    youtube: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  };
  return icons[icon] || null;
}

// Category icons with consistent styling
function CategoryIcon({ icon, color }: { icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    green: 'text-green-600 dark:text-green-400 bg-green-500/10',
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-500/10',
    pink: 'text-pink-600 dark:text-pink-400 bg-pink-500/10',
    cyan: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
    violet: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
    rose: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
  };

  const icons: Record<string, React.ReactElement> = {
    layers: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    consensus: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/><circle cx="12" cy="4" r="2"/><circle cx="12" cy="20" r="2"/>
        <circle cx="4" cy="12" r="2"/><circle cx="20" cy="12" r="2"/>
        <path d="M12 7v2M12 15v2M7 12h2M15 12h2"/>
      </svg>
    ),
    lock: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
    ),
    token: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9"/><path d="M12 6v12M8 10h8M8 14h8"/>
      </svg>
    ),
    chart: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3v18h18"/><path d="M18 17l-5-5-4 4-3-3"/>
      </svg>
    ),
    vote: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12l2 2 4-4"/><rect x="3" y="3" width="18" height="18" rx="2"/>
      </svg>
    ),
    upgrade: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v6M12 22v-6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M22 12h-6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"/>
      </svg>
    ),
    research: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
      </svg>
    ),
    platform: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h18"/>
      </svg>
    ),
    contract: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
      </svg>
    ),
    exchange: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4"/>
      </svg>
    ),
  };

  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[color] || colorClasses.blue}`}>
      {icons[icon] || icons.layers}
    </div>
  );
}

const footerLinks = {
  ecosystem: {
    title: 'Ecosystem',
    links: [
      { title: 'Lux AI', href: 'https://lux.chat' },
      { title: 'Lux Credit', href: 'https://lux.credit' },
      { title: 'Lux Exchange', href: 'https://lux.exchange' },
      { title: 'Lux Finance', href: 'https://lux.finance' },
      { title: 'Lux Market', href: 'https://lux.market' },
      { title: 'Lux Shop', href: 'https://lux.shop' },
      { title: 'Lux Quest', href: 'https://lux.quest' },
    ],
  },
  network: {
    title: 'Network',
    links: [
      { title: 'Lux Bridge', href: 'https://bridge.lux.network' },
      { title: 'Lux Explorer', href: 'https://explore.lux.network' },
      { title: 'Lux Wallet', href: 'https://wallet.lux.network' },
      { title: 'Lux Safe', href: 'https://safe.lux.network' },
      { title: 'Lux Validator', href: 'https://lux.network/validator' },
      { title: 'Lux Coin', href: 'https://lux.network/coin' },
      { title: 'Governance', href: 'https://lux.vote' },
      { title: 'Open Source', href: 'https://github.com/luxfi' },
      { title: 'Documentation', href: 'https://docs.lux.network' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { title: 'About', href: 'https://lux.partners' },
      { title: 'Brand', href: 'https://drive.google.com/drive/folders/14OJtKLVakGY6883XO9yGbiHtlFxQUUm5' },
      { title: 'Careers', href: 'https://docs.google.com/document/d/1SCt0Hg7EIs06TootKCA1am1xo4mcXoKF/edit' },
      { title: 'Partnerships', href: 'https://apply.lux.partners' },
      { title: 'Press', href: 'mailto:ai@lux.partners?subject=Press' },
      { title: 'Help', href: 'mailto:ai@lux.partners?subject=Help' },
    ],
  },
  community: {
    title: 'Community',
    links: [
      { title: 'Lux Channel', href: 'https://warpcast.com/~/channel/lux', icon: 'warpcast' },
      { title: 'Discussions', href: 'https://github.com/orgs/luxfi/discussions', icon: 'github' },
      { title: '@luxdefi', href: 'https://twitter.com/luxdefi', icon: 'x' },
      { title: '@luxdefi', href: 'https://facebook.com/luxdefi', icon: 'facebook' },
      { title: '@luxdefi', href: 'https://instagram.com/luxdefi', icon: 'instagram' },
      { title: '@luxdefi', href: 'https://linkedin.com/company/luxdefi', icon: 'linkedin' },
      { title: '@luxdefi', href: 'https://youtube.com/@luxdefi', icon: 'youtube' },
    ],
  },
};

// Educational concept cards
const learningTopics = [
  {
    title: 'Post-Quantum Cryptography',
    description: 'Quantum-resistant cryptographic algorithms including ML-KEM and ML-DSA that provide long-term security against quantum computing threats.',
    icon: '🔐',
    color: 'blue',
  },
  {
    title: 'Zero-Knowledge Proofs',
    description: 'Privacy-preserving cryptographic protocols including zk-SNARKs and zk-STARKs for confidential transactions and verifiable computation.',
    icon: '🕵️',
    color: 'purple',
  },
  {
    title: 'Homomorphic Encryption',
    description: 'Advanced encryption techniques that enable computation on encrypted data, supporting privacy-preserving analytics and machine learning.',
    icon: '🔢',
    color: 'emerald',
  },
  {
    title: 'Hardware Acceleration',
    description: 'Optimized cryptographic operations leveraging GPU, FPGA, and ASIC technologies for high-performance blockchain applications.',
    icon: '⚡',
    color: 'amber',
  },
  {
    title: 'Threshold Signatures',
    description: 'Distributed cryptographic protocols that enhance security by eliminating single points of failure in key management.',
    icon: '🔑',
    color: 'green',
  },
  {
    title: 'Secure Multi-Party Computation',
    description: 'Collaborative computation frameworks that preserve data privacy while enabling advanced analytics and machine learning applications.',
    icon: '🤖',
    color: 'indigo',
  },
];

export default function HomePage() {
  const stats = source.getStats();
  const allCategories = source.getAllCategories();
  const allPages = source.getAllPages();

  // Get recent LPs sorted by created date
  const recentLPs = [...allPages]
    .filter(lp => lp.data.frontmatter.created)
    .sort((a, b) => {
      const dateA = new Date(a.data.frontmatter.created || '2000-01-01');
      const dateB = new Date(b.data.frontmatter.created || '2000-01-01');
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 6);

  // Get finalized standards
  const finalizedLPs = allPages
    .filter(lp => lp.data.frontmatter.status === 'Final')
    .slice(0, 4);

  // Category stats helper
  const getCategoryStats = (cat: LPCategory) => {
    const final = cat.lps.filter(lp => lp.data.frontmatter.status === 'Final').length;
    const draft = cat.lps.filter(lp => lp.data.frontmatter.status === 'Draft').length;
    return { final, draft, total: cat.lps.length };
  };

  // Group categories by type for balanced 6-category sections
  const foundationalCategories = allCategories.filter(c => ['Core Architecture', 'Consensus', 'Cryptography', 'Token Standards', 'DeFi', 'Governance'].includes(c.name));
  const advancedCategories = allCategories.filter(c => ['Network Upgrades', 'Research', 'P-Chain', 'C-Chain', 'X-Chain'].includes(c.name));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <LogoWithText size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <SearchDialog />
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
            Lux Network: A high-performance, quantum-resistant blockchain platform designed for the AI era. Explore advanced cryptography, privacy-preserving technologies, and decentralized infrastructure standards.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/docs"
              className="inline-flex w-full items-center justify-center rounded-full border border-border bg-foreground px-8 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 sm:w-auto"
            >
              Browse proposals
            </Link>
            <a
              href="https://github.com/luxfi/lps"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-muted/50 px-8 py-3 text-sm font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-muted sm:w-auto"
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
                { label: 'Total LPs', value: stats.total },
                { label: 'Finalized', value: stats.byStatus['Final'] || 0 },
                { label: 'In Review', value: (stats.byStatus['Review'] || 0) + (stats.byStatus['Last Call'] || 0) },
                { label: 'Categories', value: allCategories.length },
              ].map((stat) => (
                <div key={stat.label} className="px-4 py-8 text-center sm:px-6">
                  <div className="text-3xl font-bold tabular-nums sm:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Learning Topics */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Advanced Cryptography & Privacy Technologies</h2>
            <p className="mt-3 text-muted-foreground">Cutting-edge security innovations powering the quantum-safe, AI-ready blockchain</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {learningTopics.map((topic) => (
              <div
                key={topic.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="text-3xl">{topic.icon}</div>
                <h3 className="mt-4 font-semibold">{topic.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {topic.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Foundational Standards */}
        <section className="border-y border-border bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Foundational Standards</h2>
                <p className="mt-1 text-muted-foreground">Core blockchain infrastructure and protocols</p>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {foundationalCategories.map((cat) => {
                const catStats = getCategoryStats(cat);
                return (
                  <Link
                    key={cat.name}
                    href="/docs"
                    className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:border-border/80 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <CategoryIcon icon={cat.icon} color={cat.color} />
                      <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        {cat.range[0]}-{cat.range[1]}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{cat.name}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
                      {cat.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1">
                      {cat.keyTopics.slice(0, 3).map((topic) => (
                        <span key={topic} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {topic}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-3 border-t border-border pt-4 text-xs">
                      {catStats.total > 0 ? (
                        <>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                            {catStats.final} final
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/50"></span>
                            {catStats.draft} draft
                          </span>
                          <span className="ml-auto font-medium">{catStats.total} LPs</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground/60">Coming soon</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Advanced Technology */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Advanced Technology</h2>
              <p className="mt-1 text-muted-foreground">Quantum-resistant cryptography and multi-chain architecture</p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {advancedCategories.slice(0, 3).map((cat) => {
              const catStats = getCategoryStats(cat);
              return (
                <Link
                  key={cat.name}
                  href="/docs"
                  className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:border-border/80 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <CategoryIcon icon={cat.icon} color={cat.color} />
                    <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                      {cat.range[0]}-{cat.range[1]}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{cat.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
                    {cat.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {cat.keyTopics.slice(0, 3).map((topic) => (
                      <span key={topic} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {topic}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-3 border-t border-border pt-4 text-xs">
                    {catStats.total > 0 ? (
                      <>
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                          {catStats.final} final
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/50"></span>
                          {catStats.draft} draft
                        </span>
                        <span className="ml-auto font-medium">{catStats.total} LPs</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground/60">Coming soon</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Chain-Specific Categories */}
        <section className="border-y border-border bg-gradient-to-b from-muted/20 to-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Multi-Chain Architecture</h2>
                <p className="mt-1 text-muted-foreground">Specialized blockchain networks for diverse applications</p>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {advancedCategories.slice(3).map((cat) => {
                const catStats = getCategoryStats(cat);
                return (
                  <Link
                    key={cat.name}
                    href="/docs"
                    className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-border/80 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <CategoryIcon icon={cat.icon} color={cat.color} />
                      <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        {cat.range[0]}-{cat.range[1]}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{cat.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {cat.description}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground/80 italic">
                      {cat.learnMore}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1">
                      {cat.keyTopics.map((topic) => (
                        <span key={topic} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {topic}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-3 border-t border-border pt-4 text-xs">
                      {catStats.total > 0 ? (
                        <>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                            {catStats.final} final
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/50"></span>
                            {catStats.draft} draft
                          </span>
                          <span className="ml-auto font-medium">{catStats.total} LPs</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground/60">Coming soon</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Finalized Standards */}
        {finalizedLPs.length > 0 && (
          <section className="bg-emerald-500/5">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Finalized Standards</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Production-ready specifications</p>
                </div>
                <Link href="/docs" className="text-sm font-medium text-emerald-600 dark:text-emerald-400 transition-colors hover:text-emerald-500">
                  View all {stats.byStatus['Final'] || 0} &rarr;
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {finalizedLPs.map((lp) => {
                  const lpNum = String(lp.data.frontmatter.lp || '0').padStart(4, '0');
                  return (
                    <Link
                      key={lp.slug.join('/')}
                      href={`/docs/${lp.slug.join('/')}`}
                      className="group flex items-start gap-4 rounded-xl border border-emerald-500/20 bg-card p-5 transition-all hover:border-emerald-500/40 hover:shadow-sm"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12l2 2 4-4"/>
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">LP-{lpNum}</span>
                        </div>
                        <h3 className="mt-1 font-semibold leading-snug line-clamp-1 group-hover:text-muted-foreground">
                          {lp.data.title}
                        </h3>
                        {lp.data.description && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                            {lp.data.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Recent Proposals */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Recent proposals</h2>
                <p className="mt-1 text-sm text-muted-foreground">Latest additions to the repository</p>
              </div>
              <Link href="/docs" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                View all &rarr;
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentLPs.map((lp) => {
                const lpNum = String(lp.data.frontmatter.lp || '0').padStart(4, '0');
                const status = (lp.data.frontmatter.status || 'Draft') as ProposalStatus;
                const created = lp.data.frontmatter.created;
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
                    {created && (
                      <p className="mt-3 text-xs text-muted-foreground/70">
                        Created {created}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Type Distribution */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h2 className="text-2xl font-bold">Proposal Types</h2>
          <p className="mt-2 text-muted-foreground">Different types of proposals serve different purposes</p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="text-3xl font-bold">{stats.byType['Standards Track'] || 0}</div>
              <div className="mt-1 font-medium">Standards Track</div>
              <p className="mt-2 text-sm text-muted-foreground">Technical specifications that describe new features, protocols, or standards. Requires implementation and consensus.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="text-3xl font-bold">{stats.byType['Meta'] || 0}</div>
              <div className="mt-1 font-medium">Meta</div>
              <p className="mt-2 text-sm text-muted-foreground">Process proposals that describe governance, decision-making, or changes to how LPs work.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="text-3xl font-bold">{stats.byType['Informational'] || 0}</div>
              <div className="mt-1 font-medium">Informational</div>
              <p className="mt-2 text-sm text-muted-foreground">Educational content, guidelines, and best practices that don&apos;t require implementation.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="rounded-2xl bg-foreground p-8 text-background sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">Contribute to advanced blockchain standards</h2>
            <p className="mt-3 max-w-xl opacity-80">
              Help shape the future of high-performance, quantum-resistant blockchain technology. Explore our contribution guidelines and join the Lux Network ecosystem.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/docs"
                className="inline-flex items-center justify-center rounded-full bg-background px-8 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:bg-background/90"
              >
                Read guidelines
              </Link>
              <a
                href="https://github.com/luxfi/lps"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-background/30 px-8 py-3 text-sm font-semibold transition-colors hover:bg-background/10"
              >
                <GitHubIcon size={16} />
                Open on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-10 lg:flex-row lg:gap-8">
            <div className="shrink-0">
              <Logo size={40} />
            </div>
            <div className="grid flex-1 gap-x-8 gap-y-10" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {Object.entries(footerLinks).map(([key, section]) => (
                <div key={key}>
                  <span className="mb-4 block text-sm font-semibold text-foreground">
                    {section.title}
                  </span>
                  {section.links.map((link) => (
                    <a
                      key={link.title + link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mb-2 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {'icon' in link && link.icon && <SocialIcon icon={link.icon} />}
                      {link.title}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center gap-4 border-t border-border pt-8 text-center">
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a
                href="https://docs.google.com/document/d/1mvkjr1w8Rv8ttirs1mu-_2fw_PXclOyS/preview"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Terms and Conditions
              </a>
              <a
                href="https://docs.google.com/document/d/1vZjOKaNdOoThDIaVLERWxflQLtOsuvLn/preview"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Privacy Policy
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Copyright &copy; 2020 - {new Date().getFullYear()} Lux Industries Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
