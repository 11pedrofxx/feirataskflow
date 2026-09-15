import type { Priority, Task, PlannedPeriod } from '@/types';
import { daysUntil, isOverdue, todayString } from '@/lib/date';

export interface AISuggestion {
  priority?: Priority;
  dueDate?: string;
  estimatedTime?: number;
  subtasks?: string[];
  category?: string;
  explanation: string;
}

const DAY_MAP: Record<string, number> = {
  'domingo': 0, 'dom': 0,
  'segunda': 1, 'segunda-feira': 1, 'seg': 1,
  'terça': 2, 'terça-feira': 2, 'ter': 2,
  'quarta': 3, 'quarta-feira': 3, 'qua': 3,
  'quinta': 4, 'quinta-feira': 4, 'qui': 4,
  'sexta': 5, 'sexta-feira': 5, 'sex': 5,
  'sábado': 6, 'sabado': 6, 'sáb': 6,
};

function nextWeekday(target: number): string {
  const today = new Date();
  const current = today.getDay();
  let diff = target - current;
  if (diff <= 0) diff += 7;
  today.setDate(today.getDate() + diff);
  return today.toISOString().split('T')[0];
}

function parseDate(text: string): string | undefined {
  const lower = text.toLowerCase();

  if (lower.includes('hoje')) return todayString();
  if (lower.includes('amanhã') || lower.includes('amanha')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  if (lower.includes('próxima semana') || lower.includes('proxima semana')) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }

  for (const [word, dayNum] of Object.entries(DAY_MAP)) {
    if (lower.includes(`próxima ${word}`) || lower.includes(`proxima ${word}`) || lower.includes(word)) {
      return nextWeekday(dayNum);
    }
  }

  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  for (let i = 0; i < months.length; i++) {
    const regex = new RegExp(`(\\d{1,2})\\s+de\\s+${months[i]}`, 'i');
    const match = lower.match(regex);
    if (match) {
      const day = parseInt(match[1]);
      const year = new Date().getFullYear();
      return new Date(year, i, day).toISOString().split('T')[0];
    }
  }

  return undefined;
}

function parsePriority(text: string): Priority | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('urgente') || lower.includes('emergência') || lower.includes('emergencia')) return 'urgente';
  if (lower.includes('alta') || lower.includes('importante')) return 'alta';
  if (lower.includes('média') || lower.includes('media')) return 'media';
  if (lower.includes('baixa') || lower.includes('simples')) return 'baixa';
  return undefined;
}

function parseEstimatedTime(text: string): number | undefined {
  const lower = text.toLowerCase();
  const hourMatch = lower.match(/(\d+)\s*(?:hora|h\b)/);
  if (hourMatch) return parseInt(hourMatch[1]) * 60;
  const minMatch = lower.match(/(\d+)\s*(?:minuto|min\b)/);
  if (minMatch) return parseInt(minMatch[1]);
  return undefined;
}

function detectCategory(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('trabalho') || lower.includes('reunião') || lower.includes('reuniao') || lower.includes('projeto da empresa')) return 'Trabalho';
  if (lower.includes('estud') || lower.includes('prova') || lower.includes('trabalho da escola') || lower.includes('projeto da escola') || lower.includes('aula') || lower.includes('tarefa')) return 'Estudos';
  if (lower.includes('academia') || lower.includes('exercício') || lower.includes('exercicio') || lower.includes('treino')) return 'Academia';
  if (lower.includes('finanç') || lower.includes('financ') || lower.includes('pagar') || lower.includes('conta') || lower.includes('dinheiro')) return 'Finanças';
  if (lower.includes('projeto') && !lower.includes('escola')) return 'Projetos';
  if (lower.includes('pessoal') || lower.includes('família') || lower.includes('familia') || lower.includes('casa')) return 'Pessoal';
  return undefined;
}

