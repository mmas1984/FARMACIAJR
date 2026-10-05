import React, { useState } from 'react';
import { Pill, Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Preencha seu login e sua senha para acessar.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar. Verifique usuário e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 font-sans text-slate-100 relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 mb-4 border border-blue-400/30">
            <Pill className="w-7 h-7" />
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-400 mb-1 tracking-wider uppercase">
            <span>Hospital Psiquiátrico São Vicente de Paulo</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Farmacêutico Sales Júnior
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Sistema de Gestão & Rastreabilidade de Medicamentos de Controle Especial (Portaria 344/98 - Anvisa)
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>Autenticação de Acesso Seguro</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              v2.4
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-800/80 text-rose-200 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Usuário / Login
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Seu login de usuário"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                  tabIndex={-1}
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Demonstration Quick Fill Cards */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 mb-2.5 uppercase tracking-wider">
              Contas de Acesso Pré-configuradas:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('coordenador', 'admin123')}
                className="p-2.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-amber-400 group-hover:text-amber-300">
                    COORDENADOR
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">admin123</span>
                </div>
                <div className="text-[11px] text-slate-300">coordenador</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Acesso Total + Gestão de Senhas
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('operador', 'user123')}
                className="p-2.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-blue-400 group-hover:text-blue-300">
                    USUÁRIO
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">user123</span>
                </div>
                <div className="text-[11px] text-slate-300">operador</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Operação & Dispensação
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Legal Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Controle de Acesso em conformidade com Portaria 344/98 - Anvisa</span>
        </div>
      </div>
    </div>
  );
}
