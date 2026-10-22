import { useState } from 'react';

import { api } from './api';
import { ChangePassword } from './pages/ChangePassword';
import { Login } from './pages/Login';
import { PlatformDashboard } from './pages/PlatformDashboard';
import { StationAdminDashboard } from './pages/StationAdminDashboard';
import type { AdminUser } from './types';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);

  function loggedIn(accessToken: string, admin: AdminUser) {
    setToken(accessToken);
    setUser(admin);
  }

  async function logout() {
    await api.logout().catch(() => undefined);
    setToken(null);
    setUser(null);
  }

  if (!token || !user) return <Login onLogin={loggedIn} />;
  if (user.mustChangePassword) return <ChangePassword token={token} user={user} onDone={setUser} />;
  if (user.roles.includes('PLATFORM_ADMIN')) {
    return <PlatformDashboard token={token} user={user} onLogout={() => void logout()} />;
  }
  return <StationAdminDashboard token={token} user={user} onLogout={() => void logout()} />;
}