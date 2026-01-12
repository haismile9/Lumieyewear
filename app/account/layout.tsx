'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  User, 
  ShoppingBag, 
  MapPin, 
  Heart, 
  Star, 
  Settings, 
  Monitor,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const accountLinks = [
  {
    title: 'Tổng quan',
    href: '/account',
    icon: User,
  },
  {
    title: 'Đơn hàng',
    href: '/account/orders',
    icon: ShoppingBag,
  },
  {
    title: 'Địa chỉ',
    href: '/account/addresses',
    icon: MapPin,
  },
  {
    title: 'Yêu thích',
    href: '/account/wishlist',
    icon: Heart,
  },
  {
    title: 'Đánh giá',
    href: '/account/reviews',
    icon: Star,
  },
  {
    title: 'Phiên đăng nhập',
    href: '/account/sessions',
    icon: Monitor,
  },
  {
    title: 'Cài đặt',
    href: '/account/settings',
    icon: Settings,
  },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        await fetch('http://127.0.0.1:5002/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Tài khoản của tôi</h1>
          <p className="text-muted-foreground">Quản lý thông tin và đơn hàng của bạn</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-2">
            <nav className="flex flex-col space-y-1 rounded-lg border bg-white p-2">
              {accountLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/account' && pathname.startsWith(link.href));
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.title}
                  </Link>
                );
              })}
              
              <div className="my-2 border-t" />
              
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Đăng xuất
              </Button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="rounded-lg border bg-white p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
