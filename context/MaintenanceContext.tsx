
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Equipment, Occurrence, Alert, OccurrenceStatus, AlertStatus, EquipmentCategory, RiskClass, MaintenanceTask, MaintenanceType, MaintenanceStatus } from '../types';
import { MOCK_EQUIPMENTS, MOCK_OCCURRENCES, MOCK_ALERTS } from '../constants';

interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  token?: string;
}

interface SystemSettings {
  hospitalName: string;
  notificationsEnabled: boolean;
  emailReportsEnabled: boolean;
  highContrastMode: boolean;
  cloudApiUrl: string;
  cloudApiKey: string;
  isCloudEnabled: boolean;
}

interface MaintenanceContextType {
  equipments: Equipment[];
  occurrences: Occurrence[];
  alerts: Alert[];
  tasks: MaintenanceTask[];
  isAuthenticated: boolean;
  currentUser: User | null;
  systemSettings: SystemSettings;
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  cloudLatency: number | null;
  login: (username: string, pass: string) => Promise<boolean>;
  register: (name: string, username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  addOccurrence: (occ: Partial<Occurrence>) => void;
  addEquipment: (eq: Partial<Equipment>) => void;
  importEquipments: (csvData: string) => number;
  updateOccurrenceStatus: (id: string) => void;
  resolveAlert: (id: string) => void;
  completeTask: (taskId: string, notes: string) => void;
  scheduleTask: (task: Partial<MaintenanceTask>) => void;
  resetSystem: () => void;
  triggerManualSync: () => void;
}

const DEFAULT_SETTINGS: SystemSettings = {
  hospitalName: 'Guardian Smart Hospital',
  notificationsEnabled: true,
  emailReportsEnabled: false,
  highContrastMode: false,
  // URL base do Supabase fornecida pelo usuário
  cloudApiUrl: 'https://kneftbfbgovhxabccymp.supabase.co/rest/v1',
  cloudApiKey: '', // O usuário deve colar sua ANON KEY nas configurações
  isCloudEnabled: true
};

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const MaintenanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('mm_users');
    return saved ? JSON.parse(saved) : [{ id: '1', name: 'Administrador', username: 'admin', password: '123' }];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mm_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('mm_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('mm_auth') === 'true');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudLatency, setCloudLatency] = useState<number | null>(null);
  
  const [equipments, setEquipments] = useState<Equipment[]>(() => {
    const saved = localStorage.getItem('mm_equipments');
    return saved ? JSON.parse(saved) : MOCK_EQUIPMENTS;
  });

  const [occurrences, setOccurrences] = useState<Occurrence[]>(() => {
    const saved = localStorage.getItem('mm_occurrences');
    return saved ? JSON.parse(saved) : MOCK_OCCURRENCES;
  });

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const saved = localStorage.getItem('mm_alerts');
    return saved ? JSON.parse(saved) : MOCK_ALERTS;
  });

  const [tasks, setTasks] = useState<MaintenanceTask[]>(() => {
    const saved = localStorage.getItem('mm_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 'OS-101', equipmentId: 'EQ-001', equipmentName: 'Ventilador Savina 300', type: MaintenanceType.PREVENTIVA, date: '2024-06-15', status: MaintenanceStatus.PROGRAMADA, technician: 'Rodrigo Nunes', protocol: 'IEC 62353', syncStatus: 'synced' },
      { id: 'OS-102', equipmentId: 'EQ-002', equipmentName: 'Monitor B450', type: MaintenanceType.CORRETIVA, date: '2024-05-25', status: MaintenanceStatus.EM_ANDAMENTO, technician: 'Amanda Costa', protocol: 'Fabricante GE', syncStatus: 'synced' }
    ];
  });

  // Monitor de Saúde da Conexão Cloud
  useEffect(() => {
    if (isOnline && systemSettings.isCloudEnabled && systemSettings.cloudApiUrl && systemSettings.cloudApiKey) {
      const checkHealth = async () => {
        const start = Date.now();
        try {
          const response = await fetch(`${systemSettings.cloudApiUrl}/equipments?select=count`, {
            method: 'GET',
            headers: {
              'apikey': systemSettings.cloudApiKey,
              'Authorization': `Bearer ${systemSettings.cloudApiKey}`
            }
          });
          if (response.ok) {
             setCloudLatency(Date.now() - start);
          }
        } catch (e) {
          setCloudLatency(null);
        }
      };

      const interval = setInterval(checkHealth, 30000);
      checkHealth();
      return () => clearInterval(interval);
    } else {
      setCloudLatency(null);
    }
  }, [isOnline, systemSettings.isCloudEnabled, systemSettings.cloudApiUrl, systemSettings.cloudApiKey]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('mm_users', JSON.stringify(users));
    localStorage.setItem('mm_equipments', JSON.stringify(equipments));
    localStorage.setItem('mm_occurrences', JSON.stringify(occurrences));
    localStorage.setItem('mm_alerts', JSON.stringify(alerts));
    localStorage.setItem('mm_tasks', JSON.stringify(tasks));
    localStorage.setItem('mm_settings', JSON.stringify(systemSettings));
    localStorage.setItem('mm_auth', isAuthenticated.toString());
    if (currentUser) localStorage.setItem('mm_current_user', JSON.stringify(currentUser));
  }, [equipments, occurrences, alerts, tasks, isAuthenticated, users, currentUser, systemSettings]);

  const pendingSyncCount = 
    equipments.filter(e => e.syncStatus === 'pending').length +
    occurrences.filter(o => o.syncStatus === 'pending').length +
    alerts.filter(a => a.syncStatus === 'pending').length +
    tasks.filter(t => t.syncStatus === 'pending').length;

  const syncPendingData = useCallback(async () => {
    if (!isOnline || isSyncing || pendingSyncCount === 0) return;

    setIsSyncing(true);
    
    if (systemSettings.isCloudEnabled && systemSettings.cloudApiUrl && systemSettings.cloudApiKey) {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'apikey': systemSettings.cloudApiKey,
          'Authorization': `Bearer ${systemSettings.cloudApiKey}`,
          'Prefer': 'resolution=merge-duplicates'
        };

        // Sincronização por tabela (Padrão Supabase/PostgREST)
        const syncTable = async (tableName: string, items: any[]) => {
          if (items.length === 0) return;
          await fetch(`${systemSettings.cloudApiUrl}/${tableName}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(items.map(({ syncStatus, ...rest }) => rest))
          });
        };

        await Promise.all([
          syncTable('equipments', equipments.filter(e => e.syncStatus === 'pending')),
          syncTable('occurrences', occurrences.filter(o => o.syncStatus === 'pending')),
          syncTable('alerts', alerts.filter(a => a.syncStatus === 'pending')),
          syncTable('tasks', tasks.filter(t => t.syncStatus === 'pending'))
        ]);

      } catch (e) {
        console.error("Cloud Sync Failure:", e);
      }
    }

    // Delay visual para feedback
    setTimeout(() => {
      setEquipments(prev => prev.map(e => ({ ...e, syncStatus: 'synced' })));
      setOccurrences(prev => prev.map(o => ({ ...o, syncStatus: 'synced' })));
      setAlerts(prev => prev.map(a => ({ ...a, syncStatus: 'synced' })));
      setTasks(prev => prev.map(t => ({ ...t, syncStatus: 'synced' })));
      setIsSyncing(false);
    }, 1500);
  }, [isOnline, isSyncing, pendingSyncCount, systemSettings, equipments, occurrences, alerts, tasks]);

  useEffect(() => {
    if (isOnline && pendingSyncCount > 0 && systemSettings.isCloudEnabled) {
      syncPendingData();
    }
  }, [isOnline, pendingSyncCount, syncPendingData, systemSettings.isCloudEnabled]);

  const triggerManualSync = () => {
    if (isOnline) syncPendingData();
    else alert("⚠️ Offline: Conecte-se para sincronizar.");
  };

  const completeTask = (taskId: string, notes: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        setEquipments(eqs => eqs.map(eq => {
          if (eq.id === t.equipmentId) {
            return {
              ...eq,
              status: 'Operacional' as any,
              lastMaintenance: new Date().toISOString().split('T')[0],
              syncStatus: 'pending'
            };
          }
          return eq;
        }));
        return { ...t, status: MaintenanceStatus.CONCLUIDA, syncStatus: 'pending' };
      }
      return t;
    }));
  };

  const scheduleTask = (task: Partial<MaintenanceTask>) => {
    const newTask: MaintenanceTask = {
      id: `OS-${Date.now().toString().slice(-4)}`,
      equipmentId: task.equipmentId || '',
      equipmentName: task.equipmentName || '',
      type: task.type || MaintenanceType.PREVENTIVA,
      date: task.date || new Date().toISOString().split('T')[0],
      status: MaintenanceStatus.PROGRAMADA,
      technician: currentUser?.name || 'Técnico',
      protocol: task.protocol || 'Geral',
      syncStatus: 'pending'
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSystemSettings(prev => ({ ...prev, ...newSettings }));
  };

  const login = async (username: string, pass: string) => {
    const user = users.find(u => u.username === username && u.password === pass);
    if (user) {
      setCurrentUser({ ...user, token: 'session-' + Date.now() });
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const register = async (name: string, username: string, pass: string) => {
    if (users.find(u => u.username === username)) return false;
    const newUser: User = { id: Date.now().toString(), name, username, password: pass };
    setUsers(prev => [...prev, newUser]);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const addEquipment = (newEq: Partial<Equipment>) => {
    const equipment: Equipment = {
      id: newEq.id || `EQ-${String(equipments.length + 1).padStart(3, '0')}`,
      name: newEq.name || 'Novo Equipamento',
      category: newEq.category || EquipmentCategory.DIAGNOSTICO,
      riskClass: newEq.riskClass || RiskClass.CLASSE_I,
      serialNumber: newEq.serialNumber || 'SN-TEMP',
      location: newEq.location || 'Almoxarifado',
      acquisitionDate: new Date().toISOString().split('T')[0],
      manufacturer: newEq.manufacturer || 'Fabricante',
      status: 'Operacional',
      usageHours: 0,
      syncStatus: 'pending'
    };
    setEquipments(prev => [equipment, ...prev]);
  };

  const importEquipments = (csvData: string) => {
    const lines = csvData.split('\n').filter(l => l.trim().length > 0);
    lines.forEach(line => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        addEquipment({ name: parts[0], serialNumber: parts[1], location: parts[2] || 'Setor' });
      }
    });
    return lines.length;
  };

  const addOccurrence = (newOcc: Partial<Occurrence>) => {
    const occurrence: Occurrence = {
      id: `CH-${Date.now().toString().slice(-4)}`,
      equipmentId: newOcc.equipmentId || 'EQ-000',
      equipmentName: newOcc.equipmentName || 'Ativo',
      date: new Date().toISOString().split('T')[0],
      technician: currentUser?.name || 'Eng.',
      description: newOcc.description || '',
      partsReplaced: [],
      status: OccurrenceStatus.NECESSIDADE,
      isCritical: !!newOcc.isCritical,
      cost: newOcc.cost || 0,
      downtimeHours: newOcc.downtimeHours || 0,
      syncStatus: 'pending'
    };
    setOccurrences(prev => [occurrence, ...prev]);
  };

  const updateOccurrenceStatus = (id: string) => {
    setOccurrences(prev => prev.map(occ => {
      if (occ.id === id) {
        const next = { [OccurrenceStatus.NECESSIDADE]: OccurrenceStatus.A_FAZER, [OccurrenceStatus.A_FAZER]: OccurrenceStatus.REALIZADA, [OccurrenceStatus.REALIZADA]: OccurrenceStatus.BAIXA, [OccurrenceStatus.BAIXA]: OccurrenceStatus.BAIXA };
        return { ...occ, status: next[occ.status], syncStatus: 'pending' };
      }
      return occ;
    }));
  };

  const resolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: AlertStatus.RESOLVIDO, syncStatus: 'pending' } : a));
  };

  const resetSystem = () => {
    setEquipments([]); setOccurrences([]); setAlerts([]); setTasks([]);
    localStorage.clear();
    setUsers([{ id: '1', name: 'Administrador', username: 'admin', password: '123' }]);
    setSystemSettings(DEFAULT_SETTINGS);
  };

  return (
    <MaintenanceContext.Provider value={{ 
      equipments, occurrences, alerts, tasks, isAuthenticated, currentUser, systemSettings, isOnline, isSyncing, pendingSyncCount, cloudLatency,
      login, register, logout, updateSettings, addOccurrence, addEquipment, importEquipments, updateOccurrenceStatus, resolveAlert, completeTask, scheduleTask, resetSystem, triggerManualSync
    }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) throw new Error('useMaintenance must be used within Provider');
  return context;
};
