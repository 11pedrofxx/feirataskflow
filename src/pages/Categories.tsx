import { useMemo, useState } from 'react';
import { Plus, Trash2, Briefcase, GraduationCap, User, Rocket, Dumbbell, Wallet, Folder } from 'lucide-react';
import { useTask } from '@/contexts/TaskContext';
import { useToast } from '@/contexts/ToastContext';
import { Modal } from '@/components/tf-ui/Modal';
import { Input } from '@/components/tf-ui/Input';
import { ConfirmDialog } from '@/components/tf-ui/ConfirmDialog';
import { todayString } from '@/lib/date';

const ICONS: Record<string, typeof Briefcase> = {
  Briefcase, GraduationCap, User, Rocket, Dumbbell, Wallet, Folder,
};

const COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#14b8a6',
  '#ec4899', '#6366f1', '#f97316', '#06b6d4', '#84cc16', '#a855f7',
];

export function Categories() {
  const { categories, tasks, createCategory, deleteCategory } = useTask();
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState('Folder');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const taskCount = useMemo(() => {
    const counts = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.category_id) counts.set(t.category_id, (counts.get(t.category_id) ?? 0) + 1);
    });
    return counts;
  }, [tasks]);

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast('Nome da categoria é obrigatório.', 'error');
      return;
    }
    await createCategory(name.trim(), color, icon);
    showToast('Categoria criada!', 'success');
    setName('');
    setColor(COLORS[0]);
    setIcon('Folder');
    setShowCreate(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteCategory(deleteId);
    showToast('Categoria excluída.', 'success');
    setDeleteId(null);
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Categorias</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Organize suas tarefas por categoria</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Nova
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const Icon = ICONS[cat.icon] ?? Folder;
          const count = taskCount.get(cat.id) ?? 0;
          return (
            <div key={cat.id} className="card p-4 group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                    <Icon className="h-5 w-5" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cat.name}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{count} tarefa(s)</p>
                  </div>
                </div>
                {!cat.is_default && (
                  <button
                    onClick={() => setDeleteId(cat.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 className="h-4 w-4 text-red-400 hover:text-red-500" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nova Categoria" size="sm">
        <div className="space-y-4">
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Saúde" autoFocus />
          <div>
            <label className="label">Cor</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 dark:ring-offset-black scale-110' : ''}`}
                  style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="label">Ícone</label>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(ICONS).map(([name, Icon]) => (
                <button
                  key={name}
                  onClick={() => setIcon(name)}
                  className={`aspect-square rounded-lg flex items-center justify-center transition-all ${icon === name ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500' : 'bg-slate-100 dark:bg-[#1c1c1c] hover:bg-slate-200 dark:hover:bg-[#303030]'}`}
                >
                  <Icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleCreate} className="btn-primary flex-1">Criar</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir categoria"
        message="Tarefas associadas não serão excluídas, apenas ficarão sem categoria. Deseja continuar?"
        confirmLabel="Excluir"
        danger
      />
    </div>
  );
}
