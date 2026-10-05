import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  KeyRound,
  Edit2,
  Trash2,
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SystemUser } from '../types';

export default function UsersManagement() {
  const {
    currentUser,
    isCoordinator,
    users,
    loadUsers,
    createUser,
    updateUser,
    resetUserPassword,
    deleteUser
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Form states
  const [targetUser, setTargetUser] = useState<SystemUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'USUARIO' as 'COORDENADOR' | 'USUARIO'
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Access check: only COORDENADOR can access
  if (!isCoordinator) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Acesso Restrito ao Coordenador</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          O módulo de gerenciamento de usuários e redefinição de senhas é exclusivo para o perfil <strong>COORDENADOR</strong> do Hospital Psiquiátrico São Vicente de Paulo.
        </p>
      </div>
    );
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setActionMessage({ type: 'error', text: 'A confirmação de senha não confere.' });
      return;
    }

    if (formData.password.length < 4) {
      setActionMessage({ type: 'error', text: 'A senha deve conter no mínimo 4 caracteres.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser({
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        password: formData.password,
        role: formData.role
      });
      setActionMessage({ type: 'success', text: `Usuário "${formData.name}" cadastrado com sucesso!` });
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: 'USUARIO'
      });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Erro ao cadastrar usuário.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setActionMessage(null);

    setIsSubmitting(true);
    try {
      await updateUser(targetUser.id, {
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        role: formData.role
      });
      setActionMessage({ type: 'success', text: `Dados de "${formData.name}" atualizados com sucesso!` });
      setIsEditModalOpen(false);
      setTargetUser(null);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Erro ao atualizar dados do usuário.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setActionMessage(null);

    if (newPassword !== confirmNewPassword) {
      setActionMessage({ type: 'error', text: 'A confirmação da nova senha não confere.' });
      return;
    }

    if (newPassword.length < 4) {
      setActionMessage({ type: 'error', text: 'A nova senha deve possuir no mínimo 4 caracteres.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await resetUserPassword(targetUser.id, newPassword);
      setActionMessage({ type: 'success', text: `Senha de "${targetUser.name}" redefinida com sucesso!` });
      setIsResetModalOpen(false);
      setNewPassword('');
      setConfirmNewPassword('');
      setTargetUser(null);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Erro ao redefinir senha.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: SystemUser) => {
    if (user.id === currentUser?.id) {
      alert('Você não pode excluir a sua própria conta logada.');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o usuário "${user.name}" (${user.username})? Esta ação não pode ser desfeita.`)) {
      try {
        await deleteUser(user.id);
        setActionMessage({ type: 'success', text: `Usuário "${user.name}" excluído com sucesso.` });
      } catch (err: any) {
        setActionMessage({ type: 'error', text: err.message || 'Erro ao excluir usuário.' });
      }
    }
  };

  const openEdit = (u: SystemUser) => {
    setTargetUser(u);
    setFormData({
      name: u.name,
      username: u.username,
      password: '',
      confirmPassword: '',
      role: u.role
    });
    setIsEditModalOpen(true);
  };

  const openResetPassword = (u: SystemUser) => {
    setTargetUser(u);
    setNewPassword('');
    setConfirmNewPassword('');
    setIsResetModalOpen(true);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setConfirmNewPassword(pass);
  };

  const filteredUsers = users.filter(
    u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Controle de Acessos & Segurança</span>
            <span aria-hidden="true">·</span>
            <span>Gestão de Credenciais</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gerenciador de Senhas & Usuários
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Módulo restrito ao <strong>Coordenador Farmacêutico</strong> para cadastro, edição, exclusão e redefinição de senhas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadUsers()}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors text-xs font-semibold shadow-sm"
            title="Atualizar lista de usuários"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setFormData({
                name: '',
                username: '',
                password: '',
                confirmPassword: '',
                role: 'USUARIO'
              });
              setIsCreateModalOpen(true);
            }}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg flex items-center space-x-2 transition-colors text-xs font-semibold shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Action Feedback Message */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs underline hover:no-underline opacity-80"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Quick Search & Summary */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, login ou perfil..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Coordenadores:</span>
            <strong className="font-mono tabular-nums text-slate-900">
              {users.filter(u => u.role === 'COORDENADOR').length}
            </strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Usuários Operacionais:</span>
            <strong className="font-mono tabular-nums text-slate-900">
              {users.filter(u => u.role === 'USUARIO').length}
            </strong>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Nome do Colaborador</th>
                <th className="px-6 py-3.5">Login / Usuário</th>
                <th className="px-6 py-3.5">Perfil de Acesso</th>
                <th className="px-6 py-3.5">Criado em</th>
                <th className="px-6 py-3.5">Último Acesso</th>
                <th className="px-6 py-3.5 text-right">Ações de Segurança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(u => {
                const isSelf = u.id === currentUser?.id;
                const isCoord = u.role === 'COORDENADOR';
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{u.name}</span>
                        {isSelf && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                            Você
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">
                      @{u.username}
                    </td>
                    <td className="px-6 py-4">
                      {isCoord ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-300">
                          <Shield className="w-3.5 h-3.5 text-amber-600" />
                          COORDENADOR
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          USUÁRIO
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono tabular-nums">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono tabular-nums">
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })
                        : 'Nunca acessou'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => openResetPassword(u)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                        title="Redefinir senha de acesso"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>Resetar Senha</span>
                      </button>

                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 transition-colors"
                        title="Editar dados cadastrais"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u)}
                        disabled={isSelf}
                        className={`p-1.5 rounded transition-colors ${
                          isSelf
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-rose-600 hover:text-rose-800 hover:bg-rose-50'
                        }`}
                        title={isSelf ? 'Você não pode excluir sua própria conta' : 'Excluir usuário'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Criar Novo Usuário */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md my-8 border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>Cadastrar Novo Usuário</span>
              </h3>
              <span className="text-xs text-slate-400">Controle de Acessos</span>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo do Colaborador *
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                  placeholder="Ex: Dra. Camila Rocha"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login de Acesso (Username único) *
                </label>
                <input
                  required
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-blue-600"
                  placeholder="Ex: camila.rocha"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Perfil de Acesso *
                </label>
                <select
                  value={formData.role}
                  onChange={e =>
                    setFormData({ ...formData, role: e.target.value as 'COORDENADOR' | 'USUARIO' })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white outline-none focus:border-blue-600 font-semibold text-slate-800"
                >
                  <option value="USUARIO">USUÁRIO (Operação e Dispensação de Medicamentos)</option>
                  <option value="COORDENADOR">COORDENADOR (Acesso Total + Gestão de Usuários e Senhas)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Senha Inicial *
                  </label>
                  <input
                    required
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600 font-mono"
                    placeholder="Mín. 4 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirmar Senha *
                  </label>
                  <input
                    required
                    type="password"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600 font-mono"
                    placeholder="Repita a senha"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Editar Usuário */}
      {isEditModalOpen && targetUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md my-8 border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <span>Editar Dados do Usuário</span>
              </h3>
              <span className="text-xs text-slate-400">ID: {targetUser.id.substring(0, 8)}...</span>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login de Acesso *
                </label>
                <input
                  required
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Perfil de Acesso *
                </label>
                <select
                  value={formData.role}
                  onChange={e =>
                    setFormData({ ...formData, role: e.target.value as 'COORDENADOR' | 'USUARIO' })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white outline-none focus:border-blue-600 font-semibold text-slate-800"
                >
                  <option value="USUARIO">USUÁRIO (Operação e Dispensação)</option>
                  <option value="COORDENADOR">COORDENADOR (Acesso Total + Gestão de Senhas)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Resetar / Alterar Senha */}
      {isResetModalOpen && targetUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md my-8 border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>Resetar Senha de Acesso</span>
              </h3>
              <span className="text-xs text-slate-400">@{targetUser.username}</span>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mb-4">
              Você está definindo uma nova senha para o colaborador <strong>{targetUser.name}</strong>.
              Ele precisará usar esta nova senha no próximo login.
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Nova Senha *</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-semibold text-blue-700 hover:text-blue-900"
                  >
                    Gerar Senha Aleatória
                  </button>
                </div>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-xs font-mono outline-none focus:border-blue-600"
                    placeholder="Mínimo 4 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmar Nova Senha *
                </label>
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-blue-600"
                  placeholder="Repita a nova senha"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Redefinindo...' : 'Salvar Nova Senha'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
