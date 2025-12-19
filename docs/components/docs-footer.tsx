'use client';

import Link from 'next/link';
import { Logo } from './logo';

export function DocsFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs/?type=core" className="text-muted-foreground hover:text-foreground transition-colors">
                  Core Architecture
                </Link>
              </li>
              <li>
                <Link href="/docs/?type=consensus" className="text-muted-foreground hover:text-foreground transition-colors">
                  Consensus
                </Link>
              </li>
              <li>
                <Link href="/docs/?type=cryptography" className="text-muted-foreground hover:text-foreground transition-colors">
                  Cryptography
                </Link>
              </li>
              <li>
                <Link href="/docs/?type=tokens" className="text-muted-foreground hover:text-foreground transition-colors">
                  Token Standards
                </Link>
              </li>
              <li>
                <Link href="/docs/?type=defi" className="text-muted-foreground hover:text-foreground transition-colors">
                  DeFi
                </Link>
              </li>
              <li>
                <Link href="/docs/?type=governance" className="text-muted-foreground hover:text-foreground transition-colors">
                  Governance
                </Link>
              </li>
            </ul>
          </div>

          {/* Network Docs */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Network Docs</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  All Proposals
                </Link>
              </li>
              <li>
                <a href="https://docs.lux.network" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Developer Docs
                </a>
              </li>
              <li>
                <a href="https://lux.help" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="https://lux.forum" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Discussion Forum
                </a>
              </li>
              <li>
                <a href="https://github.com/luxfi/lps" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Ecosystem */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Ecosystem</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://lux.network" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Lux Network
                </a>
              </li>
              <li>
                <a href="https://bridge.lux.network" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Lux Bridge
                </a>
              </li>
              <li>
                <a href="https://explorer.lux.network" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Block Explorer
                </a>
              </li>
              <li>
                <a href="https://wallet.lux.network" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Lux Wallet
                </a>
              </li>
              <li>
                <a href="https://safe.lux.network" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Lux Safe
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://lux.partners" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Lux Partners
                </a>
              </li>
              <li>
                <a href="https://github.com/luxfi" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://x.com/luxdefi" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  X / Twitter
                </a>
              </li>
              <li>
                <a href="https://discord.gg/lux" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Logo size={20} />
            <span className="text-sm text-muted-foreground">
              &copy; {currentYear} Lux Network. Released under CC0.
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>199 Proposals</span>
            <span className="text-border">|</span>
            <span>45 Final</span>
            <span className="text-border">|</span>
            <a
              href="https://github.com/luxfi/lps/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Contribute
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
