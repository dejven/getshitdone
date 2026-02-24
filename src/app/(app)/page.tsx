'use client';

import { useState, useEffect, useCallback } from 'react';
import HabitCheckButton from '@/components/HabitCheckButton';
import StreakCard from '@/components/StreakCard';
import ContributionGrid from '@/components/ContributionGrid';
import Confetti from '@/components/Confetti';

interface Habit {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  xp_reward: number;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
}

interface Completion {
  habit_id: string;
}

interface Streak {
  id: string;
  name: string;
  icon: string;
  current: number;
  longest: number;
}

interface ContribData {
  date: string;
  count: number;
}

interface Stats {
  level: number;
  total_xp: number;
  xp_progress: number;
  xp_needed: number;
  xp_percentage: number;
  total_completions: number;
}

export default function TodayPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [contributions, setContributions] = useState<ContribData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    try {
      const [habitsRes, completionsRes, streaksRes, contribRes, statsRes] = await Promise.all([
        fetch('/api/habits'),
        fetch(`/api/completions?date=${today}`),
        fetch('/api/streaks'),
        fetch('/api/contributions'),
        fetch('/api/stats'),
      ]);
      setHabits(await habitsRes.json());
      setCompletions(await completionsRes.json());
      setStreaks(await streaksRes.json());
      setContributions(await contribRes.json());
      setStats(await statsRes.json());
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completedSet = new Set(completions.map(c => c.habit_id));
  const completedCount = habits.filter(h => completedSet.has(h.id)).length;
  const allDone = habits.length > 0 && completedCount === habits.length;

  const handleToggle = async (habitId: string, completed: boolean) => {
    if (completed) {
      await fetch('/api/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: habitId, date: today }),
      });
      setConfettiTrigger(t => t + 1);
    } else {
      await fetch(`/api/completions/${habitId}?date=${today}`, {
        method: 'DELETE',
      });
    }
    // Reload everything for fresh stats
    loadData();
  };

  // Group habits by category
  const grouped = habits.reduce<Record<string, Habit[]>>((acc, h) => {
    const key = h.category_name || 'Övrigt';
    if (!acc[key]) acc[key] = [];
    acc[key].push(h);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xl text-muted animate-pulse">Laddar...</div>
      </div>
    );
  }

  const weekday = new Date().toLocaleDateString('sv-SE', { weekday: 'long' });
  const dateStr = new Date().toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });

  return (
    <div className="space-y-8 pt-12 lg:pt-0">
      <Confetti trigger={confettiTrigger} />

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold capitalize">{weekday}</h2>
        <p className="text-muted text-lg">{dateStr}</p>
      </div>

      {/* Progress bar for today */}
      {habits.length > 0 && (
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-medium">
              {allDone ? '🎉 Alla habits klara!' : `${completedCount}/${habits.length} klara idag`}
            </span>
            {stats && (
              <span className="text-sm text-muted">
                Level {stats.level} &middot; {stats.total_xp} XP
              </span>
            )}
          </div>
          <div className="h-3 bg-background rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                allDone
                  ? 'bg-gradient-to-r from-success to-emerald-400 xp-glow'
                  : 'bg-gradient-to-r from-primary to-primary-light'
              }`}
              style={{ width: `${(completedCount / habits.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Today's habits */}
      {habits.length === 0 ? (
        <div className="bg-surface rounded-xl p-8 border border-border text-center">
          <p className="text-2xl mb-2">🚀</p>
          <p className="text-lg text-muted">Inga habits ännu!</p>
          <a href="/habits" className="text-primary hover:text-primary-light mt-2 inline-block">
            Lägg till din första habit →
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, categoryHabits]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">{category}</h3>
              <div className="space-y-2">
                {categoryHabits.map(habit => (
                  <div
                    key={habit.id}
                    className={`
                      flex items-center gap-4 bg-surface rounded-xl p-4 border border-border
                      transition-all hover:border-primary/30
                      ${completedSet.has(habit.id) ? 'opacity-75' : ''}
                    `}
                  >
                    <HabitCheckButton
                      habitId={habit.id}
                      completed={completedSet.has(habit.id)}
                      date={today}
                      onToggle={handleToggle}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-lg font-medium ${completedSet.has(habit.id) ? 'line-through text-muted' : ''}`}>
                        <span className="mr-2">{habit.icon}</span>
                        {habit.name}
                      </div>
                      {habit.description && (
                        <div className="text-sm text-muted truncate">{habit.description}</div>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <span className="text-primary font-medium">+{habit.xp_reward} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Streaks */}
      {streaks.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">🔥 Streaks</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {streaks
              .sort((a, b) => b.current - a.current)
              .map(s => (
                <StreakCard key={s.id} {...s} />
              ))}
          </div>
        </div>
      )}

      {/* Contribution grid */}
      <div>
        <h3 className="text-xl font-bold mb-4">📊 Aktivitet</h3>
        <div className="bg-surface rounded-xl p-5 border border-border">
          <ContributionGrid data={contributions} />
        </div>
      </div>
    </div>
  );
}
