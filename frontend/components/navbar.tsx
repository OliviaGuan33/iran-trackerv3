'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: '原油图谱' },
  { href: '/briefing', label: '每日简报' },
  { href: '/tracking', label: '海峡跟踪' },
  { href: '/live', label: '实时更新' }
];

export function Navbar() {
  const pathname = usePathname();
  return (
    <header className="nav-shell">
      <div className="nav-inner">
        <div>
          <div className="nav-title">华泰固收｜伊朗局势跟踪</div>
          <div className="nav-subtitle">中文 · 实时刷新 · 行情联动</div>
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
