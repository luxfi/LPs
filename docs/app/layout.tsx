import './global.css';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { SearchDialog } from '@/components/search-dialog';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Lux Proposals (LPs) - Quantum-Safe Blockchain Standards',
    template: '%s | Lux Proposals',
  },
  description: 'Lux Network: A high-performance, quantum-resistant blockchain platform designed for the AI era. Explore technical standards and improvement proposals for advanced decentralized infrastructure.',
  keywords: ['Lux', 'blockchain', 'quantum-resistant', 'AI', 'high-performance', 'post-quantum cryptography', 'privacy-preserving', 'LRC', 'tokens', 'web3', 'enterprise blockchain'],
  authors: [{ name: 'Lux Network' }],
  metadataBase: new URL('https://lps.lux.network'),
  openGraph: {
    title: 'Lux Proposals (LPs) - Quantum-Safe Blockchain Standards',
    description: 'Explore the technical foundations of Lux Network - a high-performance, quantum-resistant blockchain platform designed for the AI era.',
    type: 'website',
    siteName: 'Lux Proposals',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Lux Proposals - Quantum-Safe Blockchain Standards for the AI Era',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lux Proposals (LPs) - Quantum-Safe Blockchain Standards',
    description: 'Technical standards for Lux Network - a high-performance, quantum-resistant blockchain platform designed for the AI era.',
    images: ['/twitter.png'],
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <head>
        {/* Prevent flash of light mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('lux-lps-theme');
                if (stored === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-svh bg-background font-sans antialiased">
        <RootProvider
          search={{
            enabled: false,
          }}
          theme={{
            enabled: true,
            defaultTheme: 'dark',
            storageKey: 'lux-lps-theme',
          }}
        >
          <SearchDialog />
          <div className="relative flex min-h-svh flex-col bg-background">
            {children}
          </div>
        </RootProvider>
      </body>
    </html>
  );
}