export function analyzeTaskText(text: string): AISuggestion {
  const lower = text.toLowerCase();
  const suggestion: AISuggestion = { explanation: '' };

  const priority = parsePriority(text);
  if (priority) suggestion.priority = priority;

  const date = parseDate(text);
  if (date) suggestion.dueDate = date;

  const time = parseEstimatedTime(text);
  if (time) suggestion.estimatedTime = time;

  const category = detectCategory(text);
  if (category) suggestion.category = category;

  const subtasks = generateSubtasks(text);
  if (subtasks.length > 0) suggestion.subtasks = subtasks;

  const parts: string[] = [];
  if (priority) parts.push(`Prioridade sugerida: ${priority}`);
  if (date) parts.push(`Prazo sugerido: ${date}`);
  if (time) parts.push(`Tempo estimado: ${time} minutos`);
  if (category) parts.push(`Categoria sugerida: ${category}`);
  if (subtasks.length > 0) parts.push(`${subtasks.length} subtarefas sugeridas`);
  suggestion.explanation = parts.join(' • ') || 'Tarefa criada sem sugestões automáticas.';

  return suggestion;
}

function generateSubtasks(text: string): string[] {
  const lower = text.toLowerCase();

  if (lower.includes('projeto') || lower.includes('trabalho da escola') || lower.includes('projeto da escola')) {
    return ['Fazer pesquisa', 'Criar roteiro', 'Escrever conteúdo', 'Revisar', 'Entregar projeto'];
  }
  if (lower.includes('estud') && (lower.includes('prova') || lower.includes('exame'))) {
    return ['Revisar conteúdo', 'Fazer exercícios', 'Reler anotações', 'Simular prova'];
  }
  if (lower.includes('relatório') || lower.includes('relatorio')) {
    return ['Coletar dados', 'Analisar informações', 'Escrever introdução', 'Escrever conclusão', 'Revisar'];
  }
  if (lower.includes('apresenta') || lower.includes('slides') || lower.includes('pitch')) {
    return ['Definir tema', 'Criar slides', 'Ensaiar apresentação', 'Revisar conteúdo'];
  }
  if (lower.includes('mudar') || lower.includes('mudança') || lower.includes('mudanca')) {
    return ['Fazer inventário', 'Empacotar itens', 'Contratar transporte', 'Desempacotar'];
  }
  if (lower.includes('viajar') || lower.includes('viagem')) {
    return ['Definir destino', 'Reservar hospedagem', 'Comprar passagens', 'Fazer mala', 'Planejar roteiro'];
  }
  return [];
}

export function getPriorityScore(priority: Priority): number {
  return { baixa: 1, media: 2, alta: 3, urgente: 4 }[priority];
}

export function suggestTaskOrder(tasks: Task[]): Task[] {
  return [...tasks]
    .filter((t) => t.status === 'pendente')
    .sort((a, b) => {
      const aOverdue = isOverdue(a) ? 1 : 0;
      const bOverdue = isOverdue(b) ? 1 : 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;

      const aScore = getPriorityScore(a.priority);
      const bScore = getPriorityScore(b.priority);
      if (aScore !== bScore) return bScore - aScore;

      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });
}

export interface ParsedDayTask {
  title: string;
  period: PlannedPeriod;
  category?: string;
}

