import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';

export default function NotFound() {
  return (
    <PageLayout>
      <div className="min-h-screen flex items-center justify-center px-4 -mt-16">
        <div className="text-center max-w-2xl mx-auto">
          <img 
            src="/LUMI404.svg" 
            alt="404 Not Found" 
            className="w-full max-w-lg mx-auto mb-8"
          />
          <p className="text-muted-foreground text-xl">
            Hãy quay lại{' '}
            <Link href="/" className="text-primary hover:underline font-medium">
              trang chủ
            </Link>{' '}
            để tiếp tục khám phá.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
