import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  Clipboard,
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
import type {
  AdminUser,
  AppointStationAdminInput,
  AppointmentResponse,
  CreateOfficerInput,
  CreateOfficerResponse,
  CreateStationInput,
  Officer,
  Station,
  StationAdmin,
} from './types';

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
      if (
        !result.user.roles.includes('PLATFORM_ADMIN') &&
        !result.user.roles.includes('STATION_ADMIN')
      ) {
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
        <div><Brand /></div>
        <div className="login-story__copy">
          <div className="restricted-label"><span /> Restricted administrative system</div>
          <h1>Control starts with verified access.</h1>
          <p>Field-Line gives authorised command personnel a secure operational view of stations, identities, and accountability.</p>
          <div className="system-scope">
            <div><Building2 size={18} /><span><strong>Station registry</strong><small>Onboard and activate commands</small></span><em>01</em></div>
            <div><UsersRound size={18} /><span><strong>Personnel authority</strong><small>Assign access by station and role</small></span><em>02</em></div>
            <div><Activity size={18} /><span><strong>Operational audit</strong><small>Maintain accountable activity records</small></span><em>03</em></div>
          </div>
        </div>
        <div className="login-story__footer"><span><i /> System status: protected</span><small>© {new Date().getFullYear()} Cryptware Systems Limited</small></div>
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

function PlatformDashboard({ token, user, onLogout }: { token: string; user: AdminUser; onLogout: () => void }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | null>(null);
  const [selected, setSelected] = useState<Station | null>(null);
  const [adminStation, setAdminStation] = useState<Station | null>(null);
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
      {selected && <StationDrawer token={token} station={selected} onClose={() => setSelected(null)} onApprove={approve} onAppoint={() => setAdminStation(selected)} />}
      {adminStation && <AppointAdminModal token={token} station={adminStation} onClose={() => setAdminStation(null)} onAppointed={() => setNotice({ kind: 'success', message: `A Station Admin was appointed to ${adminStation.name}.` })} />}
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

function StationDrawer({ token, station, onClose, onApprove, onAppoint }: { token: string; station: Station; onClose: () => void; onApprove: (station: Station) => Promise<void>; onAppoint: () => void }) {
  const [approving, setApproving] = useState(false);
  const [admins, setAdmins] = useState<StationAdmin[]>([]);
  useEffect(() => {
    if (station.status === 'ACTIVE') void api.listStationAdmins(token, station.id).then(setAdmins).catch(() => undefined);
  }, [station.id, station.status, token]);
  async function approve() { setApproving(true); await onApprove(station); setApproving(false); }
  return <><button className="drawer-backdrop" onClick={onClose} aria-label="Close details" /><aside className="drawer"><header><div className="station-symbol station-symbol--large"><Building2 /></div><button className="icon-button" onClick={onClose}><X /></button></header><span className="eyebrow">{station.code}</span><h2>{station.name}</h2><StatusBadge status={station.status} /><div className="detail-section"><h3>Station details</h3><dl><div><dt>Type</dt><dd>{station.type || 'Not specified'}</dd></div><div><dt>Command</dt><dd>{station.command || 'Not specified'}</dd></div><div><dt>Location</dt><dd><MapPin size={15} /> {station.addressLine1}, {station.city}, {station.state}</dd></div><div><dt>Phone</dt><dd>{station.phone || 'Not specified'}</dd></div><div><dt>Email</dt><dd>{station.email || 'Not specified'}</dd></div></dl></div><div className="detail-section"><h3>Station administrators</h3>{admins.length ? <div className="admin-list">{admins.map((admin) => <div key={admin.id}><span className="avatar">{admin.personnelProfile.firstName[0]}</span><span><strong>{admin.personnelProfile.firstName} {admin.personnelProfile.lastName}</strong><small>{admin.email}</small></span></div>)}</div> : <p className="muted small-copy">No Station Admin has been appointed.</p>}{station.status === 'ACTIVE' && <button className="button button--secondary button--wide" onClick={onAppoint}><Plus size={17} /> Appoint Station Admin</button>}</div><div className="detail-section"><h3>Record</h3><dl><div><dt>Created</dt><dd>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(station.createdAt))}</dd></div><div><dt>Station ID</dt><dd className="mono">{station.id}</dd></div></dl></div>{station.status === 'DRAFT' || station.status === 'PENDING_APPROVAL' ? <div className="drawer-actions"><p>Confirm that these details are correct before activating this station.</p><button className="button button--primary button--wide" onClick={approve} disabled={approving}>{approving ? <LoaderCircle className="spin" size={18} /> : <ShieldCheck size={18} />} Approve and activate</button></div> : <div className="active-callout"><Check size={18} /><div><strong>Station is operational</strong><p>Station Administrators can now be appointed.</p></div></div>}</aside></>;
}

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

