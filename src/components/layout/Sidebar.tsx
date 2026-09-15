import { LayoutDashboard, ListTodo, CalendarDays, Sun, BarChart3, FolderKanban, Bell, Settings, Sparkles, CheckSquare } from 'lucide-react';
import { useTask } from '@/contexts/TaskContext';

export type Page = 'dashboard' | 'tasks' | 'myday' | 'calendar' | 'analytics' | 'categories' | 'notifications' | 'settings';

interface SidebarProps {
  current: Page;
  onNavigate: (page: Page) => void;
  onOpenAssistant: () => void;
  onNewTask: () => void;
}

const NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'myday', label: 'Meu Dia', icon: Sun },
  { id: 'tasks', label: 'Tarefas', icon: ListTodo },
  { id: 'calendar', label: 'Calendário', icon: CalendarDays },
  { id: 'analytics', label: 'Análises', icon: BarChart3 },
  { id: 'categories', label: 'Categorias', icon: FolderKanban },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export function Sidebar({ current, onNavigate, onOpenAssistant, onNewTask }: SidebarProps) {
  const { notifications } = useTask();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0b0b0b]">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-md">
          <CheckSquare className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">TaskFlow</h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">Gestão inteligente</p>
        </div>
      </div>

      {/* New Task Button */}
      <div className="px-4 pb-4">
        <button onClick={onNewTask} className="btn-primary w-full">
          <span className="text-lg leading-none">+</span> Nova Tarefa
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#242424]'
              }`}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'notifications' && unreadCount > 0 && (
                <span className="badge bg-red-500 text-white text-[10px] px-1.5 py-0">{unreadCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Assistant */}
      <div className="p-3">
        <button
          onClick={onOpenAssistant}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-sm font-medium hover:shadow-lg transition-all"
        >
          <Sparkles className="h-4.5 w-4.5" />
          Assistente IA
        </button>
      </div>
    </aside>
  );
}
