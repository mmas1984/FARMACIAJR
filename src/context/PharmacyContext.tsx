import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Medication, Collaborator, Unit, StockMovement } from '../types';
import { api } from '../api';
import { initAuth, googleSignIn, logout as authLogout, getAccessToken } from '../services/firebaseAuth';
import { GoogleSheetsService, INITIAL_HOSPITAL_DATA, SPREADSHEET_TITLE } from '../services/googleSheets';

interface PharmacyContextType {
  medications: Medication[];
  collaborators: Collaborator[];
  units: Unit[];
  movements: StockMovement[];
  isLoading: boolean;
  googleUser: User | null;
  isGoogleConnected: boolean;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  dataSource: 'sheets' | 'local';
  signInGoogle: () => Promise<void>;
  signOutGoogle: () => Promise<void>;
  syncWithSheets: () => Promise<void>;
  saveAllToSheetsWithConfirm: () => Promise<boolean>;
  addMedication: (data: Omit<Medication, 'id' | 'currentStock'>) => Promise<Medication>;
  updateMedication: (id: string, data: Partial<Medication>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  addCollaborator: (data: Omit<Collaborator, 'id'>) => Promise<Collaborator>;
  updateCollaborator: (id: string, data: Partial<Collaborator>) => Promise<void>;
  deleteCollaborator: (id: string) => Promise<void>;
  addUnit: (data: Omit<Unit, 'id'>) => Promise<Unit>;
  updateUnit: (id: string, data: Partial<Unit>) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  registerMovement: (data: {
    medId: string;
    type: 'IN' | 'OUT';
    quantity: number;
    unitId?: string;
    collaboratorId?: string;
  }) => Promise<void>;
  refreshData: () => Promise<void>;
}

const PharmacyContext = createContext<PharmacyContextType | null>(null);

export const PharmacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(GoogleSheetsService.getSavedSpreadsheetId());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'sheets' | 'local'>('local');

  // Load from local express backend (or seed if empty)
  const loadLocalData = useCallback(async () => {
    try {
      const [m, c, u, movs] = await Promise.all([
        api.getMedications(),
        api.getCollaborators(),
        api.getUnits(),
        api.getMovements()
      ]);

      // If backend is fresh/empty, seed initial data for demonstration
      if (m.length === 0 && c.length === 0 && u.length === 0) {
        for (const item of INITIAL_HOSPITAL_DATA.collaborators) {
          await api.createCollaborator(item);
        }
        for (const item of INITIAL_HOSPITAL_DATA.units) {
          await api.createUnit(item);
        }
        for (const item of INITIAL_HOSPITAL_DATA.medications) {
          await api.createMedication(item);
        }
        const [reM, reC, reU, reMov] = await Promise.all([
          api.getMedications(),
          api.getCollaborators(),
          api.getUnits(),
          api.getMovements()
        ]);
        setMedications(reM);
        setCollaborators(reC);
        setUnits(reU);
        setMovements(reMov);
      } else {
        setMedications(m);
        setCollaborators(c);
        setUnits(u);
        setMovements(movs);
      }
    } catch (e: any) {
      console.error('Erro ao carregar dados locais:', e);
    }
  }, []);

  // Sync with Google Sheets
  const syncWithSheets = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setSyncError('Conecte sua conta Google para sincronizar.');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      // Find or create hospital sheet
      const sheetId = await GoogleSheetsService.findOrCreateSpreadsheet(token);
      setSpreadsheetId(sheetId);

      // Load sheet data
      const sheetData = await GoogleSheetsService.loadAllData(token, sheetId);

      if (sheetData.medications.length > 0) {
        setMedications(sheetData.medications);
        setCollaborators(sheetData.collaborators);
        setUnits(sheetData.units);
        setMovements(sheetData.movements);
        setDataSource('sheets');
      } else {
        // Sheet was empty or headers only: push local state to sheet
        await GoogleSheetsService.syncEntireStateToSpreadsheet(token, sheetId, {
          medications,
          collaborators,
          units,
          movements
        });
        setDataSource('sheets');
      }

