export interface Collaborator {
  id: string;
  name: string;
  cpf: string;
  role: string;
  crf: string;
  accessLevel: string;
}

export interface Unit {
  id: string;
  name: string;
  location: string;
  responsible: string;
}

export interface Medication {
  id: string;
  name: string;
  activeIngredient: string;
  dosage: string;
  manufacturer: string;
  atcCode: string;
  specialControlGroup: 'A' | 'B' | 'C' | 'None';
  currentStock: number;
}

export interface StockMovement {
  id: string;
  medId: string;
  medName?: string;
  type: 'IN' | 'OUT';
  quantity: number;
  unitId?: string;
  unitName?: string;
  collaboratorId?: string;
  collabName?: string;
  timestamp: string;
}

export interface SystemUser {
  id: string;
  name: string;
  username: string;
  role: 'COORDENADOR' | 'USUARIO';
  createdAt: string;
  lastLogin?: string;
}

