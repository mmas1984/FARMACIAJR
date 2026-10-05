import { Medication, Collaborator, Unit, StockMovement, SystemUser } from './types';
import { INITIAL_HOSPITAL_DATA } from './services/googleSheets';

const API_URL = '/api';

// Fallback Local Storage Keys for Static Deployments (e.g. GitHub Pages)
const STORAGE_KEYS = {
  MEDS: 'farmacia_sales_junior_meds',
  COLLABS: 'farmacia_sales_junior_collabs',
  UNITS: 'farmacia_sales_junior_units',
  MOVEMENTS: 'farmacia_sales_junior_movements',
  USERS: 'farmacia_sales_junior_users'
};

const DEFAULT_USERS: (SystemUser & { password?: string })[] = [
  {
    id: 'usr-coord-01',
    name: 'Farmacêutico Sales Júnior',
    username: 'coordenador',
    password: 'admin123',
    role: 'COORDENADOR',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-oper-01',
    name: 'Enf. Juliana Mendes',
    username: 'operador',
    password: 'user123',
    role: 'USUARIO',
    createdAt: new Date().toISOString()
  }
];

// Helper to check and get client storage data
function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Erro ao salvar no localStorage:', err);
  }
}

// Initialize local seeds if empty (for GitHub Pages static environment)
function ensureSeedsInitialized() {
  getLocalItem(STORAGE_KEYS.MEDS, INITIAL_HOSPITAL_DATA.medications);
  getLocalItem(STORAGE_KEYS.COLLABS, INITIAL_HOSPITAL_DATA.collaborators);
  getLocalItem(STORAGE_KEYS.UNITS, INITIAL_HOSPITAL_DATA.units);
  getLocalItem(STORAGE_KEYS.MOVEMENTS, INITIAL_HOSPITAL_DATA.movements);
  getLocalItem(STORAGE_KEYS.USERS, DEFAULT_USERS);
}

ensureSeedsInitialized();

// Safe fetch wrapper that detects if /api is active or returns 404/HTML (static GitHub Pages)
async function safeApiCall<T>(
  url: string,
  options?: RequestInit,
  fallbackFn?: () => Promise<T> | T
): Promise<T> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // If server returned HTML (typical of GitHub Pages 404 or SPA rewrite) or 404
    if (!res.ok || !contentType.includes('application/json')) {
      if (fallbackFn) {
        return await fallbackFn();
      }
      throw new Error(`API Indisponível (HTTP ${res.status})`);
    }

    return await res.json();
  } catch (err) {
    if (fallbackFn) {
      return await fallbackFn();
    }
    throw err;
  }
}

