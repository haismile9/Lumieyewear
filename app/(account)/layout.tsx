import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tài khoản của tôi - LUMI Web',
  description: 'Quản lý tài khoản và đơn hàng của bạn',
};

export default function AccountRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

