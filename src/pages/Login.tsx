import { FormEvent, useState } from 'react';
import { Activity, Building2, ChevronRight, Eye, EyeOff, LoaderCircle, UsersRound } from 'lucide-react';

import { api } from '../api';
import { Brand } from '../components/brands';
import { getError } from '../utils/errors';
import type { AdminUser } from '../types';

export function Login({ onLogin }: { onLogin: (token: string, user: AdminUser) => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function submit(event: FormEvent) {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
        const result = await api.login(email.trim(), password);
        if (!result.user.roles.some((role) => ['PLATFORM_ADMIN', 'STATION_ADMIN', 'STATION_OFFICER'].includes(role))) {
            await api.logout().catch(() => undefined);
            setError('This portal is restricted to authorised administrators.');
            return;
        }
        onLogin(result.accessToken, result.user);
        } catch (requestError) {
        setError(getError(requestError));
        } finally {
        setLoading(false);
        }
    }

    return (
        <main className="login-shell">
            <section className="login-story">
                <div>
                <Brand />
                </div>
                <div className="login-story__copy">
                <div className="restricted-label">
                    <span /> Restricted administrative system
                </div>
                <h1>Control starts with verified access.</h1>
                <p>Field-Line gives authorised command personnel a secure operational view of stations, identities, and accountability.</p>
                <div className="system-scope">
                    <div>
                    <Building2 size={18} />
                    <span>
                        <strong>Station registry</strong>
                        <small>Onboard and activate commands</small>
                    </span>
                    <em>01</em>
                    </div>
                    <div>
                    <UsersRound size={18} />
                    <span>
                        <strong>Personnel authority</strong>
                        <small>Assign access by station and role</small>
                    </span>
                    <em>02</em>
                    </div>
                    <div>
                    <Activity size={18} />
                    <span>
                        <strong>Operational audit</strong>
                        <small>Maintain accountable activity records</small>
                    </span>
                    <em>03</em>
                    </div>
                </div>
                </div>
                <div className="login-story__footer">
                <span>
                    <i /> System status: protected
                </span>
                <small>© {new Date().getFullYear()} Cryptware Systems Limited</small>
                </div>
            </section>
            <section className="login-panel">
                <form className="auth-card" onSubmit={submit}>
                <div className="mobile-brand">
                    <Brand compact />
                </div>
                <span className="eyebrow">Platform administration</span>
                <h2>Welcome back</h2>
                <p className="muted">Sign in with your administrator credentials.</p>
                {error && <div className="alert alert--error">{error}</div>}
                <label>
                    Email address
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" autoComplete="email" required />
                </label>
                <label>
                    Password
                    <span className="password-field">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" minLength={12} required />
                    <button type="button" className="icon-button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                    </span>
                </label>
                <button className="button button--primary button--wide" disabled={loading}>
                    {loading ? (
                    <>
                        <LoaderCircle className="spin" size={18} /> Signing in…
                    </>
                    ) : (
                    <>
                        Sign in <ChevronRight size={18} />
                    </>
                    )}
                </button>
                <p className="support-copy">Need access? Contact your system administrator.</p>
                </form>
            </section>
        </main>
    );
}
