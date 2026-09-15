import { Menu, Moon, Sun, Bell, Search, Plus } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTask } from '@/contexts/TaskContext';
import type { Page } from './Sidebar';

interface TopBarProps {
  title: string;
  onMenu?: () => void;
  onNavigate: (page: Page) => void;
  onNewTask: () => void;
}

export function TopBar({ title, onMenu, onNavigate, onNewTask }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const { notifications } = useTask();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 glass border-b border-slate-200 dark:border-[#2a2a2a]">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center gap-3">
          <button onClick={onMenu} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#242424] transition-colors">
            <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onNewTask}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#242424] transition-colors"
          >
            <Plus className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={() => onNavigate('notifications')}
            className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#242424] transition-colors"
          >
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#242424] transition-colors">
            {theme === 'light' ? <Moon className="h-5 w-5 text-slate-600" /> : <Sun className="h-5 w-5 text-slate-300" />}
          </button>
        </div>
      </div>
    </header>
  );
}
