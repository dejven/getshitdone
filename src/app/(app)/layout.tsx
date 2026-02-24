'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Stats {
  level: number;
  total_xp: number;
  xp_progress: number;
  xp_needed: number;
  xp_percentage: number;
  total_completions: number;
  longest_streak: number;
  freeze_tokens: number;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(data => {
        if (!data.setup) {
          router.replace('/setup');
        } else if (!data.authenticated) {
          router.replace('/login');
        } else {
          setReady(true);
          // Load stats
          fetch('/api/stats')
            .then(r => r.json())
            .then(setStats);
        }
      });
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold animate-pulse">
          <span className="text-primary">get</span>
          <span className="text-accent">shit</span>
          <span className="text-foreground">done</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar stats={stats} />
      <main className="flex-1 p-4 lg:p-8 lg:pl-8 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
