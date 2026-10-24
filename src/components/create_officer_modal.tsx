import { FormEvent, useState } from 'react';
import { LoaderCircle, Plus } from 'lucide-react';

import { api } from '../api';
import { ModalHeader } from '../components/modal_header';
import { compact, getError } from '../utils/errors';
import type { CreateOfficerInput, CreateOfficerResponse, CreateStationOfficerResponse } from '../types';
import { OfficerKind, OfficerKindToggle } from '../components/officer_toggle';

export type CreatedOfficer =
  | { kind: 'FIELD'; result: CreateOfficerResponse }
  | { kind: 'STATION'; result: CreateStationOfficerResponse; input: CreateOfficerInput };

const blankOfficer: CreateOfficerInput = {
  serviceNumber: '',
  firstName: '',
  middleName: '',
  lastName: '',
  rank: '',
  department: '',
  phone: '',
  email: '',
  authorisationRef: '',
};

const kindHints: Record<OfficerKind, string> = {
  FIELD: 'Uses the Field-Line mobile app. Access is bound to a registered device.',
  STATION: 'Handles web operations for this station through the Field-Line web portal.',
};

export function CreateOfficerModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: (created: CreatedOfficer) => void }) {
  const [kind, setKind] = useState<OfficerKind>('FIELD');
  const [form, setForm] = useState<CreateOfficerInput>(blankOfficer);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update<K extends keyof CreateOfficerInput>(key: K, value: CreateOfficerInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = compact(form);
      if (kind === 'FIELD') onCreated({ kind, result: await api.createOfficer(token, payload) });
      else onCreated({ kind, result: await api.createStationOfficer(token, payload), input: form });
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal">
        <ModalHeader eyebrow="Officer onboarding" title="Add officer" onClose={onClose} />
        <form onSubmit={submit}>
          {error && <div className="alert alert--error">{error}</div>}
          <div className="form-section">
            <h3>Officer type</h3>
            <OfficerKindToggle value={kind} onChange={setKind} disabled={loading} />
            <p className="muted small-copy">{kindHints[kind]}</p>
          </div>
          <div className="form-section">
            <h3>Officer identity</h3>
            <div className="form-grid">
              <label>
                First name
                <input value={form.firstName} onChange={(event) => update('firstName', event.target.value)} required />
              </label>
              <label>
                Last name
                <input value={form.lastName} onChange={(event) => update('lastName', event.target.value)} required />
              </label>
              <label>
                Service number
                <input value={form.serviceNumber} onChange={(event) => update('serviceNumber', event.target.value.toUpperCase())} placeholder="NPF-284517" required />
              </label>
              <label>
                Rank
                <input value={form.rank || ''} onChange={(event) => update('rank', event.target.value)} placeholder="Inspector" />
              </label>
              <label>
                Department / unit
                <input value={form.department || ''} onChange={(event) => update('department', event.target.value)} placeholder={kind === 'FIELD' ? 'Patrol' : 'Operations'} />
              </label>
              <label>
                Authorisation reference
                <input value={form.authorisationRef} onChange={(event) => update('authorisationRef', event.target.value)} placeholder="Official posting reference" required />
              </label>
            </div>
          </div>
          <div className="form-section">
            <h3>Verified contact details</h3>
            <div className="form-grid">
              <label>
                Official phone
                <input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+234…" pattern="\+?[0-9]{10,15}" required />
              </label>
              <label>
                Official email
                <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />
              </label>
            </div>
          </div>
          <footer>
            <button type="button" className="button button--ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="button button--primary" disabled={loading}>
              {loading ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />} {kind === 'FIELD' ? 'Create field officer' : 'Create station officer'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}