import { useState } from 'react';

import { api } from '../../api';
import type { Incident, UpdateIncidentInput } from '../../types';
import { compact } from '../../utils/errors';
import { fromDateTimeLocal, incidentTypeOptions, priorityOptions, toDateTimeLocal, toNumber } from '../../utils/incident_options';
import { SelectField, TextAreaField, TextField } from '../form_fields';
import { FormModal } from '../form_modal';

type Props = { token: string; incident: Incident; onClose: () => void; onSaved: () => void };

export function IncidentEditModal({ token, incident, onClose, onSaved }: Props) {
  const location = incident.location;
  const savedLatitude = toNumber(location?.latitude);
  const savedLongitude = toNumber(location?.longitude);
  const savedAccuracy = toNumber(location?.accuracyMeters);
  const [form, setForm] = useState({
    type: incident.type ?? '',
    otherTypeDescription: incident.otherTypeDescription ?? '',
    priority: incident.priority ?? '',
    occurredAt: toDateTimeLocal(incident.occurredAt),
    description: incident.description ?? '',
    latitude: savedLatitude?.toString() ?? '',
    longitude: savedLongitude?.toString() ?? '',
    resolvedAddress: location?.resolvedAddress ?? '',
    landmarkOrDirections: location?.landmarkOrDirections ?? '',
  });
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function save() {
    const input = compact<UpdateIncidentInput>({
      type: form.type,
      otherTypeDescription: form.type === 'OTHER' ? form.otherTypeDescription.trim() : '',
      priority: form.priority,
      occurredAt: fromDateTimeLocal(form.occurredAt),
      clientCreatedAt: incident.clientCreatedAt ?? '',
      description: form.description.trim(),
    });

    const latitude = Number.parseFloat(form.latitude);
    const longitude = Number.parseFloat(form.longitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      const unchanged = savedLatitude === latitude && savedLongitude === longitude;
      input.location = {
        latitude,
        longitude,
        ...(unchanged && savedAccuracy !== null ? { accuracyMeters: savedAccuracy } : {}),
        capturedAt: unchanged && location?.capturedAt ? location.capturedAt : new Date().toISOString(),
        ...(form.resolvedAddress.trim() ? { resolvedAddress: form.resolvedAddress.trim() } : {}),
        ...(form.landmarkOrDirections.trim() ? { landmarkOrDirections: form.landmarkOrDirections.trim() } : {}),
        source: unchanged && location?.source ? location.source : 'MANUAL',
      };
    }

    await api.updateIncident(token, incident.id, input);
    onSaved();
  }

  return (
    <FormModal eyebrow="Incident record" title="Edit incident details" submitLabel="Save changes" onClose={onClose} onSubmit={save}>
      <div className="form-section">
        <h3>Classification</h3>
        <div className="form-grid">
          <SelectField label="Incident type" value={form.type} onChange={set('type')} options={incidentTypeOptions} placeholder="Select type" required />
          <SelectField label="Priority" value={form.priority} onChange={set('priority')} options={priorityOptions} placeholder="Select priority" required />
          {form.type === 'OTHER' && <TextField className="span-2" label="Describe the incident type" value={form.otherTypeDescription} onChange={set('otherTypeDescription')} placeholder="e.g. Cybercrime complaint" required />}
          <TextField className="span-2" type="datetime-local" label="Occurred at" value={form.occurredAt} onChange={set('occurredAt')} required />
          <TextAreaField className="span-2" label="Description" value={form.description} onChange={set('description')} rows={5} required />
        </div>
      </div>
      <div className="form-section">
        <h3>Location</h3>
        <p className="muted small-copy">The location is saved only when both coordinates are filled in.</p>
        <div className="form-grid">
          <TextField label="Latitude" inputMode="decimal" value={form.latitude} onChange={set('latitude')} placeholder="6.60182" />
          <TextField label="Longitude" inputMode="decimal" value={form.longitude} onChange={set('longitude')} placeholder="3.35151" />
          <TextField className="span-2" label="Address" value={form.resolvedAddress} onChange={set('resolvedAddress')} placeholder="Obafemi Awolowo Way, Ikeja" />
          <TextField className="span-2" label="Landmark or directions" value={form.landmarkOrDirections} onChange={set('landmarkOrDirections')} placeholder="Opposite the filling station" />
        </div>
      </div>
    </FormModal>
  );
}