import type {
  AppointStationAdminInput,
  AppointmentResponse,
  AssignedStationResponse,
  CreateStationInput,
  CreateOfficerInput,
  CreateOfficerResponse,
  LoginResponse,
  Station,
  StationAdmin,
  StationListResponse,
  Officer,
} from './types';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://field-line-api-dev.onrender.com/api/v1'
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const rawMessage = body?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : rawMessage || `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    request<void>(
      '/auth/change-password',
      { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) },
      token,
    ),
  listStations: (token: string) => request<StationListResponse>('/platform/stations', {}, token),
  createStation: (token: string, input: CreateStationInput) =>
    request<Station>(
      '/platform/stations',
      { method: 'POST', body: JSON.stringify(input) },
      token,
    ),
  approveStation: (token: string, id: string) =>
    request<Station>(`/platform/stations/${id}/approve`, { method: 'POST' }, token),
  listStationAdmins: (token: string, stationId: string) =>
    request<StationAdmin[]>(`/platform/stations/${stationId}/admins`, {}, token),
  appointStationAdmin: (
    token: string,
    stationId: string,
    input: AppointStationAdminInput,
  ) =>
    request<AppointmentResponse>(
      `/platform/stations/${stationId}/admins`,
      { method: 'POST', body: JSON.stringify(input) },
      token,
    ),
  getAssignedStation: (token: string) =>
    request<AssignedStationResponse>('/station-admin/station', {}, token),
  listOfficers: (token: string) =>
    request<Officer[]>('/station-admin/officers', {}, token),
  createOfficer: (token: string, input: CreateOfficerInput) =>
    request<CreateOfficerResponse>(
      '/station-admin/officers',
      { method: 'POST', body: JSON.stringify(input) },
      token,
    ),
  removeOfficer: (token: string, officerId: string) =>
    request<void>(`/station-admin/officers/${officerId}`, { method: 'DELETE' }, token),
};
