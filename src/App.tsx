import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react';

import { api, ApiError } from './api';
import type { AdminUser, CreateStationInput, Station } from './types';

type Notice = { kind: 'success' | 'error'; message: string } | null;

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

function getError(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) return 'Unable to reach the server. It may be waking up—try again shortly.';
  return 'Something went wrong. Please try again.';
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`}>
      <span className="brand__mark"><ShieldCheck size={compact ? 22 : 27} /></span>
      <span><strong>Field-Line</strong><small>Command & Control</small></span>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (token: string, user: AdminUser) => void }) {
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
      if (!result.user.roles.includes('PLATFORM_ADMIN')) {
        await api.logout().catch(() => undefined);
        setError('This portal is restricted to Platform Administrators.');
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
        <div><Brand /></div>
        <div className="login-story__copy">
          <span className="eyebrow eyebrow--light">Secure administration portal</span>
          <h1>One view of every station in your command.</h1>
          <p>Onboard stations, manage access, and maintain a reliable audit trail across the Field-Line network.</p>
          <div className="security-note"><ShieldCheck size={18} /> Protected by role-based access controls</div>
        </div>
        <small>© {new Date().getFullYear()} Cryptware Systems Limited</small>
      </section>
      <section className="login-panel">
        <form className="auth-card" onSubmit={submit}>
          <div className="mobile-brand"><Brand compact /></div>
          <span className="eyebrow">Platform administration</span>
          <h2>Welcome back</h2>
          <p className="muted">Sign in with your administrator credentials.</p>
          {error && <div className="alert alert--error">{error}</div>}
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" autoComplete="email" required /></label>
          <label>Password
            <span className="password-field">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" minLength={12} required />
              <button type="button" className="icon-button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
            </span>
          </label>
          <button className="button button--primary button--wide" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={18} /> Signing in…</> : <>Sign in <ChevronRight size={18} /></>}</button>
          <p className="support-copy">Need access? Contact your system administrator.</p>
        </form>
      </section>
    </main>
  );
}

function ChangePassword({ token, user, onDone }: { token: string; user: AdminUser; onDone: (user: AdminUser) => void }) {
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
        <div className="round-icon"><ShieldCheck size={28} /></div>
        <span className="eyebrow">First-time security</span>
        <h1>Create a new password</h1>
        <p className="muted">Replace the temporary password before accessing the administration portal.</p>
        {error && <div className="alert alert--error">{error}</div>}
        <form onSubmit={submit}>
          <label>Temporary password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} minLength={12} required /></label>
          <label>New password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={12} required /></label>
          <label>Confirm new password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} required /></label>
          <button className="button button--primary button--wide" disabled={loading}>{loading ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />} Update password</button>
        </form>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: Station['status'] }) {
  return <span className={`status status--${status.toLowerCase()}`}><i />{status.replace('_', ' ')}</span>;
}

function Dashboard({ token, user, onLogout }: { token: string; user: AdminUser; onLogout: () => void }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | null>(null);
  const [selected, setSelected] = useState<Station | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadStations = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.listStations(token);
      setStations(result.items);
    } catch (error) {
      setNotice({ kind: 'error', message: getError(error) });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadStations(); }, [loadStations]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const visibleStations = useMemo(() => {
    const query = search.toLowerCase();
    return stations.filter((station) => [station.name, station.code, station.city, station.state].some((value) => value?.toLowerCase().includes(query)));
  }, [search, stations]);

  async function approve(station: Station) {
    try {
      const updated = await api.approveStation(token, station.id);
      setStations((items) => items.map((item) => item.id === updated.id ? updated : item));
      setSelected(updated);
      setNotice({ kind: 'success', message: `${updated.name} is now active.` });
    } catch (error) {
      setNotice({ kind: 'error', message: getError(error) });
    }
  }

  const active = stations.filter((station) => station.status === 'ACTIVE').length;
  const pending = stations.length - active;
  const displayName = user.personnelProfile?.firstName || user.email.split('@')[0];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
        <Brand compact />
        <button className="mobile-close" onClick={() => setMenuOpen(false)}><X /></button>
        <nav>
          <span className="nav-label">Workspace</span>
          <a className="active"><LayoutDashboard size={19} /> Overview</a>
          <a><Building2 size={19} /> Stations <span>{stations.length}</span></a>
          <a className="disabled"><UsersRound size={19} /> Administrators <small>Soon</small></a>
          <span className="nav-label">System</span>
          <a className="disabled"><Activity size={19} /> Audit activity <small>Soon</small></a>
        </nav>
        <button className="sidebar-user" onClick={onLogout}>
          <span className="avatar">{displayName.slice(0, 1).toUpperCase()}</span>
          <span><strong>{displayName}</strong><small>Platform Admin</small></span>
          <LogOut size={17} />
        </button>
      </aside>
      {menuOpen && <button className="overlay" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}
      <main className="dashboard">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)}><Menu /></button>
          <div><span className="eyebrow">Command overview</span><h1>Good day, {displayName}</h1></div>
          <button className="button button--primary" onClick={() => setModal('create')}><Plus size={18} /> Add station</button>
        </header>
        {notice && <div className={`toast toast--${notice.kind}`}>{notice.kind === 'success' ? <Check size={18} /> : <X size={18} />}{notice.message}</div>}
        <section className="stats-grid">
          <article><span className="metric-icon metric-icon--blue"><Building2 /></span><div><small>Total stations</small><strong>{stations.length}</strong><em>Registered on Field-Line</em></div></article>
          <article><span className="metric-icon metric-icon--green"><ShieldCheck /></span><div><small>Active stations</small><strong>{active}</strong><em>Approved and operational</em></div></article>
          <article><span className="metric-icon metric-icon--amber"><Activity /></span><div><small>Awaiting action</small><strong>{pending}</strong><em>Draft or pending approval</em></div></article>
        </section>
        <section className="content-card">
          <div className="card-heading"><div><h2>Police stations</h2><p>Manage every station connected to the platform.</p></div><label className="search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stations" /></label></div>
          {loading ? <div className="empty-state"><LoaderCircle className="spin" /><h3>Loading stations</h3><p>The free development server may take a moment to wake up.</p></div> : visibleStations.length === 0 ? <div className="empty-state"><Building2 /><h3>{search ? 'No stations found' : 'No stations yet'}</h3><p>{search ? 'Try another name, code, or location.' : 'Create the first station to begin onboarding its administrators.'}</p>{!search && <button className="button button--secondary" onClick={() => setModal('create')}><Plus size={18} /> Add first station</button>}</div> : <div className="table-wrap"><table><thead><tr><th>Station</th><th>Location</th><th>Command</th><th>Status</th><th /></tr></thead><tbody>{visibleStations.map((station) => <tr key={station.id} onClick={() => setSelected(station)}><td><span className="station-cell"><span className="station-symbol"><Building2 size={18} /></span><span><strong>{station.name}</strong><small>{station.code}</small></span></span></td><td>{station.city}, {station.state}</td><td>{station.command || 'Not specified'}</td><td><StatusBadge status={station.status} /></td><td><ChevronRight size={18} /></td></tr>)}</tbody></table></div>}
        </section>
      </main>
      {modal === 'create' && <CreateStationModal token={token} onClose={() => setModal(null)} onCreated={(station) => { setStations((items) => [station, ...items]); setModal(null); setSelected(station); setNotice({ kind: 'success', message: `${station.name} was created as a draft.` }); }} />}
      {selected && <StationDrawer station={selected} onClose={() => setSelected(null)} onApprove={approve} />}
    </div>
  );
}

function CreateStationModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: (station: Station) => void }) {
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
      const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== '' && value !== null)) as CreateStationInput;
      onCreated(await api.createStation(token, payload));
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoading(false);
    }
  }

  return <div className="modal-backdrop"><section className="modal"><header><button className="back-button" onClick={onClose}><ArrowLeft size={19} /></button><div><span className="eyebrow">Station onboarding</span><h2>Add a police station</h2></div><button className="icon-button" onClick={onClose}><X /></button></header><form onSubmit={submit}>{error && <div className="alert alert--error">{error}</div>}<div className="form-section"><h3>Station identity</h3><div className="form-grid"><label>Station code<input value={form.code} onChange={(event) => update('code', event.target.value.toUpperCase())} placeholder="e.g. LA-IKJ-001" pattern="[A-Z0-9-]{3,30}" required /></label><label>Station name<input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Ikeja Police Station" required /></label><label>Station type<input value={form.type || ''} onChange={(event) => update('type', event.target.value)} placeholder="Divisional Headquarters" /></label><label>Police command<input value={form.command || ''} onChange={(event) => update('command', event.target.value)} placeholder="Lagos State Police Command" /></label></div></div><div className="form-section"><h3>Location</h3><div className="form-grid"><label className="span-2">Address line 1<input value={form.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} placeholder="Street and building" required /></label><label>City<input value={form.city} onChange={(event) => update('city', event.target.value)} placeholder="Ikeja" required /></label><label>State<input value={form.state} onChange={(event) => update('state', event.target.value)} required /></label></div></div><div className="form-section"><h3>Contact information</h3><div className="form-grid"><label>Official phone<input value={form.phone || ''} onChange={(event) => update('phone', event.target.value)} placeholder="+234…" /></label><label>Official email<input type="email" value={form.email || ''} onChange={(event) => update('email', event.target.value)} placeholder="station@example.com" /></label></div></div><footer><button type="button" className="button button--ghost" onClick={onClose}>Cancel</button><button className="button button--primary" disabled={loading}>{loading ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />} Create draft station</button></footer></form></section></div>;
}

function StationDrawer({ station, onClose, onApprove }: { station: Station; onClose: () => void; onApprove: (station: Station) => Promise<void> }) {
  const [approving, setApproving] = useState(false);
  async function approve() { setApproving(true); await onApprove(station); setApproving(false); }
  return <><button className="drawer-backdrop" onClick={onClose} aria-label="Close details" /><aside className="drawer"><header><div className="station-symbol station-symbol--large"><Building2 /></div><button className="icon-button" onClick={onClose}><X /></button></header><span className="eyebrow">{station.code}</span><h2>{station.name}</h2><StatusBadge status={station.status} /><div className="detail-section"><h3>Station details</h3><dl><div><dt>Type</dt><dd>{station.type || 'Not specified'}</dd></div><div><dt>Command</dt><dd>{station.command || 'Not specified'}</dd></div><div><dt>Location</dt><dd><MapPin size={15} /> {station.addressLine1}, {station.city}, {station.state}</dd></div><div><dt>Phone</dt><dd>{station.phone || 'Not specified'}</dd></div><div><dt>Email</dt><dd>{station.email || 'Not specified'}</dd></div></dl></div><div className="detail-section"><h3>Record</h3><dl><div><dt>Created</dt><dd>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(station.createdAt))}</dd></div><div><dt>Station ID</dt><dd className="mono">{station.id}</dd></div></dl></div>{station.status === 'DRAFT' || station.status === 'PENDING_APPROVAL' ? <div className="drawer-actions"><p>Confirm that these details are correct before activating this station.</p><button className="button button--primary button--wide" onClick={approve} disabled={approving}>{approving ? <LoaderCircle className="spin" size={18} /> : <ShieldCheck size={18} />} Approve and activate</button></div> : <div className="active-callout"><Check size={18} /><div><strong>Station is operational</strong><p>This station can now receive an assigned administrator.</p></div></div>}</aside></>;
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);

  function loggedIn(accessToken: string, admin: AdminUser) { setToken(accessToken); setUser(admin); }
  async function logout() { await api.logout().catch(() => undefined); setToken(null); setUser(null); }

  if (!token || !user) return <Login onLogin={loggedIn} />;
  if (user.mustChangePassword) return <ChangePassword token={token} user={user} onDone={setUser} />;
  return <Dashboard token={token} user={user} onLogout={() => void logout()} />;
}
