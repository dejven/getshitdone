'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Idag', icon: '⚡' },
  { href: '/habits', label: 'Habits', icon: '📋' },
  { href: '/settings', label: 'Inställningar', icon: '⚙️' },
];

export default function Sidebar({ stats }: { stats: { level: number; total_xp: number; xp_progress: number; xp_needed: number; xp_percentage: number } | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface rounded-lg border border-border"
      >
        <span className="text-xl">{mobileOpen ? '✕' : '☰'}</span>
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-surface border-r border-border
        flex flex-col
        transform transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold">
            <span className="text-primary">get</span>
            <span className="text-accent">shit</span>
            <span className="text-foreground">done</span>
          </h1>
          {stats && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted">Level {stats.level}</span>
                <span className="text-muted">{stats.xp_progress}/{stats.xp_needed} XP</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500 xp-glow"
                  style={{ width: `${stats.xp_percentage}%` }}
                />
              </div>
              <div className="text-xs text-muted mt-1">{stats.total_xp} total XP</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-all
                ${pathname === item.href
                  ? 'bg-primary/20 text-primary-light'
                  : 'text-muted hover:text-foreground hover:bg-surface-light'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted hover:text-foreground hover:bg-surface-light transition-all"
          >
            <span className="text-xl">🚪</span>
            Logga ut
          </button>
        </div>
      </aside>
    </>
  );
}
