import { FormEvent, useState } from 'react';
import { Check, LoaderCircle, ShieldCheck } from 'lucide-react';

import { api } from '../api';
import { Brand } from '../components/brands';
import { getError } from '../utils/errors';
import type { AdminUser } from '../types';

export function ChangePassword({ token, user, onDone }: { token: string; user: AdminUser; onDone: (user: AdminUser) => void }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (newPassword !== confirmPassword) return setError('The new passwords do not match.');
        setLoading(true);
        setError('');
        try {
        await api.changePassword(token, currentPassword, newPassword);
        onDone({ ...user, mustChangePassword: false });
        } catch (requestError) {
        setError(getError(requestError));
        } finally {
        setLoading(false);
        }
    }

    return (
        <main className="centered-page">
            <div className="password-card">
                <Brand compact />
                <div className="round-icon">
                <ShieldCheck size={28} />
                </div>
                <span className="eyebrow">First-time security</span>
                <h1>Create a new password</h1>
                <p className="muted">Replace the temporary password before accessing the administration portal.</p>
                {error && <div className="alert alert--error">{error}</div>}
                <form onSubmit={submit}>
                <label>
                    Temporary password
                    <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} minLength={12} required />
                </label>
                <label>
                    New password
                    <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={12} required />
                </label>
                <label>
                    Confirm new password
                    <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} required />
                </label>
                <button className="button button--primary button--wide" disabled={loading}>
                    {loading ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />} Update password
                </button>
                </form>
            </div>
        </main>
    );
}