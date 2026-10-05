import React, { useState } from 'react';
import { Trash2, Edit2, Plus, Users, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { Collaborator } from '../types';

export default function Collaborators() {
  const {
    collaborators,
    addCollaborator,
    updateCollaborator,
    deleteCollaborator,
    isGoogleConnected,
    spreadsheetUrl
  } = usePharmacy();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Collaborator>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateCollaborator(editingId, formData);
      } else {
        await addCollaborator({
          name: formData.name || '',
          cpf: formData.cpf || '',
          role: formData.role || '',
          crf: formData.crf || '',
          accessLevel: formData.accessLevel || 'Nurse'
        });
      }
      setIsModalOpen(false);
      setFormData({});
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar colaborador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Confirma a exclusão do colaborador "${name}"?`)) {
      await deleteCollaborator(id);
    }
  };

  const openEdit = (collab: Collaborator) => {
    setFormData(collab);
    setEditingId(collab.id);
    setIsModalOpen(true);
  };

  const getAccessBadge = (level: string) => {
    switch (level) {
      case 'Admin':
        return <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-purple-100 text-purple-800">Administrador Geral</span>;
      case 'Pharmacist':
        return <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">Farmacêutico Responsável</span>;
      case 'Nurse':
        return <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Enfermagem / Retirada</span>;
      default:
        return <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-800">{level}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Controle de Acesso Hospitalar</span>
            <span aria-hidden="true">·</span>
            <span>CRF & Responsabilidade Técnica</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Colaboradores & Profissionais
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isGoogleConnected && spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ver na Planilha</span>
            </a>
          )}
          <button
            onClick={() => {
              setFormData({ accessLevel: 'Pharmacist' });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg flex items-center space-x-2 transition-colors text-xs font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Colaborador</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Nome Completo</th>
                <th className="px-6 py-3.5">CPF</th>
                <th className="px-6 py-3.5">Cargo / Função</th>
                <th className="px-6 py-3.5">Registro de Classe (CRF / COREN)</th>
                <th className="px-6 py-3.5">Nível de Acesso</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {collaborators.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{c.name}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono tabular-nums">{c.cpf}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{c.role}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono">{c.crf || '—'}</td>
                  <td className="px-6 py-4">{getAccessBadge(c.accessLevel)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {collaborators.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum colaborador cadastrado no sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-3">
              {editingId ? 'Editar Colaborador' : 'Novo Colaborador'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  required
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                  placeholder="Ex: Dr. Roberto Alencar"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CPF *
                </label>
                <input
                  required
                  type="text"
                  value={formData.cpf || ''}
                  onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargo / Função *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.role || ''}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                    placeholder="Ex: Farmacêutico"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CRF / COREN
                  </label>
                  <input
                    type="text"
                    value={formData.crf || ''}
                    onChange={e => setFormData({ ...formData, crf: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                    placeholder="CRF-SP 00000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nível de Acesso *
                </label>
                <select
                  required
                  value={formData.accessLevel || 'Nurse'}
                  onChange={e => setFormData({ ...formData, accessLevel: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white outline-none focus:border-blue-600 font-medium"
                >
                  <option value="Pharmacist">Farmacêutico Coordenador (Acesso Completo)</option>
                  <option value="Admin">Administrador Hospitalar</option>
                  <option value="Nurse">Enfermeiro(a) / Retirada Autorizada</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
