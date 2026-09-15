import { LayoutDashboard, Sun, ListTodo, CalendarDays, BarChart3 } from 'lucide-react';
import type { Page } from './Sidebar';

interface BottomNavProps {
  current: Page;
  onNavigate: (page: Page) => void;
}

const ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'myday', label: 'Meu Dia', icon: Sun },
  { id: 'tasks', label: 'Tarefas', icon: ListTodo },
  { id: 'calendar', label: 'Agenda', icon: CalendarDays },
  { id: 'analytics', label: 'Análises', icon: BarChart3 },
];

export function BottomNav({ current, onNavigate }: BottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass border-t border-slate-200 dark:border-[#2a2a2a] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                active ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
