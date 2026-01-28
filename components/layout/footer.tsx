import { LogoSvg } from './header/logo-svg';
import { ShopLinks } from './shop-links';
import { SidebarLinks } from './sidebar/product-sidebar-links';
import { getCollections } from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';
import Link from 'next/link';

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

export async function Footer() {
  const collections = await getCollections();
  const cmsPages = await getCMSPages();

  return (
    <footer className="p-sides">
      <div
        style={{ backgroundColor: '#1800ad' }}
        className="w-full md:h-[532px] p-sides md:p-11 text-white rounded-[12px] flex flex-col justify-between max-md:gap-8"
      >
        <div className="flex flex-col justify-between md:flex-row">
          <LogoSvg className="md:basis-3/4 max-md:w-full max-w-[1200px] h-auto block" />
          <ShopLinks collections={collections} className="max-md:hidden" align="right" />
          <span className="mt-3 italic font-semibold md:hidden">Refined. Minimal. Never boring.</span>
        </div>
        <div className="flex justify-between max-md:contents text-muted-foreground">
          <div className="flex flex-col md:flex-row gap-4 max-w-[450px] w-full">
            <SidebarLinks className="max-md:flex-col" size="base" invert />
            {cmsPages.length > 0 && (
              <div className="flex flex-row gap-2 md:ml-4">
                {cmsPages.slice(0, 3).map((page: any) => (
                  <Link
                    key={page.id}
                    href={`/pages/${page.handle}`}
                    className="text-sm 2xl:text-base leading-tight transition-colors hover:underline ease-out duration-200 whitespace-nowrap text-background/50 hover:text-background"
                  >
                    {page.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <p className="text-base">{new Date().getFullYear()}© — All rights reserved</p>
        </div>
      </div>
    </footer>
  );
}

