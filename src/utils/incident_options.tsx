import type { Incident, PersonnelRef } from '../types';

export type Option = { value: string; label: string };

/** THEFT → "Theft", USED_BY_SUSPECT → "Used By Suspect". */
export function humanize(value?: string | null) {
  if (!value) return '—';
  return value
    .toLowerCase()
    .split('_')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

const options = (...values: string[]): Option[] => values.map((value) => ({ value, label: humanize(value) }));

/*
 * Enum values. Confirmed from API responses: THEFT, ROAD_ACCIDENT, URGENT, OPEN, UNDER_REVIEW, ASSIGNED,
 * IN_PROGRESS, RESOLVED, CLOSED, VICTIM, WITNESS, NIN, CAR, MOTORCYCLE, USED_BY_SUSPECT, INVOLVED,
 * UNKNOWN, OWNER, TYPED, DICTATED, AUDIO, PHOTO, SUSPECT, GPS.
 * Everything else is a best guess — align these lists with Swagger. A value the API returns that
 * isn't listed still displays correctly (SelectField adds it).
 */
export const incidentTypeOptions = options('THEFT', 'ROBBERY', 'ASSAULT', 'BURGLARY', 'FRAUD', 'DOMESTIC_VIOLENCE', 'KIDNAPPING', 'MISSING_PERSON', 'ROAD_ACCIDENT', 'VANDALISM', 'OTHER');
export const priorityOptions = options('LOW', 'MEDIUM', 'HIGH', 'URGENT');
export const incidentStatusOptions = options('OPEN', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
export const personRoleOptions = options('VICTIM', 'WITNESS', 'COMPLAINANT', 'SUSPECT', 'INFORMANT', 'OTHER');
export const idTypeOptions = options('NIN', 'VOTERS_CARD', 'DRIVERS_LICENCE', 'INTERNATIONAL_PASSPORT', 'OTHER');
export const vehicleTypeOptions = options('CAR', 'MOTORCYCLE', 'TRICYCLE', 'BUS', 'TRUCK', 'OTHER');
export const vehicleRoleOptions = options('INVOLVED', 'USED_BY_SUSPECT', 'VICTIM_VEHICLE', 'WITNESS_VEHICLE', 'STOLEN', 'OTHER');
export const driverOwnerStatusOptions = options('UNKNOWN', 'OWNER', 'SUSPECT', 'VICTIM', 'WITNESS');
export const statementMethodOptions = options('TYPED', 'DICTATED', 'AUDIO');
export const evidenceTypeOptions = options('PHOTO', 'VIDEO', 'AUDIO', 'DOCUMENT');
export const suspectStatusOptions = options('SUSPECT', 'WANTED', 'ARRESTED', 'RELEASED');
export const genderOptions = options('MALE', 'FEMALE');

/** Maps incident status / priority onto the badge colours already in the stylesheet. */
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
    case 'HIGH':
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

/** Parses the API's numeric strings ("6.524379") as well as plain numbers. */
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

/** ISO → value for <input type="datetime-local"> in the user's timezone. */
export function toDateTimeLocal(value?: string | null) {
  const date = parse(value);
  if (!date) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function fromDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : '';
}

/** ISO or YYYY-MM-DD → value for <input type="date">. */
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