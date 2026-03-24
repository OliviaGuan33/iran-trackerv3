import './globals.css';
import { Navbar } from '../components/navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '伊朗局势跟踪',
  description: '原油图谱、每日简报、海峡跟踪、实时更新'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Navbar />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
