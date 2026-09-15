import { useMemo, useState } from 'react';
import { Sun, Moon, Coffee, Plus, GripVertical } from 'lucide-react';
import { useTask } from '@/contexts/TaskContext';
import { TaskCard } from '@/components/TaskCard';
import { ProgressBar, EmptyState } from '@/components/tf-ui';
import { formatDuration, todayString } from '@/lib/date';
import type { Task, PlannedPeriod } from '@/types';

interface MyDayProps {
  onEditTask: (task: Task) => void;
  onNewTask: () => void;
}

const PERIODS: { id: PlannedPeriod; label: string; icon: typeof Sun; time: string; gradient: string }[] = [
  { id: 'manha', label: 'Manhã', icon: Sun, time: '06:00 - 12:00', gradient: 'from-amber-400 to-orange-400' },
  { id: 'tarde', label: 'Tarde', icon: Coffee, time: '12:00 - 18:00', gradient: 'from-green-400 to-cyan-400' },
  { id: 'noite', label: 'Noite', icon: Moon, time: '18:00 - 23:00', gradient: 'from-emerald-400 to-teal-500' },
];

export function MyDay({ onEditTask, onNewTask }: MyDayProps) {
  const { tasks, updateTask } = useTask();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverPeriod, setDragOverPeriod] = useState<PlannedPeriod | null>(null);

  const today = todayString();

  const tasksByPeriod = useMemo(() => {
    const result: Record<PlannedPeriod, Task[]> = { manha: [], tarde: [], noite: [] };
    const todayTasks = tasks.filter((t) =>
      t.status === 'pendente' && (t.due_date === today || t.planned_period)
    );
    todayTasks.forEach((task) => {
      const period = task.planned_period ?? 'manha';
      if (result[period]) result[period].push(task);
    });
    Object.values(result).forEach((arr) => arr.sort((a, b) => a.sort_order - b.sort_order));
    return result;
  }, [tasks, today]);

  const totalEstimated = useMemo(() => {
    return Object.values(tasksByPeriod).flat().reduce((sum, t) => sum + (t.estimated_time ?? 0), 0);
  }, [tasksByPeriod]);

  const completedToday = useMemo(() => {
    return tasks.filter((t) => t.status === 'concluida' && t.completed_at?.startsWith(today)).length;
  }, [tasks, today]);

  const totalToday = useMemo(() => Object.values(tasksByPeriod).flat().length, [tasksByPeriod]);

  const handleDrop = async (period: PlannedPeriod) => {
    if (!draggedId) return;
    const task = tasks.find((t) => t.id === draggedId);
    if (task && task.planned_period !== period) {
      await updateTask(task.id, { planned_period: period, due_date: today });
    }
    setDraggedId(null);
    setDragOverPeriod(null);
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Meu Dia</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {totalToday} tarefa(s) • {formatDuration(totalEstimated) || 'sem tempo estimado'} • {completedToday} concluída(s)
          </p>
        </div>
        <button onClick={onNewTask} className="btn-primary">
          <Plus className="h-4 w-4" /> Nova
        </button>
      </div>

      {/* Progress */}
      {totalToday > 0 && (
        <div className="card p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Progresso do dia</span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              {Math.round((completedToday / (totalToday + completedToday)) * 100) || 0}%
            </span>
          </div>
          <ProgressBar value={completedToday} max={totalToday + completedToday} />
        </div>
      )}

      {/* Periods */}
      <div className="space-y-4">
        {PERIODS.map((period) => {
          const Icon = period.icon;
          const periodTasks = tasksByPeriod[period.id];
          return (
            <div
              key={period.id}
              onDragOver={(e) => { e.preventDefault(); setDragOverPeriod(period.id); }}
              onDragLeave={() => setDragOverPeriod(null)}
              onDrop={() => handleDrop(period.id)}
              className={`card p-4 transition-all ${dragOverPeriod === period.id ? 'ring-2 ring-green-500' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${period.gradient} flex items-center justify-center shadow-sm`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{period.label}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{period.time}</p>
                  </div>
                </div>
                <span className="badge bg-slate-100 dark:bg-[#1c1c1c] text-slate-500 dark:text-slate-400">
                  {periodTasks.length} tarefa(s)
                </span>
              </div>

              {periodTasks.length === 0 ? (
                <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-[#2a2a2a] rounded-xl">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Arraste tarefas para a {period.label.toLowerCase()} ou clique em "Nova"
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {periodTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDraggedId(task.id)}
                      onDragEnd={() => { setDraggedId(null); setDragOverPeriod(null); }}
                      className={`group relative ${draggedId === task.id ? 'opacity-50' : ''}`}
                    >
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4 text-slate-400" />
                      </div>
                      <TaskCard task={task} onEdit={onEditTask} draggable={false} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalToday === 0 && completedToday === 0 && (
        <EmptyState
          icon={<Sun className="h-10 w-10" />}
          title="Seu dia está livre"
          message="Adicione tarefas e organize-as por período. Arraste tarefas entre manhã, tarde e noite."
          action={<button onClick={onNewTask} className="btn-primary"><Plus className="h-4 w-4" /> Nova Tarefa</button>}
        />
      )}
    </div>
  );
}