function AppointAdminModal({ token, station, onClose, onAppointed }: { token: string; station: Station; onClose: () => void; onAppointed: () => void }) {
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
      const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== '')) as unknown as AppointStationAdminInput;
      const appointment = await api.appointStationAdmin(token, station.id, payload);
      setResult(appointment);
      onAppointed();
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return <div className="modal-backdrop"><section className="modal credential-modal"><div className="credential-success"><span className="round-icon"><Check /></span><span className="eyebrow">Appointment complete</span><h2>Station Admin created</h2><p>{result.admin.personnelProfile.firstName} {result.admin.personnelProfile.lastName} can now sign in to the Field-Line administration portal.</p><div className="credential-box"><small>Email</small><strong>{result.admin.email}</strong><small>One-time temporary password</small><code>{result.temporaryPassword}</code><button className="button button--secondary" onClick={() => void navigator.clipboard.writeText(result.temporaryPassword)}><Clipboard size={17} /> Copy password</button></div><div className="alert alert--warning">This password is shown only once. Share it through an approved secure channel. The administrator must change it at first login.</div><button className="button button--primary button--wide" onClick={onClose}>Done</button></div></section></div>;
  }

  return <div className="modal-backdrop"><section className="modal"><header><button className="back-button" onClick={onClose}><ArrowLeft size={19} /></button><div><span className="eyebrow">{station.code}</span><h2>Appoint Station Admin</h2></div><button className="icon-button" onClick={onClose}><X /></button></header><form onSubmit={submit}>{error && <div className="alert alert--error">{error}</div>}<div className="form-section"><h3>Personnel information</h3><div className="form-grid"><label>First name<input value={form.firstName} onChange={(event) => update('firstName', event.target.value)} required /></label><label>Last name<input value={form.lastName} onChange={(event) => update('lastName', event.target.value)} required /></label><label>Personnel type<select value={form.personnelType} onChange={(event) => update('personnelType', event.target.value as AppointStationAdminInput['personnelType'])}><option value="POLICE_OFFICER">Police Officer</option><option value="POLICE_STAFF">Police Staff</option></select></label><label>Service / personnel number<input value={form.personnelNumber} onChange={(event) => update('personnelNumber', event.target.value.toUpperCase())} placeholder="NPF-284517" required /></label><label>Rank or position<input value={form.position || ''} onChange={(event) => update('position', event.target.value)} placeholder="Divisional Administrative Officer" /></label><label>Department<input value={form.department || ''} onChange={(event) => update('department', event.target.value)} placeholder="Administration" /></label></div></div><div className="form-section"><h3>Account and authorisation</h3><div className="form-grid"><label>Official email<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required /></label><label>Official phone<input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+234…" pattern="\+?[0-9]{10,15}" required /></label><label className="span-2">Appointment authorisation reference<input value={form.authorisationRef} onChange={(event) => update('authorisationRef', event.target.value)} placeholder="Official approval or appointment reference" required /></label></div></div><footer><button type="button" className="button button--ghost" onClick={onClose}>Cancel</button><button className="button button--primary" disabled={loading}>{loading ? <LoaderCircle className="spin" size={18} /> : <ShieldCheck size={18} />} Create Station Admin</button></footer></form></section></div>;
}

const blankOfficer: CreateOfficerInput = { serviceNumber: '', firstName: '', middleName: '', lastName: '', rank: '', department: '', phone: '', email: '', authorisationRef: '' };

function CreateOfficerModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: (result: CreateOfficerResponse) => void }) {
  const [form, setForm] = useState<CreateOfficerInput>(blankOfficer);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  function update<K extends keyof CreateOfficerInput>(key: K, value: CreateOfficerInput[K]) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    try { onCreated(await api.createOfficer(token, Object.fromEntries(Object.entries(form).filter(([, value]) => value !== '')) as unknown as CreateOfficerInput)); }
    catch (requestError) { setError(getError(requestError)); }
    finally { setLoading(false); }
  }
  return <div className="modal-backdrop"><section className="modal"><header><button className="back-button" onClick={onClose}><ArrowLeft size={19} /></button><div><span className="eyebrow">Officer onboarding</span><h2>Add police officer</h2></div><button className="icon-button" onClick={onClose}><X /></button></header><form onSubmit={submit}>{error && <div className="alert alert--error">{error}</div>}<div className="form-section"><h3>Officer identity</h3><div className="form-grid"><label>First name<input value={form.firstName} onChange={(event) => update('firstName', event.target.value)} required /></label><label>Last name<input value={form.lastName} onChange={(event) => update('lastName', event.target.value)} required /></label><label>Service number<input value={form.serviceNumber} onChange={(event) => update('serviceNumber', event.target.value.toUpperCase())} placeholder="NPF-284517" required /></label><label>Rank<input value={form.rank || ''} onChange={(event) => update('rank', event.target.value)} placeholder="Inspector" /></label><label>Department / unit<input value={form.department || ''} onChange={(event) => update('department', event.target.value)} placeholder="Patrol" /></label><label>Authorisation reference<input value={form.authorisationRef} onChange={(event) => update('authorisationRef', event.target.value)} placeholder="Official posting reference" required /></label></div></div><div className="form-section"><h3>Verified contact details</h3><div className="form-grid"><label>Official phone<input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+234…" pattern="\+?[0-9]{10,15}" required /></label><label>Official email<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required /></label></div></div><footer><button type="button" className="button button--ghost" onClick={onClose}>Cancel</button><button className="button button--primary" disabled={loading}>{loading ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />} Create officer</button></footer></form></section></div>;
}

function OfficerCredentialModal({ result, onClose }: { result: CreateOfficerResponse; onClose: () => void }) {
  const officer = result.officer;
  return <div className="modal-backdrop"><section className="modal credential-modal"><div className="credential-success"><span className="round-icon"><Check /></span><span className="eyebrow">Officer created</span><h2>Mobile onboarding credentials</h2><p>Give these details to {officer.personnelProfile.firstName} through an approved secure channel.</p><div className="credential-box"><small>Service number</small><strong>{officer.personnelProfile.personnelNumber}</strong><small>Station-issued password</small><code>{result.temporaryPassword}</code><button className="button button--secondary" onClick={() => void navigator.clipboard.writeText(result.temporaryPassword)}><Clipboard size={17} /> Copy password</button></div><div className="alert alert--warning">The password is shown only once. The officer will use it with their base station and device ID, then verify their phone and create a six-digit app PIN.</div><button className="button button--primary button--wide" onClick={onClose}>Done</button></div></section></div>;
}

