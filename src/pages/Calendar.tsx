import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import { useTask } from '@/contexts/TaskContext';
import { TaskCard } from '@/components/TaskCard';
import { EmptyState } from '@/components/tf-ui';
import {
  getMonthName, getWeekdaysShort, getDaysInMonth, getWeekDays,
  dateToISO, todayString, formatDate, isToday as isTodayFn,
} from '@/lib/date';
import type { Task } from '@/types';

type View = 'month' | 'week' | 'day';

interface CalendarProps {
  onEditTask: (task: Task) => void;
  onNewTask: () => void;
}

export function Calendar({ onEditTask, onNewTask }: CalendarProps) {
  const { tasks } = useTask();
  const [view, setView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayString());

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      if (t.due_date) {
        const arr = map.get(t.due_date) ?? [];
        arr.push(t);
        map.set(t.due_date, arr);
      }
    });
    return map;
  }, [tasks]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else {
      d.setDate(d.getDate() + dir);
      setSelectedDate(dateToISO(d));
    }
    setCurrentDate(d);
  };

  const headerLabel = useMemo(() => {
    if (view === 'month') return `${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`;
    if (view === 'week') {
      const days = getWeekDays(currentDate);
      return `${days[0].getDate()} - ${days[6].getDate()} ${getMonthName(days[6].getMonth())}`;
    }
    return formatDate(selectedDate);
  }, [view, currentDate, selectedDate]);

  const selectedTasks = tasksByDate.get(selectedDate) ?? [];

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Calendário</h2>
        <button onClick={onNewTask} className="btn-primary">
          <Plus className="h-4 w-4" /> Nova
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(todayString()); }} className="btn-secondary text-xs">Hoje</button>
          <button onClick={() => navigate(1)} className="btn-ghost p-2"><ChevronRight className="h-5 w-5" /></button>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 ml-2 capitalize">{headerLabel}</h3>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-[#1c1c1c] rounded-xl p-1">
          {(['day', 'week', 'month'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                view === v ? 'bg-white dark:bg-[#0b0b0b] text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-4">
          {view === 'month' && <MonthView currentDate={currentDate} tasksByDate={tasksByDate} selectedDate={selectedDate} onSelect={setSelectedDate} />}
          {view === 'week' && <WeekView currentDate={currentDate} tasksByDate={tasksByDate} selectedDate={selectedDate} onSelect={setSelectedDate} />}
          {view === 'day' && <DayView selectedDate={selectedDate} tasks={selectedTasks} onEditTask={onEditTask} />}
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
            {view === 'day' ? 'Tarefas do dia' : formatDate(selectedDate)}
          </h3>
          {selectedTasks.length === 0 ? (
            <div className="card p-6 text-center">
              <CalendarDays className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma tarefa neste dia.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={onEditTask} compact />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MonthView({ currentDate, tasksByDate, selectedDate, onSelect }: {
  currentDate: Date;
  tasksByDate: Map<string, Task[]>;
  selectedDate: string;
  onSelect: (d: string) => void;
}) {
  const weekdays = getWeekdaysShort();
  const days = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayOffset = days[0].getDay();

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 dark:text-slate-500 capitalize py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map((day) => {
          const dateStr = dateToISO(day);
          const dayTasks = tasksByDate.get(dateStr) ?? [];
          const isToday = isTodayFn(dateStr);
          const isSelected = dateStr === selectedDate;
          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-start transition-all relative ${
                isSelected ? 'bg-green-600 text-white' : isToday ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'hover:bg-slate-100 dark:hover:bg-[#242424]'
              }`}
            >
              <span className={`text-xs font-medium ${isSelected ? 'text-white' : ''}`}>{day.getDate()}</span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {dayTasks.slice(0, 3).map((t) => (
                    <span key={t.id} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : t.priority === 'urgente' ? 'bg-red-500' : t.priority === 'alta' ? 'bg-amber-500' : 'bg-green-500'}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ currentDate, tasksByDate, selectedDate, onSelect }: {
  currentDate: Date;
  tasksByDate: Map<string, Task[]>;
  selectedDate: string;
  onSelect: (d: string) => void;
}) {
  const days = getWeekDays(currentDate);
  const weekdays = getWeekdaysShort();

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, i) => {
        const dateStr = dateToISO(day);
        const dayTasks = tasksByDate.get(dateStr) ?? [];
        const isToday = isTodayFn(dateStr);
        const isSelected = dateStr === selectedDate;
        return (
          <button
            key={dateStr}
            onClick={() => onSelect(dateStr)}
            className={`rounded-xl p-2 min-h-24 flex flex-col items-center transition-all ${
              isSelected ? 'bg-green-600 text-white' : isToday ? 'bg-green-50 dark:bg-green-900/30' : 'hover:bg-slate-100 dark:hover:bg-[#242424]'
            }`}
          >
            <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">{weekdays[i]}</span>
            <span className={`text-lg font-bold mb-1 ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>{day.getDate()}</span>
            <div className="flex flex-col gap-1 w-full">
              {dayTasks.slice(0, 3).map((t) => (
                <div key={t.id} className={`text-[10px] truncate px-1 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : t.priority === 'urgente' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : t.priority === 'alta' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>
                  {t.title}
                </div>
              ))}
              {dayTasks.length > 3 && <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>+{dayTasks.length - 3}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DayView({ selectedDate, tasks, onEditTask }: {
  selectedDate: string;
  tasks: Task[];
  onEditTask: (t: Task) => void;
}) {
  if (tasks.length === 0) {
    return <EmptyState icon={<CalendarDays className="h-10 w-10" />} title="Nenhuma tarefa" message="Não há tarefas agendadas para este dia." />;
  }
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onEdit={onEditTask} />
      ))}
    </div>
  );
}
