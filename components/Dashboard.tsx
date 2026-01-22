
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ICONS } from '../constants';
import { useMaintenance } from '../context/MaintenanceContext';
import { Cloud, CloudOff, CheckCircle2, Clock, Globe, Zap } from 'lucide-react';

const IOT_DATA = [
  { time: '08:00', load: 45 }, { time: '10:00', load: 60 }, { time: '12:00', load: 85 },
  { time: '14:00', load: 92 }, { time: '16:00', load: 70 }, { time: '18:00', load: 55 },
];

const Dashboard: React.FC = () => {
  const { occurrences, equipments, alerts, isOnline, pendingSyncCount, isSyncing, cloudLatency, systemSettings } = useMaintenance();

  const stats = useMemo(() => {
    const totalOcc = occurrences.length;
    const resolved = occurrences.filter(o => o.status === 'Baixa').length;
    const rate = totalOcc > 0 ? ((resolved / totalOcc) * 100).toFixed(1) : '100';
    const totalCost = occurrences.reduce((acc, curr) => acc + curr.cost, 0);
    const avgMttr = totalOcc > 0 ? (occurrences.reduce((acc, curr) => acc + curr.downtimeHours, 0) / totalOcc).toFixed(1) : '0';

    return [
      { label: 'Resolutividade', value: `${rate}%`, icon: ICONS.Success, color: 'bg-emerald-50 text-emerald-600' },
      { label: 'Ocorrências Ativas', value: totalOcc - resolved, icon: ICONS.Warning, color: 'bg-rose-50 text-rose-600' },
      { label: 'MTTR Médio', value: `${avgMttr}h`, icon: ICONS.Tools, color: 'bg-amber-50 text-amber-600' },
      { label: 'Custo Acumulado', value: `R$ ${totalCost.toLocaleString()}`, icon: ICONS.Reports, color: 'bg-indigo-50 text-indigo-600' },
    ];
  }, [occurrences]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Status Operacional</h2>
          <p className="text-slate-500">Dados dinâmicos da engenharia clínica em tempo real.</p>
        </div>
        
        {/* Offline & Cloud Awareness Widget */}
        <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all shadow-sm ${
          isOnline ? 'bg-white border-slate-100' : 'bg-rose-50 border-rose-100'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}>
            {isOnline ? <Cloud size={20} /> : <CloudOff size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Infraestrutura</p>
              {cloudLatency && (
                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Zap size={8} /> {cloudLatency}ms
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${isOnline ? 'text-slate-700' : 'text-rose-600'}`}>
                {systemSettings.isCloudEnabled ? (isSyncing ? 'Sincronizando...' : 'Cloud Ativo') : 'Local Storage Only'}
              </span>
              {pendingSyncCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full">
                  {pendingSyncCount} PENDENTES
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border shadow-sm group hover:border-blue-200 transition-all">
            <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              {ICONS.Intelligence} Carga de Trabalho do Ativo (IoT)
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <Globe size={12} /> SERVIDOR: {systemSettings.isCloudEnabled ? 'AWS US-EAST' : 'LOCAL CACHE'}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={IOT_DATA}>
                <defs>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="load" stroke="#3b82f6" fill="url(#colorLoad)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl text-white flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-bold bg-blue-500/20 px-2 py-1 rounded-full text-blue-400 mb-4 inline-block tracking-widest">IA PREDICTOR</span>
            <h4 className="text-xl font-bold mb-4">Recomendações de Segurança</h4>
            <div className="space-y-4">
              {alerts.length > 0 ? (
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-xs text-blue-400 font-bold mb-1">Ação Requerida</p>
                  <p className="text-xs text-slate-300">{alerts[0].title}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Nenhum risco preditivo detectado.</p>
              )}
              
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <CheckCircle2 size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Cloud Health</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {systemSettings.isCloudEnabled 
                    ? `Sincronização persistente ativa via ${systemSettings.cloudApiUrl}.` 
                    : "Sistema operando em modo isolado (Local DB)."}
                </p>
              </div>
            </div>
          </div>
          <button className="w-full py-3 bg-blue-600 rounded-xl font-bold text-xs mt-6 hover:bg-blue-500 transition-all">OTIMIZAR PLANO</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
