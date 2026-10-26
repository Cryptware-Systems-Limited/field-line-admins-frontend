import { useState } from 'react';

import { api } from '../../api';
import type { IncidentPerson, UpsertIncidentPersonInput } from '../../types';
import { compact } from '../../utils/errors';
import { idTypeOptions, newId, personRoleOptions, toDateInput } from '../../utils/incident_options';
import { SelectField, TextAreaField, TextField } from '../form_fields';
import { FormModal } from '../form_modal';

type Props = { token: string; incidentId: string; person?: IncidentPerson; onClose: () => void; onSaved: () => void };

export function IncidentPersonModal({ token, incidentId, person, onClose, onSaved }: Props) {
  // Stable ID so a retried save updates the same record instead of creating a duplicate.
  const [personId] = useState(() => person?.id ?? newId());
  const [form, setForm] = useState({
    role: person?.role ?? 'VICTIM',
    fullName: person?.fullName ?? '',
    dateOfBirth: toDateInput(person?.dateOfBirth),
    phone: person?.phone ?? '',
    address: person?.address ?? '',
    idType: person?.idType ?? '',
    idNumber: person?.idNumber ?? '',
    officerNotes: person?.officerNotes ?? '',
  });
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function save() {
    await api.upsertIncidentPerson(token, incidentId, personId, compact<UpsertIncidentPersonInput>({ ...form, fullName: form.fullName.trim() }));
    onSaved();
  }

  return (
    <FormModal eyebrow="People involved" title={person ? 'Edit person' : 'Add person'} submitLabel={person ? 'Save person' : 'Add person'} onClose={onClose} onSubmit={save}>
      <div className="form-section">
        <h3>Identity</h3>
        <div className="form-grid">
          <SelectField label="Role in incident" value={form.role} onChange={set('role')} options={personRoleOptions} required />
          <TextField label="Full name" value={form.fullName} onChange={set('fullName')} placeholder="Folake Adeyemi" required />
          <TextField type="date" label="Date of birth" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
          <TextField label="Phone" value={form.phone} onChange={set('phone')} placeholder="08035554471" />
          <TextField className="span-2" label="Address" value={form.address} onChange={set('address')} />
          <SelectField label="ID type" value={form.idType} onChange={set('idType')} options={idTypeOptions} placeholder="Not provided" />
          <TextField label="ID number" value={form.idNumber} onChange={set('idNumber')} />
        </div>
      </div>
      <div className="form-section">
        <h3>Officer notes</h3>
        <TextAreaField label="Notes" value={form.officerNotes} onChange={set('officerNotes')} />
      </div>
    </FormModal>
  );
}