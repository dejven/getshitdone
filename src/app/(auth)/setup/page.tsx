'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Lösenorden matchar inte');
      return;
    }
    if (password.length < 4) {
      setError('Lösenordet måste vara minst 4 tecken');
      return;
    }

    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/');
    } else {
      const data = await res.json();
      setError(data.error || 'Något gick fel');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-primary">get</span>
            <span className="text-accent">shit</span>
            <span className="text-foreground">done</span>
          </h1>
          <p className="text-muted text-lg mb-1">Välkommen! 🎉</p>
          <p className="text-muted text-sm">Skapa ett lösenord för att komma igång</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Välj lösenord"
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder-muted focus:outline-none focus:border-primary text-lg"
            autoFocus
          />
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Bekräfta lösenord"
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder-muted focus:outline-none focus:border-primary text-lg"
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium text-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Skapar...' : 'Kom igång'}
          </button>
        </form>
      </div>
    </div>
  );
}
