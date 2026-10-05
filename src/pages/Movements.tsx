import React, { useState } from 'react';
import { ArrowRightLeft, ShieldAlert, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';

export default function Movements() {
  const {
    medications,
    units,
    collaborators,
    registerMovement,
    isGoogleConnected,
    spreadsheetUrl
  } = usePharmacy();

  const [type, setType] = useState<'IN' | 'OUT'>('OUT');
  const [medId, setMedId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitId, setUnitId] = useState('');
  const [collaboratorId, setCollaboratorId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedMed = medications.find(m => m.id === medId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!medId) {
      setError('Por favor, selecione um medicamento.');
      return;
    }

    if (quantity <= 0) {
      setError('A quantidade deve ser maior que zero.');
      return;
    }

    if (type === 'OUT') {
      if (!unitId) {
        setError('A Unidade Administrativa de destino é obrigatória para saídas.');
        return;
      }
      if (!collaboratorId) {
        setError('O Colaborador responsável pela retirada é obrigatório para saídas.');
        return;
      }
      if (selectedMed && selectedMed.currentStock < quantity) {
        setError(
          `Estoque insuficiente! Saldo atual de "${selectedMed.name}": ${selectedMed.currentStock} unidades. Quantidade solicitada: ${quantity}.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await registerMovement({
        medId,
        type,
        quantity: Number(quantity),
        unitId: type === 'OUT' ? unitId : undefined,
        collaboratorId: type === 'OUT' ? collaboratorId : undefined
      });

      setSuccess(
        `Movimentação de ${type === 'IN' ? 'Entrada' : 'Saída/Dispensação'} registrada com sucesso! O estoque foi atualizado e sincronizado com o banco de dados.`
      );
      setQuantity(1);
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar movimentação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Rastreabilidade em Tempo Real</span>
            <span aria-hidden="true">·</span>
            <span>Portaria 344/98</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Controle de Estoque & Movimentações
          </h1>
        </div>

        {isGoogleConnected && spreadsheetUrl && (
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Auditar na Planilha</span>
          </a>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {/* Toggle IN / OUT */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            className={`py-2.5 text-xs font-bold rounded-lg transition-all ${
              type === 'OUT'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => {
              setType('OUT');
              setError('');
              setSuccess('');
            }}
          >
            Saída / Dispensação para Setor
          </button>
          <button
            type="button"
            className={`py-2.5 text-xs font-bold rounded-lg transition-all ${
              type === 'IN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => {
              setType('IN');
              setError('');
              setSuccess('');
            }}
          >
            Entrada de Medicamento (Recebimento)
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Medication Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Medicamento a ser movimentado *
            </label>
            <select
              required
              value={medId}
              onChange={e => setMedId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs bg-white outline-none focus:border-blue-600 font-medium"
            >
              <option value="">Selecione o medicamento...</option>
              {medications.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.activeIngredient} ({m.dosage}) | Saldo Atual: {m.currentStock} un |{' '}
                  {m.specialControlGroup !== 'None' ? `Grupo ${m.specialControlGroup}` : 'Geral'}
                </option>
              ))}
            </select>
          </div>

          {/* Special Control Visual Alert */}
          {selectedMed && selectedMed.specialControlGroup !== 'None' && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>
                  Atenção Especial — Portaria 344/98 (Grupo {selectedMed.specialControlGroup})
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Este medicamento é classificado como de controle restrito. Para dispensação hospitalar,
                é obrigatória a conferência da prescrição médica e retenção da via legal correspondente
                (Grupo A: Notificação Amarela; Grupo B: Notificação Azul; Grupo C: Receita Branca em 2 vias).
              </p>
            </div>
          )}

          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Quantidade *
              </label>
              {selectedMed && (
                <span className="text-[11px] text-slate-500">
                  Saldo em estoque:{' '}
                  <strong className="text-slate-800 font-mono tabular-nums">
                    {selectedMed.currentStock} un.
                  </strong>
                </span>
              )}
            </div>
            <input
              required
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-mono tabular-nums outline-none focus:border-blue-600"
            />
          </div>

          {/* Destination and Collaborator if OUT */}
          {type === 'OUT' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Unidade Administrativa de Destino *
                </label>
                <select
                  required
                  value={unitId}
                  onChange={e => setUnitId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs bg-white outline-none focus:border-blue-600 font-medium"
                >
                  <option value="">Selecione o setor/ala de destino...</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Colaborador Responsável pela Retirada *
                </label>
                <select
                  required
                  value={collaboratorId}
                  onChange={e => setCollaboratorId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs bg-white outline-none focus:border-blue-600 font-medium"
                >
                  <option value="">Selecione quem está retirando...</option>
                  {collaborators.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.role} {c.crf ? `(${c.crf})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Timestamp Notice */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Registro de Auditoria:</span>
            <span className="font-mono tabular-nums text-slate-700 font-semibold">
              Data e Hora exata gerada automaticamente pelo servidor (Timestamp inalterável)
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !medId}
              className={`w-full py-3 text-xs font-bold text-white rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                type === 'OUT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Registrando movimentação...'
                  : type === 'OUT'
                  ? 'Confirmar Saída & Dispensação'
                  : 'Confirmar Entrada no Estoque'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
