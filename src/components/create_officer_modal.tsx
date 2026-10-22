import { FormEvent, useState } from 'react';
import { LoaderCircle, Plus } from 'lucide-react';

import { api } from '../api';
import { ModalHeader } from '../components/modal_header';
import { compact, getError } from '../utils/errors';
import type { CreateOfficerInput, CreateOfficerResponse } from '../types';

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

export function CreateOfficerModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: (result: CreateOfficerResponse) => void }) {
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
      onCreated(await api.createOfficer(token, compact(form)));
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal">
        <ModalHeader eyebrow="Officer onboarding" title="Add police officer" onClose={onClose} />
        <form onSubmit={submit}>
          {error && <div className="alert alert--error">{error}</div>}
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
                <input value={form.department || ''} onChange={(event) => update('department', event.target.value)} placeholder="Patrol" />
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
              {loading ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />} Create officer
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}