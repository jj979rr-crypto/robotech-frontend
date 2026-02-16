// src/routes/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

type Role = 'admin' | 'competitor' | 'club_owner' | 'judge';

interface ProtectedRouteProps {
  requiredRole: Role;
  children: ReactNode;
}

interface StoredUser {
  role?: string;
  staffType?: string;
  // otros campos si quieres...
}

const hasPermission = (
  requiredRole: Role,
  userRole?: string,
  userStaffType?: string,
) => {
  if (!userRole) return false;

  if (requiredRole === 'admin') return userRole === 'admin';
  if (requiredRole === 'competitor') return userRole === 'competitor';
  if (requiredRole === 'club_owner') {
    return userRole === 'staff' && userStaffType === 'club_owner';
  }
  if (requiredRole === 'judge') {
    return userRole === 'staff' && userStaffType === 'judge';
  }

  return false;
};

export const ProtectedRoute = ({ requiredRole, children }: ProtectedRouteProps) => {
  const token = localStorage.getItem('access_token');
  const rawUser = localStorage.getItem('user');

  // 1. No hay token o user → redirigir al login correcto
  if (!token || !rawUser) {
    const redirect =
      requiredRole === 'admin'
        ? '/admin-secret-access'
        : requiredRole === 'competitor'
        ? '/login'
        : requiredRole === 'club_owner'
        ? '/internal/login-owner'
        : '/internal/login-judge';

    return <Navigate to={redirect} replace />;
  }

  // 2. Parsear usuario
  let user: StoredUser | null = null;
  try {
    user = JSON.parse(rawUser);
  } catch {
    // Si el JSON está corrupto, limpiamos y mandamos a login
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');

    const redirect =
      requiredRole === 'admin'
        ? '/admin-secret-access'
        : requiredRole === 'competitor'
        ? '/login'
        : requiredRole === 'club_owner'
        ? '/internal/login-owner'
        : '/internal/login-judge';

    return <Navigate to={redirect} replace />;
  }

  // 3. Verificar permisos
  const canPass = hasPermission(requiredRole, user?.role, user?.staffType);

  if (!canPass) {
    const redirect =
      requiredRole === 'admin'
        ? '/admin-secret-access'
        : requiredRole === 'competitor'
        ? '/login'
        : requiredRole === 'club_owner'
        ? '/internal/login-owner'
        : '/internal/login-judge';

    return <Navigate to={redirect} replace />;
  }
  return <>{children}</>;
};
