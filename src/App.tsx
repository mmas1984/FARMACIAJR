import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  Activity,
  Users,
  Building,
  Pill,
  ArrowRightLeft,
  FileBarChart,
  Menu,
  X,
  FileSpreadsheet,
  ExternalLink,
  LogOut,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Shield,
  UserCheck,
  User as UserIcon
} from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PharmacyProvider, usePharmacy } from './context/PharmacyContext';
import Dashboard from './pages/Dashboard';
import Collaborators from './pages/Collaborators';
import Units from './pages/Units';
import Medications from './pages/Medications';
import Movements from './pages/Movements';
import Reports from './pages/Reports';
import UsersManagement from './pages/UsersManagement';
import Login from './pages/Login';

function HeaderBar() {
  const location = useLocation();
  const { currentUser, isCoordinator, logout } = useAuth();
  const {
    isGoogleConnected,
    googleUser,
    spreadsheetUrl,
    isSyncing,
    signInGoogle,
    signOutGoogle,
    syncWithSheets
  } = usePharmacy();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Painel de Controle Farmacêutico';
      case '/medications':
        return 'Catálogo de Medicamentos & Controle Especial';
      case '/movements':
        return 'Dispensação & Movimentação de Estoque';
      case '/collaborators':
        return 'Colaboradores & Permissões Hospitalares';
      case '/units':
        return 'Unidades Administrativas & Setores';
      case '/reports':
        return 'Relatórios e Balanços Anvisa';
      case '/users':
        return 'Gerenciador de Senhas & Usuários';
      default:
        return 'Hospital Psiquiátrico São Vicente de Paulo';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
      {/* Zone 1: Breadcrumbs Context */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span className="hidden sm:inline text-slate-400">Hospital S.V.P.</span>
        <span className="hidden sm:inline" aria-hidden="true">/</span>
        <span className="text-slate-900 font-semibold">{getPageTitle(location.pathname)}</span>
      </div>

      {/* Zone 3: Logged-in System User Profile & Google Sheets Integration */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Google Sheets Active Badge */}
        {isGoogleConnected ? (
          <div className="hidden md:flex items-center gap-2 pr-2 border-r border-slate-200">
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                title="Abrir planilha no Google Docs / Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Planilha Conectada</span>
                <ExternalLink className="w-3 h-3 text-emerald-600 ml-0.5" />
              </a>
            )}
            <button
              onClick={() => syncWithSheets()}
              disabled={isSyncing}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="Sincronizar dados com Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        ) : (
          <button
            onClick={signInGoogle}
            disabled={isSyncing}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-all"
            title="Conectar com o Google Sheets para sincronização"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Conectar Planilha</span>
          </button>
        )}

        {/* Current Authenticated User (Coordenador ou Usuário) */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-1 sm:pl-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  isCoordinator
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-blue-100 text-blue-900 border border-blue-300'
                }`}
              >
                {isCoordinator ? <Shield className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left leading-none">
                <span className="text-xs font-bold text-slate-800 block truncate max-w-[120px] sm:max-w-[180px]">
                  {currentUser.name}
                </span>
                <span
                  className={`text-[9px] font-bold tracking-wider uppercase ${
                    isCoordinator ? 'text-amber-700' : 'text-blue-700'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Encerrar sessão no sistema"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span className="hidden sm:inline text-slate-600 hover:text-rose-600">Sair</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { isGoogleConnected } = usePharmacy();
  const { currentUser, isCoordinator } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard Geral', icon: Activity },
    { path: '/medications', label: 'Medicamentos & ATC', icon: Pill },
    { path: '/movements', label: 'Controle de Estoque', icon: ArrowRightLeft },
    { path: '/collaborators', label: 'Colaboradores', icon: Users },
    { path: '/units', label: 'Unidades / Setores', icon: Building },
    { path: '/reports', label: 'Relatórios & Balanços', icon: FileBarChart },
    // Show Gerenciador de Senhas only for COORDENADOR
    ...(isCoordinator
      ? [
          {
            path: '/users',
            label: 'Gerenciador de Senhas',
            icon: KeyRound,
            badge: 'COORD'
          }
        ]
      : [])
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800 antialiased">
      {/* Sidebar Navigation (260px wide, deep navy slate) */}
      <aside className="bg-slate-900 text-white w-full md:w-64 flex-shrink-0 md:min-h-screen flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Brand Zone */}
          <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
            <Link to="/" className="flex items-center space-x-3 text-white">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight block leading-tight">
                  Farmacêutico Sales Júnior
                </span>
                <span className="text-[11px] text-slate-400 block font-normal leading-none mt-0.5">
                  Farmácia Psiquiátrica
                </span>
              </div>
            </Link>
            <button
              className="md:hidden text-slate-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className={`md:block ${isMobileMenuOpen ? 'block' : 'hidden'} px-3 py-5 space-y-1`}>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {(item as any).badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      {(item as any).badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Status */}
        <div className="p-4 border-t border-slate-800/80 hidden md:block">
          <div className="bg-slate-800/60 rounded-lg p-3 text-xs">
            <div className="flex items-center justify-between mb-1 text-slate-300 font-semibold">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Portaria 344/98</span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                  isCoordinator ? 'bg-amber-400/20 text-amber-300' : 'bg-blue-400/20 text-blue-300'
                }`}
              >
                {currentUser?.role}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Auditoria ativa em tempo real para controle de psicotrópicos e entorpecentes.
            </p>
            {isGoogleConnected && (
              <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-emerald-400">
                <span>Google Sheets Ativo</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

function MainAppRoutes() {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-sm font-medium text-slate-300">Carregando sistema de farmácia...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <PharmacyProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/collaborators" element={<Collaborators />} />
            <Route path="/units" element={<Units />} />
            <Route path="/medications" element={<Medications />} />
            <Route path="/movements" element={<Movements />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </PharmacyProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainAppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}
