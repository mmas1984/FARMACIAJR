import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SystemUser } from '../types';
import { api } from '../api';

interface AuthContextType {
  currentUser: SystemUser | null;
  isAuthenticated: boolean;
  isCoordinator: boolean;
  isLoadingAuth: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  users: SystemUser[];
  loadUsers: () => Promise<void>;
  createUser: (data: { name: string; username: string; password: string; role: 'COORDENADOR' | 'USUARIO' }) => Promise<SystemUser>;
  updateUser: (id: string, data: { name?: string; username?: string; role?: 'COORDENADOR' | 'USUARIO' }) => Promise<SystemUser>;
  resetUserPassword: (id: string, newPassword: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_AUTH_KEY = 'farmacia_sales_junior_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [users, setUsers] = useState<SystemUser[]>([]);

  // Verify auth on mount
  useEffect(() => {
    setIsLoadingAuth(false);
  }, []);

  const login = async (username: string, password: string) => {
    const user = await api.login(username, password);
    setCurrentUser(user);
    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_AUTH_KEY);
  };

  const loadUsers = useCallback(async () => {
    try {
      const list = await api.getUsers();
      setUsers(list);
    } catch (err) {
      console.error('Erro ao carregar lista de usuários:', err);
    }
  }, []);

  // Automatically load users when logged in as coordinator
  useEffect(() => {
    if (currentUser?.role === 'COORDENADOR') {
      loadUsers();
    }
  }, [currentUser, loadUsers]);

  const createUser = async (data: { name: string; username: string; password: string; role: 'COORDENADOR' | 'USUARIO' }) => {
    const created = await api.createUser(data);
    setUsers(prev => [...prev, created]);
    return created;
  };

  const updateUser = async (id: string, data: { name?: string; username?: string; role?: 'COORDENADOR' | 'USUARIO' }) => {
    const updated = await api.updateUser(id, data);
    setUsers(prev => prev.map(u => (u.id === id ? updated : u)));
    // If updating current user's profile info
    if (currentUser?.id === id) {
      const merged = { ...currentUser, ...updated };
      setCurrentUser(merged);
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(merged));
    }
    return updated;
  };

  const resetUserPassword = async (id: string, newPassword: string) => {
    await api.resetPassword(id, newPassword);
  };

  const deleteUser = async (id: string) => {
    await api.deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const isCoordinator = currentUser?.role === 'COORDENADOR';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isCoordinator,
        isLoadingAuth,
        login,
        logout,
        users,
        loadUsers,
        createUser,
        updateUser,
        resetUserPassword,
        deleteUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
