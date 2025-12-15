import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Lux Proposals (LPs)',
    template: '%s | Lux Proposals',
  },
  description: 'Standards and improvement proposals for the Lux Network - community-driven governance for an open network.',
  keywords: ['Lux', 'blockchain', 'proposals', 'governance', 'standards', 'LRC', 'tokens'],
  authors: [{ name: 'Lux Network' }],
  metadataBase: new URL('https://lps.lux.network'),
  openGraph: {
    title: 'Lux Proposals (LPs)',
    description: 'Open, community-driven standards for the Lux Network ecosystem',
    type: 'website',
    siteName: 'Lux Proposals',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Lux Proposals - Open standards for Lux Network',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lux Proposals (LPs)',
    description: 'Open, community-driven standards for the Lux Network ecosystem',
    images: ['/twitter.png'],
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-svh bg-background font-sans antialiased">
        <RootProvider
          search={{
            enabled: true,
          }}
          theme={{
            enabled: true,
            defaultTheme: 'dark',
            storageKey: 'lux-lps-theme',
          }}
        >
          <div className="relative flex min-h-svh flex-col bg-background">
            {children}
          </div>
        </RootProvider>
      </body>
    </html>
  );
}
