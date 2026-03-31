'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [{ href: '/', label: '中观看板' }];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="nav-shell">
      <div className="nav-inner">
        <div>
          <div className="nav-title">ExceltoWeb</div>
          <div className="nav-subtitle">Excel 图表上网页，注册登录后通过受保护 API 提取数据</div>
        </div>
        <nav className="nav-links">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? 'nav-link active' : 'nav-link'}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
