import type { Incident, PersonnelRef, Suspect } from '../types';

export type Option = { value: string; label: string };

export function humanize(value?: string | null) {
  if (!value) return '—';
  return value
    .toLowerCase()
    .split('_')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

const options = (...values: string[]): Option[] => values.map((value) => ({ value, label: humanize(value) }));

export const incidentTypeOptions = options('THEFT', 'ASSAULT', 'MISSING_PERSON', 'ROAD_ACCIDENT', 'BURGLARY', 'OTHER');
export const priorityOptions = options('EMERGENCY', 'URGENT', 'ROUTINE');
export const incidentStatusOptions = options('OPEN', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
export const personRoleOptions = options('VICTIM', 'WITNESS', 'SUSPECT', 'INFORMANT', 'OTHER');
export const idTypeOptions = options('NIN', 'VOTERS_CARD', 'DRIVERS_LICENCE', 'INTERNATIONAL_PASSPORT', 'OTHER');
export const vehicleTypeOptions = options('CAR', 'MOTORCYCLE', 'TRICYCLE', 'BUS', 'TRUCK', 'OTHER');
export const vehicleRoleOptions = options('INVOLVED', 'USED_BY_SUSPECT', 'SUSPECT_VEHICLE', 'VICTIM_VEHICLE', 'WITNESS_VEHICLE', 'OTHER');
export const driverOwnerStatusOptions = options('KNOWN', 'UNKNOWN', 'SUSPECT', 'VICTIM', 'WITNESS', 'OTHER');
export const statementMethodOptions = options('TYPED', 'DICTATED', 'AUDIO');
export const evidenceTypeOptions = options('PHOTO', 'VIDEO', 'AUDIO', 'DOCUMENT');
export const suspectStatusOptions = options('SUSPECT', 'WANTED', 'ARRESTED', 'RELEASED');
export const genderOptions = options('MALE', 'FEMALE');

export function incidentStatusClass(status?: string | null) {
  switch (status) {
    case 'OPEN':
    case 'UNDER_REVIEW':
      return 'status status--pending_approval';
    case 'ASSIGNED':
    case 'IN_PROGRESS':
      return 'status status--active';
    default:
      return 'status status--draft';
  }
}

export function priorityClass(priority?: string | null) {
  switch (priority) {
    case 'URGENT':
    case 'EMERGENCY':
      return 'status status--suspended';
    case 'MEDIUM':
      return 'status status--pending_approval';
    default:
      return 'status status--draft';
  }
}

export function incidentRef(incident: Incident) {
  return incident.reference || incident.referenceNumber || `#${incident.id.slice(0, 8).toUpperCase()}`;
}

export function incidentTitle(incident: Incident) {
  if (incident.type === 'OTHER' && incident.otherTypeDescription) return incident.otherTypeDescription;
  return incident.type ? humanize(incident.type) : 'Incident';
}

export function toNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function personnelName(ref?: PersonnelRef | null) {
  if (!ref) return '';
  const name = [ref.personnelProfile?.firstName, ref.personnelProfile?.lastName].filter(Boolean).join(' ');
  return name || ref.email || ref.id;
}

export function newId() {
  return crypto.randomUUID();
}

function parse(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value?: string | null) {
  const date = parse(value);
  return date ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(date) : value || '—';
}

export function formatDate(value?: string | null) {
  const date = parse(value);
  return date ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(date) : value || '—';
}

export function toDateTimeLocal(value?: string | null) {
  const date = parse(value);
  if (!date) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function fromDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : '';
}

export function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

export function formatBytes(bytes?: number | null) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

export function suspectPhotoId(suspect: Suspect) {
  return suspect.photos?.find((photo) => photo.id)?.id || suspect.photo?.id || suspect.photoId || null;
}