export function parseDayMessage(text: string): ParsedDayTask[] {
  const lower = text.toLowerCase();
  if (!lower.includes('dia:') && !lower.includes('dia ') && !lower.includes('manhã') && !lower.includes('manha') && !lower.includes('tarde') && !lower.includes('noite')) {
    return [];
  }

  const periodMap: Record<string, PlannedPeriod> = {
    'manhã': 'manha', 'manha': 'manha',
    'tarde': 'tarde',
    'noite': 'noite',
  };

  const periodLabels = ['manhã', 'manha', 'tarde', 'noite'];
  const tasks: ParsedDayTask[] = [];

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let currentPeriod: PlannedPeriod | null = null;

  for (const line of lines) {
    const lineLower = line.toLowerCase();

    let foundPeriod = false;
    for (const label of periodLabels) {
      if (lineLower.includes(label)) {
        currentPeriod = periodMap[label];
        foundPeriod = true;
        break;
      }
    }

    if (foundPeriod) {
      const afterColon = line.split(':').slice(1).join(':').trim();
      if (afterColon) {
        const items = afterColon.split('+').map((s) => s.trim()).filter(Boolean);
        for (const item of items) {
          const cat = detectCategory(item);
          tasks.push({ title: capitalize(item), period: currentPeriod!, category: cat });
        }
      }
      continue;
    }

    if (currentPeriod) {
      const afterColon = line.includes(':') ? line.split(':').slice(1).join(':').trim() : line;
      if (afterColon) {
        const items = afterColon.split('+').map((s) => s.trim()).filter(Boolean);
        for (const item of items) {
          const cat = detectCategory(item);
          tasks.push({ title: capitalize(item), period: currentPeriod, category: cat });
        }
      }
    }
  }

  if (tasks.length === 0) return [];
  return tasks;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface AIResponse {
  text: string;
  actions?: { label: string; taskId?: string }[];
  parsedDayTasks?: ParsedDayTask[];
}

function parseTimeQuery(text: string): { hour: number; minute: number } | null {
  const lower = text.toLowerCase().trim();

  const hmMatch = lower.match(/(\d{1,2}):(\d{2})/);
  if (hmMatch) {
    const h = parseInt(hmMatch[1]);
    const m = parseInt(hmMatch[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return { hour: h, minute: m };
  }

  const hMatch = lower.match(/(\d{1,2})\s*(h|hs|horas|hr)\b/);
  if (hMatch) {
    const h = parseInt(hMatch[1]);
    if (h >= 0 && h <= 23) return { hour: h, minute: 0 };
  }

  const ampmMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(da\s*(manhã|manha|tarde|noite)|am|pm)/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1]);
    const m = ampmMatch[2] ? parseInt(ampmMatch[2]) : 0;
    const suffix = ampmMatch[3] ?? ampmMatch[5];
    if (suffix.includes('tarde') || suffix.includes('noite') || suffix === 'pm') {
      if (h < 12) h += 12;
    } else if (suffix.includes('manhã') || suffix.includes('manha') || suffix === 'am') {
      if (h === 12) h = 0;
    }
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return { hour: h, minute: m };
  }

  const periodMap: Record<string, { hour: number; minute: number }> = {
    'manhã': { hour: 9, minute: 0 }, 'manha': { hour: 9, minute: 0 },
    'tarde': { hour: 14, minute: 0 },
    'noite': { hour: 19, minute: 0 },
  };
  for (const [word, time] of Object.entries(periodMap)) {
    if (lower.includes(`pela ${word}`) || lower.includes(`de ${word}`) || lower.includes(`no ${word}`) || lower.includes(`na ${word}`)) {
      return time;
    }
  }

  return null;
}

