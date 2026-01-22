
import React, { useState, useEffect, useCallback } from 'react';
import { ICONS, MOCK_EQUIPMENTS } from '../constants';
import { OccurrenceStatus } from '../types';
import { useMaintenance } from '../context/MaintenanceContext';
import { Cloud, Clock, Mic, MicOff, AlertCircle } from 'lucide-react';

const OccurrenceManager: React.FC = () => {
  const { occurrences, addOccurrence, updateOccurrenceStatus, systemSettings, equipments } = useMaintenance();
  const [showModal, setShowModal] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedEq, setSelectedEq] = useState(equipments[0]?.id || '');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [filter, setFilter] = useState<OccurrenceStatus | 'TODOS'>('TODOS');
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = React.useRef<any>(null);

  // Verifica compatibilidade do navegador ao montar
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const filteredOccurrences = filter === 'TODOS' 
    ? occurrences 
    : occurrences.filter(o => o.status === filter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const equipment = equipments.find(eq => eq.id === selectedEq);
    addOccurrence({
      equipmentId: selectedEq,
      equipmentName: equipment?.name || 'N/A',
      description,
      isCritical,
      cost: isCritical ? 1500 : 200,
      downtimeHours: isCritical ? 12 : 1
    });
    setShowModal(false);
    setDescription('');
    setIsCritical(false);
    setSpeechError(null);
  };

  const toggleSpeechRecognition = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    setSpeechError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSpeechError("Navegador não suporta comando de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onend = () => setIsRecording(false);

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setIsRecording(false);
      if (event.error === 'not-allowed') {
        setSpeechError("Permissão de microfone negada.");
      } else {
        setSpeechError("Erro ao capturar voz. Tente novamente.");
      }
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription(prev => {
        const space = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
        return prev + space + transcript.charAt(0).toUpperCase() + transcript.slice(1);
      });
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isRecording]);

  const getStatusColor = (status: OccurrenceStatus) => {
    switch(status) {
      case OccurrenceStatus.NECESSIDADE: return 'bg-amber-100 text-amber-700 border-amber-200';
      case OccurrenceStatus.A_FAZER: return 'bg-blue-100 text-blue-700 border-blue-200';
      case OccurrenceStatus.REALIZADA: return 'bg-purple-100 text-purple-700 border-purple-200';
      case OccurrenceStatus.BAIXA: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${systemSettings.highContrastMode ? 'text-white' : 'text-slate-800'}`}>Ocorrências Ativas</h2>
          <p className="text-slate-500">Gestão do ciclo de vida da falha hospitalar.</p>
        </div>
        <button 
          onClick={() => {
            setShowModal(true);
            if (equipments.length > 0 && !selectedEq) setSelectedEq(equipments[0].id);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95"
        >
          {ICONS.Warning} NOVO CHAMADO
        </button>
      </header>

      <div className="flex flex-wrap gap-2 p-1 bg-slate-200/50 rounded-2xl w-fit">
        {['TODOS', ...Object.values(OccurrenceStatus)].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className={`rounded-3xl border shadow-sm overflow-hidden ${systemSettings.highContrastMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="divide-y divide-slate-100">
          {filteredOccurrences.map((occ) => (
            <div key={occ.id} className={`p-6 transition-all group ${occ.isCritical && occ.status !== 'Baixa' ? 'bg-rose-50/30 border-l-4 border-rose-500' : 'hover:bg-slate-50'}`}>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-48 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${getStatusColor(occ.status)}`}>{occ.id}</span>
                    {occ.isCritical && <span className="text-rose-600">{ICONS.Critical}</span>}
                    {occ.syncStatus === 'pending' && (
                      <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                        <Clock size={10} /> OFFLINE
                      </div>
                    )}
                  </div>
                  <p className={`text-sm font-bold ${systemSettings.highContrastMode ? 'text-slate-300' : 'text-slate-800'}`}>{occ.date}</p>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-bold ${systemSettings.highContrastMode ? 'text-white' : 'text-slate-800'}`}>
                      {occ.equipmentName}
                    </h4>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-bold border ${getStatusColor(occ.status)}`}>{occ.status}</span>
                  </div>
                  <p className={`text-sm mt-1 ${systemSettings.highContrastMode ? 'text-slate-400' : 'text-slate-600'}`}>{occ.description}</p>
                </div>
                
                <div className="flex flex-row md:flex-col gap-2 justify-end">
                  {occ.status !== OccurrenceStatus.BAIXA && (
                    <button 
                      onClick={() => updateOccurrenceStatus(occ.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 flex items-center gap-2 shadow-md transition-all active:scale-95"
                    >
                      {ICONS.NextAction} PRÓXIMA ETAPA
                    </button>
                  )}
                  {occ.syncStatus === 'synced' && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      <Cloud size={12} /> SINCRONIZADO
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredOccurrences.length === 0 && (
            <div className="p-20 text-center text-slate-400 italic">
              Nenhuma ocorrência encontrada para este filtro.
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className={`w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 border ${
            systemSettings.highContrastMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className={`p-6 border-b flex items-center justify-between ${isCritical ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : systemSettings.highContrastMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`}>
              <h3 className="text-xl font-bold">Abertura de Chamado</h3>
              <button type="button" onClick={() => { setShowModal(false); setSpeechError(null); }} className="text-2xl hover:text-rose-500 transition-colors">&times;</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Equipamento</label>
                <select 
                  value={selectedEq}
                  onChange={(e) => setSelectedEq(e.target.value)}
                  className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    systemSettings.highContrastMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'
                  }`}
                >
                  {equipments.map(eq => <option key={eq.id} value={eq.id}>{eq.name} ({eq.id})</option>)}
                </select>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                systemSettings.highContrastMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'
              }`}>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Falha Crítica?</span>
                  <span className="text-[10px] text-slate-400">Ativa alertas prioritários na engenharia</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsCritical(!isCritical)}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isCritical ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isCritical ? 'right-1 scale-110' : 'left-1'}`}></div>
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Descrição Técnica</label>
                  {speechSupported && (
                    <button 
                      type="button" 
                      onClick={toggleSpeechRecognition} 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-sm ${
                        isRecording 
                          ? 'bg-rose-600 text-white animate-pulse' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {isRecording ? <Mic size={14} /> : <Mic size={14} />}
                      {isRecording ? 'OUVINDO... (CLIQUE P/ PARAR)' : 'DITAR DESCRIÇÃO'}
                    </button>
                  )}
                </div>
                
                <div className="relative">
                  <textarea 
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`w-full p-4 border rounded-2xl h-32 resize-none outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm leading-relaxed ${
                      systemSettings.highContrastMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                    placeholder="Descreva o problema ou dize o que aconteceu..."
                  />
                  {isRecording && (
                    <div className="absolute inset-0 bg-blue-500/5 rounded-2xl pointer-events-none border-2 border-blue-500/20 animate-pulse"></div>
                  )}
                </div>
                
                {speechError && (
                  <div className="mt-2 flex items-center gap-2 text-rose-500 text-[10px] font-bold">
                    <AlertCircle size={12} />
                    {speechError}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setSpeechError(null); }} 
                  className={`flex-1 py-4 font-bold rounded-2xl transition-all ${
                    systemSettings.highContrastMode 
                      ? 'text-slate-400 hover:text-white border border-slate-700' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  CANCELAR
                </button>
                <button 
                  type="submit" 
                  className={`flex-1 py-4 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 ${
                    isCritical ? 'bg-rose-600 shadow-rose-200 hover:bg-rose-700' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'
                  }`}
                >
                  ABRIR CHAMADO
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default OccurrenceManager;
