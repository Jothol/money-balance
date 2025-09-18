// lib/period.ts
export type PeriodKind = 'day' | 'week' | 'month';

const pad2 = (n: number) => String(n).padStart(2, '0');

// ----- Day -----
export function toDayId(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseDayId(id: string): Date {
  const [y, m, d] = id.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function shiftDayId(id: string, deltaDays: number): string {
  const d = parseDayId(id);
  d.setDate(d.getDate() + deltaDays);
  return toDayId(d);
}

// ----- ISO Week -----
function isoWeekInfo(d: Date): { isoYear: number; isoWeek: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7; // 1..7 (Mon..Sun)
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { isoYear: date.getUTCFullYear(), isoWeek: weekNo };
}

export function toWeekId(d: Date): string {
  const { isoYear, isoWeek } = isoWeekInfo(d);
  return `${isoYear}-W${pad2(isoWeek)}`;
}

export function parseWeekId(id: string): Date {
  // returns the Monday of that ISO week (local time midnight)
  const m = id.match(/^(\d{4})-W(\d{2})$/);
  if (!m) return new Date();
  const year = Number(m[1]);
  const week = Number(m[2]);

  // ISO week 1 is the week with Jan 4th in it. Start from Jan 4 and back to Monday.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayNum = jan4.getUTCDay() || 7; // 1..7
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setUTCDate(jan4.getUTCDate() - (dayNum - 1));

  const monday = new Date(mondayOfWeek1);
  monday.setUTCDate(mondayOfWeek1.getUTCDate() + (week - 1) * 7);
  // convert to local midnight
  return new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate());
}

function shiftWeekId(id: string, deltaWeeks: number): string {
  const monday = parseWeekId(id);
  monday.setDate(monday.getDate() + deltaWeeks * 7);
  return toWeekId(monday);
}

// ----- Month -----
export function toMonthId(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export function parseMonthId(id: string): Date {
  const [y, m] = id.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, 1);
}

function shiftMonthId(id: string, deltaMonths: number): string {
  const d = parseMonthId(id);
  d.setMonth(d.getMonth() + deltaMonths);
  return toMonthId(d);
}

// ----- Current / Shift / Label -----
export function currentPeriodId(kind: PeriodKind): string {
  const now = new Date();
  if (kind === 'day') return toDayId(now);
  if (kind === 'week') return toWeekId(now);
  return toMonthId(now);
}

export function shiftPeriod(kind: PeriodKind, periodId: string, delta: number): string {
  if (kind === 'day') return shiftDayId(periodId, delta);
  if (kind === 'week') return shiftWeekId(periodId, delta);
  return shiftMonthId(periodId, delta);
}

export function labelPeriod(kind: PeriodKind, periodId: string): string {
  if (kind === 'day') {
    const d = parseDayId(periodId);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (kind === 'week') {
    // Show the Monday date as the label
    const start = parseWeekId(periodId);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const s = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const e = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${periodId} (${s} – ${e})`;
  }
  const d = parseMonthId(periodId);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}
