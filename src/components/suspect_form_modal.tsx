import { useState } from 'react';

import { api } from '../api';
import type { CreateSuspectInput, Suspect, SuspectInput } from '../types';
import { compact } from '../utils/errors';
import { genderOptions, idTypeOptions, suspectStatusOptions, toDateInput } from '../utils/incident_options';
import { SelectField, TextAreaField, TextField } from './form_fields';
import { FormModal } from './form_modal';
import { SuspectPhotoCapture } from '../components/suspect_photo_capture';

type Props = { token: string; suspect?: Suspect; onClose: () => void; onSaved: () => void };

export function SuspectFormModal({ token, suspect, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    fullName: suspect?.fullName ?? '',
    aliases: (suspect?.aliases ?? []).join(', '),
    dateOfBirth: toDateInput(suspect?.dateOfBirth),
    gender: suspect?.gender ?? '',
    phone: suspect?.phone ?? '',
    address: suspect?.address ?? '',
    idType: suspect?.idType ?? '',
    idNumber: suspect?.idNumber ?? '',
    identifyingMarks: suspect?.identifyingMarks ?? '',
    notes: suspect?.notes ?? '',
    status: suspect?.status ?? 'SUSPECT',
  });
  // Photos can only be attached when creating (PUT /suspects/{id} takes no photoSessionId).
  const [photoSessionId, setPhotoSessionId] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function save() {
    const { aliases: aliasText, ...rest } = form;
    const aliases = aliasText
      .split(',')
      .map((alias) => alias.trim())
      .filter(Boolean);
    const base = compact<SuspectInput>({ ...rest, fullName: rest.fullName.trim() });
    const input: SuspectInput = aliases.length ? { ...base, aliases } : base;

    if (suspect) await api.updateSuspect(token, suspect.id, input);
    else await api.createSuspect(token, photoSessionId ? ({ ...input, photoSessionId } satisfies CreateSuspectInput) : input);
    onSaved();
  }

  return (
    <FormModal eyebrow="Suspect register" title={suspect ? 'Edit suspect' : 'Add suspect'} submitLabel={suspect ? 'Save suspect' : 'Add suspect'} onClose={onClose} onSubmit={save}>
      <div className="form-section">
        <h3>Identity</h3>
        <div className="form-grid">
          <TextField className="span-2" label="Full name" value={form.fullName} onChange={set('fullName')} required />
          <TextField className="span-2" label="Aliases" value={form.aliases} onChange={set('aliases')} placeholder="Separate with commas" />
          <TextField type="date" label="Date of birth" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
          <SelectField label="Gender" value={form.gender} onChange={set('gender')} options={genderOptions} placeholder="Not recorded" />
          <SelectField label="ID type" value={form.idType} onChange={set('idType')} options={idTypeOptions} placeholder="Not provided" />
          <TextField label="ID number" value={form.idNumber} onChange={set('idNumber')} />
          <SelectField label="Status" value={form.status} onChange={set('status')} options={suspectStatusOptions} required />
        </div>
      </div>
      {!suspect && (
        <div className="form-section">
          <h3>Photo</h3>
          <SuspectPhotoCapture token={token} onChange={setPhotoSessionId} />
        </div>
      )}
      <div className="form-section">
        <h3>Contact</h3>
        <div className="form-grid">
          <TextField label="Phone" value={form.phone} onChange={set('phone')} />
          <TextField label="Address" value={form.address} onChange={set('address')} />
        </div>
      </div>
      <div className="form-section">
        <h3>Description</h3>
        <div className="form-grid">
          <TextAreaField className="span-2" label="Identifying marks" value={form.identifyingMarks} onChange={set('identifyingMarks')} rows={3} placeholder="Scars, tattoos, distinguishing features" />
          <TextAreaField className="span-2" label="Notes" value={form.notes} onChange={set('notes')} rows={3} />
        </div>
      </div>
    </FormModal>
  );
}