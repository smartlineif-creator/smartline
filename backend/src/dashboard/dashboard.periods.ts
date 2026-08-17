export type DashboardPeriod = 'today' | '7d' | '30d' | 'all';
export type DashboardBucket = 'hour' | 'day' | 'week';

export interface WindowRange {
  gte?: Date;
  lt: Date;
}

export interface PeriodRange {
  bucket: DashboardBucket;
  current: WindowRange;
  previous: WindowRange | null;
}

export interface BucketSlot {
  label: string;
  start: Date;
  end: Date;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

export function resolvePeriod(period?: string): DashboardPeriod {
  return period === 'today' ||
    period === '7d' ||
    period === '30d' ||
    period === 'all'
    ? period
    : '7d';
}

export function getPeriodRange(
  period: DashboardPeriod,
  now: Date,
): PeriodRange {
  switch (period) {
    case 'today': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const prevStart = new Date(start.getTime() - DAY_MS);
      return {
        bucket: 'hour',
        current: { gte: start, lt: now },
        previous: { gte: prevStart, lt: start },
      };
    }
    case '30d': {
      const start = new Date(now.getTime() - 30 * DAY_MS);
      const prevStart = new Date(now.getTime() - 60 * DAY_MS);
      return {
        bucket: 'day',
        current: { gte: start, lt: now },
        previous: { gte: prevStart, lt: start },
      };
    }
    case 'all':
      return { bucket: 'week', current: { lt: now }, previous: null };
    case '7d':
    default: {
      const start = new Date(now.getTime() - 7 * DAY_MS);
      const prevStart = new Date(now.getTime() - 14 * DAY_MS);
      return {
        bucket: 'day',
        current: { gte: start, lt: now },
        previous: { gte: prevStart, lt: start },
      };
    }
  }
}

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  start.setDate(start.getDate() + diffToMonday);
  return start;
}

/** Builds the full bucket grid for a range so empty buckets can be filled with zeros. */
export function buildBucketSlots(
  bucket: DashboardBucket,
  range: WindowRange,
  earliest?: Date,
): BucketSlot[] {
  if (bucket === 'hour') {
    const start = range.gte ?? range.lt;
    const cursor = new Date(start);
    cursor.setMinutes(0, 0, 0);
    const slots: BucketSlot[] = [];
    while (cursor.getTime() <= range.lt.getTime()) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor.getTime() + HOUR_MS);
      slots.push({
        label: slotStart.toLocaleTimeString('uk-UA', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        start: slotStart,
        end: slotEnd,
      });
      cursor.setTime(cursor.getTime() + HOUR_MS);
    }
    return slots;
  }

  if (bucket === 'day') {
    const start = range.gte ?? range.lt;
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const slots: BucketSlot[] = [];
    while (cursor.getTime() <= range.lt.getTime()) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor.getTime() + DAY_MS);
      slots.push({
        label: slotStart.toLocaleDateString('uk-UA', {
          day: '2-digit',
          month: '2-digit',
        }),
        start: slotStart,
        end: slotEnd,
      });
      cursor.setTime(cursor.getTime() + DAY_MS);
    }
    return slots;
  }

  // week — no lower bound on the range itself, so the grid starts at the earliest order
  if (!earliest) return [];
  const cursor = startOfWeek(earliest);
  const slots: BucketSlot[] = [];
  while (cursor.getTime() <= range.lt.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + WEEK_MS);
    slots.push({
      label: `з ${slotStart.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })}`,
      start: slotStart,
      end: slotEnd,
    });
    cursor.setTime(cursor.getTime() + WEEK_MS);
  }
  return slots;
}

export function deltaPercent(value: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((value - previous) / previous) * 100);
}
