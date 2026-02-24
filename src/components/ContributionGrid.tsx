'use client';

interface ContributionData {
  date: string;
  count: number;
}

export default function ContributionGrid({ data }: { data: ContributionData[] }) {
  // Build a map of date -> count
  const countMap = new Map(data.map(d => [d.date, d.count]));

  // Generate last 365 days
  const today = new Date();
  const days: { date: string; count: number; dayOfWeek: number }[] = [];

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      count: countMap.get(dateStr) || 0,
      dayOfWeek: d.getDay(),
    });
  }

  // Group into weeks
  const weeks: typeof days[] = [];
  let currentWeek: typeof days = [];

  // Pad the first week
  if (days[0].dayOfWeek > 0) {
    for (let i = 0; i < days[0].dayOfWeek; i++) {
      currentWeek.push({ date: '', count: -1, dayOfWeek: i });
    }
  }

  for (const day of days) {
    if (day.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const maxCount = Math.max(...data.map(d => d.count), 1);

  function getLevel(count: number): number {
    if (count <= 0) return 0;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }

  const monthLabels: { label: string; col: number }[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
  let lastMonth = -1;
  let colIndex = 0;

  for (const week of weeks) {
    const firstReal = week.find(d => d.date);
    if (firstReal) {
      const month = new Date(firstReal.date).getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ label: months[month], col: colIndex });
        lastMonth = month;
      }
    }
    colIndex++;
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {/* Month labels */}
        <div className="flex mb-1 text-xs text-muted" style={{ paddingLeft: '20px' }}>
          {monthLabels.map((m, i) => (
            <span
              key={i}
              className="absolute text-xs"
              style={{ marginLeft: `${m.col * 14}px` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="flex gap-[2px] mt-5">
          {/* Day labels */}
          <div className="flex flex-col gap-[2px] text-xs text-muted mr-1" style={{ fontSize: '9px' }}>
            <span className="h-[10px]"></span>
            <span className="h-[10px] leading-[10px]">Mån</span>
            <span className="h-[10px]"></span>
            <span className="h-[10px] leading-[10px]">Ons</span>
            <span className="h-[10px]"></span>
            <span className="h-[10px] leading-[10px]">Fre</span>
            <span className="h-[10px]"></span>
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`w-[10px] h-[10px] rounded-[2px] contrib-${day.count >= 0 ? getLevel(day.count) : 0} ${day.count < 0 ? 'opacity-0' : ''}`}
                  title={day.date ? `${day.date}: ${day.count} habits` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
