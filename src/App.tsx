import { useState } from 'react';

import { api } from './api';
import { ChangePassword } from './pages/ChangePassword';
import { Login } from './pages/Login';
import { PlatformDashboard } from './pages/PlatformDashboard';
import { StationAdminDashboard } from './pages/StationAdminDashboard';
import { StationOperationsDashboard } from './pages/StationOperationsDashboard';
import { SUSPECT_PHOTO_CAPTURE_PATH, SuspectPhotoCapture } from './pages/SuspectPhotoCapture';
import type { AdminUser } from './types';

// Public page opened from the suspect-photo QR code (no login). Read once — it doesn't change while the app runs.
const isPhotoCapture = window.location.pathname.replace(/\/$/, '') === SUSPECT_PHOTO_CAPTURE_PATH;
const captureToken = new URLSearchParams(window.location.search).get('token');

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

  if (isPhotoCapture) return <SuspectPhotoCapture captureToken={captureToken} />;
  if (!token || !user) return <Login onLogin={loggedIn} />;
  if (user.mustChangePassword) return <ChangePassword token={token} user={user} onDone={setUser} />;
  if (user.roles.includes('PLATFORM_ADMIN')) {
    return <PlatformDashboard token={token} user={user} onLogout={() => void logout()} />;
  }
  if (user.roles.includes('STATION_ADMIN')) {
    return <StationAdminDashboard token={token} user={user} onLogout={() => void logout()} />;
  }
  return <StationOperationsDashboard token={token} user={user} onLogout={() => void logout()} />;
}