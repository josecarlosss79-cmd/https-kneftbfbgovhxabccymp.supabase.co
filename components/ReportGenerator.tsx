
import React, { useState, useMemo } from 'react';
import { ICONS } from '../constants';
import { useMaintenance } from '../context/MaintenanceContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportGenerator: React.FC = () => {
  const { equipments, occurrences, currentUser, systemSettings } = useMaintenance();
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Engine de Cálculo de Dados Dinâmicos
  const stats = useMemo(() => {
    const totalEquipments = equipments.length;
    const today = new Date();
    const inCompliance = equipments.filter(eq => eq.nextMaintenance && new Date(eq.nextMaintenance) >= today).length;
    const complianceRate = totalEquipments > 0 ? ((inCompliance / totalEquipments) * 100).toFixed(1) : '0';
    const totalMaintenanceCost = occurrences.reduce((acc, curr) => acc + curr.cost, 0);
    const totalDowntime = occurrences.reduce((acc, curr) => acc + curr.downtimeHours, 0);
    const avgMttr = occurrences.length > 0 ? (totalDowntime / occurrences.length).toFixed(1) : '0';

    return { totalEquipments, complianceRate, totalMaintenanceCost, avgMttr, inCompliance };
  }, [equipments, occurrences]);

  const reports = useMemo(() => [
    { 
      id: 'inv', 
      title: 'Inventário Geral de Ativos', 
      desc: 'Relação completa de patrimônio e status operacional.', 
      icon: ICONS.Equipment, 
      type: 'PDF / XLSX', 
      category: 'Gestão',
      headers: ['Patrimônio', 'Equipamento', 'Setor', 'Status'],
      data: equipments.map(eq => ({ col1: eq.id, col2: eq.name, col3: eq.location, col4: eq.status }))
    },
    { 
      id: 'conf', 
      title: 'Conformidade de Manutenção', 
      desc: 'Status de manutenção programada vs. realizado.', 
      icon: ICONS.Maintenance, 
      type: 'PDF', 
      category: 'Qualidade',
      headers: ['ID', 'Equipamento', 'Vencimento', 'Status'],
      data: equipments.map(eq => ({ col1: eq.id, col2: eq.name, col3: eq.nextMaintenance || 'N/D', col4: eq.nextMaintenance && new Date(eq.nextMaintenance) < new Date() ? 'ATRASADO' : 'OK' }))
    },
    { 
      id: 'perf', 
      title: 'Desempenho (MTBF & MTTR)', 
      desc: 'Indicadores de confiabilidade e tempo de reparo por ativo.', 
      icon: ICONS.Intelligence, 
      type: 'PDF / CSV', 
      category: 'Engenharia',
      headers: ['ID', 'Ativo', 'Confiabilidade', 'Eficiência'],
      data: equipments.map(eq => {
        const eqOccurrences = occurrences.filter(occ => occ.equipmentId === eq.id);
        const failureCount = eqOccurrences.length;
        const totalDowntime = eqOccurrences.reduce((sum, occ) => sum + occ.downtimeHours, 0);
        const mttr = failureCount > 0 ? (totalDowntime / failureCount).toFixed(1) : '0.0';
        const mtbf = failureCount > 0 ? Math.round(eq.usageHours / failureCount) : eq.usageHours;
        return { 
          col1: eq.id, 
          col2: eq.name, 
          col3: `MTBF: ${mtbf}h`, 
          col4: failureCount > 0 ? `MTTR: ${mttr}h` : 'SEM FALHAS' 
        };
      })
    },
    { 
      id: 'fin', 
      title: 'Custos e Ordens de Serviço', 
      desc: 'Análise financeira de intervenções e peças.', 
      icon: ICONS.Stats, 
      type: 'PDF / CSV', 
      category: 'Financeiro',
      headers: ['Chamado', 'Equipamento', 'Custo Total', 'Status'],
      data: occurrences.map(occ => ({ col1: occ.id, col2: occ.equipmentName, col3: `R$ ${occ.cost.toFixed(2)}`, col4: occ.status }))
    },
  ], [equipments, occurrences]);

  const handleExportPDF = (report: any) => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString('pt-BR');
      
      // Cabeçalho do Relatório
      doc.setFontSize(18);
      doc.setTextColor(59, 130, 246); // Blue-600
      doc.text(systemSettings.hospitalName, 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Relatório: ${report.title}`, 14, 30);
      doc.text(`Emissão: ${timestamp}`, 14, 35);
      doc.text(`Auditado por: ${currentUser?.name || 'Sistema'}`, 14, 40);

      // Linha Separadora
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 45, 196, 45);

      // Tabela de Dados
      autoTable(doc, {
        startY: 50,
        head: [report.headers],
        body: report.data.map((row: any) => [row.col1, row.col2, row.col3, row.col4]),
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 50 },
      });

      // Rodapé
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${pageCount} - MedMaintain Cloud Management`, 14, 285);
      }

      doc.save(`${report.title.toLowerCase().replace(/ /g, '_')}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Falha ao gerar o documento PDF.');
    } finally {
      setTimeout(() => setIsGenerating(false), 800);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Centro de Relatórios & BI</h2>
          <p className="text-slate-500">Documentação técnica dinâmica baseada no estado atual.</p>
        </div>
        <div className="px-4 py-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          BI ATUALIZADO
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ativos Atuais', value: stats.totalEquipments, icon: ICONS.Equipment, color: 'text-blue-600' },
          { label: 'Conformidade', value: `${stats.complianceRate}%`, icon: ICONS.Success, color: 'text-emerald-600' },
          { label: 'Custo Total', value: `R$ ${stats.totalMaintenanceCost.toLocaleString()}`, icon: ICONS.Stats, color: 'text-amber-600' },
          { label: 'Tempo Resposta', value: `${stats.avgMttr}h`, icon: ICONS.Tools, color: 'text-rose-600' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border shadow-sm">
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-widest">{kpi.label}</p>
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 bg-blue-50">
                  {report.icon}
                </div>
                <h3 className="font-bold text-slate-800">{report.title}</h3>
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{report.type}</span>
            </div>
            <p className="text-sm text-slate-500 mb-6">{report.desc}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setActivePreview(report.id)} 
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-200 transition-colors"
              >
                PREVIEW
              </button>
              <button 
                onClick={() => handleExportPDF(report)} 
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                {ICONS.Download} SALVAR PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {activePreview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
             <div className="p-6 border-b flex justify-between bg-slate-50">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">{ICONS.Reports}</div>
                 <h3 className="font-bold text-slate-800">Visualização Técnica: {reports.find(r => r.id === activePreview)?.title}</h3>
               </div>
               <button onClick={() => setActivePreview(null)} className="text-2xl hover:text-rose-500 transition-colors">&times;</button>
             </div>
             <div className="p-8 overflow-y-auto">
               <table className="w-full text-xs">
                 <thead>
                   <tr className="border-b-2 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                     {reports.find(r => r.id === activePreview)?.headers.map((h, i) => (
                       <th key={i} className={`pb-4 ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {reports.find(r => r.id === activePreview)?.data.map((row: any, i: number) => (
                     <tr key={i} className="hover:bg-slate-50 group">
                       <td className="py-4 font-bold text-blue-600">{row.col1}</td>
                       <td className="py-4 font-medium text-slate-700">{row.col2}</td>
                       <td className="py-4 text-slate-500">{row.col3}</td>
                       <td className="py-4 text-right">
                         <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] border ${
                           row.col4.includes('OK') || row.col4.includes('Operacional') || row.col4.includes('MTTR') 
                           ? 'text-emerald-600 border-emerald-100 bg-emerald-50' 
                           : row.col4.includes('SEM FALHAS') ? 'text-blue-600 border-blue-100 bg-blue-50' : 'text-rose-600 border-rose-100 bg-rose-50'
                         }`}>
                           {row.col4}
                         </span>
                       </td>
                     </tr>
                   ))}
                   {(reports.find(r => r.id === activePreview)?.data.length || 0) === 0 && (
                     <tr><td colSpan={4} className="py-20 text-center text-slate-400 italic">Sem dados para este período.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
             <div className="p-6 bg-slate-50 border-t flex justify-end">
                <button 
                  onClick={() => {
                    const report = reports.find(r => r.id === activePreview);
                    if (report) handleExportPDF(report);
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  {ICONS.Download} BAIXAR PDF COMPLETO
                </button>
             </div>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 z-[80] bg-white/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <p className="font-bold text-slate-800 text-lg">Gerando Relatório PDF...</p>
              <p className="text-sm text-slate-500">Compilando dados de engenharia clínica</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;