export const api = {
  // 1. Collaborators
  getCollaborators: async (): Promise<Collaborator[]> => {
    return safeApiCall(
      `${API_URL}/collaborators`,
      undefined,
      () => getLocalItem<Collaborator[]>(STORAGE_KEYS.COLLABS, INITIAL_HOSPITAL_DATA.collaborators)
    );
  },

  createCollaborator: async (data: Omit<Collaborator, 'id'>): Promise<Collaborator> => {
    return safeApiCall(
      `${API_URL}/collaborators`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) },
      () => {
        const list = getLocalItem<Collaborator[]>(STORAGE_KEYS.COLLABS, INITIAL_HOSPITAL_DATA.collaborators);
        const newCollab: Collaborator = { id: `col-${Date.now()}`, ...data };
        const updated = [...list, newCollab];
        setLocalItem(STORAGE_KEYS.COLLABS, updated);
        return newCollab;
      }
    );
  },

  updateCollaborator: async (id: string, data: Partial<Collaborator>): Promise<Collaborator> => {
    return safeApiCall(
      `${API_URL}/collaborators/${id}`,
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) },
      () => {
        const list = getLocalItem<Collaborator[]>(STORAGE_KEYS.COLLABS, INITIAL_HOSPITAL_DATA.collaborators);
        const updated = list.map(c => (c.id === id ? { ...c, ...data } : c));
        setLocalItem(STORAGE_KEYS.COLLABS, updated);
        return updated.find(c => c.id === id)!;
      }
    );
  },

  deleteCollaborator: async (id: string): Promise<void> => {
    return safeApiCall(
      `${API_URL}/collaborators/${id}`,
      { method: 'DELETE' },
      () => {
        const list = getLocalItem<Collaborator[]>(STORAGE_KEYS.COLLABS, INITIAL_HOSPITAL_DATA.collaborators);
        setLocalItem(STORAGE_KEYS.COLLABS, list.filter(c => c.id !== id));
      }
    );
  },

  // 2. Units
  getUnits: async (): Promise<Unit[]> => {
    return safeApiCall(
      `${API_URL}/units`,
      undefined,
      () => getLocalItem<Unit[]>(STORAGE_KEYS.UNITS, INITIAL_HOSPITAL_DATA.units)
    );
  },

  createUnit: async (data: Omit<Unit, 'id'>): Promise<Unit> => {
    return safeApiCall(
      `${API_URL}/units`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) },
      () => {
        const list = getLocalItem<Unit[]>(STORAGE_KEYS.UNITS, INITIAL_HOSPITAL_DATA.units);
        const newUnit: Unit = { id: `unit-${Date.now()}`, ...data };
        setLocalItem(STORAGE_KEYS.UNITS, [...list, newUnit]);
        return newUnit;
      }
    );
  },

  updateUnit: async (id: string, data: Partial<Unit>): Promise<Unit> => {
    return safeApiCall(
      `${API_URL}/units/${id}`,
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) },
      () => {
        const list = getLocalItem<Unit[]>(STORAGE_KEYS.UNITS, INITIAL_HOSPITAL_DATA.units);
        const updated = list.map(u => (u.id === id ? { ...u, ...data } : u));
        setLocalItem(STORAGE_KEYS.UNITS, updated);
        return updated.find(u => u.id === id)!;
      }
    );
  },

  deleteUnit: async (id: string): Promise<void> => {
    return safeApiCall(
      `${API_URL}/units/${id}`,
      { method: 'DELETE' },
      () => {
        const list = getLocalItem<Unit[]>(STORAGE_KEYS.UNITS, INITIAL_HOSPITAL_DATA.units);
        setLocalItem(STORAGE_KEYS.UNITS, list.filter(u => u.id !== id));
      }
    );
  },

  // 3. Medications
  getMedications: async (): Promise<Medication[]> => {
    return safeApiCall(
      `${API_URL}/medications`,
      undefined,
      () => getLocalItem<Medication[]>(STORAGE_KEYS.MEDS, INITIAL_HOSPITAL_DATA.medications)
    );
  },

  createMedication: async (data: Omit<Medication, 'id' | 'currentStock'>): Promise<Medication> => {
    return safeApiCall(
      `${API_URL}/medications`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) },
      () => {
        const list = getLocalItem<Medication[]>(STORAGE_KEYS.MEDS, INITIAL_HOSPITAL_DATA.medications);
        const newMed: Medication = { id: `med-${Date.now()}`, currentStock: 0, ...data };
        setLocalItem(STORAGE_KEYS.MEDS, [...list, newMed]);
        return newMed;
      }
    );
  },

  updateMedication: async (id: string, data: Partial<Medication>): Promise<Medication> => {
    return safeApiCall(
      `${API_URL}/medications/${id}`,
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) },
      () => {
        const list = getLocalItem<Medication[]>(STORAGE_KEYS.MEDS, INITIAL_HOSPITAL_DATA.medications);
        const updated = list.map(m => (m.id === id ? { ...m, ...data } : m));
        setLocalItem(STORAGE_KEYS.MEDS, updated);
        return updated.find(m => m.id === id)!;
      }
    );
  },

  deleteMedication: async (id: string): Promise<void> => {
    return safeApiCall(
      `${API_URL}/medications/${id}`,
      { method: 'DELETE' },
      () => {
        const list = getLocalItem<Medication[]>(STORAGE_KEYS.MEDS, INITIAL_HOSPITAL_DATA.medications);
        setLocalItem(STORAGE_KEYS.MEDS, list.filter(m => m.id !== id));
      }
    );
  },

  // 4. Stock Movements
  getMovements: async (): Promise<StockMovement[]> => {
    return safeApiCall(
      `${API_URL}/movements`,
      undefined,
      () => {
        const movs = getLocalItem<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_HOSPITAL_DATA.movements);
        const meds = getLocalItem<Medication[]>(STORAGE_KEYS.MEDS, INITIAL_HOSPITAL_DATA.medications);
        const units = getLocalItem<Unit[]>(STORAGE_KEYS.UNITS, INITIAL_HOSPITAL_DATA.units);
        const collabs = getLocalItem<Collaborator[]>(STORAGE_KEYS.COLLABS, INITIAL_HOSPITAL_DATA.collaborators);

        return movs.map(m => ({
          ...m,
          medName: meds.find(x => x.id === m.medId)?.name,
          unitName: units.find(x => x.id === m.unitId)?.name,
          collabName: collabs.find(x => x.id === m.collaboratorId)?.name
        }));
      }
    );
  },

  createMovement: async (data: {
    medId: string;
    type: 'IN' | 'OUT';
    quantity: number;
    unitId?: string;
    collaboratorId?: string;
  }): Promise<StockMovement> => {
    return safeApiCall(
      `${API_URL}/movements`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) },
      () => {
        const meds = getLocalItem<Medication[]>(STORAGE_KEYS.MEDS, INITIAL_HOSPITAL_DATA.medications);
        const medIdx = meds.findIndex(m => m.id === data.medId);
        if (medIdx === -1) throw new Error('Medicamento não encontrado.');

        const med = meds[medIdx];
        if (data.type === 'OUT') {
          if (!data.unitId || !data.collaboratorId) {
            throw new Error('Unidade e Colaborador são obrigatórios para saída.');
          }
          if (med.currentStock < data.quantity) {
            throw new Error('Estoque insuficiente para dispensação.');
          }
          med.currentStock -= data.quantity;
        } else {
          med.currentStock += data.quantity;
        }

        setLocalItem(STORAGE_KEYS.MEDS, meds);

        const movs = getLocalItem<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_HOSPITAL_DATA.movements);
        const newMov: StockMovement = {
          id: `mov-${Date.now()}`,
          medId: data.medId,
          type: data.type,
          quantity: data.quantity,
          unitId: data.unitId,
          collaboratorId: data.collaboratorId,
          timestamp: new Date().toISOString()
        };

        setLocalItem(STORAGE_KEYS.MOVEMENTS, [newMov, ...movs]);
        return newMov;
      }
    );
  },

  // 5. Auth & User Management
  login: async (username: string, password: string): Promise<SystemUser> => {
    return safeApiCall(
      `${API_URL}/auth/login`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) },
      () => {
        const users = getLocalItem<any[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
        const found = users.find(
          u => u.username.toLowerCase() === String(username).toLowerCase() && u.password === String(password)
        );

        if (!found) {
          throw new Error('Credenciais inválidas. Verifique seu login e senha.');
        }

        found.lastLogin = new Date().toISOString();
        setLocalItem(STORAGE_KEYS.USERS, users);

        const { password: _, ...safeUser } = found;
        return safeUser;
      }
    );
  },

  getUsers: async (): Promise<SystemUser[]> => {
    return safeApiCall(
      `${API_URL}/users`,
      undefined,
      () => {
        const users = getLocalItem<any[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
        return users.map(({ password, ...rest }) => rest);
      }
    );
  },

  createUser: async (data: { name: string; username: string; password: string; role: 'COORDENADOR' | 'USUARIO' }): Promise<SystemUser> => {
    return safeApiCall(
      `${API_URL}/users`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) },
      () => {
        const users = getLocalItem<any[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
        const existing = users.find(u => u.username.toLowerCase() === data.username.toLowerCase());
        if (existing) {
          throw new Error('Já existe um usuário cadastrado com este Login.');
        }

        const newUser = {
          id: `usr-${Date.now()}`,
          name: data.name.trim(),
          username: data.username.trim().toLowerCase(),
          password: data.password,
          role: data.role,
          createdAt: new Date().toISOString()
        };

        setLocalItem(STORAGE_KEYS.USERS, [...users, newUser]);
        const { password: _, ...safeUser } = newUser;
        return safeUser;
      }
    );
  },

  updateUser: async (id: string, data: { name?: string; username?: string; role?: 'COORDENADOR' | 'USUARIO' }): Promise<SystemUser> => {
    return safeApiCall(
      `${API_URL}/users/${id}`,
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) },
      () => {
        const users = getLocalItem<any[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
        const idx = users.findIndex(u => u.id === id);
        if (idx === -1) throw new Error('Usuário não encontrado.');

        if (data.username && data.username.toLowerCase() !== users[idx].username.toLowerCase()) {
          const existing = users.find(u => u.username.toLowerCase() === data.username!.toLowerCase() && u.id !== id);
          if (existing) throw new Error('Este Login já está em uso.');
        }

        if (users[idx].role === 'COORDENADOR' && data.role === 'USUARIO') {
          const coordCount = users.filter(u => u.role === 'COORDENADOR').length;
          if (coordCount <= 1) {
            throw new Error('O sistema deve possuir pelo menos um Coordenador ativo.');
          }
        }

        users[idx] = { ...users[idx], ...data };
        setLocalItem(STORAGE_KEYS.USERS, users);
        const { password: _, ...safeUser } = users[idx];
        return safeUser;
      }
    );
  },

  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    return safeApiCall(
      `${API_URL}/users/${id}/password`,
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword }) },
      () => {
        const users = getLocalItem<any[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
        const idx = users.findIndex(u => u.id === id);
        if (idx === -1) throw new Error('Usuário não encontrado.');
        users[idx].password = newPassword;
        setLocalItem(STORAGE_KEYS.USERS, users);
      }
    );
  },

  deleteUser: async (id: string): Promise<void> => {
    return safeApiCall(
      `${API_URL}/users/${id}`,
      { method: 'DELETE' },
      () => {
        const users = getLocalItem<any[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
        const toDelete = users.find(u => u.id === id);
        if (!toDelete) throw new Error('Usuário não encontrado.');
        if (toDelete.role === 'COORDENADOR') {
          const coordCount = users.filter(u => u.role === 'COORDENADOR').length;
          if (coordCount <= 1) {
            throw new Error('Não é possível excluir o único Coordenador cadastrado.');
          }
        }
        setLocalItem(STORAGE_KEYS.USERS, users.filter(u => u.id !== id));
      }
    );
  }
};
