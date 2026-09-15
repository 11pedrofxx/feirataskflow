import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot } from 'lucide-react';
import { useTask } from '@/contexts/TaskContext';
import { askAssistant } from '@/lib/ai';
import { todayString } from '@/lib/date';
import type { PlannedPeriod } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const QUICK_PROMPTS = [
  'O que eu devo fazer hoje?',
  'Quais tarefas devo priorizar?',
  'Quais tarefas estão atrasadas?',
  'Organize meu dia.',
  'Há conflitos de prazo?',
  'Dicas de produtividade',
];

export function AIAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { tasks, createTask, categories } = useTask();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Olá! Sou seu assistente de produtividade. Posso analisar suas tarefas, sugerir prioridades, organizar seu dia e muito mais.\n\nDica: você pode escrever seu planejamento assim:\n\nDia:\nManhã: Academia + estudos\nTarde: Reunião + relatório\nNoite: Jantar com a família\n\n...e eu adiciono tudo automaticamente!' },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(async () => {
      const response = askAssistant(text, tasks);
      setMessages((prev) => [...prev, { role: 'assistant', text: response.text }]);

      if (response.parsedDayTasks && response.parsedDayTasks.length > 0) {
        const today = todayString();
        let created = 0;
        for (const pt of response.parsedDayTasks) {
          const cat = pt.category ? categories.find((c) => c.name === pt.category) : null;
          await createTask({
            title: pt.title,
            priority: 'media',
            due_date: today,
            planned_period: pt.period as PlannedPeriod,
            category_id: cat?.id ?? null,
            status: 'pendente',
          });
          created++;
        }
        if (created > 0) {
          setMessages((prev) => [...prev, {
            role: 'assistant',
            text: `Pronto! ${created} tarefa(s) adicionada(s) ao seu planejador de hoje. Você pode vê-las na página "Meu Dia".`,
          }]);
        }
      }
    }, 400);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg h-[80vh] sm:h-[600px] card rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#2a2a2a] bg-gradient-to-r from-green-600 to-emerald-500">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Assistente IA</h3>
              <p className="text-white/70 text-xs">Analisando suas tarefas em tempo real</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-black">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-md'
                    : 'bg-white dark:bg-[#1c1c1c] text-slate-700 dark:text-slate-200 rounded-bl-md border border-slate-200 dark:border-[#303030]'
                }`}
              >
                {msg.text.split('\n').map((line, j) => (
                  <p key={j} className={line === '' ? 'h-2' : ''}>{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2 bg-slate-50 dark:bg-black">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => send(prompt)}
                className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#303030] text-slate-600 dark:text-slate-300 hover:border-green-400 hover:text-green-600 dark:hover:text-green-400 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0b0b0b]">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Pergunte sobre suas tarefas..."
              autoFocus
            />
            <button onClick={() => send(input)} className="btn-primary px-3">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FloatingAssistantButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 lg:bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-green-600 to-emerald-500 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
      aria-label="Abrir assistente IA"
    >
      <Sparkles className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-black animate-pulse" />
    </button>
  );
}
