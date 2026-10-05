import React from 'react';
import { Download, FileText, FileSpreadsheet, ExternalLink, ShieldAlert, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { usePharmacy } from '../context/PharmacyContext';

export default function Reports() {
  const {
    medications,
    movements,
    isGoogleConnected,
    spreadsheetUrl
  } = usePharmacy();

  // --- PDF Generation ---
  const exportStockPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(15);
    doc.text('Hospital Psiquiátrico São Vicente de Paulo', 14, 15);
    doc.setFontSize(11);
    doc.text('Relatório Oficial de Estoque e Balanço Farmacêutico', 14, 22);
    doc.setFontSize(9);
    doc.text(`Data de Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')} | Responsável Técnico`, 14, 28);

    const tableData = medications.map(m => [
      m.name,
      m.activeIngredient,
      m.dosage,
      m.atcCode || '-',
      m.specialControlGroup !== 'None' ? `Grupo ${m.specialControlGroup} (Portaria 344/98)` : 'Não Controlado',
      m.currentStock.toString()
    ]);

    autoTable(doc, {
      head: [['Medicamento', 'Princípio Ativo', 'Dosagem', 'Código ATC', 'Controle Especial', 'Estoque']],
      body: tableData,
      startY: 33,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] }
    });

    doc.save(`balanco_estoque_sales_junior_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportMovementsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(15);
    doc.text('Hospital Psiquiátrico São Vicente de Paulo', 14, 15);
    doc.setFontSize(11);
    doc.text('Livro de Registro de Movimentações - Portaria 344/98 Anvisa', 14, 22);
    doc.setFontSize(9);
    doc.text(`Data de Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, 28);

    const tableData = movements.map(m => [
      format(new Date(m.timestamp), 'dd/MM/yyyy HH:mm'),
      m.medName || '-',
      m.type === 'IN' ? 'Entrada (+)' : 'Saída (-)',
      m.quantity.toString(),
      m.unitName || '-',
      m.collabName || '-'
    ]);

    autoTable(doc, {
      head: [['Data / Hora', 'Medicamento', 'Tipo', 'Qtd', 'Unidade Destino', 'Colaborador Retirada']],
      body: tableData,
      startY: 33,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`movimentacoes_sales_junior_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // --- CSV Generation with UTF-8 BOM ---
  const exportCSV = (filename: string, headers: string[], data: string[][]) => {
    const csvContent = [
      headers.join(';'),
      ...data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportStockCSV = () => {
    const headers = [
      'Medicamento',
      'Principio Ativo',
      'Dosagem',
      'Fabricante',
      'Codigo ATC',
      'Controle Especial',
      'Saldo Atual'
    ];
    const data = medications.map(m => [
      m.name,
      m.activeIngredient,
      m.dosage,
      m.manufacturer,
      m.atcCode || '',
      m.specialControlGroup !== 'None' ? `Grupo ${m.specialControlGroup}` : 'Nao Controlado',
      m.currentStock.toString()
    ]);
    exportCSV(`estoque_farmacia_svp_${format(new Date(), 'yyyyMMdd')}.csv`, headers, data);
  };

  const exportMovementsCSV = () => {
    const headers = [
      'Data/Hora UTC',
      'Data/Hora Local',
      'Medicamento',
      'Tipo Movimentacao',
      'Quantidade',
      'Unidade Destino',
      'Colaborador Responsavel'
    ];
    const data = movements.map(m => [
      m.timestamp,
      format(new Date(m.timestamp), 'dd/MM/yyyy HH:mm:ss'),
      m.medName || '',
      m.type === 'IN' ? 'Entrada' : 'Saida',
      m.quantity.toString(),
      m.unitName || '',
      m.collabName || ''
    ]);
    exportCSV(`movimentacoes_farmacia_svp_${format(new Date(), 'yyyyMMdd')}.csv`, headers, data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Auditoria & Prestação de Contas</span>
            <span aria-hidden="true">·</span>
            <span>Exportação Oficial</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Relatórios & Balanços Farmacêuticos
          </h1>
        </div>

        {isGoogleConnected && spreadsheetUrl && (
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Abrir Planilha Completa no Google Docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report 1: Current Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4 border-b border-slate-100 pb-4">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-semibold text-base text-slate-900">Balanço de Estoque Atual</h2>
                <p className="text-xs text-slate-500">
                  Posição em tempo real de todos os {medications.length} medicamentos com classificação ATC e Portaria 344/98.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Gera documento oficial contendo a relação completa de lotes, princípios ativos, fabricantes,
              códigos ATC e quantitativo físico em almoxarifado para auditoria da vigilância sanitária.
            </p>
          </div>

          <div className="flex space-x-3 pt-3 border-t border-slate-100">
            <button
              onClick={exportStockPDF}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors text-xs font-semibold shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Relatório em PDF</span>
            </button>
            <button
              onClick={exportStockCSV}
              className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg border border-slate-200 flex items-center justify-center space-x-2 transition-colors text-xs font-semibold"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar Excel (.CSV)</span>
            </button>
          </div>
        </div>

        {/* Report 2: Movements History */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4 border-b border-slate-100 pb-4">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-semibold text-base text-slate-900">Histórico de Rastreabilidade</h2>
                <p className="text-xs text-slate-500">
                  Livro de movimentações com data e hora inalteráveis, setor de destino e responsável.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Emite a listagem cronológica de todas as entradas e dispensações realizadas ({movements.length} registros),
              comprovando quem retirou cada medicamento psicotrópico e para qual ala hospitalar foi destinado.
            </p>
          </div>

          <div className="flex space-x-3 pt-3 border-t border-slate-100">
            <button
              onClick={exportMovementsPDF}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors text-xs font-semibold shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Livro em PDF</span>
            </button>
            <button
              onClick={exportMovementsCSV}
              className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg border border-slate-200 flex items-center justify-center space-x-2 transition-colors text-xs font-semibold"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar Excel (.CSV)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
