import React from 'react';
import Link from 'next/link';
import {
  GitFork,
  MessageSquare,
  ArrowRight,
  Github,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Layers,
  Network,
  Lock,
  Coins,
  TrendingUp,
  Vote,
  Zap,
  FlaskConical,
  LayoutGrid,
  FileCode,
  ArrowLeftRight,
  Radio,
  CheckCircle
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { source, type LPCategory } from '@/lib/source';
import { HomeHeader } from '@/components/home-header';

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

function SocialIcon({ icon, size = 14 }: { icon: string; size?: number }) {
  const iconMap: Record<string, React.ReactElement> = {
    warpcast: <Radio size={size} />,
    github: <Github size={size} />,
    x: <Twitter size={size} />,
    facebook: <Facebook size={size} />,
    instagram: <Instagram size={size} />,
    linkedin: <Linkedin size={size} />,
    youtube: <Youtube size={size} />,
  };
  return iconMap[icon] || null;
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

  const iconMap: Record<string, React.ReactElement> = {
    layers: <Layers className="h-6 w-6" />,
    consensus: <Network className="h-6 w-6" />,
    lock: <Lock className="h-6 w-6" />,
    token: <Coins className="h-6 w-6" />,
    chart: <TrendingUp className="h-6 w-6" />,
    vote: <Vote className="h-6 w-6" />,
    upgrade: <Zap className="h-6 w-6" />,
    research: <FlaskConical className="h-6 w-6" />,
    platform: <LayoutGrid className="h-6 w-6" />,
    contract: <FileCode className="h-6 w-6" />,
    exchange: <ArrowLeftRight className="h-6 w-6" />,
  };

  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[color] || colorClasses.blue}`}>
      {iconMap[icon] || <Layers className="h-6 w-6" />}
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
      { title: 'Help', href: 'https://lux.help' },
    ],
  },
  community: {
    title: 'Community',
    links: [
      { title: 'Lux Channel', href: 'https://warpcast.com/~/channel/lux', icon: 'warpcast' },
      { title: 'LP Discussions', href: 'https://github.com/luxfi/lps/discussions', icon: 'github' },
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
    .slice(0, 6);

  // Category stats helper
  const getCategoryStats = (cat: LPCategory) => {
    const final = cat.lps.filter(lp => lp.data.frontmatter.status === 'Final').length;
    const draft = cat.lps.filter(lp => lp.data.frontmatter.status === 'Draft').length;
    return { final, draft, total: cat.lps.length };
  };

  // Group categories by type for balanced sections
  const foundationalCategories = allCategories.filter(c => ['Core Architecture', 'Consensus', 'Cryptography', 'Token Standards', 'DeFi', 'Governance'].includes(c.name));
  const advancedCategories = allCategories.filter(c => ['Network Upgrades', 'Research', 'Sustainability & ESG', 'Impact & Public Goods'].includes(c.name));
  const chainCategories = allCategories.filter(c => ['Platform Chain (P-Chain)', 'EVM & Smart Contracts', 'Virtual Machines & Subnets', 'Interoperability', 'Bridge Protocols', 'Threshold Cryptography (T-Chain)'].includes(c.name));
  const extendedCategories = allCategories.filter(c => ['Protocol Extensions', 'Advanced Protocols', 'Extended Specifications'].includes(c.name));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <HomeHeader />

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
          <div className="mt-10 flex items-center justify-center gap-3">
            <a
              href="https://github.com/luxfi/LPs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Github size={16} />
              GitHub
            </a>
            <Link
              href="/docs"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Browse proposals
              <ArrowRight className="size-4" />
            </Link>
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
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                      {cat.range ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                          {cat.range[0]}-{cat.range[1]}
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                          {cat.lps.length} LPs
                        </span>
                      )}
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
              <p className="mt-1 text-muted-foreground">Research, sustainability, and network evolution</p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {advancedCategories.map((cat) => {
              const catStats = getCategoryStats(cat);
              return (
                <Link
                  key={cat.name}
                  href="/docs"
                  className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:border-border/80 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <CategoryIcon icon={cat.icon} color={cat.color} />
                    {cat.range ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        {cat.range[0]}-{cat.range[1]}
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        {cat.lps.length} LPs
                      </span>
                    )}
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
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {chainCategories.map((cat) => {
                const catStats = getCategoryStats(cat);
                return (
                  <Link
                    key={cat.name}
                    href="/docs"
                    className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-border/80 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <CategoryIcon icon={cat.icon} color={cat.color} />
                      {cat.range ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                          {cat.range[0]}-{cat.range[1]}
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                          {cat.lps.length} LPs
                        </span>
                      )}
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

        {/* Extended Protocols */}
        {extendedCategories.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Extended Protocols</h2>
                <p className="mt-1 text-muted-foreground">Advanced and experimental specifications</p>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {extendedCategories.map((cat) => {
                const catStats = getCategoryStats(cat);
                return (
                  <Link
                    key={cat.name}
                    href="/docs"
                    className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:border-border/80 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <CategoryIcon icon={cat.icon} color={cat.color} />
                      {cat.range ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                          {cat.range[0]}-{cat.range[1]}
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                          {cat.lps.length} LPs
                        </span>
                      )}
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
        )}

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
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {finalizedLPs.map((lp) => {
                  const lpNum = String(lp.data.frontmatter.lp || '0').padStart(4, '0');
                  return (
                    <Link
                      key={lp.slug.join('/')}
                      href={`/docs/${lp.slug.join('/')}`}
                      className="group flex items-start gap-4 rounded-xl border border-emerald-500/20 bg-card p-5 transition-all hover:border-emerald-500/40 hover:shadow-sm"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-6 w-6" />
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
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/docs/lp-1"
                className="inline-flex h-10 items-center justify-center rounded-md bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-background/90"
              >
                LP-1 Contribution Guide
              </Link>
              <a
                href="https://github.com/luxfi/lps/fork"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-background/30 px-4 text-sm font-medium transition-colors hover:bg-background/10"
              >
                <GitFork className="h-4 w-4" />
                Fork &amp; Contribute
              </a>
              <a
                href="https://github.com/luxfi/lps/discussions"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-background/30 px-4 text-sm font-medium transition-colors hover:bg-background/10"
              >
                <MessageSquare className="h-4 w-4" />
                Discuss
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
              BSD-3-Clause &copy; 2020 - {new Date().getFullYear()} Lux Industries Inc.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
