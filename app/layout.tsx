import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ReduxProvider } from '@/store/provider';
import { DebugGrid } from '@/components/debug-grid';
import { isDevelopment, API_BASE_URL } from '@/lib/constants';
import { getCollections } from '@/lib/api';
import { Header } from '../components/layout/header';
import dynamic from 'next/dynamic';
import { V0Provider } from '../lib/context';
import { cn } from '../lib/utils';

const V0Setup = dynamic(() => import('@/components/v0-setup'));

const isV0 = process.env['VERCEL_URL']?.includes('vusercontent.net') ?? false;

async function getCMSPages() {
  try {
    const response = await fetch(`${API_BASE_URL}/pages`, {
      next: { revalidate: 3600 },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.pages || data.data || []).filter((page: any) => page.status === 'PUBLISHED');
  } catch (error) {
    console.error('Error fetching CMS pages:', error);
    return [];
  }
}

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LUMI Store',
  description: 'LUMI Store, your one-stop shop for all your needs.',
    generator: 'v0.app'
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [collections, cmsPages] = await Promise.all([
    getCollections(),
    getCMSPages()
  ]);

  return (
    <html lang="en">
      <body
        className={cn(geistSans.variable, geistMono.variable, 'antialiased min-h-screen', { 'is-v0': isV0 })}
        suppressHydrationWarning
      >
        <V0Provider isV0={isV0}>
          <ReduxProvider>
            <NuqsAdapter>
              <main data-vaul-drawer-wrapper="true">
                <Header collections={collections} cmsPages={cmsPages} />
                {children}
              </main>
              {isDevelopment && <DebugGrid />}
              <Toaster closeButton position="bottom-right" />
            </NuqsAdapter>
          </ReduxProvider>
          {isV0 && <V0Setup />}
        </V0Provider>
      </body>
    </html>
  );
}

