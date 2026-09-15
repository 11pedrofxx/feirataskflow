import { useMemo, useState } from 'react';
import { Search, Filter, ArrowUpDown, Plus, ListTodo, X } from 'lucide-react';
import { useTask } from '@/contexts/TaskContext';
import { TaskCard } from '@/components/TaskCard';
import { Select } from '@/components/tf-ui/Select';
import { EmptyState } from '@/components/tf-ui';
import { todayString, isOverdue, isUpcoming } from '@/lib/date';
import type { Task, Priority } from '@/types';

type Tab = 'all' | 'today' | 'upcoming' | 'completed' | 'overdue';
type SortBy = 'priority' | 'date' | 'created' | 'title';

interface TaskListProps {
  onEditTask: (task: Task) => void;
  onNewTask: () => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'today', label: 'Hoje' },
  { id: 'upcoming', label: 'Próximas' },
  { id: 'completed', label: 'Concluídas' },
  { id: 'overdue', label: 'Atrasadas' },
];

export function TaskList({ onEditTask, onNewTask }: TaskListProps) {
  const { tasks, categories } = useTask();
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('priority');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...tasks];
    const today = todayString();

    switch (tab) {
      case 'today': result = result.filter((t) => t.due_date === today && t.status === 'pendente'); break;
      case 'upcoming': result = result.filter((t) => isUpcoming(t.due_date) && t.status === 'pendente'); break;
      case 'completed': result = result.filter((t) => t.status === 'concluida'); break;
      case 'overdue': result = result.filter((t) => isOverdue(t)); break;
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (filterCategory) result = result.filter((t) => t.category_id === filterCategory);
    if (filterPriority) result = result.filter((t) => t.priority === filterPriority);
    if (filterStatus === 'pendente') result = result.filter((t) => t.status === 'pendente');
    if (filterStatus === 'concluida') result = result.filter((t) => t.status === 'concluida');

    const priorityScore: Record<Priority, number> = { urgente: 4, alta: 3, media: 2, baixa: 1 };
    switch (sortBy) {
      case 'priority': result.sort((a, b) => priorityScore[b.priority] - priorityScore[a.priority]); break;
      case 'date': result.sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')); break;
      case 'created': result.sort((a, b) => b.created_at.localeCompare(a.created_at)); break;
      case 'title': result.sort((a, b) => a.title.localeCompare(b.title)); break;
    }

    return result;
  }, [tasks, tab, search, filterCategory, filterPriority, filterStatus, sortBy]);

  const activeFilters = (filterCategory ? 1 : 0) + (filterPriority ? 1 : 0) + (filterStatus ? 1 : 0);

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tarefas</h2>
        <button onClick={onNewTask} className="btn-primary">
          <Plus className="h-4 w-4" /> Nova
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-[#1c1c1c] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#303030]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Buscar tarefas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary px-3 ${showFilters || activeFilters > 0 ? 'border-green-400 text-green-600 dark:text-green-400' : ''}`}
        >
          <Filter className="h-4 w-4" />
          {activeFilters > 0 && <span className="badge bg-green-600 text-white text-[10px]">{activeFilters}</span>}
        </button>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="w-auto max-w-40">
          <option value="priority">Por prioridade</option>
          <option value="date">Por data</option>
          <option value="created">Recentes</option>
          <option value="title">Por título</option>
        </Select>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-up">
          <Select label="Categoria" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Todas categorias</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Prioridade" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">Todas prioridades</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </Select>
          <Select label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos status</option>
            <option value="pendente">Pendente</option>
            <option value="concluida">Concluída</option>
          </Select>
          {activeFilters > 0 && (
            <button
              onClick={() => { setFilterCategory(''); setFilterPriority(''); setFilterStatus(''); }}
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 self-end"
            >
              <X className="h-3 w-3" /> Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Task list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="h-10 w-10" />}
          title="Nenhuma tarefa encontrada"
          message={search || activeFilters > 0 ? "Tente ajustar a busca ou filtros." : "Crie sua primeira tarefa para começar."}
          action={<button onClick={onNewTask} className="btn-primary"><Plus className="h-4 w-4" /> Nova Tarefa</button>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} />
          ))}
        </div>
      )}
    </div>
  );
}
