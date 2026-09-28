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
  pagination: { page: number; limit: number; total: number; pages: number };
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
