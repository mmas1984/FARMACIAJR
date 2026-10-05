import { Collaborator, Unit, Medication, StockMovement } from '../types';

export const SPREADSHEET_TITLE = 'Farmacêutico Sales Júnior - Banco de Dados Hospitalar';
const STORAGE_KEY_SPREADSHEET_ID = 'farmasys_svp_spreadsheet_id';

export interface SyncStatus {
  connected: boolean;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetTitle: string;
  lastSyncTime: string | null;
  syncing: boolean;
  error: string | null;
}

// Initial clinical dataset for psychiatric hospital
export const INITIAL_HOSPITAL_DATA = {
  medications: [
    {
      id: 'med-001',
      name: 'Haloperidol 5mg',
      activeIngredient: 'Haloperidol',
      dosage: '5mg',
      manufacturer: 'Janssen-Cilag',
      atcCode: 'N05AD01',
      specialControlGroup: 'C' as const,
      currentStock: 140
    },
    {
      id: 'med-002',
      name: 'Clonazepam 2mg (Rivotril)',
      activeIngredient: 'Clonazepam',
      dosage: '2mg',
      manufacturer: 'Roche',
      atcCode: 'N05BA09',
      specialControlGroup: 'B' as const,
      currentStock: 45
    },
    {
      id: 'med-003',
      name: 'Diazepam 10mg/2ml Inj.',
      activeIngredient: 'Diazepam',
      dosage: '10mg/2ml',
      manufacturer: 'União Química',
      atcCode: 'N05BA01',
      specialControlGroup: 'B' as const,
      currentStock: 8
    },
    {
      id: 'med-004',
      name: 'Sulfato de Morfina 10mg/ml',
      activeIngredient: 'Morfina',
      dosage: '10mg/ml',
      manufacturer: 'Cristália',
      atcCode: 'N02AA01',
      specialControlGroup: 'A' as const,
      currentStock: 12
    },
    {
      id: 'med-005',
      name: 'Risperidona 2mg',
      activeIngredient: 'Risperidona',
      dosage: '2mg',
      manufacturer: 'Eurofarma',
      atcCode: 'N05AX08',
      specialControlGroup: 'C' as const,
      currentStock: 95
    },
    {
      id: 'med-006',
      name: 'Clorpromazina 100mg (Amplictil)',
      activeIngredient: 'Clorpromazina',
      dosage: '100mg',
      manufacturer: 'Sanofi',
      atcCode: 'N05AA01',
      specialControlGroup: 'C' as const,
      currentStock: 60
    }
  ],
  collaborators: [
    {
      id: 'col-001',
      name: 'Farmacêutico Sales Júnior',
      cpf: '012.345.678-90',
      role: 'Farmacêutico Coordenador',
      crf: 'CRF-SP 48.912',
      accessLevel: 'Pharmacist'
    },
    {
      id: 'col-002',
      name: 'Enf. Juliana Mendes',
      cpf: '987.654.321-11',
      role: 'Enfermeira Chefe da Ala Psiquiátrica',
      crf: 'COREN-SP 214.509',
      accessLevel: 'Nurse'
    },
    {
      id: 'col-003',
      name: 'Dr. Roberto Fontes',
      cpf: '333.444.555-66',
      role: 'Médico Psiquiatra Plantonista',
      crf: 'CRM-SP 109.832',
      accessLevel: 'Admin'
    }
  ],
  units: [
    {
      id: 'unit-001',
      name: 'Dispensário Central de Farmácia',
      location: 'Térreo - Pavilhão Central',
      responsible: 'Farmacêutico Sales Júnior'
    },
    {
      id: 'unit-002',
      name: 'Ala Masculina (Internação Aguda)',
      location: '1º Andar - Bloco A',
      responsible: 'Enf. Juliana Mendes'
    },
    {
      id: 'unit-003',
      name: 'Ala Feminina (Estabilização)',
      location: '2º Andar - Bloco B',
      responsible: 'Enf. Carolina Prado'
    },
    {
      id: 'unit-004',
      name: 'Emergência Psiquiátrica & Triagem',
      location: 'Térreo - Setor Vermelho',
      responsible: 'Dr. Roberto Fontes'
    }
  ],
  movements: [
    {
      id: 'mov-001',
      medId: 'med-002',
      type: 'OUT' as const,
      quantity: 5,
      unitId: 'unit-002',
      collaboratorId: 'col-002',
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString()
    },
    {
      id: 'mov-002',
      medId: 'med-004',
      type: 'OUT' as const,
      quantity: 2,
      unitId: 'unit-004',
      collaboratorId: 'col-003',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    },
    {
      id: 'mov-003',
      medId: 'med-001',
      type: 'IN' as const,
      quantity: 50,
      timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString()
    }
  ]
};

