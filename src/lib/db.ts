import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'getshitdone.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1',
      icon TEXT NOT NULL DEFAULT '📋',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
      name TEXT NOT NULL,
      description TEXT,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      frequency TEXT NOT NULL DEFAULT 'daily',
      target_count INTEGER NOT NULL DEFAULT 1,
      xp_reward INTEGER NOT NULL DEFAULT 10,
      icon TEXT NOT NULL DEFAULT '✅',
      color TEXT NOT NULL DEFAULT '#6366f1',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS completions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
      habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      date TEXT NOT NULL DEFAULT (date('now')),
      count INTEGER NOT NULL DEFAULT 1,
      note TEXT,
      source TEXT NOT NULL DEFAULT 'manual'
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_completions_habit_date
      ON completions(habit_id, date);

    CREATE TABLE IF NOT EXISTS streak_freezes (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
      habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_streak_freezes_habit_date
      ON streak_freezes(habit_id, date);

    CREATE TABLE IF NOT EXISTS webhook_keys (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_used_at TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
      habit_id TEXT REFERENCES habits(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'reminder',
      time TEXT NOT NULL DEFAULT '09:00',
      days TEXT NOT NULL DEFAULT '1,2,3,4,5,6,7',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      total_xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      total_completions INTEGER NOT NULL DEFAULT 0,
      freeze_tokens INTEGER NOT NULL DEFAULT 3
    );

    INSERT OR IGNORE INTO user_stats (id, total_xp, level, longest_streak, total_completions, freeze_tokens)
      VALUES (1, 0, 1, 0, 0, 3);
  `);

  // Seed default categories if none exist
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (categoryCount.count === 0) {
    const insert = db.prepare('INSERT INTO categories (id, name, color, icon, sort_order) VALUES (?, ?, ?, ?, ?)');
    insert.run('health', 'Hälsa', '#10b981', '💪', 1);
    insert.run('work', 'Jobb', '#6366f1', '💻', 2);
    insert.run('home', 'Hem', '#f59e0b', '🏠', 3);
    insert.run('mind', 'Mental hälsa', '#ec4899', '🧠', 4);
    insert.run('social', 'Socialt', '#8b5cf6', '👥', 5);
  }
}

// ---- Habit Helpers ----

export function getAllHabits(activeOnly = true) {
  const db = getDb();
  const where = activeOnly ? 'WHERE h.is_active = 1' : '';
  return db.prepare(`
    SELECT h.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM habits h
    LEFT JOIN categories c ON h.category_id = c.id
    ${where}
    ORDER BY c.sort_order, h.name
  `).all();
}

export function getHabitById(id: string) {
  const db = getDb();
  return db.prepare(`
    SELECT h.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM habits h
    LEFT JOIN categories c ON h.category_id = c.id
    WHERE h.id = ?
  `).get(id);
}

export function createHabit(data: {
  name: string;
  description?: string;
  category_id?: string;
  frequency?: string;
  target_count?: number;
  xp_reward?: number;
  icon?: string;
  color?: string;
}) {
  const db = getDb();
  const id = crypto.randomBytes(8).toString('hex');
  db.prepare(`
    INSERT INTO habits (id, name, description, category_id, frequency, target_count, xp_reward, icon, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name,
    data.description || null,
    data.category_id || null,
    data.frequency || 'daily',
    data.target_count || 1,
    data.xp_reward || 10,
    data.icon || '✅',
    data.color || '#6366f1'
  );
  return getHabitById(id);
}

export function updateHabit(id: string, data: Partial<{
  name: string;
  description: string;
  category_id: string;
  frequency: string;
  target_count: number;
  xp_reward: number;
  icon: string;
  color: string;
  is_active: number;
}>) {
  const db = getDb();
  const fields = Object.entries(data)
    .filter(([_, v]) => v !== undefined)
    .map(([k, _]) => `${k} = @${k}`);
  if (fields.length === 0) return getHabitById(id);

  fields.push("updated_at = datetime('now')");

  db.prepare(`UPDATE habits SET ${fields.join(', ')} WHERE id = @id`).run({ ...data, id });
  return getHabitById(id);
}

export function deleteHabit(id: string) {
  const db = getDb();
  db.prepare('DELETE FROM habits WHERE id = ?').run(id);
}

// ---- Completion Helpers ----

export function getCompletionsForDate(date: string) {
  const db = getDb();
  return db.prepare(`
    SELECT c.*, h.name as habit_name, h.icon as habit_icon, h.xp_reward
    FROM completions c
    JOIN habits h ON c.habit_id = h.id
    WHERE c.date = ?
  `).all(date);
}

export function completeHabit(habitId: string, date?: string, note?: string, source = 'manual') {
  const db = getDb();
  const targetDate = date || new Date().toISOString().split('T')[0];
  const id = crypto.randomBytes(8).toString('hex');

  // Check if already completed today
  const existing = db.prepare(
    'SELECT id, count FROM completions WHERE habit_id = ? AND date = ?'
  ).get(habitId, targetDate) as { id: string; count: number } | undefined;

  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(habitId) as {
    target_count: number;
    xp_reward: number;
  } | undefined;

  if (!habit) throw new Error('Habit not found');

  if (existing) {
    // Increment count
    db.prepare('UPDATE completions SET count = count + 1, note = COALESCE(?, note) WHERE id = ?')
      .run(note || null, existing.id);

    // Only award XP if reaching target
    if (existing.count + 1 === habit.target_count) {
      awardXp(habit.xp_reward);
    }
    return { ...existing, count: existing.count + 1, already_existed: true };
  }

  db.prepare(`
    INSERT INTO completions (id, habit_id, date, count, note, source)
    VALUES (?, ?, ?, 1, ?, ?)
  `).run(id, habitId, targetDate, note || null, source);

  // Award XP if target is 1
  if (habit.target_count === 1) {
    awardXp(habit.xp_reward);
  }

  return { id, habit_id: habitId, date: targetDate, count: 1, new: true };
}

export function uncompleteHabit(habitId: string, date?: string) {
  const db = getDb();
  const targetDate = date || new Date().toISOString().split('T')[0];

  const existing = db.prepare(
    'SELECT id, count FROM completions WHERE habit_id = ? AND date = ?'
  ).get(habitId, targetDate) as { id: string; count: number } | undefined;

  if (!existing) return null;

  const habit = db.prepare('SELECT xp_reward FROM habits WHERE id = ?').get(habitId) as { xp_reward: number };

  db.prepare('DELETE FROM completions WHERE id = ?').run(existing.id);

  // Remove XP
  const stats = db.prepare('SELECT total_xp FROM user_stats WHERE id = 1').get() as { total_xp: number };
  const newXp = Math.max(0, stats.total_xp - habit.xp_reward);
  db.prepare('UPDATE user_stats SET total_xp = ?, level = ? WHERE id = 1').run(newXp, calculateLevel(newXp));

  return { removed: true };
}

// ---- Streak Calculations ----

export function getStreakForHabit(habitId: string): { current: number; longest: number } {
  const db = getDb();
  const completions = db.prepare(`
    SELECT DISTINCT date FROM completions
    WHERE habit_id = ?
    ORDER BY date DESC
  `).all(habitId) as { date: string }[];

  const freezes = db.prepare(`
    SELECT date FROM streak_freezes WHERE habit_id = ?
  `).all(habitId) as { date: string }[];

  const freezeSet = new Set(freezes.map(f => f.date));
  const completionSet = new Set(completions.map(c => c.date));

  let current = 0;
  let longest = 0;
  let streak = 0;

  // Walk backwards from today
  const today = new Date();
  const checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];

    if (completionSet.has(dateStr) || freezeSet.has(dateStr)) {
      streak++;
      if (i <= current + 1) current = streak; // still in current streak
    } else {
      if (streak > longest) longest = streak;
      if (i === 0 || (i === 1 && !completionSet.has(today.toISOString().split('T')[0]))) {
        // Allow today to not be completed yet
      } else {
        break;
      }
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  if (streak > longest) longest = streak;

  return { current, longest };
}

export function getAllStreaks() {
  const db = getDb();
  const habits = db.prepare('SELECT id, name, icon FROM habits WHERE is_active = 1').all() as { id: string; name: string; icon: string }[];

  return habits.map(h => ({
    ...h,
    ...getStreakForHabit(h.id)
  }));
}

// ---- XP & Level System ----

function calculateLevel(xp: number): number {
  // Each level requires more XP: level N requires N*100 XP
  // Total XP for level N = N*(N-1)/2 * 100
  let level = 1;
  let xpNeeded = 0;
  while (xpNeeded + level * 100 <= xp) {
    xpNeeded += level * 100;
    level++;
  }
  return level;
}

export function getXpForNextLevel(level: number): number {
  return level * 100;
}

export function getTotalXpForLevel(level: number): number {
  return (level * (level - 1)) / 2 * 100;
}

function awardXp(amount: number) {
  const db = getDb();
  const stats = db.prepare('SELECT total_xp, total_completions FROM user_stats WHERE id = 1').get() as {
    total_xp: number;
    total_completions: number;
  };
  const newXp = stats.total_xp + amount;
  const newLevel = calculateLevel(newXp);
  db.prepare(`
    UPDATE user_stats SET
      total_xp = ?,
      level = ?,
      total_completions = total_completions + 1
    WHERE id = 1
  `).run(newXp, newLevel);
}

export function getUserStats() {
  const db = getDb();
  const stats = db.prepare('SELECT * FROM user_stats WHERE id = 1').get() as {
    total_xp: number;
    level: number;
    longest_streak: number;
    total_completions: number;
    freeze_tokens: number;
  };

  const xpForCurrentLevel = getTotalXpForLevel(stats.level);
  const xpForNextLevel = getXpForNextLevel(stats.level);
  const xpProgress = stats.total_xp - xpForCurrentLevel;

  return {
    ...stats,
    xp_progress: xpProgress,
    xp_needed: xpForNextLevel,
    xp_percentage: Math.round((xpProgress / xpForNextLevel) * 100)
  };
}

// ---- Contribution Grid ----

export function getContributionData(days = 365) {
  const db = getDb();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().split('T')[0];

  return db.prepare(`
    SELECT date, COUNT(DISTINCT habit_id) as count
    FROM completions
    WHERE date >= ?
    GROUP BY date
    ORDER BY date
  `).all(startStr) as { date: string; count: number }[];
}

// ---- Categories ----

export function getAllCategories() {
  const db = getDb();
  return db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
}

// ---- Webhook Keys ----

export function createWebhookKey(name: string): { key: string; id: string } {
  const db = getDb();
  const id = crypto.randomBytes(8).toString('hex');
  const key = `gsd_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const keyPrefix = key.substring(0, 8);

  db.prepare(`
    INSERT INTO webhook_keys (id, name, key_hash, key_prefix) VALUES (?, ?, ?, ?)
  `).run(id, name, keyHash, keyPrefix);

  return { key, id };
}

export function validateWebhookKey(key: string): boolean {
  const db = getDb();
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const result = db.prepare('SELECT id FROM webhook_keys WHERE key_hash = ?').get(keyHash) as { id: string } | undefined;

  if (result) {
    db.prepare("UPDATE webhook_keys SET last_used_at = datetime('now') WHERE id = ?").run(result.id);
    return true;
  }
  return false;
}

export function getAllWebhookKeys() {
  const db = getDb();
  return db.prepare('SELECT id, name, key_prefix, created_at, last_used_at FROM webhook_keys ORDER BY created_at DESC').all();
}

export function deleteWebhookKey(id: string) {
  const db = getDb();
  db.prepare('DELETE FROM webhook_keys WHERE id = ?').run(id);
}

// ---- Auth ----

export function getPassword(): string | null {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'password_hash'").get() as { value: string } | undefined;
  return row?.value || null;
}

export function setPassword(hash: string) {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('password_hash', ?)").run(hash);
}

export function isSetup(): boolean {
  return getPassword() !== null;
}

export function getJwtSecret(): string {
  const db = getDb();
  let row = db.prepare("SELECT value FROM settings WHERE key = 'jwt_secret'").get() as { value: string } | undefined;
  if (!row) {
    const secret = crypto.randomBytes(64).toString('hex');
    db.prepare("INSERT INTO settings (key, value) VALUES ('jwt_secret', ?)").run(secret);
    return secret;
  }
  return row.value;
}
