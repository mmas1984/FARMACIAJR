import React, { useState } from 'react';
import { Trash2, Edit2, Plus, Building2, MapPin, User, FileSpreadsheet } from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { Unit } from '../types';

export default function Units() {
  const {
    units,
    addUnit,
    updateUnit,
    deleteUnit,
    isGoogleConnected,
    spreadsheetUrl
  } = usePharmacy();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Unit>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateUnit(editingId, formData);
      } else {
        await addUnit({
          name: formData.name || '',
          location: formData.location || '',
          responsible: formData.responsible || ''
        });
      }
      setIsModalOpen(false);
      setFormData({});
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar unidade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Confirma a exclusão da unidade "${name}"?`)) {
      await deleteUnit(id);
    }
  };

  const openEdit = (unit: Unit) => {
    setFormData(unit);
    setEditingId(unit.id);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Estrutura Hospitalar</span>
            <span aria-hidden="true">·</span>
            <span>Locais de Armazenamento & Destino</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Unidades Administrativas & Setores
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
              setFormData({});
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg flex items-center space-x-2 transition-colors text-xs font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Unidade</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Nome da Unidade / Setor</th>
                <th className="px-6 py-3.5">Localização Física</th>
                <th className="px-6 py-3.5">Profissional Responsável</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {units.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{u.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{u.location}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{u.responsible}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id, u.name)}
                      className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {units.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma unidade administrativa cadastrada.
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
              {editingId ? 'Editar Unidade' : 'Nova Unidade'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Unidade *
                </label>
                <input
                  required
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                  placeholder="Ex: Ala Feminina - Bloco B"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Localização *
                </label>
                <input
                  required
                  type="text"
                  value={formData.location || ''}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                  placeholder="Ex: 2º Andar, Pavilhão Sul"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsável pelo Setor *
                </label>
                <input
                  required
                  type="text"
                  value={formData.responsible || ''}
                  onChange={e => setFormData({ ...formData, responsible: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                  placeholder="Ex: Enf. Mariana Silva"
                />
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
                  {isSubmitting ? 'Salvando...' : 'Salvar Unidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