      setLastSyncTime(new Date());
    } catch (err: any) {
      console.error('Erro ao sincronizar com Google Sheets:', err);
      setSyncError(err.message || 'Erro ao comunicar com o Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  }, [medications, collaborators, units, movements]);

  // Auth initialization
  useEffect(() => {
    let isMounted = true;

    loadLocalData().finally(() => {
      if (isMounted) setIsLoading(false);
    });

    const unsubscribe = initAuth(
      (user, token) => {
        if (!isMounted) return;
        setGoogleUser(user);
        syncWithSheets();
      },
      () => {
        if (!isMounted) return;
        setGoogleUser(null);
        setDataSource('local');
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signInGoogle = async () => {
    try {
      setIsSyncing(true);
      setSyncError(null);
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        await syncWithSheets();
      }
    } catch (err: any) {
      setSyncError(err.message || 'Erro ao realizar login Google.');
    } finally {
      setIsSyncing(false);
    }
  };

  const signOutGoogle = async () => {
    await authLogout();
    setGoogleUser(null);
    setDataSource('local');
    setSpreadsheetId(null);
    GoogleSheetsService.setSavedSpreadsheetId(null);
  };

  // Full overwrite with user confirmation requirement
  const saveAllToSheetsWithConfirm = async (): Promise<boolean> => {
    const token = await getAccessToken();
    if (!token || !spreadsheetId) {
      alert('Não há planilha ativa conectada.');
      return false;
    }

    const confirmed = window.confirm(
      `Confirmação de sincronização:\n\nDeseja atualizar a planilha "${SPREADSHEET_TITLE}" com todos os ${medications.length} medicamentos, ${collaborators.length} colaboradores e ${movements.length} movimentações atuais?\n\nEsta operação sincronizará todas as linhas no Google Docs/Sheets.`
    );

    if (!confirmed) return false;

    try {
      setIsSyncing(true);
      await GoogleSheetsService.syncEntireStateToSpreadsheet(token, spreadsheetId, {
        medications,
        collaborators,
        units,
        movements
      });
      setLastSyncTime(new Date());
      setSyncError(null);
      return true;
    } catch (e: any) {
      setSyncError(e.message || 'Erro ao salvar dados na planilha.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // CRUD Actions:
  const addMedication = async (data: Omit<Medication, 'id' | 'currentStock'>): Promise<Medication> => {
    const newMed = await api.createMedication(data);
    setMedications(prev => [...prev, newMed]);

    const token = await getAccessToken();
    if (token && spreadsheetId) {
      GoogleSheetsService.syncEntireStateToSpreadsheet(token, spreadsheetId, {
        medications: [...medications, newMed],
        collaborators,
        units,
        movements
      }).catch(console.warn);
    }
    return newMed;
  };

  const updateMedication = async (id: string, data: Partial<Medication>) => {
    const updated = await api.updateMedication(id, data);
    setMedications(prev => prev.map(m => (m.id === id ? { ...m, ...updated } : m)));

    const token = await getAccessToken();
    if (token && spreadsheetId) {
      const nextMeds = medications.map(m => (m.id === id ? { ...m, ...updated } : m));
      GoogleSheetsService.syncEntireStateToSpreadsheet(token, spreadsheetId, {
        medications: nextMeds,
        collaborators,
        units,
        movements
      }).catch(console.warn);
    }
  };

  const deleteMedication = async (id: string) => {
    await api.deleteMedication(id);
    const nextMeds = medications.filter(m => m.id !== id);
    setMedications(nextMeds);

    const token = await getAccessToken();
    if (token && spreadsheetId) {
      GoogleSheetsService.syncEntireStateToSpreadsheet(token, spreadsheetId, {
        medications: nextMeds,
        collaborators,
        units,
        movements
      }).catch(console.warn);
    }
  };

  const addCollaborator = async (data: Omit<Collaborator, 'id'>): Promise<Collaborator> => {
    const newCollab = await api.createCollaborator(data);
    setCollaborators(prev => [...prev, newCollab]);

    const token = await getAccessToken();
    if (token && spreadsheetId) {
      GoogleSheetsService.syncEntireStateToSpreadsheet(token, spreadsheetId, {
        medications,
        collaborators: [...collaborators, newCollab],
        units,
        movements
      }).catch(console.warn);
    }
    return newCollab;
  };

  const updateCollaborator = async (id: string, data: Partial<Collaborator>) => {
    const updated = await api.updateCollaborator(id, data);
    const nextCols = collaborators.map(c => (c.id === id ? { ...c, ...updated } : c));
    setCollaborators(nextCols);

    const token = await getAccessToken();
    if (token && spreadsheetId) {
      GoogleSheetsService.syncEntireStateToSpreadsheet(token, spreadsheetId, {
        medications,
        collaborators: nextCols,
        units,
        movements
      }).catch(console.warn);
    }
  };

  const deleteCollaborator = async (id: string) => {
    await api.deleteCollaborator(id);
    const nextCols = collaborators.filter(c => c.id !== id);
    setCollaborators(nextCols);

    const token = await getAccessToken();
    if (token && spreadsheetId) {
      GoogleSheetsService.syncEntireStateToSpreadsheet(token, spreadsheetId, {
        medications,
        collaborators: nextCols,
        units,
        movements
      }).catch(console.warn);
    }
  };

  const addUnit = async (data: Omit<Unit, 'id'>): Promise<Unit> => {
    const newUnit = await api.createUnit(data);
    setUnits(prev => [...prev, newUnit]);

    const token = await getAccessToken();
    if (token && spreadsheetId) {
      GoogleSheetsService.syncEntireStateToSpreadsheet(token, spreadsheetId, {
        medications,
        collaborators,
        units: [...units, newUnit],
        movements
      }).catch(console.warn);
    }
    return newUnit;
  };

  const updateUnit = async (id: string, data: Partial<Unit>) => {
    const updated = await api.updateUnit(id, data);
    const nextUnits = units.map(u => (u.id === id ? { ...u, ...updated } : u));
    setUnits(nextUnits);

    const token = await getAccessToken();
    if (token && spreadsheetId) {
      GoogleSheetsService.syncEntireStateToSpreadsheet(token, spreadsheetId, {
        medications,
        collaborators,
        units: nextUnits,
        movements
      }).catch(console.warn);
    }
  };

  const deleteUnit = async (id: string) => {
    await api.deleteUnit(id);
    const nextUnits = units.filter(u => u.id !== id);
    setUnits(nextUnits);

    const token = await getAccessToken();
    if (token && spreadsheetId) {
      GoogleSheetsService.syncEntireStateToSpreadsheet(token, spreadsheetId, {
        medications,
        collaborators,
        units: nextUnits,
        movements
      }).catch(console.warn);
    }
  };

  // Register Stock Movement
  const registerMovement = async (data: {
    medId: string;
    type: 'IN' | 'OUT';
    quantity: number;
    unitId?: string;
    collaboratorId?: string;
  }) => {
    const createdMovement = await api.createMovement(data);

    // Update medication stock locally
    const medIdx = medications.findIndex(m => m.id === data.medId);
    let updatedMed: Medication | null = null;
    if (medIdx !== -1) {
      const current = medications[medIdx];
      const newStock = data.type === 'IN' ? current.currentStock + data.quantity : current.currentStock - data.quantity;
      updatedMed = { ...current, currentStock: newStock };
      setMedications(prev => prev.map(m => (m.id === data.medId ? updatedMed! : m)));
    }

    // Enrich movement
    const med = medications.find(m => m.id === data.medId);
    const unit = units.find(u => u.id === data.unitId);
    const col = collaborators.find(c => c.id === data.collaboratorId);
    const enrichedMov: StockMovement = {
      ...createdMovement,
      medName: med?.name || 'Medicamento',
      unitName: unit?.name,
      collabName: col?.name
    };

    setMovements(prev => [enrichedMov, ...prev]);

    // Record directly into Google Sheets if connected
    const token = await getAccessToken();
    if (token && spreadsheetId && updatedMed) {
      GoogleSheetsService.recordMovementInSpreadsheet(token, spreadsheetId, enrichedMov, updatedMed).catch(console.warn);
    }
  };

  const refreshData = async () => {
    const token = await getAccessToken();
    if (token && spreadsheetId) {
      await syncWithSheets();
    } else {
      await loadLocalData();
    }
  };

  const spreadsheetUrl = spreadsheetId ? GoogleSheetsService.getSpreadsheetUrl(spreadsheetId) : null;

  return (
    <PharmacyContext.Provider
      value={{
        medications,
        collaborators,
        units,
        movements,
        isLoading,
        googleUser,
        isGoogleConnected: !!googleUser,
        spreadsheetId,
        spreadsheetUrl,
        isSyncing,
        lastSyncTime,
        syncError,
        dataSource,
        signInGoogle,
        signOutGoogle,
        syncWithSheets,
        saveAllToSheetsWithConfirm,
        addMedication,
        updateMedication,
        deleteMedication,
        addCollaborator,
        updateCollaborator,
        deleteCollaborator,
        addUnit,
        updateUnit,
        deleteUnit,
        registerMovement,
        refreshData
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error('usePharmacy must be used within a PharmacyProvider');
  }
  return context;
};
