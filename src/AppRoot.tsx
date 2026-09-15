import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { TaskProvider, useTask as useTaskFromContext } from '@/contexts/TaskContext';
import { AuthScreen } from '@/components/AuthScreen';
import { Sidebar, type Page } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { BottomNav } from '@/components/layout/BottomNav';
import { AIAssistant, FloatingAssistantButton } from '@/components/AIAssistant';
import { TaskForm } from '@/components/TaskForm';
import { Spinner } from '@/components/tf-ui';
import { Dashboard } from '@/pages/Dashboard';
import { TaskList } from '@/pages/TaskList';
import { MyDay } from '@/pages/MyDay';
import { Calendar } from '@/pages/Calendar';
import { Analytics } from '@/pages/Analytics';
import { Categories } from '@/pages/Categories';
import { Notifications } from '@/pages/Notifications';
import { Settings } from '@/pages/Settings';
import type { Task } from '@/types';
import { X } from 'lucide-react';

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Visão Geral',
  myday: 'Meu Dia',
  tasks: 'Tarefas',
  calendar: 'Calendário',
  analytics: 'Análises',
  categories: 'Categorias',
  notifications: 'Notificações',
  settings: 'Configurações',
};

function AppContent() {
  const { user, loading, passwordRecovery } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleNewTask = useCallback(() => {
    setEditingTask(null);
    setTaskFormOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setTaskFormOpen(true);
  }, []);

  const handleNavigate = useCallback((p: Page) => {
    setPage(p);
    setMobileSidebarOpen(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!user) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setAssistantOpen(true);
      }
      if (e.key === 'n' && !taskFormOpen && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleNewTask();
      }
      if (e.key === 'Escape') {
        setAssistantOpen(false);
        setTaskFormOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [user, taskFormOpen, handleNewTask]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-green-600" />
          <p className="text-sm text-zinc-400 dark:text-slate-400">Carregando TaskFlow...</p>
        </div>
      </div>
    );
  }

  if (!user || passwordRecovery) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex">
      {/* Desktop sidebar */}
      <Sidebar
        current={page}
        onNavigate={handleNavigate}
        onOpenAssistant={() => setAssistantOpen(true)}
        onNewTask={handleNewTask}
      />

      {/* Mobile sidebar drawer */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-[#0b0b0b] border-r border-slate-200 dark:border-[#2a2a2a] animate-slide-in-right overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-[#2a2a2a]">
              <span className="text-sm font-semibold text-zinc-100">Menu</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#242424]">
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>
            <MobileNav current={page} onNavigate={handleNavigate} onNewTask={handleNewTask} onOpenAssistant={() => { setAssistantOpen(true); setMobileSidebarOpen(false); }} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          title={PAGE_TITLES[page]}
          onMenu={() => setMobileSidebarOpen(true)}
          onNavigate={handleNavigate}
          onNewTask={handleNewTask}
        />

        <main className="flex-1 overflow-y-auto">
          {page === 'dashboard' && <Dashboard onNavigate={handleNavigate} onEditTask={handleEditTask} onNewTask={handleNewTask} onOpenAssistant={() => setAssistantOpen(true)} />}
          {page === 'myday' && <MyDay onEditTask={handleEditTask} onNewTask={handleNewTask} />}
          {page === 'tasks' && <TaskList onEditTask={handleEditTask} onNewTask={handleNewTask} />}
          {page === 'calendar' && <Calendar onEditTask={handleEditTask} onNewTask={handleNewTask} />}
          {page === 'analytics' && <Analytics />}
          {page === 'categories' && <Categories />}
          {page === 'notifications' && <Notifications />}
          {page === 'settings' && <Settings />}
        </main>
      </div>

      {/* Floating AI assistant button */}
      <FloatingAssistantButton onClick={() => setAssistantOpen(true)} />

      {/* AI Assistant panel */}
      <AIAssistant open={assistantOpen} onClose={() => setAssistantOpen(false)} />

      {/* Task form modal */}
      <TaskForm
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        editingTask={editingTask}
      />

      {/* Bottom navigation (mobile) */}
      <BottomNav current={page} onNavigate={handleNavigate} />
    </div>
  );
}

function MobileNav({ current, onNavigate, onNewTask, onOpenAssistant }: {
  current: Page;
  onNavigate: (p: Page) => void;
  onNewTask: () => void;
  onOpenAssistant: () => void;
}) {
  const { notifications } = useTaskFromContext();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const NAV_ITEMS: { id: Page; label: string }[] = [
    { id: 'dashboard', label: 'Visão Geral' },
    { id: 'myday', label: 'Meu Dia' },
    { id: 'tasks', label: 'Tarefas' },
    { id: 'calendar', label: 'Calendário' },
    { id: 'analytics', label: 'Análises' },
    { id: 'categories', label: 'Categorias' },
    { id: 'notifications', label: 'Notificações' },
    { id: 'settings', label: 'Configurações' },
  ];

  return (
    <div className="p-3 space-y-1">
      <button onClick={onNewTask} className="btn-primary w-full mb-2">
        + Nova Tarefa
      </button>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            current === item.id
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'text-zinc-300 hover:bg-[#242424]'
          }`}
        >
          <span>{item.label}</span>
          {item.id === 'notifications' && unreadCount > 0 && (
            <span className="badge bg-red-500 text-white text-[10px] px-1.5 py-0">{unreadCount}</span>
          )}
        </button>
      ))}
      <button onClick={onOpenAssistant} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-sm font-medium mt-2">
        Assistente IA
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <TaskProvider>
            <AppContent />
          </TaskProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
