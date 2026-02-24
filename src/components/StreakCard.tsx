'use client';

interface StreakCardProps {
  icon: string;
  name: string;
  current: number;
  longest: number;
}

export default function StreakCard({ icon, name, current, longest }: StreakCardProps) {
  const isHot = current >= 7;
  const isOnFire = current >= 30;

  return (
    <div className={`
      bg-surface rounded-xl p-4 border border-border
      transition-all hover:border-primary/50
      ${isOnFire ? 'border-orange-500/50 shadow-lg shadow-orange-500/10' : ''}
      ${isHot && !isOnFire ? 'border-amber-500/30' : ''}
    `}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{name}</div>
          <div className="text-sm text-muted">Bäst: {longest} dagar</div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${isOnFire ? 'fire-glow text-orange-400' : isHot ? 'text-amber-400' : 'text-primary-light'}`}>
            {current}
          </div>
          <div className="text-xs text-muted">
            {isOnFire ? '🔥🔥🔥' : isHot ? '🔥' : 'dagar'}
          </div>
        </div>
      </div>
    </div>
  );
}
