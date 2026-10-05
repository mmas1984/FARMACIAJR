import React, { useState } from 'react';
import { Trash2, Edit2, Plus, AlertCircle, Search, Pill, ShieldAlert, FileSpreadsheet } from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { Medication } from '../types';

export default function Medications() {
  const {
    medications,
    addMedication,
    updateMedication,
    deleteMedication,
    isGoogleConnected,
    spreadsheetUrl
  } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Medication>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateMedication(editingId, formData);
      } else {
        await addMedication({
          name: formData.name || '',
          activeIngredient: formData.activeIngredient || '',
          dosage: formData.dosage || '',
          manufacturer: formData.manufacturer || '',
          atcCode: formData.atcCode || '',
          specialControlGroup: formData.specialControlGroup || 'None'
        });
      }
      setIsModalOpen(false);
      setFormData({});
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar medicamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Confirma a exclusão de "${name}"? Esta ação removerá o medicamento do sistema e sincronizará com a planilha.`)) {
      await deleteMedication(id);
    }
  };

  const openEdit = (med: Medication) => {
    setFormData(med);
    setEditingId(med.id);
    setIsModalOpen(true);
  };

  const getGroupBadge = (group: string) => {
    switch (group) {
      case 'A':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Grupo A (Receita Amarela)
          </span>
        );
      case 'B':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 border border-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Grupo B (Receita Azul)
          </span>
        );
      case 'C':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-300">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            Grupo C (Branca - 2 Vias)
          </span>
        );
      default:
        return (
          <span className="text-xs text-slate-500 font-medium">
            Não Controlado
          </span>
        );
    }
  };

  const filtered = medications.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.activeIngredient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.atcCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup = filterGroup === 'ALL' || m.specialControlGroup === filterGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Catálogo Hospitalar</span>
            <span aria-hidden="true">·</span>
            <span>Classificação ATC & Portaria 344/98</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Medicamentos & Psicotrópicos
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
              <span>Ver Planilha</span>
            </a>
          )}
          <button
            onClick={() => {
              setFormData({ specialControlGroup: 'None' });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg flex items-center space-x-2 transition-colors text-xs font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Medicamento</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, princípio ou código ATC..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs w-full md:w-auto">
          <span className="text-slate-500 font-medium mr-1">Filtrar:</span>
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'A', label: 'Grupo A' },
            { id: 'B', label: 'Grupo B' },
            { id: 'C', label: 'Grupo C' },
            { id: 'None', label: 'Não Controlados' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterGroup(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterGroup === f.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Medication List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Nome Comercial</th>
                <th className="px-6 py-3.5">Princípio Ativo</th>
                <th className="px-4 py-3.5">Dosagem</th>
                <th className="px-4 py-3.5">Fabricante</th>
                <th className="px-4 py-3.5">Código ATC</th>
                <th className="px-6 py-3.5">Controle Especial (344/98)</th>
                <th className="px-6 py-3.5 text-right">Estoque</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{m.name}</td>
                  <td className="px-6 py-4 text-slate-600">{m.activeIngredient}</td>
                  <td className="px-4 py-4 text-slate-700 font-medium">{m.dosage}</td>
                  <td className="px-4 py-4 text-slate-600">{m.manufacturer}</td>
                  <td className="px-4 py-4 font-mono text-slate-600 tabular-nums">
                    {m.atcCode || '—'}
                  </td>
                  <td className="px-6 py-4">{getGroupBadge(m.specialControlGroup)}</td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`font-mono text-sm font-bold tabular-nums ${
                        m.currentStock < 15 ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      {m.currentStock}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">un</span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEdit(m)}
                      className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition-colors"
                      title="Editar medicamento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id, m.name)}
                      className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition-colors"
                      title="Excluir medicamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    Nenhum medicamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg my-8 border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? 'Editar Medicamento' : 'Novo Medicamento'}
              </h3>
              <span className="text-xs text-slate-400">Portaria 344/98 - Anvisa</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Comercial
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                    placeholder="Ex: Haloperidol 5mg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Princípio Ativo
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.activeIngredient || ''}
                    onChange={e => setFormData({ ...formData, activeIngredient: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                    placeholder="Ex: Haloperidol"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dosagem</label>
                  <input
                    required
                    type="text"
                    value={formData.dosage || ''}
                    onChange={e => setFormData({ ...formData, dosage: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                    placeholder="Ex: 5mg, 10mg/ml"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fabricante / Laboratório
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.manufacturer || ''}
                    onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-600"
                    placeholder="Ex: Cristália, Janssen"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Classificação Obrigatória 1: Código ATC (Anatomical Therapeutic Chemical)
                </label>
                <input
                  required
                  type="text"
                  value={formData.atcCode || ''}
                  onChange={e => setFormData({ ...formData, atcCode: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-blue-600"
                  placeholder="Ex: N05AD01"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Classificação Obrigatória 2: Controle Especial (Portaria 344/98)</span>
                </label>
                <select
                  required
                  value={formData.specialControlGroup || 'None'}
                  onChange={e =>
                    setFormData({ ...formData, specialControlGroup: e.target.value as any })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white outline-none focus:border-blue-600 font-medium"
                >
                  <option value="None">Sem Controle Especial (Uso Geral)</option>
                  <option value="A">Grupo A: Entorpecentes e Psicotrópicos (Receita Tipo "A" - Cor Amarela)</option>
                  <option value="B">Grupo B: Psicotrópicos e Anorexígenos (Receita Tipo "B" - Cor Azul)</option>
                  <option value="C">Grupo C: Outros Especiais (Receita de Controle Especial - Cor Branca, 2 vias)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Medicamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
