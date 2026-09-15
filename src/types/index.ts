export type Priority = 'baixa' | 'media' | 'alta' | 'urgente';
export type TaskStatus = 'pendente' | 'concluida';
export type PlannedPeriod = 'manha' | 'tarde' | 'noite';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly';
export type NotificationType = 'prazo' | 'atrasada' | 'importante' | 'lembrete' | 'agendada';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: Priority;
  category_id: string | null;
  tags: string[] | null;
  estimated_time: number;
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
  notes: string | null;
  status: TaskStatus;
  planned_period: PlannedPeriod | null;
  sort_order: number;
  created_at: string;
  completed_at: string | null;
  subtasks?: Subtask[];
  category?: Category | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: NotificationType;
  read: boolean;
  task_id: string | null;
  created_at: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  priority: Priority;
  category_id?: string | null;
  tags?: string[];
  estimated_time?: number;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern | null;
  notes?: string | null;
  status?: TaskStatus;
  planned_period?: PlannedPeriod | null;
  sort_order?: number;
}

export interface SubtaskInput {
  title: string;
  completed?: boolean;
  sort_order?: number;
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; border: string; dot: string }> = {
  baixa: { bg: 'bg-slate-100 dark:bg-[#1c1c1c]', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-200 dark:border-[#303030]', dot: 'bg-slate-400' },
  media: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800', dot: 'bg-green-500' },
  alta: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  urgente: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  prazo: 'Prazo',
  atrasada: 'Atrasada',
  importante: 'Importante',
  lembrete: 'Lembrete',
  agendada: 'Agendada',
};

export const DEFAULT_CATEGORIES = [
  { name: 'Trabalho', color: '#22c55e', icon: 'Briefcase' },
  { name: 'Estudos', color: '#8b5cf6', icon: 'GraduationCap' },
  { name: 'Pessoal', color: '#10b981', icon: 'User' },
  { name: 'Projetos', color: '#f59e0b', icon: 'Rocket' },
  { name: 'Academia', color: '#ef4444', icon: 'Dumbbell' },
  { name: 'Finanças', color: '#14b8a6', icon: 'Wallet' },
];
