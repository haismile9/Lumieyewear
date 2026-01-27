'use client';

import MobileMenu from './mobile-menu';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LogoSvg } from './logo-svg';
import CartModal from '@/components/cart/modal';
import { NavItem } from '@/lib/types';
import { Collection } from '@/lib/api/types';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { persistor } from '@/store/store';
import { useState, useEffect } from 'react';

export const navItems: NavItem[] = [
  {
    label: 'home',
    href: '/',
  },
  {
    label: 'shop all',
    href: '/shop',
  },
  {
    label: 'order',
    href: '/order',
  },
];

interface HeaderProps {
  collections: Collection[];
  cmsPages?: any[];
}

export function Header({ collections, cmsPages = [] }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [showAboutMenu, setShowAboutMenu] = useState(false);

  const handleLogout = async () => {
    dispatch(logout());
    await persistor.purge(); // Clear persisted state
    router.push('/login');
  };

  return (
    <header className="grid fixed top-0 left-0 z-50 grid-cols-3 items-start w-full p-sides md:grid-cols-12 md:gap-sides">
      <div className="block flex-none md:hidden">
        <MobileMenu collections={collections} cmsPages={cmsPages} />
      </div>
      <Link href="/" className="md:col-span-3 xl:col-span-2" prefetch>
        <LogoSvg className="w-auto h-6 max-md:place-self-center md:w-full md:h-auto max-w-96" />
      </Link>
      <nav className="flex gap-2 justify-end items-center md:col-span-9 xl:col-span-10">
        <ul className="items-center gap-5 py-0.5 px-3 bg-background/10 rounded-sm backdrop-blur-md hidden md:flex">
          {navItems.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'font-semibold text-base transition-colors duration-200 uppercase',
                  pathname === item.href ? 'text-foreground' : 'text-foreground/50'
                )}
                prefetch
              >
                {item.label}
              </Link>
            </li>
          ))}
          {cmsPages.length > 0 && (
            <li 
              className="relative"
              onMouseEnter={() => setShowAboutMenu(true)}
              onMouseLeave={() => setShowAboutMenu(false)}
            >
              <button
                className={cn(
                  'font-semibold text-base transition-colors duration-200 uppercase flex items-center gap-1 py-2',
                  pathname.startsWith('/pages/') ? 'text-foreground' : 'text-foreground/50'
                )}
              >
                About
                <ChevronDown className="h-3 w-3" />
              </button>
              {showAboutMenu && (
                <div className="absolute top-full left-0 pt-2">
                  <div className="bg-background/95 backdrop-blur-md rounded-md shadow-lg py-2 min-w-[180px] z-50 border border-foreground/10">
                    {cmsPages.map((page: any) => (
                      <Link
                        key={page.id}
                        href={`/pages/${page.handle}`}
                        className={cn(
                          'block px-4 py-2 text-sm transition-colors',
                          pathname === `/pages/${page.handle}` 
                            ? 'text-foreground bg-foreground/5' 
                            : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5'
                        )}
                        prefetch
                      >
                        {page.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </li>
          )}
          {user && (
            <li>
              <Link
                href="/account"
                className={cn(
                  'font-semibold text-base transition-colors duration-200 uppercase flex items-center gap-1',
                  pathname.startsWith('/account') ? 'text-foreground' : 'text-foreground/50'
                )}
                prefetch
              >
                
                Account
              </Link>
            </li>
          )}
          {user && (
            <li>
              <button
                onClick={handleLogout}
                className="font-semibold text-base transition-colors duration-200 uppercase flex items-center gap-1 text-foreground/50 hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </li>
          )}
          {!user && (
            <li>
              <Link
                href="/login"
                className={cn(
                  'font-semibold text-base transition-colors duration-200 uppercase',
                  pathname === '/login' ? 'text-foreground' : 'text-foreground/50'
                )}
                prefetch
              >
                Login
              </Link>
            </li>
          )}
        </ul>
        <CartModal />
      </nav>
    </header>
  );
}

