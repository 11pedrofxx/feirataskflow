import { Calendar, Clock, Tag, Repeat, ChevronDown, ChevronRight, CheckCircle2, Circle, Trash2, Copy, CalendarClock, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { PriorityBadge } from '@/components/tf-ui/Badge';
import { Checkbox } from '@/components/tf-ui';
import { useTask } from '@/contexts/TaskContext';
import { useToast } from '@/contexts/ToastContext';
import { formatDateShort, formatTime, formatDuration, relativeDate, isOverdue } from '@/lib/date';
import type { Task } from '@/types';
import { ConfirmDialog } from '@/components/tf-ui/ConfirmDialog';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  compact?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function TaskCard({ task, onEdit, compact, draggable, onDragStart, onDragEnd }: TaskCardProps) {
  const { toggleTaskComplete, duplicateTask, deleteTask, toggleSubtask, deleteSubtask, postponeTask } = useTask();
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const overdue = isOverdue(task);
  const completed = task.status === 'concluida';
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length ?? 0;

  const handleDuplicate = async () => {
    await duplicateTask(task);
    showToast('Tarefa duplicada com sucesso!', 'success');
    setShowMenu(false);
  };

  const handlePostpone = async (days: number) => {
    if (!task.due_date) {
      showToast('Esta tarefa não tem data de vencimento.', 'warning');
      return;
    }
    await postponeTask(task, days);
    showToast(`Tarefa adiada em ${days} dia(s).`, 'success');
    setShowMenu(false);
  };

  return (
    <>
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={() => onEdit?.(task)}
        className={`group card p-4 hover:shadow-md hover:border-slate-300 dark:hover:border-[#303030] transition-all cursor-pointer ${completed ? 'opacity-60' : ''} ${overdue ? 'border-l-4 border-l-red-500' : ''}`}
      >
        <div className="flex items-start gap-3">
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={completed} onChange={() => toggleTaskComplete(task)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium text-slate-900 dark:text-slate-100 ${completed ? 'line-through' : ''}`}>
                  {task.title}
                </h3>
                {!compact && task.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                )}
              </div>

              <div className="relative shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#242424] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                    <div className="absolute right-0 top-8 z-20 w-48 card shadow-lg py-1 animate-scale-in" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { onEdit?.(task); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-[#242424] flex items-center gap-2">
                        <ChevronRight className="h-4 w-4" /> Editar
                      </button>
                      <button onClick={handleDuplicate} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-[#242424] flex items-center gap-2">
                        <Copy className="h-4 w-4" /> Duplicar
                      </button>
                      <button onClick={() => handlePostpone(1)} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-[#242424] flex items-center gap-2">
                        <CalendarClock className="h-4 w-4" /> Adiar 1 dia
                      </button>
                      <button onClick={() => handlePostpone(7)} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-[#242424] flex items-center gap-2">
                        <CalendarClock className="h-4 w-4" /> Adiar 7 dias
                      </button>
                      <div className="border-t border-slate-200 dark:border-[#2a2a2a] my-1" />
                      <button onClick={() => { setConfirmDelete(true); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                        <Trash2 className="h-4 w-4" /> Excluir
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <PriorityBadge priority={task.priority} />

              {task.due_date && (
                <span className={`badge ${overdue ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' : 'bg-slate-100 dark:bg-[#1c1c1c] text-slate-600 dark:text-slate-300'}`}>
                  <Calendar className="h-3 w-3" />
                  {relativeDate(task.due_date)}
                </span>
              )}

              {task.due_time && (
                <span className="badge bg-slate-100 dark:bg-[#1c1c1c] text-slate-600 dark:text-slate-300">
                  <Clock className="h-3 w-3" />
                  {formatTime(task.due_time)}
                </span>
              )}

              {task.estimated_time > 0 && (
                <span className="badge bg-slate-100 dark:bg-[#1c1c1c] text-slate-600 dark:text-slate-300">
                  <Clock className="h-3 w-3" />
                  {formatDuration(task.estimated_time)}
                </span>
              )}

              {task.category && (
                <span className="badge" style={{ backgroundColor: task.category.color + '20', color: task.category.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.category.color }} />
                  {task.category.name}
                </span>
              )}

              {task.is_recurring && (
                <span className="badge bg-slate-100 dark:bg-[#1c1c1c] text-slate-600 dark:text-slate-300">
                  <Repeat className="h-3 w-3" />
                </span>
              )}

              {task.tags && task.tags.length > 0 && (
                <span className="badge bg-slate-100 dark:bg-[#1c1c1c] text-slate-500 dark:text-slate-400">
                  <Tag className="h-3 w-3" />
                  {task.tags.length}
                </span>
              )}

              {hasSubtasks && (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                  className="badge bg-slate-100 dark:bg-[#1c1c1c] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#303030]"
                >
                  {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  {completedSubtasks}/{task.subtasks!.length}
                </button>
              )}
            </div>

            {expanded && hasSubtasks && (
              <div className="mt-3 space-y-1.5 animate-fade-in">
                {task.subtasks!.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2 group/sub">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={sub.completed} onChange={() => toggleSubtask(sub)} className="w-4 h-4" />
                    </div>
                    <span className={`text-xs flex-1 ${sub.completed ? 'line-through text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                      {sub.title}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSubtask(sub.id); }}
                      className="opacity-0 group-hover/sub:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-[#242424] rounded"
                    >
                      <Trash2 className="h-3 w-3 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => { await deleteTask(task.id); showToast('Tarefa excluída.', 'success'); }}
        title="Excluir tarefa"
        message="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
      />
    </>
  );
}
