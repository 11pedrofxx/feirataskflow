import type { ReactNode } from 'react';
import { PRIORITY_COLORS, type Priority } from '@/types';

export function PriorityBadge({ priority }: { priority: Priority }) {
  const c = PRIORITY_COLORS[priority];
  const labels: Record<Priority, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente' };
  return (
    <span className={`badge ${c.bg} ${c.text} ${c.border} border`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {labels[priority]}
    </span>
  );
}

export function Badge({ children, color = 'slate' }: { children: ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 dark:bg-[#1c1c1c] text-slate-600 dark:text-slate-300',
    green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    purple: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    teal: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
  };
  return <span className={`badge ${colors[color] ?? colors.slate}`}>{children}</span>;
}
