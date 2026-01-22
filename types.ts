
export enum EquipmentCategory {
  DIAGNOSTICO = 'Diagnóstico',
  SUPORTE_VIDA = 'Suporte de Vida',
  LABORATORIO = 'Laboratório',
  MONITORIZACAO = 'Monitorização',
  TERAPEUTICO = 'Terapêutico'
}

export enum RiskClass {
  CLASSE_I = 'Classe I (Baixo Risco)',
  CLASSE_II = 'Classe II (Médio Risco)',
  CLASSE_III = 'Classe III (Alto Risco)',
  CLASSE_IV = 'Classe IV (Máximo Risco)'
}

export enum MaintenanceType {
  PREVENTIVA = 'Preventiva',
  CORRETIVA = 'Corretiva',
  CALIBRACAO = 'Calibração'
}

export enum MaintenanceStatus {
  PROGRAMADA = 'Programada',
  EM_ANDAMENTO = 'Em Andamento',
  CONCLUIDA = 'Concluída',
  ATRASADA = 'Atrasada'
}

export type SyncStatus = 'synced' | 'pending' | 'error';

export interface MaintenanceTask {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: MaintenanceType;
  date: string;
  status: MaintenanceStatus;
  technician: string;
  protocol: string;
  syncStatus?: SyncStatus;
}

export enum OccurrenceStatus {
  NECESSIDADE = 'Necessidade',
  A_FAZER = 'A Fazer',
  REALIZADA = 'Realizada',
  BAIXA = 'Baixa'
}

export enum AlertStatus {
  ATIVO = 'Ativo',
  RESOLVIDO = 'Resolvido'
}

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  riskClass: RiskClass;
  serialNumber: string;
  location: string;
  acquisitionDate: string;
  manufacturer: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  status: 'Operacional' | 'Manutenção' | 'Inoperante';
  usageHours: number;
  syncStatus?: SyncStatus;
}

export interface Occurrence {
  id: string;
  equipmentId: string;
  equipmentName: string;
  date: string;
  technician: string;
  description: string;
  partsReplaced: string[];
  status: OccurrenceStatus;
  isCritical: boolean;
  cost: number;
  downtimeHours: number;
  syncStatus?: SyncStatus;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  date: string;
  severity: 'Alta' | 'Média' | 'Baixa';
  status: AlertStatus;
  syncStatus?: SyncStatus;
}
