import { FormEvent, useState } from 'react';
import { Check, Clipboard, LoaderCircle, ShieldCheck } from 'lucide-react';

import { api } from '../api';
import { ModalHeader } from '../components/modal_header';
import { compact, getError } from '../utils/errors';
import type { AppointStationAdminInput, AppointmentResponse, Station } from '../types';

const blankAdmin: AppointStationAdminInput = {
    email: '',
    phone: '',
    personnelType: 'POLICE_OFFICER',
    personnelNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    position: '',
    department: '',
    authorisationRef: '',
};

type Props = { token: string; station: Station; onClose: () => void; onAppointed: () => void };

export function AppointAdminModal({ token, station, onClose, onAppointed }: Props) {
    const [form, setForm] = useState<AppointStationAdminInput>(blankAdmin);
    const [result, setResult] = useState<AppointmentResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    function update<K extends keyof AppointStationAdminInput>(key: K, value: AppointStationAdminInput[K]) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    async function submit(event: FormEvent) {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
        const appointment = await api.appointStationAdmin(token, station.id, compact(form));
        setResult(appointment);
        onAppointed();
        } catch (requestError) {
        setError(getError(requestError));
        } finally {
        setLoading(false);
        }
    }

    if (result) return <AdminCredentialView result={result} onClose={onClose} />;

    return (
        <div className="modal-backdrop">
        <section className="modal">
            <ModalHeader eyebrow={station.code} title="Appoint Station Admin" onClose={onClose} />
            <form onSubmit={submit}>
            {error && <div className="alert alert--error">{error}</div>}
            <div className="form-section">
                <h3>Personnel information</h3>
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
                    Personnel type
                    <select value={form.personnelType} onChange={(event) => update('personnelType', event.target.value as AppointStationAdminInput['personnelType'])}>
                    <option value="POLICE_OFFICER">Police Officer</option>
                    <option value="POLICE_STAFF">Police Staff</option>
                    </select>
                </label>
                <label>
                    Service / personnel number
                    <input value={form.personnelNumber} onChange={(event) => update('personnelNumber', event.target.value.toUpperCase())} placeholder="NPF-284517" required />
                </label>
                <label>
                    Rank or position
                    <input value={form.position || ''} onChange={(event) => update('position', event.target.value)} placeholder="Divisional Administrative Officer" />
                </label>
                <label>
                    Department
                    <input value={form.department || ''} onChange={(event) => update('department', event.target.value)} placeholder="Administration" />
                </label>
                </div>
            </div>
            <div className="form-section">
                <h3>Account and authorisation</h3>
                <div className="form-grid">
                <label>
                    Official email
                    <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />
                </label>
                <label>
                    Official phone
                    <input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+234…" pattern="\+?[0-9]{10,15}" required />
                </label>
                <label className="span-2">
                    Appointment authorisation reference
                    <input value={form.authorisationRef} onChange={(event) => update('authorisationRef', event.target.value)} placeholder="Official approval or appointment reference" required />
                </label>
                </div>
            </div>
            <footer>
                <button type="button" className="button button--ghost" onClick={onClose}>
                Cancel
                </button>
                <button className="button button--primary" disabled={loading}>
                {loading ? <LoaderCircle className="spin" size={18} /> : <ShieldCheck size={18} />} Create Station Admin
                </button>
            </footer>
            </form>
        </section>
        </div>
    );
}

function AdminCredentialView({ result, onClose }: { result: AppointmentResponse; onClose: () => void }) {
    return (
        <div className="modal-backdrop">
        <section className="modal credential-modal">
            <div className="credential-success">
            <span className="round-icon">
                <Check />
            </span>
            <span className="eyebrow">Appointment complete</span>
            <h2>Station Admin created</h2>
            <p>
                {result.admin.personnelProfile.firstName} {result.admin.personnelProfile.lastName} can now sign in to the Field-Line administration portal.
            </p>
            <div className="credential-box">
                <small>Email</small>
                <strong>{result.admin.email}</strong>
                <small>One-time temporary password</small>
                <code>{result.temporaryPassword}</code>
                <button className="button button--secondary" onClick={() => void navigator.clipboard.writeText(result.temporaryPassword)}>
                <Clipboard size={17} /> Copy password
                </button>
            </div>
            <div className="alert alert--warning">This password is shown only once. Share it through an approved secure channel. The administrator must change it at first login.</div>
            <button className="button button--primary button--wide" onClick={onClose}>
                Done
            </button>
            </div>
        </section>
        </div>
    );
}