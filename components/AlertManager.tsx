
import React from 'react';
import { ICONS } from '../constants';
import { useMaintenance } from '../context/MaintenanceContext';

const AlertManager: React.FC = () => {
  const { alerts, resolveAlert } = useMaintenance();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Alertas Ativos</h2>
          <p className="text-slate-500">Notificações Críticas de Engenharia Clínica.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {alerts.length > 0 ? alerts.map((alert) => (
            <div key={alert.id} className={`p-6 rounded-3xl border-l-4 bg-white shadow-sm flex gap-6 items-start animate-in slide-in-from-left duration-300 ${
              alert.severity === 'Alta' ? 'border-rose-500' : 'border-amber-500'
            }`}>
              <div className={`p-3 rounded-xl ${alert.severity === 'Alta' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                {ICONS.Warning}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800">{alert.title}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{alert.date}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{alert.description}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => resolveAlert(alert.id)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                  >
                    RESOLVER AGORA
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-20 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-300">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                {ICONS.Success}
              </div>
              <p className="font-bold">Zero alertas pendentes. Tudo em conformidade.</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl border h-fit">
          <h4 className="font-bold text-slate-800 mb-4">Métricas de Alerta</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Tempo Médio Resolução</span>
              <span className="font-bold text-slate-700">42 min</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[85%]"></div>
            </div>
            <p className="text-[10px] text-slate-400 italic mt-2">Você resolveu 85% dos alertas críticos dentro do SLA estabelecido pela RDC 509.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertManager;
