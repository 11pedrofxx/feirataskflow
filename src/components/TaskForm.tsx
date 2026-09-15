import { useEffect, useState } from 'react';
import { Sparkles, Plus, X, Repeat, Tag, ListChecks } from 'lucide-react';
import { Modal } from '@/components/tf-ui/Modal';
import { Input, Textarea } from '@/components/tf-ui/Input';
import { Select } from '@/components/tf-ui/Select';
import { useTask } from '@/contexts/TaskContext';
import { useToast } from '@/contexts/ToastContext';
import { analyzeTaskText, type AISuggestion } from '@/lib/ai';
import { todayString } from '@/lib/date';
import type { Priority, RecurrencePattern, Task, TaskInput } from '@/types';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  editingTask?: Task | null;
  defaultDate?: string;
  defaultPeriod?: 'manha' | 'tarde' | 'noite';
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

export function TaskForm({ open, onClose, editingTask, defaultDate, defaultPeriod }: TaskFormProps) {
  const { categories, createTask, updateTask, addSubtask } = useTask();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<Priority>('media');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>('weekly');
  const [notes, setNotes] = useState('');
  const [plannedPeriod, setPlannedPeriod] = useState<'manha' | 'tarde' | 'noite' | ''>('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingTask) {
        setTitle(editingTask.title);
        setDescription(editingTask.description ?? '');
        setDueDate(editingTask.due_date ?? '');
        setDueTime(editingTask.due_time ?? '');
        setPriority(editingTask.priority);
        setCategoryId(editingTask.category_id ?? '');
        setTags(editingTask.tags ?? []);
        setEstimatedTime(editingTask.estimated_time ? String(editingTask.estimated_time) : '');
        setIsRecurring(editingTask.is_recurring);
        setRecurrencePattern(editingTask.recurrence_pattern ?? 'weekly');
        setNotes(editingTask.notes ?? '');
        setPlannedPeriod(editingTask.planned_period ?? '');
        setSubtasks(editingTask.subtasks?.map((s) => s.title) ?? []);
      } else {
        setTitle('');
        setDescription('');
        setDueDate(defaultDate ?? '');
        setDueTime('');
        setPriority('media');
        setCategoryId('');
        setTags([]);
        setEstimatedTime('');
        setIsRecurring(false);
        setRecurrencePattern('weekly');
        setNotes('');
        setPlannedPeriod(defaultPeriod ?? '');
        setSubtasks([]);
      }
      setSuggestion(null);
      setShowSuggestion(false);
      setTagInput('');
      setSubtaskInput('');
    }
  }, [open, editingTask, defaultDate, defaultPeriod]);

  const handleAnalyze = () => {
    if (!title.trim()) {
      showToast('Digite um título para analisar.', 'warning');
      return;
    }
    const s = analyzeTaskText(title + ' ' + description);
    setSuggestion(s);
    setShowSuggestion(true);
    showToast('Análise concluída!', 'success');
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    if (suggestion.priority) setPriority(suggestion.priority);
    if (suggestion.dueDate) setDueDate(suggestion.dueDate);
    if (suggestion.estimatedTime) setEstimatedTime(String(suggestion.estimatedTime));
    if (suggestion.subtasks && suggestion.subtasks.length > 0) setSubtasks(suggestion.subtasks);
    if (suggestion.category) {
      const cat = categories.find((c) => c.name === suggestion.category);
      if (cat) setCategoryId(cat.id);
    }
    setShowSuggestion(false);
    showToast('Sugestões aplicadas!', 'success');
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const addSubtaskItem = () => {
    const s = subtaskInput.trim();
    if (s) setSubtasks([...subtasks, s]);
    setSubtaskInput('');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('O título é obrigatório.', 'error');
      return;
    }
    setSaving(true);
    const input: TaskInput = {
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
      due_time: dueTime || null,
      priority,
      category_id: categoryId || null,
      tags: tags.length > 0 ? tags : undefined,
      estimated_time: estimatedTime ? parseInt(estimatedTime) : 0,
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring ? recurrencePattern : null,
      notes: notes.trim() || null,
      planned_period: (plannedPeriod || null) as 'manha' | 'tarde' | 'noite' | null,
    };

    try {
      if (editingTask) {
        await updateTask(editingTask.id, input);
        showToast('Tarefa atualizada com sucesso!', 'success');
        onClose();
      } else {
        const task = await createTask(input, subtasks.map((s) => ({ title: s })));
        if (task) {
          showToast('Tarefa criada com sucesso!', 'success');
          onClose();
        }
      }
    } catch {
      showToast('Erro ao salvar tarefa. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editingTask ? 'Editar Tarefa' : 'Nova Tarefa'} size="lg">
      <div className="space-y-5">
        {/* Title with AI analysis */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Título da tarefa *</label>
            <button
              onClick={handleAnalyze}
              className="text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Analisar com IA
            </button>
          </div>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Terminar meu projeto da escola na próxima sexta-feira"
            autoFocus
          />
        </div>

        {/* AI Suggestion */}
        {showSuggestion && suggestion && (
          <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 animate-slide-up">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-900 dark:text-green-200">Sugestões da IA</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mb-3">{suggestion.explanation}</p>
                {suggestion.subtasks && suggestion.subtasks.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">Subtarefas sugeridas:</p>
                    <ul className="text-xs text-green-700 dark:text-green-300 space-y-0.5">
                      {suggestion.subtasks.map((s, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-green-500" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button onClick={applySuggestion} className="btn-primary text-xs px-3 py-2 shrink-0">
                Aplicar
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        <Textarea
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Adicione mais detalhes sobre a tarefa..."
          rows={3}
        />

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data de vencimento"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={todayString()}
          />
          <Input
            label="Horário"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
          />
        </div>

        {/* Priority and Category */}
        <div className="grid grid-cols-2 gap-4">
          <Select label="Prioridade" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </Select>
          <Select label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sem categoria</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>

        {/* Tags */}
        <div>
          <label className="label flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Tags</label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Digite uma tag e pressione Enter"
            />
            <button onClick={addTag} className="btn-secondary px-3"><Plus className="h-4 w-4" /></button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((t) => (
                <span key={t} className="badge bg-slate-100 dark:bg-[#1c1c1c] text-slate-600 dark:text-slate-300">
                  {t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Estimated Time and Planned Period */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Tempo estimado (minutos)"
            type="number"
            value={estimatedTime}
            onChange={(e) => setEstimatedTime(e.target.value)}
            min="0"
            step="15"
          />
          <Select label="Período do dia" value={plannedPeriod} onChange={(e) => setPlannedPeriod(e.target.value as 'manha' | 'tarde' | 'noite' | '')}>
            <option value="">Sem período definido</option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
            <option value="noite">Noite</option>
          </Select>
        </div>

        {/* Recurring */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRecurring(!isRecurring)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
              isRecurring
                ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'border-slate-200 dark:border-[#303030] text-slate-600 dark:text-slate-300'
            }`}
          >
            <Repeat className="h-4 w-4" />
            <span className="text-sm font-medium">Tarefa recorrente</span>
          </button>
          {isRecurring && (
            <Select value={recurrencePattern} onChange={(e) => setRecurrencePattern(e.target.value as RecurrencePattern)} className="flex-1 max-w-48">
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="monthly">Mensalmente</option>
            </Select>
          )}
        </div>

        {/* Subtasks */}
        <div>
          <label className="label flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5" /> Subtarefas</label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtaskItem(); } }}
              placeholder="Adicionar subtarefa..."
            />
            <button onClick={addSubtaskItem} className="btn-secondary px-3"><Plus className="h-4 w-4" /></button>
          </div>
          {subtasks.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {subtasks.map((s, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#1c1c1c]/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">{s}</span>
                  <button onClick={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <Textarea
          label="Observações"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas adicionais..."
          rows={2}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Salvando...' : editingTask ? 'Salvar alterações' : 'Criar tarefa'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
