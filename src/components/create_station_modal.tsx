import { FormEvent, useState } from 'react';
import { LoaderCircle, Plus } from 'lucide-react';

import { api } from '../api';
import { ModalHeader } from '../components/modal_header';
import { compact, getError } from '../utils/errors';
import type { CreateStationInput, Station } from '../types';

const blankStation: CreateStationInput = {
  code: '',
  name: '',
  type: '',
  command: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: 'Lagos',
  phone: '',
  email: '',
  latitude: null,
  longitude: null,
};

export function CreateStationModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: (station: Station) => void }) {
  const [form, setForm] = useState<CreateStationInput>(blankStation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update<K extends keyof CreateStationInput>(key: K, value: CreateStationInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      onCreated(await api.createStation(token, compact(form, true)));
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal">
        <ModalHeader eyebrow="Station onboarding" title="Add a police station" onClose={onClose} />
        <form onSubmit={submit}>
          {error && <div className="alert alert--error">{error}</div>}
          <div className="form-section">
            <h3>Station identity</h3>
            <div className="form-grid">
              <label>
                Station code
                <input value={form.code} onChange={(event) => update('code', event.target.value.toUpperCase())} placeholder="e.g. LA-IKJ-001" pattern="[A-Z0-9-]{3,30}" required />
              </label>
              <label>
                Station name
                <input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Ikeja Police Station" required />
              </label>
              <label>
                Station type
                <input value={form.type || ''} onChange={(event) => update('type', event.target.value)} placeholder="Divisional Headquarters" />
              </label>
              <label>
                Police command
                <input value={form.command || ''} onChange={(event) => update('command', event.target.value)} placeholder="Lagos State Police Command" />
              </label>
            </div>
          </div>
          <div className="form-section">
            <h3>Location</h3>
            <div className="form-grid">
              <label className="span-2">
                Address line 1
                <input value={form.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} placeholder="Street and building" required />
              </label>
              <label>
                City
                <input value={form.city} onChange={(event) => update('city', event.target.value)} placeholder="Ikeja" required />
              </label>
              <label>
                State
                <input value={form.state} onChange={(event) => update('state', event.target.value)} required />
              </label>
            </div>
          </div>
          <div className="form-section">
            <h3>Contact information</h3>
            <div className="form-grid">
              <label>
                Official phone
                <input value={form.phone || ''} onChange={(event) => update('phone', event.target.value)} placeholder="+234…" />
              </label>
              <label>
                Official email
                <input type="email" value={form.email || ''} onChange={(event) => update('email', event.target.value)} placeholder="station@example.com" />
              </label>
            </div>
          </div>
          <footer>
            <button type="button" className="button button--ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="button button--primary" disabled={loading}>
              {loading ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />} Create draft station
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}