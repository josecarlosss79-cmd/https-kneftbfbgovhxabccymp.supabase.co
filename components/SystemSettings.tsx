
import React, { useState, useEffect } from 'react';
import { Database, Activity, ShieldCheck, HeartPulse, Save, RefreshCw, Server, Key, Link as LinkIcon, ShieldAlert, Code } from 'lucide-react';
import { ICONS } from '../constants';
import { useMaintenance } from '../context/MaintenanceContext';

const SystemSettings: React.FC = () => {
  const [resetting, setResetting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const { systemSettings, updateSettings, importEquipments, resetSystem, equipments, occurrences, alerts, tasks } = useMaintenance();
  const [importText, setImportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const handleSaveAll = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setLastSaved(new Date().toLocaleTimeString());
    }, 800);
  };

  const handleReset = () => {
    const confirmPhrase = "LIMPAR BASE";
    const promptValue = window.prompt(`ATENÇÃO: Isso apagará TODOS os registros (Ativos, Ocorrências, Alertas, Tarefas e Branding).\n\nEsta ação é IRREVERSÍVEL.\n\nDigite "${confirmPhrase}" para confirmar:`);
    if (promptValue === confirmPhrase) {
      setResetting(true);
      setTimeout(() => { resetSystem(); setResetting(false); alert("✅ SISTEMA REINICIADO COM SUCESSO!"); }, 2500);
    } else if (promptValue !== null) { alert("⚠️ Frase de confirmação incorreta."); }
  };

  const handleExportBackup = () => {
    setExporting(true);
    setTimeout(() => {
      const backupData = { version: '2.5.1', timestamp: new Date().toISOString(), data: { equipments, occurrences, alerts, tasks, settings: systemSettings } };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medmaintain_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setExporting(false);
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className={`text-3xl font-bold tracking-tight ${systemSettings.highContrastMode ? 'text-white' : 'text-slate-800'}`}>Cloud Gateway v2</h2>
          <p className="text-slate-500 font-medium">Configuração de autenticação e persistência remota.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && <span className="text-[10px] font-bold text-emerald-500 animate-pulse">SINCRO: {lastSaved}</span>}
          <button onClick={handleSaveAll} disabled={saving} className={`px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg ${saving ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'}`}>
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'SALVANDO...' : 'SALVAR E REINICIAR'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cloud Gateway */}
        <div className={`lg:col-span-2 p-8 rounded-[2.5rem] border shadow-sm space-y-6 transition-colors ${
          systemSettings.highContrastMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Server size={24} />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${systemSettings.highContrastMode ? 'text-white' : 'text-slate-800'}`}>Conectividade Remota</h3>
                <p className="text-xs text-slate-400">Integração via REST API com Injeção de Header.</p>
              </div>
            </div>
            <button 
              onClick={() => updateSettings({ isCloudEnabled: !systemSettings.isCloudEnabled })}
              className={`w-14 h-7 rounded-full relative transition-all shadow-inner ${systemSettings.isCloudEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${systemSettings.isCloudEnabled ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <LinkIcon size={12} /> Endpoint Principal (URL)
              </label>
              <input 
                type="url" 
                value={systemSettings.cloudApiUrl}
                onChange={(e) => updateSettings({ cloudApiUrl: e.target.value })}
                className={`w-full px-5 py-3.5 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 font-mono text-sm transition-all ${
                  systemSettings.highContrastMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'
                }`}
                placeholder="https://vossa-api.xyz"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Key size={12} /> Chave de Autenticação (Anon Key / API Key)
              </label>
              <input 
                type="password" 
                value={systemSettings.cloudApiKey}
                onChange={(e) => updateSettings({ cloudApiKey: e.target.value })}
                className={`w-full px-5 py-3.5 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 font-mono text-sm transition-all ${
                  systemSettings.highContrastMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'
                }`}
                placeholder="Insira sua SUA-ANON-KEY"
              />
              
              {/* Visualização de Cabeçalhos Injetados */}
              <div className={`mt-4 p-4 rounded-2xl border border-dashed flex items-start gap-4 ${systemSettings.highContrastMode ? 'bg-slate-950/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                 <Code size={18} className="text-blue-500 mt-1" />
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Cabeçalhos Injetados Automaticamente:</p>
                    <pre className="text-[9px] font-mono text-slate-500 overflow-x-auto">
{`{
  "apikey": "${systemSettings.cloudApiKey || 'SUA-ANON-KEY'}",
  "Authorization": "Bearer ${systemSettings.cloudApiKey || 'SUA-ANON-KEY'}"
}`}
                    </pre>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Box */}
        <div className="space-y-6">
          <div className={`p-8 rounded-[2.5rem] border shadow-sm transition-colors ${
            systemSettings.highContrastMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 text-white shadow-xl'
          }`}>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-400" /> Camada de Segurança
            </h3>
            <div className="mt-6 space-y-4">
               <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${systemSettings.cloudApiKey ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-600'}`}></div>
                  <span className="text-xs font-bold text-slate-300">Auth Header: {systemSettings.cloudApiKey ? 'OK' : 'Pendente'}</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${systemSettings.cloudApiUrl ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-600'}`}></div>
                  <span className="text-xs font-bold text-slate-300">Gateway URL: {systemSettings.cloudApiUrl ? 'OK' : 'Pendente'}</span>
               </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-6 leading-relaxed">
               As chaves são armazenadas de forma segura no seu perfil de navegador e criptografadas durante o trânsito (HTTPS).
            </p>
          </div>

          <div className={`p-8 rounded-[2.5rem] border transition-colors flex flex-col justify-center items-center text-center space-y-4 ${
            systemSettings.highContrastMode ? 'bg-rose-950/20 border-rose-900/50' : 'bg-rose-50 border-rose-100'
          }`}>
            <ShieldAlert size={32} className="text-rose-500" />
            <h3 className="font-bold text-rose-800 text-sm">Zona de Risco</h3>
            <button onClick={() => { if(confirm("Apagar todos os dados locais?")) resetSystem(); }} className="w-full py-3 bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-all">REINICIAR DATABASE</button>
          </div>
        </div>

      </div>

      {/* Hub de Dados Inferior */}
      <div className={`p-8 rounded-[3rem] border shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between transition-colors ${
        systemSettings.highContrastMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-4">
           <div className="p-4 bg-amber-50 text-amber-600 rounded-3xl">
              <Database size={32} />
           </div>
           <div>
              <h4 className={`font-bold ${systemSettings.highContrastMode ? 'text-white' : 'text-slate-800'}`}>Gerenciamento de Backup</h4>
              <p className="text-xs text-slate-500">Exporte ou importe sua base JSON para migração.</p>
           </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setShowImportModal(true)} className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase">IMPORTAR</button>
          <button onClick={handleExportBackup} className="flex-1 md:flex-none px-6 py-3 border border-slate-200 rounded-xl text-[10px] font-bold uppercase">EXPORTAR</button>
        </div>
      </div>

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Injetar Dados Externos</h3>
              <button onClick={() => setShowImportModal(false)} className="text-2xl text-slate-400">&times;</button>
            </div>
            <div className="p-8 space-y-4">
               <textarea 
                 value={importText} onChange={(e) => setImportText(e.target.value)} 
                 placeholder="Cole seu JSON ou CSV aqui..."
                 className="w-full h-48 p-4 bg-slate-50 border rounded-2xl font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none"
               />
               <button onClick={() => { importEquipments(importText); setShowImportModal(false); }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-xs uppercase shadow-xl shadow-blue-200">PROCESSAR IMPORTAÇÃO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
