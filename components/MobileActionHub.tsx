
import React, { useState } from 'react';
import { QrCode, Mic, RefreshCw, Plus, X, Stethoscope, History } from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { useNavigate } from 'react-router-dom';

const MobileActionHub: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isOnline, isSyncing, pendingSyncCount, triggerManualSync } = useMaintenance();
  const navigate = useNavigate();

  const actions = [
    { 
      icon: <QrCode size={24} />, 
      label: 'Escanear Ativo', 
      color: 'bg-blue-600', 
      onClick: () => { navigate('/equipments'); setIsOpen(false); } 
    },
    { 
      icon: <Mic size={24} />, 
      label: 'Relato por Voz', 
      color: 'bg-rose-600', 
      onClick: () => { navigate('/occurrences'); setIsOpen(false); } 
    },
    { 
      icon: <RefreshCw size={24} className={isSyncing ? 'animate-spin' : ''} />, 
      label: isSyncing ? 'Sincronizando...' : `Sincronizar (${pendingSyncCount})`, 
      color: 'bg-amber-500', 
      onClick: () => { triggerManualSync(); if (pendingSyncCount === 0) setIsOpen(false); } 
    }
  ];

  return (
    <div className="md:hidden fixed bottom-20 right-6 z-[100]">
      {/* Botões de Ação Expansíveis */}
      {isOpen && (
        <div className="flex flex-col-reverse items-end gap-3 mb-4 animate-in slide-in-from-bottom-10 duration-300">
          {actions.map((action, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="bg-white px-3 py-1 rounded-lg shadow-md text-[10px] font-bold uppercase text-slate-600 border border-slate-100">
                {action.label}
              </span>
              <button
                onClick={action.onClick}
                className={`${action.color} text-white p-4 rounded-2xl shadow-xl active:scale-90 transition-all`}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botão Principal (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'bg-slate-800 rotate-45' : 'bg-blue-600'} text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative`}
      >
        {isOpen ? <X size={28} /> : <Plus size={28} />}
        {!isOpen && pendingSyncCount > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 border-4 border-slate-50 rounded-full animate-bounce"></div>
        )}
      </button>
    </div>
  );
};

export default MobileActionHub;
