import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.className} dark`} suppressHydrationWarning>
      <body className="bg-black text-white">
        <RootProvider
          theme={{
            enabled: true,
            defaultTheme: 'dark',
            storageKey: 'lux-lps-theme',
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
