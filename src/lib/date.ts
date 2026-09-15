const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const MONTHS_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function formatDate(date: string | Date | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

export function formatDateShort(date: string | Date | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

export function formatWeekday(date: string | Date | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return WEEKDAYS[d.getDay()];
}

export function getWeekdayShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return WEEKDAYS_SHORT[d.getDay()];
}

export function getMonthName(month: number): string {
  return MONTHS[month];
}

export function getMonthShort(month: number): string {
  return MONTHS_SHORT[month];
}

export function getWeekdaysShort(): string[] {
  return WEEKDAYS_SHORT;
}

export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function isToday(date: string | null): boolean {
  if (!date) return false;
  return date === todayString();
}

export function isOverdue(task: { due_date: string | null; status: string }): boolean {
  if (!task.due_date || task.status === 'concluida') return false;
  return task.due_date < todayString();
}

export function isUpcoming(date: string | null, days = 7): boolean {
  if (!date) return false;
  const today = todayString();
  const future = new Date();
  future.setDate(future.getDate() + days);
  return date >= today && date <= future.toISOString().split('T')[0];
}

export function daysUntil(date: string | null): number {
  if (!date) return Infinity;
  const today = new Date(todayString() + 'T00:00:00');
  const target = new Date(date + 'T00:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function relativeDate(date: string | null): string {
  if (!date) return 'Sem prazo';
  const days = daysUntil(date);
  if (days < 0) return `${Math.abs(days)} ${Math.abs(days) === 1 ? 'dia atrasada' : 'dias atrasada'}`;
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  if (days <= 7) return `Em ${days} dias`;
  return formatDateShort(date);
}

export function formatTime(time: string | null): string {
  if (!time) return '';
  return time.substring(0, 5);
}

export function formatDuration(minutes: number): string {
  if (!minutes || minutes === 0) return '';
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= lastDay; i++) {
    days.push(new Date(year, month, i));
  }
  return days;
}

export function getFirstDayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

export function getWeekDays(date: Date): Date[] {
  const start = getFirstDayOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function dateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}