function formatTimeLabel(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export function askAssistant(question: string, tasks: Task[]): AIResponse {
  const lower = question.toLowerCase().trim();

  const parsedDayTasks = parseDayMessage(question);
  if (parsedDayTasks.length > 0) {
    const lines = parsedDayTasks.map((t) => {
      const periodLabel = t.period === 'manha' ? 'Manhã' : t.period === 'tarde' ? 'Tarde' : 'Noite';
      return `• ${periodLabel}: ${t.title}${t.category ? ` (${t.category})` : ''}`;
    });
    return {
      text: `Entendi! Vou criar ${parsedDayTasks.length} tarefa(s) no seu planejador do dia:\n\n${lines.join('\n')}\n\nCriando agora...`,
      parsedDayTasks,
    };
  }

  const timeQuery = parseTimeQuery(question);
  if (timeQuery && (lower.includes('tarefa') || lower.includes('fazer') || lower.includes('tenho') || lower.includes('marcado') || lower.includes('agendad'))) {
    const queryTime = timeQuery.hour * 60 + timeQuery.minute;
    const timeLabel = formatTimeLabel(timeQuery.hour, timeQuery.minute);

    const withTime = tasks.filter((t) => t.due_time && t.status === 'pendente');
    const periodOnly = tasks.filter((t) => !t.due_time && t.status === 'pendente' && t.planned_period);

    const matching: Task[] = [];

    for (const t of withTime) {
      const [h, m] = t.due_time!.split(':').map(Number);
      const taskMinutes = h * 60 + m;
      if (Math.abs(taskMinutes - queryTime) <= 30) {
        matching.push(t);
      }
    }

    let periodMatch: 'manha' | 'tarde' | 'noite' | null = null;
    if (timeQuery.hour < 12) periodMatch = 'manha';
    else if (timeQuery.hour < 18) periodMatch = 'tarde';
    else periodMatch = 'noite';

    for (const t of periodOnly) {
      if (t.planned_period === periodMatch) {
        matching.push(t);
      }
    }

    if (matching.length === 0) {
      return { text: `Não há tarefas agendadas para próximo de ${timeLabel}.\n\nVocê pode adicionar tarefas com horário específico ao criá-las, ou usar o planejador por período (manhã, tarde, noite).` };
    }

    const lines = matching.map((t, i) => {
      const parts = [`${i + 1}. ${t.title}`];
      if (t.due_time) parts.push(`às ${t.due_time}`);
      else if (t.planned_period) {
        const pl = t.planned_period === 'manha' ? 'manhã' : t.planned_period;
        parts.push(`(${pl})`);
      }
      if (t.priority === 'urgente' || t.priority === 'alta') parts.push(`— ${t.priority}`);
      return parts.join(' ');
    });

    return {
      text: `Aqui estão suas tarefas para próximo de ${timeLabel}:\n\n${lines.join('\n')}\n\nVocê tem ${matching.length} tarefa(s) nesse horário.`,
    };
  }

  const pending = tasks.filter((t) => t.status === 'pendente');
  const overdue = tasks.filter((t) => isOverdue(t));
  const today = tasks.filter((t) => t.due_date === todayString() && t.status === 'pendente');
  const completed = tasks.filter((t) => t.status === 'concluida');

  if (lower.includes('o que') && (lower.includes('fazer hoje') || lower.includes('fazer agora')) || lower.includes('organize meu dia') || lower.includes('organize a minha dia') || lower.includes('organiza meu dia')) {
    if (today.length === 0 && overdue.length === 0) {
      return { text: 'Você não tem tarefas para hoje. Aproveite para planejar seus próximos passos ou adicionar novas tarefas.' };
    }
    const ordered = suggestTaskOrder([...today, ...overdue]);
    const lines = ordered.slice(0, 8).map((t, i) => {
      const parts = [`${i + 1}. ${t.title}`];
      if (t.priority === 'urgente' || t.priority === 'alta') parts.push(`(${t.priority})`);
      if (isOverdue(t)) parts.push('— atrasada');
      return parts.join(' ');
    });
    return {
      text: `Aqui está sua programação sugerida para hoje:\n\n${lines.join('\n')}\n\nVocê tem ${today.length} tarefa(s) para hoje e ${overdue.length} atrasada(s). Comece pelas de maior prioridade.`,
    };
  }

  if (lower.includes('prioriz') || lower.includes('prioridade') || lower.includes('mais importante') || lower.includes('o que eu devo fazer primeiro')) {
    const ordered = suggestTaskOrder(pending);
    if (ordered.length === 0) return { text: 'Você não tem tarefas pendentes. Tudo em dia!' };
    const top = ordered.slice(0, 5);
    const lines = top.map((t, i) => `${i + 1}. ${t.title} — ${t.priority}${isOverdue(t) ? ' (atrasada)' : ''}`);
    return { text: `Recomendo priorizar estas tarefas:\n\n${lines.join('\n')}\n\nFoque primeiro nas urgentes e atrasadas.` };
  }

  if (lower.includes('atrasa')) {
    if (overdue.length === 0) return { text: 'Você não tem tarefas atrasadas. Continue assim!' };
    const lines = overdue.map((t) => `• ${t.title} — vencia ${t.due_date}`);
    return { text: `Você tem ${overdue.length} tarefa(s) atrasada(s):\n\n${lines.join('\n')}\n\nRecomendo priorizar estas tarefas o quanto antes.` };
  }

  if (lower.includes('divida') || lower.includes('dividir') || lower.includes('subtarefa') || lower.includes('etapa')) {
    return {
      text: 'Para dividir uma tarefa em etapas menores, abra a tarefa e clique em "Adicionar subtarefa".\n\nDica: divida tarefas grandes em passos que levem no máximo 30-60 minutos cada. Isso mantém o foco e dá uma sensação de progresso constante.\n\nExemplo para "Terminar projeto da escola":\n1. Fazer pesquisa\n2. Criar roteiro\n3. Escrever conteúdo\n4. Revisar\n5. Entregar projeto',
    };
  }

  if (lower.includes('conflito') || lower.includes('sobrecarga') || lower.includes('muitas tarefas')) {
    const byDate = new Map<string, number>();
    pending.forEach((t) => {
      if (t.due_date) byDate.set(t.due_date, (byDate.get(t.due_date) ?? 0) + 1);
    });
    const conflicts = [...byDate.entries()].filter(([, c]) => c > 3).sort((a, b) => a[0].localeCompare(b[0]));
    if (conflicts.length === 0) return { text: 'Não detectei conflitos de prazos. Sua agenda está equilibrada.' };
    const lines = conflicts.map(([date, count]) => `• ${date}: ${count} tarefas`);
    return { text: `Detectei possíveis conflitos de prazo:\n\n${lines.join('\n')}\n\nConsidere redistribuir algumas tarefas ou adiantar as mais importantes.` };
  }

  if (lower.includes('produtiv') || lower.includes('dica') || lower.includes('recomenda')) {
    const rate = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
    const tips: string[] = [];
    if (overdue.length > 0) tips.push(`Você tem ${overdue.length} tarefa(s) atrasada(s). Priorize concluí-las hoje.`);
    if (today.length > 5) tips.push(`Você tem ${today.length} tarefas para hoje. Considere adiar as de menor prioridade.`);
    tips.push('Tente a técnica Pomodoro: 25 minutos de foco, 5 de descanso.');
    tips.push('Comece o dia com a tarefa mais difícil — o resto parecerá mais fácil.');
    tips.push(`Sua taxa de conclusão atual é ${rate}%.`);
    return { text: `Aqui estão algumas recomendações de produtividade:\n\n${tips.map((t) => `• ${t}`).join('\n')}` };
  }

  if (lower.includes('resumo') || lower.includes('status') || lower.includes('como estou')) {
    return {
      text: `Aqui está seu resumo:\n\n• Total de tarefas: ${tasks.length}\n• Pendentes: ${pending.length}\n• Concluídas: ${completed.length}\n• Atrasadas: ${overdue.length}\n• Para hoje: ${today.length}\n\n${overdue.length > 0 ? 'Atenção às tarefas atrasadas!' : 'Você está no caminho certo!'}`,
    };
  }

  return {
    text: `Posso ajudar com:\n\n• "O que eu devo fazer hoje?"\n• "Quais tarefas devo priorizar?"\n• "Quais tarefas estão atrasadas?"\n• "Organize meu dia."\n• "Que tarefas tenho às 14:00?"\n• "O que tenho marcado pela tarde?"\n• "Divida essa tarefa em etapas menores."\n• "Há conflitos de prazo?"\n• "Dicas de produtividade"\n• "Resumo das minhas tarefas"\n\nPergunte em português e eu analisarei suas tarefas.`,
  };
}
