import { useState, useEffect } from 'react';
import { CheckSquare, Mail, Lock, User, ArrowRight, Sparkles, Calendar, BarChart3, Bot, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Spinner } from '@/components/tf-ui';
import DotField from './DotField.jsx';

type Mode = 'login' | 'signup' | 'verify' | 'reset' | 'newpassword';

export function AuthScreen() {
  const { signIn, signUp, resetPassword, sendOtp, verifyOtp, updatePassword, passwordRecovery, clearPasswordRecovery } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (passwordRecovery) {
      setMode('newpassword');
    }
  }, [passwordRecovery]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === 'signup' && !name.trim()) e.name = 'Nome é obrigatório';
    if (mode !== 'verify' && mode !== 'newpassword') {
      if (!email) e.email = 'E-mail é obrigatório';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'E-mail inválido';
    }
    if (mode === 'login' || mode === 'signup') {
      if (!password) e.password = 'Senha é obrigatória';
      else if (password.length < 6) e.password = 'Mínimo de 6 caracteres';
    }
    if (mode === 'verify') {
      if (!code.trim()) e.code = 'Código é obrigatório';
      else if (!/^\d{6}$/.test(code.trim())) e.code = 'Digite os 6 dígitos';
    }
    if (mode === 'newpassword') {
      if (!newPassword) e.newPassword = 'Senha é obrigatória';
      else if (newPassword.length < 6) e.newPassword = 'Mínimo de 6 caracteres';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          showToast(error, 'error');
        } else {
          showToast('Bem-vindo de volta!', 'success');
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, name.trim());
        if (error) {
          showToast(error, 'error');
        } else {
          setCode('');
          setMode('verify');
        }
      } else if (mode === 'verify') {
        const { error } = await verifyOtp(email, code.trim());
        if (error) {
          showToast(error, 'error');
        } else {
          showToast('E-mail verificado! Fazendo login...', 'success');
          const { error: loginError } = await signIn(email, password);
          if (loginError) {
            showToast('E-mail verificado! Faça login para continuar.', 'success');
            setMode('login');
          }
        }
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email);
        if (error) showToast(error, 'error');
        else {
          showToast('E-mail de recuperação enviado! Verifique sua caixa de entrada.', 'success');
          setMode('login');
        }
      } else if (mode === 'newpassword') {
        const { error } = await updatePassword(newPassword);
        if (error) {
          showToast(error, 'error');
        } else {
          showToast('Senha atualizada com sucesso!', 'success');
          clearPasswordRecovery();
          setNewPassword('');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const { error } = await sendOtp(email);
      if (error) {
        showToast(error, 'error');
      } else {
        showToast('Novo código enviado!', 'success');
      }
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Mode, string> = {
    login: 'Entrar',
    signup: 'Criar conta',
    verify: 'Verifique seu e-mail',
    reset: 'Recuperar senha',
    newpassword: 'Nova senha',
  };

  const subtitles: Record<Mode, string> = {
    login: 'Acesse sua conta para continuar',
    signup: 'Comece a organizar suas tarefas hoje',
    verify: `Enviamos um código de 6 dígitos para ${email}. Digite-o abaixo para validar sua conta.`,
    reset: 'Enviaremos um link para seu e-mail',
    newpassword: 'Digite sua nova senha para acessar sua conta',
  };

  const buttonLabels: Record<Mode, string> = {
    login: 'Entrar',
    signup: 'Criar conta',
    verify: 'Verificar código',
    reset: 'Enviar link',
    newpassword: 'Atualizar senha',
  };

  return (
    <div className="relative min-h-screen flex overflow-hidden bg-black text-white">
      {/* Background Animado DotField */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <DotField
          dotRadius={1.5}
          dotSpacing={14}
          cursorRadius={500}
          cursorForce={0.1}
          bulgeOnly
          bulgeStrength={75}
          glowRadius={100}
          sparkle={false}
          waveAmplitude={0}
          gradientFrom="#16a34a"
          gradientTo="#16a34a"
          glowColor="#120F17"
        />
      </div>

      {/* Painel Esquerdo - Branding */}
      <div className="hidden lg:flex flex-1 bg-emerald-700/80 backdrop-blur-md relative z-10 overflow-hidden border-r border-white/10">
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <CheckSquare className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">TaskFlow</h1>
              <p className="text-white/70 text-sm">Gestão inteligente de tarefas</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Organize seu dia.<br />Conquiste suas metas.
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-md">
            Um assistente de produtividade completo que ajuda você a priorizar, planejar e executar suas tarefas com inteligência.
          </p>
          <div className="space-y-4">
            {[
              { icon: Sparkles, text: 'Assistente IA para sugerir prioridades e organizar seu dia' },
              { icon: Calendar, text: 'Calendário e planejador diário com arrastar e soltar' },
              { icon: BarChart3, text: 'Análises de produtividade com gráficos detalhados' },
              { icon: Bot, text: 'Divisão automática de tarefas em subtarefas' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-center gap-3 text-white/90">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-sm">{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Painel Direito - Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">TaskFlow</h1>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            {titles[mode]}
          </h2>
          <p className="text-sm text-zinc-400 mb-6 break-words">
            {subtitles[mode]}
          </p>

          <div className="space-y-4">
            {mode === 'signup' && (
              <div>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
                  <input
                    type="text"
                    className="input pl-11 bg-zinc-900/80 border-zinc-800 text-white placeholder-zinc-500"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
            )}

            {mode !== 'verify' && mode !== 'newpassword' && (
              <div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
                  <input
                    type="email"
                    className="input pl-11 bg-zinc-900/80 border-zinc-800 text-white placeholder-zinc-500"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
                  <input
                    type="password"
                    className="input pl-11 bg-zinc-900/80 border-zinc-800 text-white placeholder-zinc-500"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                  />
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>
            )}

            {mode === 'verify' && (
              <div>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="input pl-11 text-center text-lg tracking-[0.5em] font-semibold bg-zinc-900/80 border-zinc-800 text-white placeholder-zinc-500"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                    autoFocus
                  />
                </div>
                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
              </div>
            )}

            {mode === 'newpassword' && (
              <div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
                  <input
                    type="password"
                    className="input pl-11 bg-zinc-900/80 border-zinc-800 text-white placeholder-zinc-500"
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                    autoFocus
                  />
                </div>
                {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full py-3 bg-emerald-600 hover:bg-emerald-500 transition-colors">
              {loading ? <Spinner className="h-5 w-5" /> : (
                <>
                  {buttonLabels[mode]}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-zinc-400">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('reset')} className="text-emerald-500 hover:underline">
                  Esqueceu sua senha?
                </button>
                <p className="mt-3">
                  Não tem conta?{' '}
                  <button onClick={() => setMode('signup')} className="text-emerald-500 font-medium hover:underline">
                    Cadastre-se
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p>
                Já tem conta?{' '}
                <button onClick={() => setMode('login')} className="text-emerald-500 font-medium hover:underline">
                  Entrar
                </button>
              </p>
            )}
            {mode === 'verify' && (
              <>
                <p>
                  Não recebeu o código?{' '}
                  <button onClick={handleResendCode} disabled={loading} className="text-emerald-500 font-medium hover:underline disabled:opacity-50">
                    Reenviar código
                  </button>
                </p>
                <p className="mt-3">
                  <button onClick={() => setMode('login')} className="text-emerald-500 font-medium hover:underline">
                    Voltar para login
                  </button>
                </p>
              </>
            )}
            {mode === 'reset' && (
              <p>
                <button onClick={() => setMode('login')} className="text-emerald-500 font-medium hover:underline">
                  Voltar para login
                </button>
              </p>
            )}
            {mode === 'newpassword' && (
              <p className="text-xs">
                Após atualizar sua senha, você será redirecionado para o app.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}