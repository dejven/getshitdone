'use client';

import { useState } from 'react';

interface HabitCheckButtonProps {
  habitId: string;
  completed: boolean;
  date: string;
  onToggle: (habitId: string, completed: boolean) => Promise<void>;
}

export default function HabitCheckButton({ habitId, completed, date, onToggle }: HabitCheckButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isChecked, setIsChecked] = useState(completed);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    const newState = !isChecked;
    setIsChecked(newState);

    if (newState) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);
    }

    try {
      await onToggle(habitId, newState);
    } catch {
      setIsChecked(!newState); // revert
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`
        w-14 h-14 rounded-xl flex items-center justify-center text-2xl
        transition-all duration-200 border-2
        ${isChecked
          ? 'bg-success/20 border-success text-success scale-105'
          : 'bg-surface border-border text-muted hover:border-primary hover:text-primary hover:scale-105'
        }
        ${isAnimating ? 'check-bounce' : ''}
        ${loading ? 'opacity-50' : ''}
        active:scale-95
      `}
      aria-label={isChecked ? 'Markera som ej klar' : 'Markera som klar'}
    >
      {isChecked ? '✓' : '○'}
    </button>
  );
}
