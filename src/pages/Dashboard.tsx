import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Pill,
  AlertTriangle,
  ArrowRightLeft,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldAlert,
  Building2,
  Users2,
  TrendingDown,
  TrendingUp,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { useAuth } from '../context/AuthContext';
import { Medication } from '../types';

export default function Dashboard() {
  const { isCoordinator, currentUser } = useAuth();
  const {
    medications,
    collaborators,
    units,
    movements,
    isGoogleConnected,
    googleUser,
    spreadsheetId,
    spreadsheetUrl,
    isSyncing,
    lastSyncTime,
    syncError,
    signInGoogle,
    syncWithSheets,
    saveAllToSheetsWithConfirm
  } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  // Computed metrics
  const totalItemsInStock = useMemo(() => {
    return medications.reduce((acc, m) => acc + (m.currentStock || 0), 0);
  }, [medications]);

  const lowStockMeds = useMemo(() => {
    return medications.filter(m => (m.currentStock || 0) < 15);
  }, [medications]);

  const controlledMedsCount = useMemo(() => {
    return medications.filter(m => m.specialControlGroup && m.specialControlGroup !== 'None').length;
  }, [medications]);

  const groupACount = useMemo(() => {
    return medications.filter(m => m.specialControlGroup === 'A').length;
  }, [medications]);

  const groupBCount = useMemo(() => {
    return medications.filter(m => m.specialControlGroup === 'B').length;
  }, [medications]);

  const groupCCount = useMemo(() => {
    return medications.filter(m => m.specialControlGroup === 'C').length;
  }, [medications]);

  // Today's movements
  const todayMovements = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return movements.filter(m => m.timestamp.startsWith(today));
  }, [movements]);

  // Filtered medications for live preview table
  const filteredMeds = useMemo(() => {
    return medications.filter(m => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.activeIngredient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.atcCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGroup =
        selectedGroup === 'ALL' ||
        (selectedGroup === 'LOW' && m.currentStock < 15) ||
        m.specialControlGroup === selectedGroup;

      return matchesSearch && matchesGroup;
    });
  }, [medications, searchQuery, selectedGroup]);

  const getSpecialGroupVisual = (group: string) => {
    switch (group) {
      case 'A':
        return {
          title: 'Grupo A (Receita Amarela)',
          desc: 'Entorpecentes e Psicotrópicos Estritos',
          border: 'border-amber-400',
          bg: 'bg-amber-50',
          text: 'text-amber-900',
          indicator: 'bg-amber-400'
        };
      case 'B':
        return {
          title: 'Grupo B (Receita Azul)',
          desc: 'Psicotrópicos e Anorexígenos',
          border: 'border-blue-400',
          bg: 'bg-blue-50',
          text: 'text-blue-900',
          indicator: 'bg-blue-500'
        };
      case 'C':
        return {
          title: 'Grupo C (Receita Branca - 2 Vias)',
          desc: 'Outras Substâncias Sujeitas a Controle Especial',
          border: 'border-slate-300',
          bg: 'bg-slate-50',
          text: 'text-slate-900',
          indicator: 'bg-slate-400'
        };
      default:
        return {
          title: 'Uso Geral',
          desc: 'Medicamento Não Controlado',
          border: 'border-emerald-300',
          bg: 'bg-emerald-50',
          text: 'text-emerald-900',
          indicator: 'bg-emerald-400'
        };
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hospital Identity & Header Context */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Hospital Psiquiátrico São Vicente de Paulo</span>
            <span aria-hidden="true">·</span>
            <span>Farmácia Central & Almoxarifado Clínico</span>
            <span aria-hidden="true">·</span>
            <span>Portaria 344/98 - Anvisa</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
            Painel de Controle Farmacêutico
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Gestão unificada de estoque, rastreabilidade inalterável de psicotrópicos e sincronização com banco de dados em planilha.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/movements"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Nova Movimentação</span>
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors"
          >
            <span>Relatórios & Balanços</span>
          </Link>
          {isCoordinator && (
            <Link
              to="/users"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg shadow-sm transition-colors"
            >
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Gerenciar Senhas & Usuários</span>
            </Link>
          )}
        </div>
      </div>

      {/* Google Sheets Live Database Synchronizer Card */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shrink-0">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-semibold text-slate-900">
                  Banco de Dados em Planilha Google
                </h2>
                {isGoogleConnected ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Modo Local
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 max-w-xl">
                {isGoogleConnected
                  ? `Os registros estão espelhados em tempo real na planilha "Farmacêutico Sales Júnior - Banco de Dados Hospitalar" no Google Drive (${googleUser?.email}).`
                  : 'Conecte sua conta do Google para transformar uma planilha do Google Docs/Sheets no banco de dados ativo do hospital com sincronização contínua.'}
              </p>
              {lastSyncTime && (
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Última sincronização com Google Sheets:</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-700">
                    {lastSyncTime.toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              )}
              {syncError && (
                <p className="text-xs text-rose-600 mt-2 font-medium bg-rose-50 p-2 rounded border border-rose-200">
                  {syncError}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isGoogleConnected ? (
              <>
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir no Google Sheets</span>
                  </a>
                )}
                <button
                  onClick={() => syncWithSheets()}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
                  title="Atualizar dados a partir da planilha"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Recarregar Planilha'}</span>
                </button>
                <button
                  onClick={() => saveAllToSheetsWithConfirm()}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
                  title="Gravar estado completo na planilha"
                >
                  <span>Gravar na Planilha</span>
                </button>
              </>
            ) : (
              <button
                onClick={signInGoogle}
                disabled={isSyncing}
                className="inline-flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Conectar com Google Sheets</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Primary KPI Grid (High Density & Tabular Figures) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Medicamentos Ativos
            </span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {medications.length}
              </span>
              <span className="text-xs text-slate-500">itens cadastrados</span>
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Volume total em estoque:</span>
              <span className="font-mono tabular-nums font-semibold text-slate-800">
                {totalItemsInStock.toLocaleString('pt-BR')} un.
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Controle Especial (344/98)
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-amber-900 font-mono tabular-nums">
                {controlledMedsCount}
              </span>
              <span className="text-xs text-amber-700 font-medium">psicotrópicos / entorpecentes</span>
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Grupo A: {groupACount} · Grupo B: {groupBCount} · Grupo C: {groupCCount}</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => setSelectedGroup(selectedGroup === 'LOW' ? 'ALL' : 'LOW')}
          className={`cursor-pointer transition-all rounded-xl p-5 border shadow-sm flex flex-col justify-between ${
            lowStockMeds.length > 0
              ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Estoque Crítico (&lt; 15 un)
            </span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-rose-900 font-mono tabular-nums">
                {lowStockMeds.length}
              </span>
              <span className="text-xs text-rose-700 font-medium">precisam reposição</span>
            </div>
            <div className="text-xs text-rose-700 mt-2 flex items-center justify-between border-t border-rose-100 pt-2 font-medium">
              <span>Clique para {selectedGroup === 'LOW' ? 'remover filtro' : 'filtrar na tabela'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Movimentações Hoje
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
                {todayMovements.length}
              </span>
              <span className="text-xs text-slate-500">registros auditados</span>
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Total histórico:</span>
              <span className="font-mono tabular-nums font-semibold text-slate-800">
                {movements.length} movimentações
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Classification Breakdown Cards (Anvisa Portaria 344/98) */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Distribuição por Categoria de Receita (Portaria 344/98)
            </h2>
            <p className="text-xs text-slate-500">
              Rastreamento rigoroso das notificações e receitas retidas por cor oficial
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Grupo A */}
          <div
            onClick={() => setSelectedGroup(selectedGroup === 'A' ? 'ALL' : 'A')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedGroup === 'A' ? 'ring-2 ring-amber-500 bg-amber-50/70 border-amber-400' : 'border-slate-200 hover:border-amber-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                Receita Amarela (Tipo A)
              </span>
              <span className="font-mono text-lg font-bold text-amber-900 tabular-nums">
                {groupACount}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Grupo A: Entorpecentes & Psicotrópicos</h3>
            <p className="text-xs text-slate-500 mt-1">
              Ex: Morfina, Metadona, Oxicodona. Notificação de receita amarela com retenção estrita.
            </p>
          </div>

          {/* Grupo B */}
          <div
            onClick={() => setSelectedGroup(selectedGroup === 'B' ? 'ALL' : 'B')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedGroup === 'B' ? 'ring-2 ring-blue-500 bg-blue-50/70 border-blue-400' : 'border-slate-200 hover:border-blue-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                Receita Azul (Tipo B)
              </span>
              <span className="font-mono text-lg font-bold text-blue-900 tabular-nums">
                {groupBCount}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Grupo B: Psicotrópicos & Anorexígenos</h3>
            <p className="text-xs text-slate-500 mt-1">
              Ex: Diazepam, Clonazepam, Lorazepam. Notificação de receita tipo B azul numerada.
            </p>
          </div>

          {/* Grupo C */}
          <div
            onClick={() => setSelectedGroup(selectedGroup === 'C' ? 'ALL' : 'C')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedGroup === 'C' ? 'ring-2 ring-slate-700 bg-slate-50 border-slate-400' : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                Receita Branca (2 Vias)
              </span>
              <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                {groupCCount}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Grupo C: Outros Especiais & Antipsicóticos</h3>
            <p className="text-xs text-slate-500 mt-1">
              Ex: Haloperidol, Risperidona, Clorpromazina. Receita de controle especial em duas vias.
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid: Live Medication Inventory with Search & Recent Movements */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Interactive Inventory Table */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Estoque Clínico em Tempo Real
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>{filteredMeds.length} de {medications.length} medicamentos listados</span>
                <span aria-hidden="true">·</span>
                <span>Dados sincronizados</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar nome, princípio ou ATC..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-52 sm:w-64 outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {selectedGroup !== 'ALL' && (
                <button
                  onClick={() => setSelectedGroup('ALL')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
                >
                  Limpar filtro
                </button>
              )}
            </div>
          </div>

          {/* Segmented Control Bar (Zero-pill discipline: interactive buttons) */}
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium mr-2">Filtro rápido:</span>
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'A', label: 'Grupo A (Amarela)' },
              { id: 'B', label: 'Grupo B (Azul)' },
              { id: 'C', label: 'Grupo C (Branca)' },
              { id: 'None', label: 'Não Controlados' },
              { id: 'LOW', label: 'Estoque Baixo' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedGroup(tab.id)}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  selectedGroup === tab.id
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-5 py-3">Medicamento / Princípio Ativo</th>
                  <th className="px-4 py-3">Dosagem</th>
                  <th className="px-4 py-3">Código ATC</th>
                  <th className="px-4 py-3">Controle 344/98</th>
                  <th className="px-5 py-3 text-right">Saldo Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMeds.map(m => {
                  const visual = getSpecialGroupVisual(m.specialControlGroup);
                  const isLow = (m.currentStock || 0) < 15;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                          <span>{m.activeIngredient}</span>
                          <span aria-hidden="true">·</span>
                          <span>{m.manufacturer}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        {m.dosage}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600 tabular-nums">
                        {m.atcCode || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${visual.indicator}`} />
                          <span className="text-slate-700 font-medium">
                            {m.specialControlGroup !== 'None' ? `Grupo ${m.specialControlGroup}` : 'Uso Comum'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="font-mono text-sm font-bold tabular-nums">
                          <span className={isLow ? 'text-rose-600' : 'text-slate-900'}>
                            {m.currentStock}
                          </span>
                          <span className="text-[10px] font-normal text-slate-400 ml-1">un.</span>
                        </div>
                        {isLow && (
                          <div className="text-[10px] text-rose-600 font-medium flex items-center justify-end gap-1 mt-0.5">
                            <TrendingDown className="w-3 h-3" />
                            <span>Repor</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredMeds.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      Nenhum medicamento encontrado para os critérios selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
            <Link
              to="/medications"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
            >
              <span>Gerenciar catálogo de medicamentos</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column (1 Col): Recent Movements & Audit Trail */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Rastreabilidade Recente
                </h2>
                <p className="text-xs text-slate-500">Últimas dispensações e entradas</p>
              </div>
              <Link
                to="/movements"
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
              >
                <span>Ver todas</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {movements.slice(0, 6).map(mov => {
                const isOut = mov.type === 'OUT';
                return (
                  <div
                    key={mov.id}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {mov.medName || 'Medicamento'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {isOut ? `Destino: ${mov.unitName || 'Unidade'}` : 'Entrada em estoque central'}
                        </p>
                      </div>
                      <span
                        className={`font-mono text-xs font-bold tabular-nums px-2 py-0.5 rounded ${
                          isOut ? 'text-rose-700 bg-rose-50' : 'text-emerald-700 bg-emerald-50'
                        }`}
                      >
                        {isOut ? '-' : '+'}{mov.quantity} un
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                      <span>{mov.collabName || 'Farmácia Central'}</span>
                      <span className="font-mono tabular-nums">
                        {new Date(mov.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {movements.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">
                  Nenhuma movimentação registrada no sistema.
                </div>
              )}
            </div>
          </div>

          {/* Quick Hospital Units Overview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>Unidades & Setores Cadastrados</span>
              </h2>
              <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {units.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {units.slice(0, 4).map(u => (
                <div key={u.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{u.name}</p>
                    <p className="text-[11px] text-slate-500">{u.location}</p>
                  </div>
                  <span className="text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    {u.responsible}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
