import { useState } from 'react';

import { api } from '../../api';
import type { Incident } from '../../types';
import { compact } from '../../utils/errors';
import { humanize, incidentStatusOptions, personnelName } from '../../utils/incident_options';
import { SelectField, TextAreaField, TextField } from '../form_fields';
import { FormModal } from '../form_modal';

type Props = { token: string; incident: Incident; onClose: () => void; onSaved: () => void };

export function AssignIncidentModal({ token, incident, onClose, onSaved }: Props) {
  const current = incident.assignedOfficer?.id ?? incident.assignedOfficerId ?? '';
  const [officerId, setOfficerId] = useState(current);
  const [reason, setReason] = useState('');

  async function save() {
    await api.assignIncident(token, incident.id, compact({ officerId: officerId.trim(), reason: reason.trim() }));
    onSaved();
  }

  return (
    <FormModal eyebrow="Assignment" title={current ? 'Reassign incident' : 'Assign incident'} submitLabel="Assign officer" onClose={onClose} onSubmit={save}>
      <div className="form-section">
        {current && <p className="muted small-copy">Currently assigned to {personnelName(incident.assignedOfficer) || current}.</p>}
        <div className="form-grid">
          <TextField className="span-2" label="Officer ID" value={officerId} onChange={setOfficerId} placeholder="ID of the officer taking this incident" required />
          <TextAreaField className="span-2" label="Reason" value={reason} onChange={setReason} rows={3} placeholder="Why this officer is being assigned" />
        </div>
      </div>
    </FormModal>
  );
}

export function ChangeStatusModal({ token, incident, onClose, onSaved }: Props) {
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const options = incidentStatusOptions.filter((option) => option.value !== incident.status);

  async function save() {
    await api.changeIncidentStatus(token, incident.id, compact({ status, reason: reason.trim() }));
    onSaved();
  }

  return (
    <FormModal eyebrow="Status" title="Change incident status" submitLabel="Update status" onClose={onClose} onSubmit={save}>
      <div className="form-section">
        <p className="muted small-copy">Current status: {humanize(incident.status)}</p>
        <div className="form-grid">
          <SelectField className="span-2" label="New status" value={status} onChange={setStatus} options={options} placeholder="Select status" required />
          <TextAreaField className="span-2" label="Reason" value={reason} onChange={setReason} rows={3} placeholder="Recorded in the incident's activity log" />
        </div>
      </div>
    </FormModal>
  );
}