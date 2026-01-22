
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ICONS } from './constants';
import { MaintenanceProvider, useMaintenance } from './context/MaintenanceContext';
import Dashboard from './components/Dashboard';
import EquipmentManager from './components/EquipmentManager';
import MaintenanceManager from './components/MaintenanceManager';
import OccurrenceManager from './components/OccurrenceManager';
import AlertManager from './components/AlertManager';
import ReportGenerator from './components/ReportGenerator';
import SystemSettings from './components/SystemSettings';
import AIAssistant from './components/AIAssistant';
import MobileActionHub from './components/MobileActionHub';
import { RefreshCw, Cloud, CloudOff } from 'lucide-react';

const Login = () => {
  const { login, register, systemSettings } = useMaintenance();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isRegistering) {
      if (register(name || username, username, password)) {
        setSuccess('Usuário cadastrado com sucesso! Agora entre no sistema.');
        setIsRegistering(false);
        setPassword('');
      } else {
        setError('Nome de usuário já cadastrado.');
      }
    } else {
      if (!login(username, password)) {
        setError('Usuário ou senha inválidos.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md space-y-6 animate-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl">
            {ICONS.Stats}
          </div>
          <h1 className="text-2xl font-bold text-slate-800 pt-2">
            {isRegistering ? 'Criar Nova Conta' : systemSettings.hospitalName}
          </h1>
          <p className="text-slate-500 text-sm">
            {isRegistering ? 'Escolha seus dados de acesso' : 'Engenharia Clínica Inteligente'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome de Usuário</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="Ex: joaosilva"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl outline-none focus:ring-2 transition-all ${error ? 'border-rose-300 ring-rose-100' : 'border-slate-100 focus:ring-blue-100'}`}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-[10px] text-rose-500 font-bold text-center">{error}</p>}
          {success && <p className="text-[10px] text-emerald-500 font-bold text-center">{success}</p>}

          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all uppercase text-xs tracking-widest">
            {isRegistering ? 'Cadastrar Agora' : 'Entrar'}
          </button>
        </form>

        <div className="text-center space-y-4">
          <button 
            type="button" 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccess(''); }}
            className="text-xs font-bold text-blue-600 hover:underline underline-offset-4"
          >
            {isRegistering ? 'Já possui cadastro? Faça login' : 'Não tem conta? Cadastre-se aqui'}
          </button>
          
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter pt-4">🔒 Acesso Seguro v2.5.0</p>
        </div>
      </div>
    </div>
  );
};

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useMaintenance();
  if (!isAuthenticated) return <Login />;
  return <>{children}</>;
};

const Sidebar = () => {
  const location = useLocation();
  const { occurrences, logout, currentUser, systemSettings } = useMaintenance();
  const criticalCount = occurrences.filter(o => o.isCritical && o.status !== 'Baixa').length;

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: ICONS.Dashboard },
    { path: '/equipments', label: 'Equipamentos', icon: ICONS.Equipment },
    { path: '/maintenance', label: 'Manutenção', icon: ICONS.Maintenance },
    { path: '/alerts', label: 'Alertas', icon: ICONS.Alerts },
    { path: '/occurrences', label: 'Ocorrências', icon: ICONS.Occurrences, badge: criticalCount },
    { path: '/reports', label: 'Relatórios', icon: ICONS.Reports },
    { path: '/settings', label: 'Configuração', icon: ICONS.Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 shadow-sm">
      <div className="p-6 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
          {ICONS.Stats}
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-slate-800 leading-none truncate">{systemSettings.hospitalName}</h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Smart Hospital</p>
        </div>
      </div>
      
      <div className="p-4 flex items-center gap-3 border-b border-slate-50 bg-slate-50/30">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
          {currentUser?.name.charAt(0)}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.name}</p>
          <p className="text-[9px] text-slate-500 truncate">@{currentUser?.username}</p>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`${isActive ? 'text-blue-600' : 'text-slate-400'}`}>{item.icon}</span>
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {item.badge && item.badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-blue-600 text-white' : 'bg-rose-500 text-white animate-pulse'}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
        <button onClick={logout} className="flex items-center gap-3 px-4 py-2 w-full text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs font-bold uppercase tracking-widest">
          {ICONS.Logout}
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

const BottomNav = () => {
  const location = useLocation();
  const { occurrences } = useMaintenance();
  const criticalCount = occurrences.filter(o => o.isCritical && o.status !== 'Baixa').length;
  
  const navItems = [
    { path: '/', icon: ICONS.Dashboard, label: 'Dash' },
    { path: '/equipments', icon: ICONS.Equipment, label: 'Ativos' },
    { path: '/maintenance', icon: ICONS.Maintenance, label: 'Manut' },
    { path: '/occurrences', icon: ICONS.Occurrences, label: 'Falhas', badge: criticalCount },
    { path: '/settings', icon: ICONS.Settings, label: 'Config' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center px-2 py-3 z-50 shadow-[0_-4px_15px_rgba(0,0,0,0.08)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 transition-all relative ${
              isActive ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${isActive ? 'bg-blue-50 shadow-inner' : ''}`}>
              {item.icon}
            </div>
            {item.badge && item.badge > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[8px] flex items-center justify-center rounded-full font-bold">
                {item.badge}
              </span>
            )}
            <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const AppContent = () => {
  const { occurrences, alerts, systemSettings, isOnline, isSyncing, pendingSyncCount, triggerManualSync } = useMaintenance();
  const criticalCount = occurrences.filter(o => o.isCritical && o.status !== 'Baixa').length;

  return (
    <ProtectedLayout>
      <div className={`flex min-h-screen transition-colors duration-500 ${systemSettings.highContrastMode ? 'bg-slate-950 grayscale-[0.3]' : 'bg-slate-50'}`}>
        <Sidebar />
        <main className="flex-1 w-full pb-20 md:pb-0 overflow-x-hidden">
          <header className={`h-16 border-b px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-colors ${systemSettings.highContrastMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="md:hidden w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
                {ICONS.Stats}
              </div>
              <div className="hidden md:flex items-center gap-4 text-slate-400 text-sm">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                  isOnline 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                  {isOnline ? <Cloud size={14} /> : <CloudOff size={14} />}
                  {isOnline ? 'CONECTADO' : 'OFFLINE'}
                </div>
                {pendingSyncCount > 0 && (
                  <button 
                    onClick={triggerManualSync}
                    className="flex items-center gap-2 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 transition-colors"
                  >
                    {isSyncing ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    {isSyncing ? 'SINCRONIZANDO...' : `${pendingSyncCount} PENDENTES`}
                  </button>
                )}
                <span className={`${systemSettings.highContrastMode ? 'text-slate-300' : 'text-slate-500'} font-bold`}>{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {criticalCount > 0 && (
                <Link to="/occurrences" className="flex items-center gap-2 bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse">
                  {ICONS.Critical}
                  <span className="hidden sm:inline">CRÍTICO: {criticalCount}</span>
                </Link>
              )}
              <Link to="/alerts" className={`p-2 hover:bg-slate-50 rounded-lg relative ${systemSettings.highContrastMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-400'}`}>
                {ICONS.Alerts}
                {alerts.length > 0 && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></div>
                )}
              </Link>
            </div>
          </header>

          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/equipments" element={<EquipmentManager />} />
              <Route path="/maintenance" element={<MaintenanceManager />} />
              <Route path="/alerts" element={<AlertManager />} />
              <Route path="/occurrences" element={<OccurrenceManager />} />
              <Route path="/reports" element={<ReportGenerator />} />
              <Route path="/settings" element={<SystemSettings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        <AIAssistant />
        <MobileActionHub />
        <BottomNav />
      </div>
    </ProtectedLayout>
  );
};

export default function App() {
  return (
    <MaintenanceProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </MaintenanceProvider>
  );
}
