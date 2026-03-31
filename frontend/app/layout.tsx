import './globals.css';
import { Navbar } from '../components/navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ExceltoWeb',
  description: 'ExceltoWeb：把 Excel 图表展示到网页端，并提供注册登录和受保护 API。',
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
