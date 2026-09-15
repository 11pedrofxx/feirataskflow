import { useMemo } from 'react';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Sun, ArrowRight, Sparkles, Calendar } from 'lucide-react';
import { useTask } from '@/contexts/TaskContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, greeting, todayString, isOverdue, relativeDate } from '@/lib/date';
import { TaskCard } from '@/components/TaskCard';
import { ProductivityChart } from '@/components/ProductivityChart';
import { ProgressBar } from '@/components/tf-ui';
import { PriorityBadge } from '@/components/tf-ui/Badge';
import { suggestTaskOrder } from '@/lib/ai';
import type { Page } from '@/components/layout/Sidebar';
import type { Task } from '@/types';

interface DashboardProps {
  onNavigate: (page: Page) => void;
  onEditTask: (task: Task) => void;
  onNewTask: () => void;
  onOpenAssistant: () => void;
}

export function Dashboard({ onNavigate, onEditTask, onNewTask, onOpenAssistant }: DashboardProps) {
  const { tasks } = useTask();
  const { user } = useAuth();
  const today = todayString();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'concluida').length;
    const pending = tasks.filter((t) => t.status === 'pendente').length;
    const overdue = tasks.filter((t) => isOverdue(t)).length;
    const todayTasks = tasks.filter((t) => t.due_date === today && t.status === 'pendente');
    const highPriority = tasks.filter((t) => (t.priority === 'alta' || t.priority === 'urgente') && t.status === 'pendente');
    const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, overdue, todayTasks, highPriority, productivity };
  }, [tasks, today]);

  const recentActivity = useMemo(() => {
    return [...tasks]
      .sort((a, b) => (b.completed_at ?? b.created_at).localeCompare(a.completed_at ?? a.created_at))
      .slice(0, 5);
  }, [tasks]);

  const insights = useMemo(() => {
    const result: { icon: typeof TrendingUp; text: string; color: string }[] = [];
    if (stats.overdue > 0) {
      result.push({ icon: AlertTriangle, text: `Você tem ${stats.overdue} tarefa(s) atrasada(s). Priorize concluí-las hoje.`, color: 'text-red-600 dark:text-red-400' });
    }
    if (stats.todayTasks.length > 0) {
      result.push({ icon: Sun, text: `${stats.todayTasks.length} tarefa(s) para hoje. Mantenha o foco!`, color: 'text-green-600 dark:text-green-400' });
    }
    if (stats.productivity >= 70) {
      result.push({ icon: TrendingUp, text: `Excelente! Sua produtividade está em ${stats.productivity}%.`, color: 'text-emerald-600 dark:text-emerald-400' });
    } else if (stats.total > 0) {
      result.push({ icon: TrendingUp, text: `Sua produtividade está em ${stats.productivity}%. Continue!`, color: 'text-amber-600 dark:text-amber-400' });
    }
    if (stats.highPriority.length > 2) {
      result.push({ icon: Sparkles, text: `Você tem ${stats.highPriority.length} tarefas de alta prioridade. Considere usar o assistente IA para organizar.`, color: 'text-emerald-600 dark:text-emerald-400' });
    }
    return result;
  }, [stats]);

  const suggestedOrder = useMemo(() => suggestTaskOrder(tasks).slice(0, 4), [tasks]);
  const userName = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'usuário';

  const statCards = [
    { label: 'Total', value: stats.total, icon: Calendar, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-[#1c1c1c]' },
    { label: 'Concluídas', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Atrasadas', value: stats.overdue, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {greeting()}, {userName}!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 capitalize">{formatDate(today)}</p>
        </div>
        <button onClick={onNewTask} className="btn-primary self-start sm:self-auto">
          <span className="text-lg leading-none">+</span> Nova Tarefa
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-4 lg:p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <ProductivityChart />
        </div>
        <div className="card p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Produtividade</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Taxa de conclusão geral</p>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10" className="stroke-slate-200 dark:stroke-[#303030]" />
                <circle
                  cx="60" cy="60" r="50" fill="none" strokeWidth="10"
                  className="stroke-green-600 transition-all duration-700"
                  strokeLinecap="round"
                  strokeDasharray={`${(stats.productivity / 100) * 314} 314`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.productivity}%</span>
              </div>
            </div>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              {stats.completed} de {stats.total} tarefas concluídas
            </p>
          </div>
        </div>
      </div>

      {/* Today's tasks + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Today's tasks */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tarefas para hoje</h3>
            <button onClick={() => onNavigate('tasks')} className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {stats.todayTasks.length === 0 ? (
            <div className="card p-8 text-center">
              <Sun className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma tarefa para hoje. Aproveite o dia!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.todayTasks.slice(0, 4).map((task) => (
                <TaskCard key={task.id} task={task} onEdit={onEditTask} compact />
              ))}
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Insights de produtividade</h3>
          {insights.length === 0 ? (
            <div className="card p-6 text-center">
              <Sparkles className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Adicione tarefas para receber insights personalizados.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {insights.map((insight, i) => {
                const Icon = insight.icon;
                return (
                  <div key={i} className="card p-3 flex items-start gap-3 animate-fade-in">
                    <div className="shrink-0 mt-0.5">
                      <Icon className={`h-4 w-4 ${insight.color}`} />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{insight.text}</p>
                  </div>
                );
              })}
            </div>
          )}
          <button
            onClick={onOpenAssistant}
            className="w-full card p-3 flex items-center gap-3 hover:border-green-300 dark:hover:border-green-700 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Pedir ajuda ao assistente</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Organize seu dia com IA</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-green-500 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* Upcoming + High Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Próximas tarefas</h3>
          {suggestedOrder.length === 0 ? (
            <div className="card p-6 text-center">
              <Calendar className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma tarefa pendente.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {suggestedOrder.map((task) => (
                <div key={task.id} className="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onEditTask(task)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <PriorityBadge priority={task.priority} />
                      <span className="text-xs text-slate-400 dark:text-slate-500">{relativeDate(task.due_date)}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Atividades recentes</h3>
          {recentActivity.length === 0 ? (
            <div className="card p-6 text-center">
              <Clock className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Sem atividade recente.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((task) => (
                <div key={task.id} className="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onEditTask(task)}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${task.status === 'concluida' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-[#1c1c1c]'}`}>
                    {task.status === 'concluida' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Clock className="h-4 w-4 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === 'concluida' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-slate-100'}`}>{task.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {task.status === 'concluida' ? 'Concluída' : 'Criada'} • {relativeDate(task.due_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
