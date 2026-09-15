import { useMemo } from 'react';
import { Bell, CheckCheck, Clock, AlertTriangle, Star, CalendarClock, BellOff } from 'lucide-react';
import { useTask } from '@/contexts/TaskContext';
import { useToast } from '@/contexts/ToastContext';
import { EmptyState } from '@/components/tf-ui';
import { NOTIFICATION_TYPE_LABELS, type NotificationType } from '@/types';
import { relativeDate } from '@/lib/date';

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  prazo: { icon: CalendarClock, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  atrasada: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  importante: { icon: Star, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  lembrete: { icon: Clock, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  agendada: { icon: Bell, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' },
};

export function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useTask();
  const { showToast } = useToast();

  const sorted = useMemo(() => {
    return [...notifications].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [notifications]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Notificações</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {unread > 0 ? `${unread} não lida(s)` : 'Tudo em dia!'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={() => { markAllNotificationsRead(); showToast('Todas marcadas como lidas.', 'success'); }} className="btn-secondary text-xs">
            <CheckCheck className="h-4 w-4" /> Marcar todas como lidas
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={<BellOff className="h-10 w-10" />}
          title="Nenhuma notificação"
          message="Você não tem notificações no momento. Próximos prazos e tarefas importantes aparecerão aqui."
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((notif) => {
            const config = TYPE_CONFIG[notif.type];
            const Icon = config.icon;
            return (
              <div
                key={notif.id}
                className={`card p-4 flex items-start gap-3 transition-all cursor-pointer hover:shadow-md ${notif.read ? 'opacity-60' : ''}`}
                onClick={() => { if (!notif.read) markNotificationRead(notif.id); }}
              >
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">{notif.title}</h3>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />}
                  </div>
                  {notif.message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{notif.message}</p>}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{NOTIFICATION_TYPE_LABELS[notif.type]}</span>
                    <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{relativeDate(notif.created_at.split('T')[0])}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
