import type { NavigateFunction } from 'react-router-dom';

export const logoutAndRedirect = (navigate: NavigateFunction) => {
  const rawUser = localStorage.getItem('user');

  let lastRole: string | undefined;
  let staffType: string | undefined;

  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      lastRole = parsed.role;
      staffType = parsed.staffType;
    } catch {
      // si está corrupto, no pasa nada, lo tratamos como invitado
    }
  }

  // 1. limpiar sesión
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');

  // 2. decidir a dónde mandarlo según lo que era antes
  if (lastRole === 'admin') {
    navigate('/admin-secret-access', { replace: true });
    return;
  }

  if (lastRole === 'competitor') {
    navigate('/login', { replace: true });
    return;
  }

  if (lastRole === 'staff' && staffType === 'club_owner') {
    navigate('/internal/login-owner', { replace: true });
    return;
  }

  if (lastRole === 'staff' && staffType === 'judge') {
    navigate('/internal/login-judge', { replace: true });
    return;
  }

  // si por alguna razón no sabemos qué era, a la landing pública
  navigate('/', { replace: true });
};
