
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { MaintenanceType, MaintenanceStatus, MaintenanceTask } from '../types';
import { useMaintenance } from '../context/MaintenanceContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
// Added RefreshCw to the lucide-react imports
import { Check, X as CloseIcon, FileText, ClipboardList, RefreshCw } from 'lucide-react';

const MaintenanceManager: React.FC = () => {
  const { tasks, completeTask, equipments, scheduleTask, systemSettings, currentUser } = useMaintenance();
  const [activeTask, setActiveTask] = useState<MaintenanceTask | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [filterProtocol, setFilterProtocol] = useState<string | null>(null);
  
  // Checklist State
  const [checklistData, setChecklistData] = useState<{id: number, label: string, ok: boolean | null}[]>([
    { id: 0, label: 'Inspeção visual do chassi e acessórios', ok: null },
    { id: 1, label: 'Limpeza técnica interna e externa', ok: null },
    { id: 2, label: 'Teste de interface e alarmes sonoros', ok: null }
  ]);
  const [electricalTests, setElectricalTests] = useState({ ground: '', leakage: '' });

  const generatePDFReport = (task: MaintenanceTask) => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString('pt-BR');
    const eq = equipments.find(e => e.id === task.equipmentId);

    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(systemSettings.hospitalName, 14, 20);
    doc.setFontSize(10);
    doc.text("LAUDO TÉCNICO DE ENGENHARIA CLÍNICA", 14, 30);
    doc.text(`OS: ${task.id}`, 180, 30, { align: 'right' });

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(12);
    doc.text("IDENTIFICAÇÃO DO ATIVO", 14, 50);
    
    autoTable(doc, {
      startY: 55,
      body: [
        ["Equipamento:", task.equipmentName, "Patrimônio:", task.equipmentId],
        ["Fabricante:", eq?.manufacturer || "N/A", "Nº de Série:", eq?.serialNumber || "N/A"],
        ["Localização:", eq?.location || "N/A", "Protocolo:", task.protocol]
      ],
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 }
    });

    doc.text("INSPEÇÃO TÉCNICA E FUNCIONAL", 14, (doc as any).lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [["Item de Inspeção", "Resultado"]],
      body: checklistData.map(item => [item.label, item.ok ? "CONFORME" : "NÃO CONFORME"]),
      headStyles: { fillColor: [71, 85, 105] },
      styles: { fontSize: 8 }
    });

    doc.save(`Laudo_Tecnico_${task.id}_${task.equipmentId}.pdf`);
  };

  const handleFinishTask = () => {
    if (!activeTask) return;
    const allChecked = checklistData.every(item => item.ok !== null);
    if (!allChecked) {
      alert("⚠️ Preencha todos os itens do checklist.");
      return;
    }

    setIsFinishing(true);
    setTimeout(() => {
      generatePDFReport(activeTask);
      completeTask(activeTask.id, "Realizada via MedMaintain Mobile.");
      setIsFinishing(false);
      setActiveTask(null);
      setChecklistData(prev => prev.map(item => ({ ...item, ok: null })));
    }, 1500);
  };

  const filteredTasks = filterProtocol 
    ? tasks.filter(t => t.protocol.includes(filterProtocol))
    : tasks;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
            <ClipboardList size={24} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold tracking-tight ${systemSettings.highContrastMode ? 'text-white' : 'text-slate-800'}`}>Plano de Trabalho</h2>
            <p className="text-slate-500 text-xs">Ordens de serviço pendentes para execução.</p>
          </div>
        </div>
        <button 
          onClick={() => {
            const eq = equipments[0];
            if (eq) scheduleTask({ equipmentId: eq.id, equipmentName: eq.name, type: MaintenanceType.PREVENTIVA, protocol: 'IEC 62353' });
          }}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 text-sm"
        >
          {ICONS.Add} NOVA OS
        </button>
      </header>

      {/* Grid de Tarefas Otimizado para Mobile */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.map(item => (
          <div 
            key={item.id} 
            onClick={() => item.status !== MaintenanceStatus.CONCLUIDA && setActiveTask(item)}
            className={`p-5 rounded-[2rem] border transition-all cursor-pointer ${
              item.status === MaintenanceStatus.CONCLUIDA ? 'bg-slate-50 opacity-60' : 'bg-white hover:border-blue-300 shadow-sm active:bg-blue-50/50'
            } ${systemSettings.highContrastMode ? 'bg-slate-900 border-slate-800' : 'border-slate-100'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    item.type === MaintenanceType.CORRETIVA ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.id}</span>
                </div>
                <h4 className="font-bold text-slate-800 leading-tight">{item.equipmentName}</h4>
                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1">{ICONS.Pending} {item.date}</div>
                  <div className="flex items-center gap-1">{ICONS.User} {item.technician}</div>
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${
                item.status === MaintenanceStatus.CONCLUIDA ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {item.status === MaintenanceStatus.CONCLUIDA ? <Check size={20} /> : <FileText size={20} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Mobile-First de Checklist */}
      {activeTask && (
        <div className="fixed inset-0 z-[110] flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
          <header className="p-6 border-b flex items-center justify-between bg-slate-900 text-white">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveTask(null)} className="p-2 -ml-2 text-white/50 hover:text-white">
                <CloseIcon size={24} />
              </button>
              <div>
                <h3 className="font-bold">Checklist Técnico</h3>
                <p className="text-[10px] text-white/50">{activeTask.id} • {activeTask.equipmentName}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">{activeTask.protocol}</span>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
              {checklistData.map((item, idx) => (
                <div key={idx} className="space-y-3">
                  <p className="text-sm font-bold text-slate-700 leading-relaxed pl-1">{item.label}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        const newCheck = [...checklistData];
                        newCheck[idx].ok = true;
                        setChecklistData(newCheck);
                      }}
                      className={`py-4 rounded-2xl border-2 font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                        item.ok === true ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}
                    >
                      <Check size={16} /> CONFORME
                    </button>
                    <button 
                      onClick={() => {
                        const newCheck = [...checklistData];
                        newCheck[idx].ok = false;
                        setChecklistData(newCheck);
                      }}
                      className={`py-4 rounded-2xl border-2 font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                        item.ok === false ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}
                    >
                      <CloseIcon size={16} /> FALHA
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-blue-50 rounded-3xl space-y-4">
              <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest text-center">Ensaios Elétricos (Opcional Mobile)</h4>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" 
                  placeholder="Terra (mΩ)"
                  className="w-full p-4 bg-white border border-blue-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <input 
                  type="number" 
                  placeholder="Fuga (µA)"
                  className="w-full p-4 bg-white border border-blue-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
          </div>

          <footer className="p-6 border-t bg-slate-50">
            <button 
              onClick={handleFinishTask}
              disabled={isFinishing}
              className={`w-full py-5 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 ${
                isFinishing ? 'bg-slate-400' : 'bg-blue-600 shadow-blue-200'
              }`}
            >
              {isFinishing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> GERANDO LAUDO...
                </>
              ) : (
                'Finalizar OS e Gerar PDF'
              )}
            </button>
          </footer>
        </div>
      )}
    </div>
  );
};

export default MaintenanceManager;
