'use client';

import { useState, useEffect } from 'react';

interface WebhookKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<WebhookKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  const loadKeys = async () => {
    const res = await fetch('/api/webhooks/keys');
    setKeys(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    loadKeys();
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const createKey = async () => {
    if (!newKeyName) return;
    const res = await fetch('/api/webhooks/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName }),
    });
    const data = await res.json();
    setNewKey(data.key);
    setNewKeyName('');
    loadKeys();
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Ta bort denna API-nyckel?')) return;
    await fetch(`/api/webhooks/keys/${id}`, { method: 'DELETE' });
    loadKeys();
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8 pt-12 lg:pt-0">
      <h2 className="text-3xl font-bold">⚙️ Inställningar</h2>

      {/* Notifications */}
      <div className="bg-surface rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-xl font-bold">🔔 Notifikationer</h3>
        <p className="text-muted">Få påminnelser om dina habits direkt i webbläsaren.</p>

        {notifPermission === 'granted' ? (
          <div className="flex items-center gap-2 text-success">
            <span>✓</span>
            <span>Notifikationer aktiverade</span>
          </div>
        ) : notifPermission === 'denied' ? (
          <div className="text-danger text-sm">
            Notifikationer blockerade. Ändra i webbläsarens inställningar.
          </div>
        ) : (
          <button
            onClick={requestNotificationPermission}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors"
          >
            Aktivera notifikationer
          </button>
        )}
      </div>

      {/* Webhook Keys */}
      <div className="bg-surface rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-xl font-bold">🔑 Webhook API-nycklar</h3>
        <p className="text-muted">
          Skapa API-nycklar som din AI-assistent kan använda för att logga habits via webhooks.
        </p>

        {/* Create new key */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            placeholder="Namn (t.ex. 'Min AI-assistent')"
            className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted focus:outline-none focus:border-primary"
          />
          <button
            onClick={createKey}
            disabled={!newKeyName}
            className="px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            Skapa nyckel
          </button>
        </div>

        {/* Show newly created key */}
        {newKey && (
          <div className="bg-success/10 border border-success/30 rounded-xl p-4">
            <p className="text-sm text-success mb-2 font-medium">Ny API-nyckel skapad! Kopiera den nu - den visas bara en gång.</p>
            <div className="flex gap-2 items-center">
              <code className="flex-1 bg-background p-3 rounded-lg text-sm break-all font-mono">
                {newKey}
              </code>
              <button
                onClick={() => copyToClipboard(newKey)}
                className="px-3 py-2 bg-surface-light rounded-lg hover:bg-border transition-colors"
              >
                📋
              </button>
            </div>
          </div>
        )}

        {/* Existing keys */}
        {loading ? (
          <div className="text-muted animate-pulse">Laddar...</div>
        ) : keys.length === 0 ? (
          <p className="text-muted text-sm">Inga API-nycklar skapade ännu.</p>
        ) : (
          <div className="space-y-2">
            {keys.map(key => (
              <div key={key.id} className="flex items-center gap-4 bg-background rounded-lg p-3">
                <div className="flex-1">
                  <div className="font-medium">{key.name}</div>
                  <div className="text-sm text-muted">
                    <code>{key.key_prefix}...</code>
                    {key.last_used_at && (
                      <span className="ml-2">Senast använd: {new Date(key.last_used_at).toLocaleDateString('sv-SE')}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteKey(key.id)}
                  className="px-3 py-2 text-sm bg-surface-light hover:bg-danger/20 text-danger rounded-lg transition-colors"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhook API docs */}
      <div className="bg-surface rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-xl font-bold">📖 Webhook API</h3>
        <p className="text-muted">Använd dessa endpoints med din API-nyckel för att integrera med andra verktyg.</p>

        <div className="space-y-4">
          <div className="bg-background rounded-lg p-4">
            <div className="text-sm font-medium text-primary mb-2">Markera en habit som klar</div>
            <code className="text-sm block whitespace-pre text-muted">{`POST /api/webhooks/complete
Header: x-api-key: <din-nyckel>
Body: {
  "habit_name": "Morgonpromenad",
  "note": "30 min promenad",
  "date": "2025-01-15"  // valfri
}`}</code>
          </div>

          <div className="bg-background rounded-lg p-4">
            <div className="text-sm font-medium text-primary mb-2">Lista alla habits</div>
            <code className="text-sm block whitespace-pre text-muted">{`GET /api/webhooks/habits
Header: x-api-key: <din-nyckel>`}</code>
          </div>

          <div className="bg-background rounded-lg p-4">
            <div className="text-sm font-medium text-primary mb-2">Skapa en ny habit</div>
            <code className="text-sm block whitespace-pre text-muted">{`POST /api/webhooks/habits
Header: x-api-key: <din-nyckel>
Body: {
  "name": "Meditation",
  "icon": "🧘",
  "xp_reward": 15,
  "category_id": "mind"
}`}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
