import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Try to import Vite to handle development server middlewares
let vite: any = null;
try {
  const viteModule = await import('vite');
  vite = viteModule;
} catch (e) {
  // Vite not available in production build, ignore
}

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(process.cwd(), 'database.json');

// Schemas
interface Collaborator {
  id: string;
  name: string;
  cpf: string;
  role: string;
  crf: string;
  accessLevel: string;
}

interface Unit {
  id: string;
  name: string;
  location: string;
  responsible: string;
}

interface Medication {
  id: string;
  name: string;
  activeIngredient: string;
  dosage: string;
  manufacturer: string;
  atcCode: string;
  specialControlGroup: 'A' | 'B' | 'C' | 'None';
  currentStock: number;
}

interface StockMovement {
  id: string;
  medId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  unitId?: string; // required for OUT
  collaboratorId?: string; // required for OUT
  timestamp: string;
}

interface AppUser {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'COORDENADOR' | 'USUARIO';
  createdAt: string;
  lastLogin?: string;
}

interface Database {
  collaborators: Collaborator[];
  units: Unit[];
  medications: Medication[];
  movements: StockMovement[];
  users: AppUser[];
}

const defaultInitialUsers: AppUser[] = [
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

const defaultDb: Database = {
  collaborators: [],
  units: [],
  medications: [],
  movements: [],
  users: defaultInitialUsers
};

// Simple file-based database helper
async function getDb(): Promise<Database> {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    const parsed: Database = JSON.parse(data);
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = defaultInitialUsers;
      await saveDb(parsed);
    }
    return parsed;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(DB_FILE, JSON.stringify(defaultDb, null, 2));
      return defaultDb;
    }
    throw error;
  }
}

async function saveDb(db: Database): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

// --- API ROUTES ---

// 1. Collaborators
app.get('/api/collaborators', async (req, res) => {
  const db = await getDb();
  res.json(db.collaborators);
});

app.post('/api/collaborators', async (req, res) => {
  const db = await getDb();
  const newCollab: Collaborator = { id: uuidv4(), ...req.body };
  db.collaborators.push(newCollab);
  await saveDb(db);
  res.status(201).json(newCollab);
});

app.put('/api/collaborators/:id', async (req, res) => {
  const db = await getDb();
  const idx = db.collaborators.findIndex(c => c.id === req.params.id);
  if (idx > -1) {
    db.collaborators[idx] = { ...db.collaborators[idx], ...req.body };
    await saveDb(db);
    res.json(db.collaborators[idx]);
  } else {
    res.status(404).send('Not found');
  }
});

app.delete('/api/collaborators/:id', async (req, res) => {
  const db = await getDb();
  db.collaborators = db.collaborators.filter(c => c.id !== req.params.id);
  await saveDb(db);
  res.sendStatus(204);
});

// 2. Units
app.get('/api/units', async (req, res) => {
  const db = await getDb();
  res.json(db.units);
});

app.post('/api/units', async (req, res) => {
  const db = await getDb();
  const newUnit: Unit = { id: uuidv4(), ...req.body };
  db.units.push(newUnit);
  await saveDb(db);
  res.status(201).json(newUnit);
});

app.put('/api/units/:id', async (req, res) => {
  const db = await getDb();
  const idx = db.units.findIndex(u => u.id === req.params.id);
  if (idx > -1) {
    db.units[idx] = { ...db.units[idx], ...req.body };
    await saveDb(db);
    res.json(db.units[idx]);
  } else {
    res.status(404).send('Not found');
  }
});

app.delete('/api/units/:id', async (req, res) => {
  const db = await getDb();
  db.units = db.units.filter(u => u.id !== req.params.id);
  await saveDb(db);
  res.sendStatus(204);
});

// 3. Medications
app.get('/api/medications', async (req, res) => {
  const db = await getDb();
  res.json(db.medications);
});

app.post('/api/medications', async (req, res) => {
  const db = await getDb();
  const newMed: Medication = { id: uuidv4(), currentStock: 0, ...req.body };
  db.medications.push(newMed);
  await saveDb(db);
  res.status(201).json(newMed);
});

app.put('/api/medications/:id', async (req, res) => {
  const db = await getDb();
  const idx = db.medications.findIndex(m => m.id === req.params.id);
  if (idx > -1) {
    db.medications[idx] = { ...db.medications[idx], ...req.body };
    await saveDb(db);
    res.json(db.medications[idx]);
  } else {
    res.status(404).send('Not found');
  }
});

app.delete('/api/medications/:id', async (req, res) => {
  const db = await getDb();
  db.medications = db.medications.filter(m => m.id !== req.params.id);
  await saveDb(db);
  res.sendStatus(204);
});

// 4. Stock Movements
app.get('/api/movements', async (req, res) => {
  const db = await getDb();
  // enrich movements
  const enriched = db.movements.map(mov => {
    const med = db.medications.find(m => m.id === mov.medId);
    const unit = db.units.find(u => u.id === mov.unitId);
    const collab = db.collaborators.find(c => c.id === mov.collaboratorId);
    return { ...mov, medName: med?.name, unitName: unit?.name, collabName: collab?.name };
  });
  // Sort by timestamp desc
  enriched.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(enriched);
});

