'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { buildApiUrl, API_CONFIG } from '@/config/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_admin: boolean;
  foto_perfil?: string;
  telefone?: string;
  bio?: string;
  setor?: {
    id: string;
    nome: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; message: string }>;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      verifyToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ME), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
      });

      if (response.ok) {
        const userData = await response.json();
        const mappedUser = {
          id: String(userData.id),
          name: userData.name || userData.username || 'Usuário',
          email: userData.email || '',
          role: userData.role || (userData.is_admin ? 'admin' : 'creative_user'),
          is_admin: userData.is_admin || false,
          // foto_perfil já vem como presigned URL do backend, usar diretamente
          foto_perfil: userData.foto_perfil && userData.foto_perfil.trim() !== '' ? userData.foto_perfil : undefined,
          telefone: userData.telefone || undefined,
          bio: userData.bio || undefined,
          setor: userData.setor || undefined,
        };
        setUser(mappedUser);
        setToken(tokenToVerify);
      } else {
        // Token inválido, remover do localStorage
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const apiUrl = buildApiUrl(API_CONFIG.ENDPOINTS.LOGIN);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({ username: email, password }),
      });

      
      // Se a resposta não for OK, ler o erro apenas uma vez
      if (!response.ok) {
        let errorMessage = 'Erro ao fazer login';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
          console.error('Erro na resposta:', response.status, errorMessage);
        } catch {
          try {
            const errorText = await response.text();
            errorMessage = errorText || `Erro ${response.status}: ${response.statusText}`;
            console.error('Erro na resposta:', response.status, errorMessage);
          } catch {
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
            console.error('Erro na resposta:', response.status, errorMessage);
          }
        }
        return { success: false, message: errorMessage };
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        console.error('Erro ao parsear resposta JSON:', text);
        return { success: false, message: 'Resposta inválida do servidor' };
      }

      const { access_token } = data;
      
      if (!access_token) {
        console.error('Token não encontrado na resposta:', data);
        return { success: false, message: 'Token não recebido do servidor' };
      }

      
      setToken(access_token);
      localStorage.setItem('authToken', access_token);

      try {
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
        
        const userResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ME), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          const mappedUser = {
            id: String(userData.id),
            name: userData.name || userData.username || 'Usuário',
            email: userData.email || '',
            role: userData.role || (userData.is_admin ? 'admin' : 'creative_user'),
            is_admin: userData.is_admin || false,
            // foto_perfil já vem como presigned URL do backend, usar diretamente
            foto_perfil: userData.foto_perfil && userData.foto_perfil.trim() !== '' ? userData.foto_perfil : undefined,
            telefone: userData.telefone || undefined,
            bio: userData.bio || undefined,
            setor: userData.setor || undefined,
          };
          
          setUser(mappedUser);
          
          // Redirecionar para dashboard após login bem-sucedido
          // Usar window.location.href para garantir redirecionamento completo
          // Isso força uma recarga completa da página e evita problemas com ProtectedRoute
          window.location.href = '/dashboard';
        } else {
          const errorText = await userResponse.text();
          console.error('Erro ao buscar dados do usuário:', userResponse.status, errorText);
          localStorage.removeItem('authToken');
          setToken(null);
          return { success: false, message: `Erro ao carregar dados do usuário: ${userResponse.status}` };
        }
      } catch (userError: any) {
        console.error('Erro ao buscar dados do usuário:', userError);
        localStorage.removeItem('authToken');
        setToken(null);
        
        if (userError.name === 'AbortError') {
          return { success: false, message: 'Tempo de espera excedido ao buscar dados do usuário' };
        }
        return { success: false, message: 'Erro ao carregar dados do usuário' };
      }

      return { success: true, message: 'Login realizado com sucesso!' };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Erro de conexão. Tente novamente.' };
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; message: string }> => {
    try {
      const apiUrl = buildApiUrl(API_CONFIG.ENDPOINTS.REGISTER);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        const { access_token } = data;
        setToken(access_token);
        localStorage.setItem('authToken', access_token);

        try {
          const userResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ME), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
            mode: 'cors',
            credentials: 'omit',
          });

          if (userResponse.ok) {
            const userDataResponse = await userResponse.json();
            setUser(userDataResponse);
            router.push('/dashboard');
          }
        } catch (userError) {
          console.error('Erro ao buscar dados do usuário:', userError);
        }

        return { success: true, message: 'Usuário registrado com sucesso!' };
      } else {
        return { success: false, message: data.detail || 'Erro ao registrar usuário' };
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, message: 'Erro de conexão. Tente novamente.' };
    }
  };

  const updateUser = (updates: Partial<User> | any) => {
    setUser((prev) => {
      if (!prev) {
        // Se não há usuário anterior, criar um novo com os dados atualizados
        return {
          id: String(updates.id || ''),
          name: updates.name || 'Usuário',
          email: updates.email || '',
          role: updates.role || 'user',
          is_admin: updates.is_admin || false,
          foto_perfil: updates.foto_perfil || undefined,
          telefone: updates.telefone || undefined,
          bio: updates.bio || undefined,
          setor: updates.setor || undefined,
        };
      }
      // Preservar todos os campos existentes e atualizar com os novos
      return { 
        ...prev, 
        ...updates,
        id: String(updates.id || prev.id),
        name: updates.name || prev.name,
        email: updates.email || prev.email,
        role: updates.role || prev.role,
        is_admin: updates.is_admin !== undefined ? updates.is_admin : prev.is_admin,
        foto_perfil: updates.foto_perfil !== undefined ? updates.foto_perfil : prev.foto_perfil,
        telefone: updates.telefone !== undefined ? updates.telefone : prev.telefone,
        bio: updates.bio !== undefined ? updates.bio : prev.bio,
        setor: updates.setor !== undefined ? updates.setor : prev.setor,
      };
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 