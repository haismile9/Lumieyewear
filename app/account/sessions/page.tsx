'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Monitor, Smartphone, Tablet, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Session {
  id: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5002/api/auth/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setRevoking(sessionId);

    try {
      const response = await fetch(`http://127.0.0.1:5002/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }

      // Refresh sessions list
      await fetchSessions();
    } catch (error) {
      console.error('Error revoking session:', error);
      alert('Không thể hủy phiên đăng nhập');
    } finally {
      setRevoking(null);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return <Tablet className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const getBrowserName = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Phiên đăng nhập</h2>
        <p className="text-muted-foreground">
          Quản lý các thiết bị đã đăng nhập vào tài khoản của bạn
        </p>
      </div>

      <Alert>
        <AlertDescription>
          Nếu bạn nhận thấy phiên đăng nhập không quen thuộc, hãy hủy ngay và đổi mật khẩu
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(session.userAgent)}
                  <div>
                    <CardTitle className="text-base">
                      {getBrowserName(session.userAgent)}
                    </CardTitle>
                    <CardDescription>{session.ipAddress}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline">Đang hoạt động</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <p>Đăng nhập: {new Date(session.createdAt).toLocaleString('vi-VN')}</p>
                  <p>Hết hạn: {new Date(session.expiresAt).toLocaleString('vi-VN')}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => revokeSession(session.id)}
                  disabled={revoking === session.id}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {revoking === session.id ? 'Đang hủy...' : 'Hủy phiên'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {sessions.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Monitor className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Không có phiên đăng nhập nào</p>
              <p className="text-sm text-muted-foreground">
                Bạn chưa đăng nhập trên thiết bị nào
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
