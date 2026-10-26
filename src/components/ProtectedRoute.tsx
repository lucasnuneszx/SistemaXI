'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se não está carregando e não tem token nem usuário, redirecionar para login
    if (!loading && !token && !user) {
      router.push('/login');
      return;
    }

    // Se tem token mas não tem usuário, algo deu errado
    if (!loading && token && !user) {
      localStorage.removeItem('authToken');
      router.push('/login');
      return;
    }

    // Se está tudo ok, usuário pode acessar a página
    if (!loading && token && user) {
    }
  }, [user, token, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não tem token nem usuário, não renderizar nada (vai redirecionar)
  if (!token || !user) {
    return null;
  }

  // Se está autenticado, renderizar o conteúdo
  return <>{children}</>;
} 