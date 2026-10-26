import type {
  AppointStationAdminInput,
  AppointmentResponse,
  AssignIncidentInput,
  AssignedStationResponse,
  ChangeIncidentStatusInput,
  CreateOfficerInput,
  CreateOfficerResponse,
  CreateStationInput,
  CreateStationOfficerInput,
  CreateStationOfficerResponse,
  CreateSuspectInput,
  EvidenceUploadCompleteInput,
  EvidenceUploadRequestInput,
  EvidenceUploadTicket,
  Incident,
  IncidentActivity,
  LinkSuspectInput,
  ListResult,
  LoginResponse,
  Officer,
  Station,
  StationAdmin,
  StationListResponse,
  StationOfficer,
  StationOperationsDashboardResponse,
  Suspect,
  SuspectInput,
  UpdateIncidentInput,
  UpsertIncidentPersonInput,
  UpsertIncidentStatementInput,
  UpsertIncidentVehicleInput,
} from './types';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://field-line-api-dev.onrender.com/api/v1').replace(/\/$/, '');

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
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const rawMessage = body?.message;
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage || `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

/** Accepts either a plain array or a paginated `{ items }` body. */
function toList<T>(result: ListResult<T> | null | undefined): T[] {
  if (Array.isArray(result)) return result;
  return result?.items ?? [];
}

function send(method: 'POST' | 'PUT' | 'DELETE', body?: unknown): RequestInit {
  return body === undefined ? { method } : { method, body: JSON.stringify(body) };
}

const ops = '/station-operations';

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
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      token,
    ),

  // Platform admin
  listStations: (token: string) => request<StationListResponse>('/platform/stations', {}, token),
  createStation: (token: string, input: CreateStationInput) => request<Station>('/platform/stations', { method: 'POST', body: JSON.stringify(input) }, token),
  approveStation: (token: string, id: string) => request<Station>(`/platform/stations/${id}/approve`, { method: 'POST' }, token),
  listStationAdmins: (token: string, stationId: string) => request<StationAdmin[]>(`/platform/stations/${stationId}/admins`, {}, token),
  appointStationAdmin: (token: string, stationId: string, input: AppointStationAdminInput) => request<AppointmentResponse>(`/platform/stations/${stationId}/admins`, { method: 'POST', body: JSON.stringify(input) }, token),

  // Station admin
  getAssignedStation: (token: string) => request<AssignedStationResponse>('/station-admin/station', {}, token),
  listOfficers: (token: string) => request<Officer[]>('/station-admin/officers', {}, token),
  getOfficer: (token: string, officerId: string) => request<Officer>(`/station-admin/officers/${officerId}`, {}, token),
  createOfficer: (token: string, input: CreateOfficerInput) => request<CreateOfficerResponse>('/station-admin/officers', { method: 'POST', body: JSON.stringify(input) }, token),
  removeOfficer: (token: string, officerId: string) => request<void>(`/station-admin/officers/${officerId}`, { method: 'DELETE' }, token),
  listStationOfficers: (token: string) => request<StationOfficer[]>('/station-admin/station-officers', {}, token),
  createStationOfficer: (token: string, input: CreateStationOfficerInput) => request<CreateStationOfficerResponse>('/station-admin/station-officers', { method: 'POST', body: JSON.stringify(input) }, token),
  removeStationOfficer: (token: string, officerId: string) => request<void>(`/station-admin/station-officers/${officerId}`, { method: 'DELETE' }, token),

  // Station operations — dashboard
  getStationOperationsDashboard: (token: string) => request<StationOperationsDashboardResponse>(`${ops}/dashboard`, {}, token),

  // Station operations — incidents
  listIncidents: async (token: string) => toList(await request<ListResult<Incident>>(`${ops}/incidents`, {}, token)),
  getIncident: (token: string, incidentId: string) => request<Incident>(`${ops}/incidents/${incidentId}`, {}, token),
  updateIncident: (token: string, incidentId: string, input: UpdateIncidentInput) => request<unknown>(`${ops}/incidents/${incidentId}`, send('PUT', input), token),
  upsertIncidentPerson: (token: string, incidentId: string, personId: string, input: UpsertIncidentPersonInput) => request<unknown>(`${ops}/incidents/${incidentId}/people/${personId}`, send('PUT', input), token),
  upsertIncidentVehicle: (token: string, incidentId: string, vehicleId: string, input: UpsertIncidentVehicleInput) => request<unknown>(`${ops}/incidents/${incidentId}/vehicles/${vehicleId}`, send('PUT', input), token),
  upsertIncidentStatement: (token: string, incidentId: string, statementId: string, input: UpsertIncidentStatementInput) => request<unknown>(`${ops}/incidents/${incidentId}/statements/${statementId}`, send('PUT', input), token),
  requestEvidenceUpload: (token: string, incidentId: string, evidenceId: string, input: EvidenceUploadRequestInput) => request<EvidenceUploadTicket>(`${ops}/incidents/${incidentId}/evidence/${evidenceId}/upload-request`, send('POST', input), token),
  completeEvidenceUpload: (token: string, incidentId: string, evidenceId: string, input: EvidenceUploadCompleteInput) => request<unknown>(`${ops}/incidents/${incidentId}/evidence/${evidenceId}/complete`, send('POST', input), token),
  assignIncident: (token: string, incidentId: string, input: AssignIncidentInput) => request<unknown>(`${ops}/incidents/${incidentId}/assignment`, send('POST', input), token),
  changeIncidentStatus: (token: string, incidentId: string, input: ChangeIncidentStatusInput) => request<unknown>(`${ops}/incidents/${incidentId}/status`, send('POST', input), token),
  listIncidentActivity: async (token: string, incidentId: string) => toList(await request<ListResult<IncidentActivity>>(`${ops}/incidents/${incidentId}/activity`, {}, token)),

  // Station operations — suspects
  listSuspects: async (token: string) => toList(await request<ListResult<Suspect>>(`${ops}/suspects`, {}, token)),
  getSuspect: (token: string, suspectId: string) => request<Suspect>(`${ops}/suspects/${suspectId}`, {}, token),
  createSuspect: (token: string, input: CreateSuspectInput) => request<unknown>(`${ops}/suspects`, send('POST', input), token),
  updateSuspect: (token: string, suspectId: string, input: SuspectInput) => request<unknown>(`${ops}/suspects/${suspectId}`, send('PUT', input), token),
  linkSuspect: (token: string, incidentId: string, suspectId: string, input: LinkSuspectInput) => request<unknown>(`${ops}/incidents/${incidentId}/suspects/${suspectId}`, send('POST', input), token),
  unlinkSuspect: (token: string, incidentId: string, suspectId: string) => request<void>(`${ops}/incidents/${incidentId}/suspects/${suspectId}`, send('DELETE'), token),
};