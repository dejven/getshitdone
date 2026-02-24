'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Habit {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  xp_reward: number;
  frequency: string;
  category_id: string | null;
  category_name: string | null;
  is_active: number;
}

const ICONS = ['✅', '💪', '📚', '🧘', '🏃', '💊', '🥗', '💤', '🧹', '💻', '📝', '🎯', '🧠', '💧', '🎨', '🎵', '👥', '📱', '🌱', '⭐'];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('✅');
  const [categoryId, setCategoryId] = useState('');
  const [xpReward, setXpReward] = useState(10);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const [habitsRes, catsRes] = await Promise.all([
      fetch('/api/habits'),
      fetch('/api/categories'),
    ]);
    setHabits(await habitsRes.json());
    setCategories(await catsRes.json());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setIcon('✅');
    setCategoryId('');
    setXpReward(10);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (habit: Habit) => {
    setName(habit.name);
    setDescription(habit.description || '');
    setIcon(habit.icon);
    setCategoryId(habit.category_id || '');
    setXpReward(habit.xp_reward);
    setEditingId(habit.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      name,
      description: description || undefined,
      icon,
      category_id: categoryId || undefined,
      xp_reward: xpReward,
    };

    if (editingId) {
      await fetch(`/api/habits/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }

    resetForm();
    setSaving(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker? Alla completions och streaks för denna habit försvinner.')) return;
    await fetch(`/api/habits/${id}`, { method: 'DELETE' });
    loadData();
  };

  const toggleActive = async (habit: Habit) => {
    await fetch(`/api/habits/${habit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: habit.is_active ? 0 : 1 }),
    });
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xl text-muted animate-pulse">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">📋 Habits</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors text-lg"
        >
          + Ny habit
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-surface rounded-xl p-6 border border-border space-y-4">
          <h3 className="text-lg font-bold">{editingId ? 'Redigera habit' : 'Ny habit'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1">Namn</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="T.ex. Morgonpromenad"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted focus:outline-none focus:border-primary"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-1">Beskrivning (valfri)</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Kort beskrivning"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-2">Ikon</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(i => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all
                      ${icon === i ? 'bg-primary/20 border-2 border-primary scale-110' : 'bg-background border border-border hover:border-primary/50'}
                    `}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted mb-1">Kategori</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Ingen kategori</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted mb-1">XP belöning</label>
                <input
                  type="number"
                  value={xpReward}
                  onChange={e => setXpReward(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !name}
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Sparar...' : editingId ? 'Spara ändringar' : 'Skapa habit'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-surface-light hover:bg-border text-muted rounded-xl font-medium transition-colors"
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Habits list */}
      {habits.length === 0 && !showForm ? (
        <div className="bg-surface rounded-xl p-8 border border-border text-center">
          <p className="text-2xl mb-2">🎯</p>
          <p className="text-lg text-muted">Inga habits ännu. Klicka &quot;Ny habit&quot; för att börja!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map(habit => (
            <div
              key={habit.id}
              className={`
                flex items-center gap-4 bg-surface rounded-xl p-4 border border-border
                transition-all hover:border-primary/30
                ${!habit.is_active ? 'opacity-50' : ''}
              `}
            >
              <span className="text-2xl">{habit.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-lg">{habit.name}</div>
                <div className="text-sm text-muted">
                  {habit.category_name && <span className="mr-2">{habit.category_name}</span>}
                  <span className="text-primary">+{habit.xp_reward} XP</span>
                  {!habit.is_active && <span className="ml-2 text-danger">(pausad)</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(habit)}
                  className="px-3 py-2 text-sm bg-surface-light hover:bg-border rounded-lg transition-colors"
                  title={habit.is_active ? 'Pausa' : 'Aktivera'}
                >
                  {habit.is_active ? '⏸' : '▶'}
                </button>
                <button
                  onClick={() => startEdit(habit)}
                  className="px-3 py-2 text-sm bg-surface-light hover:bg-border rounded-lg transition-colors"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(habit.id)}
                  className="px-3 py-2 text-sm bg-surface-light hover:bg-danger/20 text-danger rounded-lg transition-colors"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