app.post('/api/movements', async (req, res) => {
  const db = await getDb();
  const { medId, type, quantity, unitId, collaboratorId } = req.body;
  
  const medIdx = db.medications.findIndex(m => m.id === medId);
  if (medIdx === -1) return res.status(404).send('Medication not found');
  
  const med = db.medications[medIdx];
  
  if (type === 'OUT') {
    if (!unitId || !collaboratorId) {
      return res.status(400).json({ error: 'Unidade e Colaborador são obrigatórios para saída.' });
    }
    if (med.currentStock < quantity) {
      return res.status(400).json({ error: 'Estoque insuficiente.' });
    }
    med.currentStock -= quantity;
  } else if (type === 'IN') {
    med.currentStock += quantity;
  } else {
    return res.status(400).json({ error: 'Tipo de movimentação inválido.' });
  }

  const movement: StockMovement = {
    id: uuidv4(),
    medId,
    type,
    quantity,
    unitId: type === 'OUT' ? unitId : undefined,
    collaboratorId: type === 'OUT' ? collaboratorId : undefined,
    timestamp: new Date().toISOString()
  };

  db.movements.push(movement);
  await saveDb(db);
  
  res.status(201).json(movement);
});

// 5. User Authentication & Password Manager
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  const db = await getDb();
  const userIndex = db.users.findIndex(
    u => u.username.toLowerCase() === String(username).toLowerCase() && u.password === String(password)
  );

  if (userIndex === -1) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu login e senha.' });
  }

  const user = db.users[userIndex];
  user.lastLogin = new Date().toISOString();
  await saveDb(db);

  // Return safe user without raw password
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

app.get('/api/users', async (req, res) => {
  const db = await getDb();
  const safeUsers = db.users.map(({ password, ...rest }) => rest);
  res.json(safeUsers);
});

app.post('/api/users', async (req, res) => {
  const { name, username, password, role } = req.body;
  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios (Nome, Login, Senha e Perfil).' });
  }

  const db = await getDb();
  const existing = db.users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Já existe um usuário cadastrado com este Login.' });
  }

  const newUser: AppUser = {
    id: uuidv4(),
    name: String(name).trim(),
    username: String(username).trim().toLowerCase(),
    password: String(password),
    role: role === 'COORDENADOR' ? 'COORDENADOR' : 'USUARIO',
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  await saveDb(db);

  const { password: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

app.put('/api/users/:id', async (req, res) => {
  const { name, username, role } = req.body;
  const db = await getDb();
  const idx = db.users.findIndex(u => u.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Check username uniqueness if changed
  if (username && username.toLowerCase() !== db.users[idx].username.toLowerCase()) {
    const existing = db.users.find(
      u => u.username.toLowerCase() === String(username).toLowerCase() && u.id !== req.params.id
    );
    if (existing) {
      return res.status(400).json({ error: 'Este Login já está em uso por outro colaborador.' });
    }
  }

  // Prevent demoting the last coordinator
  if (db.users[idx].role === 'COORDENADOR' && role === 'USUARIO') {
    const coordCount = db.users.filter(u => u.role === 'COORDENADOR').length;
    if (coordCount <= 1) {
      return res.status(400).json({ error: 'Não é possível alterar o perfil. O sistema deve ter pelo menos um Coordenador ativo.' });
    }
  }

  db.users[idx].name = name ? String(name).trim() : db.users[idx].name;
  db.users[idx].username = username ? String(username).trim().toLowerCase() : db.users[idx].username;
  db.users[idx].role = role ? (role === 'COORDENADOR' ? 'COORDENADOR' : 'USUARIO') : db.users[idx].role;

  await saveDb(db);
  const { password: _, ...safeUser } = db.users[idx];
  res.json(safeUser);
});

app.put('/api/users/:id/password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 4) {
    return res.status(400).json({ error: 'A nova senha deve possuir no mínimo 4 caracteres.' });
  }

  const db = await getDb();
  const idx = db.users.findIndex(u => u.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  db.users[idx].password = String(newPassword);
  await saveDb(db);

  res.json({ message: 'Senha atualizada com sucesso!' });
});

app.delete('/api/users/:id', async (req, res) => {
  const db = await getDb();
  const userToDelete = db.users.find(u => u.id === req.params.id);

  if (!userToDelete) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Prevent deleting the last coordinator
  if (userToDelete.role === 'COORDENADOR') {
    const coordCount = db.users.filter(u => u.role === 'COORDENADOR').length;
    if (coordCount <= 1) {
      return res.status(400).json({ error: 'Não é possível excluir o único Coordenador cadastrado.' });
    }
  }

  db.users = db.users.filter(u => u.id !== req.params.id);
  await saveDb(db);
  res.sendStatus(204);
});

// --- VITE MIDDLEWARE OR STATIC FILES ---
async function startServer() {
  if (vite) {
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(viteServer.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist/index.html'));
    });
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
