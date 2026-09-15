import { useState } from 'react';
import { Moon, Sun, Bell, LogOut, User, Keyboard, Globe } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmDialog } from '@/components/tf-ui/ConfirmDialog';

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = async () => {
    await signOut();
    showToast('Sessão encerrada. Até logo!', 'success');
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto pb-24 lg:pb-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h2>

      {/* Profile */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <User className="h-4 w-4" /> Perfil
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center text-white text-xl font-bold">
            {(user?.user_metadata?.name ?? user?.email ?? 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.user_metadata?.name ?? user?.email ?? 'Usuário'}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Conta pessoal</p>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Sun className="h-4 w-4" /> Aparência
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'light' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-green-400" />}
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Tema</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{theme === 'light' ? 'Modo claro' : 'Modo escuro'}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-green-600' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications settings */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4" /> Notificações
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Próximos prazos', desc: 'Avisar quando uma tarefa estiver próxima do vencimento', enabled: true },
            { label: 'Tarefas atrasadas', desc: 'Avisar quando uma tarefa estiver atrasada', enabled: true },
            { label: 'Tarefas importantes', desc: 'Notificar sobre tarefas de alta prioridade', enabled: true },
            { label: 'Lembretes diários', desc: 'Resumo diário das tarefas do dia', enabled: false },
            { label: 'Tarefas agendadas', desc: 'Lembrete antes de tarefas agendadas', enabled: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{item.desc}</p>
              </div>
              <Toggle defaultOn={item.enabled} />
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Keyboard className="h-4 w-4" /> Atalhos do teclado
        </h3>
        <div className="space-y-2">
          {[
            { keys: 'N', action: 'Nova tarefa' },
            { keys: '/', action: 'Buscar tarefas' },
            { keys: 'Esc', action: 'Fechar modal' },
            { keys: 'Ctrl + K', action: 'Abrir assistente IA' },
          ].map((shortcut) => (
            <div key={shortcut.keys} className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">{shortcut.action}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#303030] text-xs font-mono text-slate-600 dark:text-slate-300">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4" /> Idioma
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-300">Português (Brasil)</span>
          <span className="badge bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Ativo</span>
        </div>
      </div>

      {/* Logout */}
      <div className="card p-5">
        <button onClick={() => setConfirmLogout(true)} className="w-full flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl p-3 transition-colors">
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Sair da conta</span>
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 dark:text-slate-600">TaskFlow v1.0 • Feito com dedicação</p>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Sair da conta"
        message="Tem certeza que deseja encerrar sua sessão?"
        confirmLabel="Sair"
        danger
      />
    </div>
  );
}

function Toggle({ defaultOn }: { defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative w-12 h-6 rounded-full transition-colors ${on ? 'bg-green-600' : 'bg-slate-300 dark:bg-[#303030]'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-6' : ''}`} />
    </button>
  );
}
