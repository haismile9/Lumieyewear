'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userToken = useAppSelector((state) => state.auth.token);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      verifyEmail(tokenFromUrl);
    } else {
      setStatus('error');
      setMessage('Token xác thực không hợp lệ');
    }
  }, [searchParams]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch('http://127.0.0.1:5002/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Xác thực email thất bại');
      }

      setStatus('success');
      setMessage('Email của bạn đã được xác thực thành công!');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Không thể xác thực email');
    }
  };

  const handleResendVerification = async () => {
    // This would need a token from Redux state if user is logged in
    if (!userToken) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5002/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể gửi lại email');
      }

      setMessage('Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.');
    } catch (err: any) {
      setMessage(err.message || 'Không thể gửi lại email xác thực');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: '#1800ad' }}>
      <Card className="w-full max-w-md">
        {status === 'loading' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <CardTitle>Đang xác thực email...</CardTitle>
              <CardDescription>
                Vui lòng đợi trong giây lát
              </CardDescription>
            </CardHeader>
          </>
        )}

        {status === 'success' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Xác thực thành công!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Email của bạn đã được xác thực. Đang chuyển đến trang đăng nhập...
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full">
                <Link href="/login">Đăng nhập ngay</Link>
              </Button>
            </CardContent>
          </>
        )}

        {status === 'error' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Xác thực thất bại</CardTitle>
              <CardDescription>{message}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  Link xác thực có thể đã hết hạn hoặc không hợp lệ
                </AlertDescription>
              </Alert>
              <div className="flex flex-col gap-2">
                <Button onClick={handleResendVerification} variant="outline" className="w-full">
                  Gửi lại email xác thực
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/login">Quay lại đăng nhập</Link>
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#1800ad' }}>
        <div className="text-white">Đang tải...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
