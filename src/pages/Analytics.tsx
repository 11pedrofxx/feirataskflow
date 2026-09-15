import { useMemo } from 'react';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Calendar, Award, BarChart3 } from 'lucide-react';
import { useTask } from '@/contexts/TaskContext';
import { ProgressBar } from '@/components/tf-ui';
import { getWeekdaysShort, isOverdue } from '@/lib/date';
import type { Priority } from '@/types';

export function Analytics() {
  const { tasks, categories } = useTask();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'concluida');
    const created = tasks;
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;
    const overdue = tasks.filter((t) => isOverdue(t));
    const overdueRate = total > 0 ? Math.round((overdue.length / total) * 100) : 0;

    const completionTimes = completed
      .filter((t) => t.completed_at)
      .map((t) => {
        const created = new Date(t.created_at).getTime();
        const done = new Date(t.completed_at!).getTime();
        return Math.max(0, (done - created) / (1000 * 60));
      });
    const avgCompletionTime = completionTimes.length > 0
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0;

    const dayCount = new Array(7).fill(0);
    completed.forEach((t) => {
      if (t.completed_at) {
        const day = new Date(t.completed_at).getDay();
        dayCount[day]++;
      }
    });
    const mostProductiveDay = dayCount.indexOf(Math.max(...dayCount));

    const hourCount = new Array(24).fill(0);
    completed.forEach((t) => {
      if (t.completed_at) {
        const hour = new Date(t.completed_at).getHours();
        hourCount[hour]++;
      }
    });
    const mostProductiveHour = hourCount.indexOf(Math.max(...hourCount));

    const byPriority: Record<Priority, { total: number; completed: number }> = {
      baixa: { total: 0, completed: 0 },
      media: { total: 0, completed: 0 },
      alta: { total: 0, completed: 0 },
      urgente: { total: 0, completed: 0 },
    };
    tasks.forEach((t) => {
      byPriority[t.priority].total++;
      if (t.status === 'concluida') byPriority[t.priority].completed++;
    });

    const byCategory = categories.map((cat) => {
      const catTasks = tasks.filter((t) => t.category_id === cat.id);
      return {
        name: cat.name,
        color: cat.color,
        total: catTasks.length,
        completed: catTasks.filter((t) => t.status === 'concluida').length,
      };
    }).filter((c) => c.total > 0);

    return {
      total, completed: completed.length, completionRate, overdue: overdue.length, overdueRate,
      avgCompletionTime, mostProductiveDay, mostProductiveHour, byPriority, byCategory,
      dayCount, hourCount,
    };
  }, [tasks, categories]);

  const statCards = [
    { label: 'Tarefas Concluídas', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Tarefas Criadas', value: stats.total, icon: Calendar, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Taxa de Conclusão', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Tarefas Atrasadas', value: stats.overdue, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  ];

  const weekdays = getWeekdaysShort();
  const maxDayCount = Math.max(...stats.dayCount, 1);

  const peakHours = useMemo(() => {
    const hours = [];
    for (let h = 6; h <= 22; h++) {
      hours.push({ hour: h, count: stats.hourCount[h] });
    }
    return hours;
  }, [stats.hourCount]);
  const maxHourCount = Math.max(...peakHours.map((h) => h.count), 1);

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto pb-24 lg:pb-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Análises de Produtividade</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-4 lg:p-5">
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

      {/* Most productive day + hour */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Dia mais produtivo</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white capitalize">{weekdays[stats.mostProductiveDay]}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Horário mais produtivo</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {stats.mostProductiveHour === 0 && stats.dayCount[stats.mostProductiveDay] === 0 ? '—' : `${String(stats.mostProductiveHour).padStart(2, '0')}:00`}
            </p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tempo médio de conclusão</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {stats.avgCompletionTime > 0 ? (stats.avgCompletionTime < 60 ? `${stats.avgCompletionTime}min` : `${Math.round(stats.avgCompletionTime / 60)}h`) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Day of week chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Tarefas concluídas por dia da semana</h3>
        <div className="flex items-end justify-between gap-2 h-40">
          {stats.dayCount.map((count, i) => {
            const height = (count / maxDayCount) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="w-full flex items-end justify-center h-32">
                  <div
                    className="w-1/2 max-w-6 rounded-t-md bg-gradient-to-t from-green-600 to-green-400 transition-all duration-500 hover:from-green-700 hover:to-green-500 relative"
                    style={{ height: `${height}%` }}
                  >
                    {count > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 capitalize">{weekdays[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hourly distribution */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Horários mais produtivos</h3>
        <div className="flex items-end justify-between gap-1 h-32">
          {peakHours.map((h) => {
            const height = (h.count / maxHourCount) * 100;
            return (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full flex items-end justify-center h-24">
                  <div
                    className="w-full max-w-4 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">{h.hour}h</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* By priority */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Conclusão por prioridade</h3>
        <div className="space-y-3">
          {(Object.entries(stats.byPriority) as [Priority, { total: number; completed: number }][]).map(([priority, data]) => {
            const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
            const colors: Record<Priority, string> = { baixa: 'bg-slate-400', media: 'bg-green-500', alta: 'bg-amber-500', urgente: 'bg-red-500' };
            const labels: Record<Priority, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente' };
            return (
              <div key={priority}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{labels[priority]}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{data.completed}/{data.total} • {rate}%</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-[#1c1c1c] rounded-full overflow-hidden">
                  <div className={`h-full ${colors[priority]} rounded-full transition-all duration-500`} style={{ width: `${rate}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* By category */}
      {stats.byCategory.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Tarefas por categoria</h3>
          <div className="space-y-3">
            {stats.byCategory.map((cat) => {
              const rate = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{cat.completed}/{cat.total} • {rate}%</span>
                  </div>
                  <ProgressBar value={rate} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