function StationAdminDashboard({ token, user, onLogout }: { token: string; user: AdminUser; onLogout: () => void }) {
  const [station, setStation] = useState<Station | null>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [credential, setCredential] = useState<CreateOfficerResponse | null>(null);
  const displayName = user.personnelProfile?.firstName || user.email.split('@')[0];

  useEffect(() => {
    void Promise.all([api.getAssignedStation(token), api.listOfficers(token)])
      .then(([result, officerList]) => { setStation(result.station); setOfficers(officerList); })
      .catch((requestError) => setError(getError(requestError)))
      .finally(() => setLoading(false));
  }, [token]);

  const onboarded = officers.filter((officer) => officer.devices.length > 0).length;
  return <div className="app-shell"><aside className="sidebar sidebar--fixed"><Brand compact /><nav><span className="nav-label">My station</span><a className="active"><LayoutDashboard size={19} /> Overview</a><a><UsersRound size={19} /> Officers <span>{officers.length}</span></a><span className="nav-label">System</span><a className="disabled"><Activity size={19} /> Station activity <small>Soon</small></a></nav><button className="sidebar-user" onClick={onLogout}><span className="avatar">{displayName[0].toUpperCase()}</span><span><strong>{displayName}</strong><small>Station Admin</small></span><LogOut size={17} /></button></aside><main className="dashboard"><header className="topbar"><div><span className="eyebrow">Station administration</span><h1>Welcome, {displayName}</h1></div><button className="button button--primary" onClick={() => setShowCreate(true)}><Plus size={18} /> Add officer</button></header>{loading ? <section className="content-card"><div className="empty-state"><LoaderCircle className="spin" /><h3>Loading your station</h3></div></section> : error ? <div className="alert alert--error">{error}</div> : station && <><section className="station-hero"><div className="station-symbol station-symbol--large"><Building2 /></div><div><span className="eyebrow">{station.code}</span><h2>{station.name}</h2><p><MapPin size={15} /> {station.addressLine1}, {station.city}, {station.state}</p></div><StatusBadge status={station.status} /></section><section className="stats-grid"><article><span className="metric-icon metric-icon--blue"><UsersRound /></span><div><small>Assigned officers</small><strong>{officers.length}</strong><em>Registered at your station</em></div></article><article><span className="metric-icon metric-icon--green"><ShieldCheck /></span><div><small>Mobile onboarded</small><strong>{onboarded}</strong><em>Verified and device-bound</em></div></article><article><span className="metric-icon metric-icon--amber"><Activity /></span><div><small>Awaiting onboarding</small><strong>{officers.length - onboarded}</strong><em>Issued station credentials</em></div></article></section><section className="content-card"><div className="card-heading"><div><h2>Station officers</h2><p>Onboard and monitor officers assigned to {station.name}.</p></div><button className="button button--secondary" onClick={() => setShowCreate(true)}><Plus size={17} /> Add officer</button></div>{officers.length === 0 ? <div className="empty-state"><UsersRound /><h3>No officers yet</h3><p>Add the first officer so the mobile team can test onboarding.</p><button className="button button--secondary" onClick={() => setShowCreate(true)}><Plus size={17} /> Add first officer</button></div> : <div className="table-wrap"><table><thead><tr><th>Officer</th><th>Service number</th><th>Rank / unit</th><th>Mobile status</th></tr></thead><tbody>{officers.map((officer) => <tr key={officer.id}><td><span className="station-cell"><span className="avatar">{officer.personnelProfile.firstName[0]}</span><span><strong>{officer.personnelProfile.firstName} {officer.personnelProfile.lastName}</strong><small>{officer.email}</small></span></span></td><td>{officer.personnelProfile.personnelNumber}</td><td>{officer.personnelProfile.rankOrPosition || officer.personnelProfile.department || 'Not specified'}</td><td><span className={`status ${officer.devices.length ? 'status--active' : 'status--draft'}`}><i />{officer.devices.length ? 'ONBOARDED' : 'PENDING'}</span></td></tr>)}</tbody></table></div>}</section></>}</main>{showCreate && <CreateOfficerModal token={token} onClose={() => setShowCreate(false)} onCreated={(result) => { setOfficers((items) => [result.officer, ...items]); setShowCreate(false); setCredential(result); }} />}{credential && <OfficerCredentialModal result={credential} onClose={() => setCredential(null)} />}</div>;
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);

  function loggedIn(accessToken: string, admin: AdminUser) { setToken(accessToken); setUser(admin); }
  async function logout() { await api.logout().catch(() => undefined); setToken(null); setUser(null); }

  if (!token || !user) return <Login onLogin={loggedIn} />;
  if (user.mustChangePassword) return <ChangePassword token={token} user={user} onDone={setUser} />;
  if (user.roles.includes('PLATFORM_ADMIN')) {
    return <PlatformDashboard token={token} user={user} onLogout={() => void logout()} />;
  }
  return <StationAdminDashboard token={token} user={user} onLogout={() => void logout()} />;
}
