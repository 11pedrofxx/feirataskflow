import { useMemo } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { todayString } from '@/lib/date';

export function ProductivityChart() {
  const { tasks } = useTask();

  const data = useMemo(() => {
    const days: { label: string; date: string; completed: number; created: number }[] = [];
    const weekdaysShort = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        label: weekdaysShort[d.getDay()],
        date: dateStr,
        completed: 0,
        created: 0,
      });
    }

    tasks.forEach((task) => {
      if (task.completed_at) {
        const completedDate = task.completed_at.split('T')[0];
        const day = days.find((d) => d.date === completedDate);
        if (day) day.completed++;
      }
      const createdDate = task.created_at.split('T')[0];
      const day = days.find((d) => d.date === createdDate);
      if (day) day.created++;
    });

    return days;
  }, [tasks]);

  const maxVal = Math.max(...data.map((d) => Math.max(d.completed, d.created)), 1);
  const today = todayString();

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Produtividade (7 dias)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tarefas concluídas vs. criadas</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-slate-500 dark:text-slate-400">Concluídas</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-[#303030]" />
            <span className="text-slate-500 dark:text-slate-400">Criadas</span>
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 h-40">
        {data.map((day) => {
          const completedHeight = (day.completed / maxVal) * 100;
          const createdHeight = (day.created / maxVal) * 100;
          const isToday = day.date === today;
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div className="w-full flex items-end justify-center gap-1 h-32 relative">
                <div
                  className="w-1/3 max-w-3 rounded-t-md bg-green-500 hover:bg-green-600 transition-all duration-500 relative"
                  style={{ height: `${completedHeight}%` }}
                >
                  {day.completed > 0 && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.completed}
                    </span>
                  )}
                </div>
                <div
                  className="w-1/3 max-w-3 rounded-t-md bg-slate-300 dark:bg-[#303030] hover:bg-slate-400 dark:hover:bg-[#3a3a3a] transition-all duration-500"
                  style={{ height: `${createdHeight}%` }}
                />
              </div>
              <span className={`text-[10px] font-medium ${isToday ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
