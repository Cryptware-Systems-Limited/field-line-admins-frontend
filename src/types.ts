export type AdminUser = {
  id: string;
  email: string;
  phone: string;
  mustChangePassword: boolean;
  roles: string[];
  personnelProfile?: {
    firstName: string;
    lastName: string;
    rankOrPosition?: string | null;
  } | null;
};

export type LoginResponse = {
  accessToken: string;
  accessTokenExpiresIn: string;
  user: AdminUser;
};

export type StationOperationsDashboardResponse = {
  date: string;
  station: {
    id: string;
    code: string;
    name: string;
  };
  incidents: {
    loggedToday: number;
    open: number;
    underReview: number;
    assigned: number;
    inProgress: number;
    resolved: number;
    closed: number;
    unassigned: number;
  };
  officers: { active: number };
  assignments: Array<{
    id: string;
    referenceNumber: string;
    status: string;
    assignedOfficer: {
      id: string;
      personnelProfile?: {
        personnelNumber: string;
        firstName: string;
        lastName: string;
      } | null;
    } | null;
  }>;
};

export type StationStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export type Station = {
  id: string;
  code: string;
  name: string;
  type?: string | null;
  command?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  phone?: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: StationStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateStationInput = Omit<Station, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

export type StationListResponse = {
  items: Station[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type StationAdmin = {
  id: string;
  email: string;
  phone: string;
  status: string;
  mustChangePassword: boolean;
  createdAt: string;
  personnelProfile: {
    personnelType: 'POLICE_OFFICER' | 'POLICE_STAFF';
    personnelNumber: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    rankOrPosition?: string | null;
    department?: string | null;
    authorisationRef: string;
  };
};

export type AppointStationAdminInput = {
  email: string;
  phone: string;
  personnelType: 'POLICE_OFFICER' | 'POLICE_STAFF';
  personnelNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  position?: string;
  department?: string;
  authorisationRef: string;
};

export type AppointmentResponse = {
  admin: StationAdmin;
  temporaryPassword: string;
};

export type AssignedStationResponse = {
  station: Station;
  startedAt: string;
};

export type Officer = {
  id: string;
  email: string;
  phone: string;
  status: string;
  phoneVerifiedAt?: string | null;
  createdAt: string;
  personnelProfile: {
    personnelNumber: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    rankOrPosition?: string | null;
    department?: string | null;
    authorisationRef: string;
  };
  devices: Array<{
    id: string;
    installationId: string;
    platform: string;
    status: string;
    lastSeenAt?: string | null;
  }>;
};

export type CreateOfficerInput = {
  serviceNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  rank?: string;
  department?: string;
  phone: string;
  email: string;
  authorisationRef: string;
};

export type CreateOfficerResponse = {
  officer: Officer;
  temporaryPassword: string;
};

export type StationOfficer = Omit<Officer, 'devices'>;

export type CreateStationOfficerInput = CreateOfficerInput;

export type CreateStationOfficerResponse = {
  temporaryPassword?: string;
};

export type Paginated<T> = { items: T[]; pagination?: StationListResponse['pagination'] };
export type ListResult<T> = T[] | Paginated<T>;

export type PersonnelRef = {
  id: string;
  email?: string | null;
  personnelProfile?: {
    firstName?: string | null;
    lastName?: string | null;
    personnelNumber?: string | null;
    rankOrPosition?: string | null;
  } | null;
};

export type IncidentLocation = {
  latitude?: number | string | null;
  longitude?: number | string | null;
  accuracyMeters?: number | string | null;
  capturedAt?: string | null;
  resolvedAddress?: string | null;
  landmarkOrDirections?: string | null;
  source?: string | null;
};

export type IncidentPerson = {
  id: string;
  role?: string | null;
  fullName?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  address?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  officerNotes?: string | null;
};

export type IncidentVehicle = {
  id: string;
  plateNumber?: string | null;
  type?: string | null;
  makeModel?: string | null;
  colour?: string | null;
  role?: string | null;
  driverOwnerStatus?: string | null;
};

export type IncidentStatement = {
  id: string;
  method?: string | null;
  personId?: string | null;
  content?: string | null;
  audioEvidenceId?: string | null;
  officerSummary?: string | null;
  clientCreatedAt?: string | null;
  createdAt?: string | null;
};

export type IncidentEvidence = {
  id: string;
  type?: string | null;
  status?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  description?: string | null;
  originalFileName?: string | null;
  capturedAt?: string | null;
  createdAt?: string | null;
  url?: string | null;
  secureUrl?: string | null;
};

export type Suspect = {
  id: string;
  photoId?: string | null;
  photo?: { id?: string | null } | null;
  photos?: Array<{ id?: string | null }> | null;
  fullName?: string | null;
  aliases?: string[] | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  phone?: string | null;
  address?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  identifyingMarks?: string | null;
  notes?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

/** An incident's suspect entry — either a link wrapping a suspect, or the suspect itself. */
export type IncidentSuspectLink = {
  id?: string;
  suspectId?: string | null;
  notes?: string | null;
  suspect?: Suspect | null;
  fullName?: string | null;
  status?: string | null;
};

export type Incident = {
  id: string;
  reference?: string | null;
  referenceNumber?: string | null;
  type?: string | null;
  otherTypeDescription?: string | null;
  priority?: string | null;
  status?: string | null;
  occurredAt?: string | null;
  clientCreatedAt?: string | null;
  description?: string | null;
  location?: IncidentLocation | null;
  assignedOfficerId?: string | null;
  assignedOfficer?: PersonnelRef | null;
  reportedBy?: PersonnelRef | null;
  reportingOfficer?: PersonnelRef | null;
  revision?: number | null;
  source?: string | null;
  receivedAt?: string | null;
  case?: { id?: string; referenceNumber?: string | null; status?: string | null; openedAt?: string | null; closedAt?: string | null } | null;
  people?: IncidentPerson[] | null;
  vehicles?: IncidentVehicle[] | null;
  statements?: IncidentStatement[] | null;
  evidence?: IncidentEvidence[] | null;
  suspects?: IncidentSuspectLink[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type IncidentActivity = {
  id?: string;
  action?: string | null;
  type?: string | null;
  event?: string | null;
  description?: string | null;
  message?: string | null;
  summary?: string | null;
  reason?: string | null;
  actor?: PersonnelRef | null;
  createdAt?: string | null;
};

/* Request bodies (from the API docs) */

export type IncidentLocationInput = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  capturedAt?: string;
  resolvedAddress?: string;
  landmarkOrDirections?: string;
  source?: string;
};

export type UpdateIncidentInput = {
  type: string;
  otherTypeDescription?: string;
  priority: string;
  occurredAt: string;
  clientCreatedAt?: string;
  description: string;
  location?: IncidentLocationInput;
};

export type UpsertIncidentPersonInput = {
  role: string;
  fullName: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  idType?: string;
  idNumber?: string;
  officerNotes?: string;
};

export type UpsertIncidentVehicleInput = {
  plateNumber?: string;
  type: string;
  makeModel?: string;
  colour?: string;
  role: string;
  driverOwnerStatus?: string;
};

export type UpsertIncidentStatementInput = {
  method: string;
  personId?: string;
  content?: string;
  audioEvidenceId?: string;
  officerSummary?: string;
  clientCreatedAt: string;
};

export type EvidenceUploadRequestInput = {
  type: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  capturedAt?: string;
  description?: string;
  originalFileName: string;
};

/** Signed Cloudinary upload. Confirmed by the mobile app: { uploadUrl, apiKey, signature, parameters }. */
export type EvidenceUploadTicket = {
  uploadUrl?: string;
  parameters?: Record<string, string | number | boolean>;
  cloudName?: string;
  apiKey?: string;
  timestamp?: number | string;
  signature?: string;
  publicId?: string;
  folder?: string;
  resourceType?: string;
  deliveryType?: string;
  fields?: Record<string, string | number>;
  params?: Record<string, string | number>;
};

export type EvidenceUploadCompleteInput = {
  assetId: string;
  publicId: string;
  version: number;
  signature: string;
  resourceType: string;
  deliveryType: string;
  bytes: number;
  format: string;
  etag: string;
};

export type AssignIncidentInput = { officerId: string; reason?: string };
export type ChangeIncidentStatusInput = { status: string; reason?: string };

export type SuspectInput = {
  fullName: string;
  aliases?: string[];
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  idType?: string;
  idNumber?: string;
  identifyingMarks?: string;
  notes?: string;
  status?: string;
};

export type CreateSuspectInput = SuspectInput & { photoSessionId?: string };
export type LinkSuspectInput = { notes?: string };


export type SuspectPhotoSession = {
  id: string;
  status: string;
  expiresAt?: string | null;
  captureUrl?: string | null;
  uploadedAt?: string | null;
  photo?: {
    mimeType?: string | null;
    sizeBytes?: number | null;
    capturedAt?: string | null;
    previewUrl?: string | null;
  } | null;
};

export type SuspectPhotoAccess = {
  photoId: string;
  previewUrl: string;
  expiresInSeconds?: number;
};

export type SuspectPhotoUploadRequestInput = {
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  capturedAt?: string;
};

export type SuspectPhotoUploadTicket = EvidenceUploadTicket & {
  sessionId?: string;
  expiresAt?: string;
};

export type SuspectPhotoUploadResult = {
  sessionId?: string;
  status?: string;
  uploadedAt?: string;
};