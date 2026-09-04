import { format, parseISO, isValid, parse } from 'date-fns';

export function getTodayString(): string {
  const now = new Date();
  return format(now, 'yyyy-MM-dd');
}

export function formatDate(dateString: string, formatStr: string = 'EEE, MMM d, yyyy'): string {
  try {
    if (!dateString) return '';
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return dateString;
    }
    return format(date, formatStr);
  } catch {
    return dateString;
  }
}

export function formatTimeSlot(time: string): string {
  try {
    if (!time) return '';
    const parsed = parse(time, 'HH:mm', new Date());
    if (isValid(parsed)) {
      return format(parsed, 'hh:mm a');
    }
    return time;
  } catch {
    return time;
  }
}

export function formatDateTime(isoString: string): string {
  try {
    const date = parseISO(isoString);
    if (isValid(date)) {
      return format(date, 'MMM d, yyyy · hh:mm a');
    }
    return isoString;
  } catch {
    return isoString;
  }
}

export function getTimePeriod(time: string): 'Morning' | 'Afternoon' | 'Evening' {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

export function compareTimes(timeA: string, timeB: string): number {
  return timeA.localeCompare(timeB);
}

export function minutesToTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}
