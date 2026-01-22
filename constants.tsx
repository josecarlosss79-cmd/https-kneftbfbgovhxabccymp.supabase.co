
import React from 'react';
import { 
  LayoutDashboard, 
  Stethoscope, 
  ClipboardCheck, 
  Bell, 
  History, 
  FileText, 
  Plus, 
  Search, 
  Settings,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Activity,
  User,
  LogOut,
  ChevronRight,
  Download,
  Filter,
  Zap,
  ShieldAlert,
  Database,
  ArrowRightCircle,
  MessageSquare,
  Share2,
  Mic,
  Wifi,
  WifiOff,
  Camera,
  Volume2
} from 'lucide-react';
import { OccurrenceStatus } from './types';

export const ICONS = {
  Dashboard: <LayoutDashboard size={20} />,
  Equipment: <Stethoscope size={20} />,
  Maintenance: <ClipboardCheck size={20} />,
  Alerts: <Bell size={20} />,
  Occurrences: <History size={20} />,
  Reports: <FileText size={20} />,
  Add: <Plus size={20} />,
  Search: <Search size={20} />,
  Settings: <Settings size={20} />,
  Warning: <AlertTriangle size={18} />,
  Success: <CheckCircle2 size={18} />,
  Pending: <Clock size={18} />,
  Tools: <Wrench size={18} />,
  Stats: <Activity size={18} />,
  User: <User size={18} />,
  Logout: <LogOut size={18} />,
  Arrow: <ChevronRight size={16} />,
  Download: <Download size={18} />,
  Filter: <Filter size={18} />,
  Intelligence: <Zap size={18} />,
  Critical: <ShieldAlert size={20} />,
  Audit: <Database size={18} />,
  NextAction: <ArrowRightCircle size={18} />,
  Message: <MessageSquare size={18} />,
  Share: <Share2 size={18} />,
  Mic: <Mic size={18} />,
  Wifi: <Wifi size={14} />,
  WifiOff: <WifiOff size={14} />,
  Camera: <Camera size={18} />,
  Volume: <Volume2 size={18} />
};

export const MOCK_EQUIPMENTS = [
  {
    id: 'EQ-001',
    name: 'Ventilador Pulmonar Savina 300',
    category: 'Suporte de Vida',
    serialNumber: 'SN987654',
    location: 'UTI Adulto - Leito 05',
    acquisitionDate: '2022-05-15',
    manufacturer: 'Dräger',
    status: 'Operacional',
    nextMaintenance: '2024-05-10', // Vencido propositalmente para teste de voz
    usageHours: 4200
  },
  {
    id: 'EQ-002',
    name: 'Monitor Multiparamétrico B450',
    category: 'Monitorização',
    serialNumber: 'SN123456',
    location: 'Emergência',
    acquisitionDate: '2023-01-10',
    manufacturer: 'GE Healthcare',
    status: 'Manutenção',
    nextMaintenance: '2024-05-30',
    usageHours: 1800
  },
  {
    id: 'EQ-003',
    name: 'Raio-X Portátil Mobilette',
    category: 'Diagnóstico',
    serialNumber: 'SN456789',
    location: 'Radiologia',
    acquisitionDate: '2021-11-20',
    manufacturer: 'Siemens',
    status: 'Operacional',
    nextMaintenance: '2024-05-01', // Vencido
    usageHours: 1500
  }
];

export const MOCK_OCCURRENCES = [
  { 
    id: 'CH-2024-001', 
    equipmentId: 'EQ-001',
    equipmentName: 'Ventilador Savina 300',
    date: '2024-05-22', 
    technician: 'Carlos Silva', 
    description: 'Falha crítica na válvula de exalação detectada pela enfermagem.', 
    isCritical: true,
    status: OccurrenceStatus.NECESSIDADE,
    cost: 1200.00,
    downtimeHours: 4.5,
    photos: []
  },
  { 
    id: 'CH-2024-002', 
    equipmentId: 'EQ-002',
    equipmentName: 'Monitor B450',
    date: '2024-05-18', 
    technician: 'Rodrigo Nunes', 
    description: 'Problema leve no cabo de ECG, apresentando ruído na tela.', 
    isCritical: false,
    status: OccurrenceStatus.A_FAZER,
    cost: 150.00,
    downtimeHours: 0.5,
    photos: []
  },
  { 
    id: 'CH-2024-003', 
    equipmentId: 'EQ-003',
    equipmentName: 'Raio-X Siemens',
    date: '2024-05-15', 
    technician: 'Amanda Costa', 
    description: 'Teste de descarga realizado com sucesso após troca de bateria.', 
    isCritical: false,
    status: OccurrenceStatus.BAIXA,
    cost: 450.00,
    downtimeHours: 1.0,
    photos: []
  }
];

export const MOCK_ALERTS = [
  {
    id: 'A1',
    title: 'Manutenção Vencida',
    description: 'Bomba de Infusão EQ-012 está com manutenção preventiva atrasada há 3 dias.',
    date: '2024-05-24',
    severity: 'Alta',
    status: 'Ativo'
  }
];