export class GoogleSheetsService {
  private static cachedId: string | null = null;

  static getSavedSpreadsheetId(): string | null {
    if (this.cachedId) return this.cachedId;
    return localStorage.getItem(STORAGE_KEY_SPREADSHEET_ID);
  }

  static setSavedSpreadsheetId(id: string | null) {
    this.cachedId = id;
    if (id) {
      localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEY_SPREADSHEET_ID);
    }
  }

  static getSpreadsheetUrl(spreadsheetId: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  // Find or create spreadsheet on user's Google Drive / Sheets
  static async findOrCreateSpreadsheet(accessToken: string): Promise<string> {
    // 1. Check if we already have a saved ID that is valid
    const existingId = this.getSavedSpreadsheetId();
    if (existingId) {
      try {
        const verifyRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${existingId}?fields=spreadsheetId,properties.title`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (verifyRes.ok) {
          return existingId;
        }
      } catch (e) {
        console.warn('ID de planilha salvo não é mais acessível:', e);
      }
    }

    // 2. Search in Google Drive for an existing spreadsheet with our title
    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          `name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
        )}&fields=files(id,name,webViewLink)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          const foundId = searchData.files[0].id;
          this.setSavedSpreadsheetId(foundId);
          return foundId;
        }
      }
    } catch (err) {
      console.warn('Aviso ao buscar arquivos existentes no Google Drive:', err);
    }

    // 3. Create a brand new spreadsheet formatted for hospital pharmacy
    const createPayload = {
      properties: {
        title: SPREADSHEET_TITLE
      },
      sheets: [
        {
          properties: {
            title: 'Medicamentos',
            gridProperties: { frozenRowCount: 1 }
          }
        },
        {
          properties: {
            title: 'Colaboradores',
            gridProperties: { frozenRowCount: 1 }
          }
        },
        {
          properties: {
            title: 'Unidades',
            gridProperties: { frozenRowCount: 1 }
          }
        },
        {
          properties: {
            title: 'Movimentacoes',
            gridProperties: { frozenRowCount: 1 }
          }
        }
      ]
    };

    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createPayload)
    });

    if (!createRes.ok) {
      const errBody = await createRes.json();
      throw new Error(errBody.error?.message || 'Falha ao criar planilha no Google Docs / Sheets.');
    }

    const createdData = await createRes.json();
    const newId = createdData.spreadsheetId;
    this.setSavedSpreadsheetId(newId);

    // 4. Initialize headers and initial hospital seed data
    await this.initializeSpreadsheetContent(accessToken, newId);

    return newId;
  }

  // Populate headers and initial dataset
  static async initializeSpreadsheetContent(accessToken: string, spreadsheetId: string) {
    const medHeaders = [
      'ID',
      'Nome Comercial',
      'Principio Ativo',
      'Dosagem',
      'Fabricante',
      'Codigo ATC',
      'Controle Especial (Portaria 344/98)',
      'Estoque Atual'
    ];
    const medRows = INITIAL_HOSPITAL_DATA.medications.map(m => [
      m.id,
      m.name,
      m.activeIngredient,
      m.dosage,
      m.manufacturer,
      m.atcCode,
      m.specialControlGroup,
      m.currentStock
    ]);

    const colHeaders = ['ID', 'Nome', 'CPF', 'Cargo', 'CRF', 'Nivel Acesso'];
    const colRows = INITIAL_HOSPITAL_DATA.collaborators.map(c => [
      c.id,
      c.name,
      c.cpf,
      c.role,
      c.crf || '',
      c.accessLevel
    ]);

    const unitHeaders = ['ID', 'Nome da Unidade', 'Localizacao', 'Responsavel'];
    const unitRows = INITIAL_HOSPITAL_DATA.units.map(u => [
      u.id,
      u.name,
      u.location,
      u.responsible
    ]);

    const movHeaders = [
      'ID',
      'Medicamento ID',
      'Tipo (IN/OUT)',
      'Quantidade',
      'Unidade ID',
      'Colaborador ID',
      'Timestamp UTC',
      'Data/Hora Formatada'
    ];
    const movRows = INITIAL_HOSPITAL_DATA.movements.map(m => [
      m.id,
      m.medId,
      m.type,
      m.quantity,
      m.unitId || '',
      m.collaboratorId || '',
      m.timestamp,
      new Date(m.timestamp).toLocaleString('pt-BR')
    ]);

    const batchData = [
      { range: 'Medicamentos!A1:H', values: [medHeaders, ...medRows] },
      { range: 'Colaboradores!A1:F', values: [colHeaders, ...colRows] },
      { range: 'Unidades!A1:D', values: [unitHeaders, ...unitRows] },
      { range: 'Movimentacoes!A1:H', values: [movHeaders, ...movRows] }
    ];

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData
      })
    });
  }

  // Load all sheets into application models
  static async loadAllData(
    accessToken: string,
    spreadsheetId: string
  ): Promise<{
    medications: Medication[];
    collaborators: Collaborator[];
    units: Unit[];
    movements: StockMovement[];
  }> {
    const ranges = [
      'Medicamentos!A2:H',
      'Colaboradores!A2:F',
      'Unidades!A2:D',
      'Movimentacoes!A2:H'
    ];

    const queryParams = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${queryParams}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Falha ao sincronizar dados da planilha Google.');
    }

    const data = await res.json();
    const valueRanges = data.valueRanges || [];

    // 1. Medications
    const medRows: any[][] = valueRanges[0]?.values || [];
    const medications: Medication[] = medRows.map(row => ({
      id: String(row[0] || ''),
      name: String(row[1] || ''),
      activeIngredient: String(row[2] || ''),
      dosage: String(row[3] || ''),
      manufacturer: String(row[4] || ''),
      atcCode: String(row[5] || ''),
      specialControlGroup: (row[6] as any) || 'None',
      currentStock: Number(row[7] || 0)
    })).filter(m => m.name.trim() !== '');

    // 2. Collaborators
    const colRows: any[][] = valueRanges[1]?.values || [];
    const collaborators: Collaborator[] = colRows.map(row => ({
      id: String(row[0] || ''),
      name: String(row[1] || ''),
      cpf: String(row[2] || ''),
      role: String(row[3] || ''),
      crf: String(row[4] || ''),
      accessLevel: String(row[5] || 'Nurse')
    })).filter(c => c.name.trim() !== '');

    // 3. Units
    const unitRows: any[][] = valueRanges[2]?.values || [];
    const units: Unit[] = unitRows.map(row => ({
      id: String(row[0] || ''),
      name: String(row[1] || ''),
      location: String(row[2] || ''),
      responsible: String(row[3] || '')
    })).filter(u => u.name.trim() !== '');

    // 4. Movements
    const movRows: any[][] = valueRanges[3]?.values || [];
    const movements: StockMovement[] = movRows.map(row => {
      const medId = String(row[1] || '');
      const unitId = String(row[4] || '');
      const collaboratorId = String(row[5] || '');
      const med = medications.find(m => m.id === medId);
      const unit = units.find(u => u.id === unitId);
      const col = collaborators.find(c => c.id === collaboratorId);

      return {
        id: String(row[0] || ''),
        medId,
        medName: med?.name || 'Medicamento',
        type: (row[2] as 'IN' | 'OUT') || 'IN',
        quantity: Number(row[3] || 0),
        unitId: unitId || undefined,
        unitName: unit?.name,
        collaboratorId: collaboratorId || undefined,
        collabName: col?.name,
        timestamp: String(row[6] || new Date().toISOString())
      };
    }).filter(m => m.id.trim() !== '');

    return { medications, collaborators, units, movements };
  }

  // Overwrite an entire sheet with user confirmation (required by skill)
  static async syncEntireStateToSpreadsheet(
    accessToken: string,
    spreadsheetId: string,
    state: {
      medications: Medication[];
      collaborators: Collaborator[];
      units: Unit[];
      movements: StockMovement[];
    }
  ) {
    const medRows = state.medications.map(m => [
      m.id,
      m.name,
      m.activeIngredient,
      m.dosage,
      m.manufacturer,
      m.atcCode,
      m.specialControlGroup,
      m.currentStock
    ]);

    const colRows = state.collaborators.map(c => [
      c.id,
      c.name,
      c.cpf,
      c.role,
      c.crf || '',
      c.accessLevel
    ]);

    const unitRows = state.units.map(u => [
      u.id,
      u.name,
      u.location,
      u.responsible
    ]);

    const movRows = state.movements.map(m => [
      m.id,
      m.medId,
      m.type,
      m.quantity,
      m.unitId || '',
      m.collaboratorId || '',
      m.timestamp,
      new Date(m.timestamp).toLocaleString('pt-BR')
    ]);

    // Clear and re-populate with headers
    const medHeaders = ['ID', 'Nome Comercial', 'Principio Ativo', 'Dosagem', 'Fabricante', 'Codigo ATC', 'Controle Especial (Portaria 344/98)', 'Estoque Atual'];
    const colHeaders = ['ID', 'Nome', 'CPF', 'Cargo', 'CRF', 'Nivel Acesso'];
    const unitHeaders = ['ID', 'Nome da Unidade', 'Localizacao', 'Responsavel'];
    const movHeaders = ['ID', 'Medicamento ID', 'Tipo (IN/OUT)', 'Quantidade', 'Unidade ID', 'Colaborador ID', 'Timestamp UTC', 'Data/Hora Formatada'];

    const batchData = [
      { range: 'Medicamentos!A1:H', values: [medHeaders, ...medRows] },
      { range: 'Colaboradores!A1:F', values: [colHeaders, ...colRows] },
      { range: 'Unidades!A1:D', values: [unitHeaders, ...unitRows] },
      { range: 'Movimentacoes!A1:H', values: [movHeaders, ...movRows] }
    ];

    // Clear existing data rows first to avoid ghost rows
    for (const sheetName of ['Medicamentos', 'Colaboradores', 'Unidades', 'Movimentacoes']) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A2:Z:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    }

    const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData
      })
    });

    if (!updateRes.ok) {
      const err = await updateRes.json();
      throw new Error(err.error?.message || 'Falha ao salvar dados na planilha.');
    }
  }

  // Append single movement row
  static async recordMovementInSpreadsheet(
    accessToken: string,
    spreadsheetId: string,
    movement: StockMovement,
    updatedMedication: Medication
  ) {
    // 1. Append movement
    const row = [
      movement.id,
      movement.medId,
      movement.type,
      movement.quantity,
      movement.unitId || '',
      movement.collaboratorId || '',
      movement.timestamp,
      new Date(movement.timestamp).toLocaleString('pt-BR')
    ];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Movimentacoes!A:H:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [row] })
      }
    );

    // 2. Update medication stock row in sheet
    try {
      const getMedsRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Medicamentos!A:A`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (getMedsRes.ok) {
        const medsData = await getMedsRes.json();
        const ids: string[] = (medsData.values || []).map((r: any[]) => r[0]);
        const rowIndex = ids.findIndex(id => id === updatedMedication.id);
        if (rowIndex !== -1) {
          // Row index in 1-based sheet
          const sheetRowNumber = rowIndex + 1;
          await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Medicamentos!H${sheetRowNumber}?valueInputOption=USER_ENTERED`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ values: [[updatedMedication.currentStock]] })
            }
          );
        }
      }
    } catch (e) {
      console.warn('Erro ao atualizar saldo de medicamento na planilha:', e);
    }
  }
}
