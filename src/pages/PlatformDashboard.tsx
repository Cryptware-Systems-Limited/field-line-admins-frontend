import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Building2, Check, LayoutDashboard, LoaderCircle, Menu, Plus, Search, ShieldCheck, UsersRound, X } from 'lucide-react';

import { api } from '../api';
import { Brand } from '../components/brands';
import { SidebarUser } from '../components/sidebar_user';
import { StatCard } from '../components/stat_cards';
import { getError } from '../utils/errors';
import type { AdminUser, Station } from '../types';
import { AppointAdminModal } from '../components/appoint_admin_modal';
import { CreateStationModal } from '../components/create_station_modal';
import { StationDrawer } from '../components/station_drawer';
import { StationsTable } from '../components/stations_table';

type Notice = { kind: 'success' | 'error'; message: string } | null;

export function PlatformDashboard({ token, user, onLogout }: { token: string; user: AdminUser; onLogout: () => void }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
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

  useEffect(() => {
    void loadStations();
  }, [loadStations]);

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
      setStations((items) => items.map((item) => (item.id === updated.id ? updated : item)));
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
        <button className="mobile-close" onClick={() => setMenuOpen(false)}>
          <X />
        </button>
        <nav>
          <span className="nav-label">Workspace</span>
          <a className="active">
            <LayoutDashboard size={19} /> Overview
          </a>
          <a>
            <Building2 size={19} /> Stations <span>{stations.length}</span>
          </a>
          <a className="disabled">
            <UsersRound size={19} /> Administrators <small>Soon</small>
          </a>
          <span className="nav-label">System</span>
          <a className="disabled">
            <Activity size={19} /> Audit activity <small>Soon</small>
          </a>
        </nav>
        <SidebarUser name={displayName} role="Platform Admin" onLogout={onLogout} />
      </aside>
      {menuOpen && <button className="overlay" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}

      <main className="dashboard">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)}>
            <Menu />
          </button>
          <div>
            <span className="eyebrow">Command overview</span>
            <h1>Good day, {displayName}</h1>
          </div>
          <button className="button button--primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} /> Add station
          </button>
        </header>

        {notice && (
          <div className={`toast toast--${notice.kind}`}>
            {notice.kind === 'success' ? <Check size={18} /> : <X size={18} />}
            {notice.message}
          </div>
        )}

        <section className="stats-grid">
          <StatCard icon={<Building2 />} tone="blue" label="Total stations" value={stations.length} caption="Registered on Field-Line" />
          <StatCard icon={<ShieldCheck />} tone="green" label="Active stations" value={active} caption="Approved and operational" />
          <StatCard icon={<Activity />} tone="amber" label="Awaiting action" value={pending} caption="Draft or pending approval" />
        </section>

        <section className="content-card">
          <div className="card-heading">
            <div>
              <h2>Police stations</h2>
              <p>Manage every station connected to the platform.</p>
            </div>
            <label className="search">
              <Search size={18} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stations" />
            </label>
          </div>
          {loading ? (
            <div className="empty-state">
              <LoaderCircle className="spin" />
              <h3>Loading stations</h3>
              <p>The free development server may take a moment to wake up.</p>
            </div>
          ) : visibleStations.length === 0 ? (
            <div className="empty-state">
              <Building2 />
              <h3>{search ? 'No stations found' : 'No stations yet'}</h3>
              <p>{search ? 'Try another name, code, or location.' : 'Create the first station to begin onboarding its administrators.'}</p>
              {!search && (
                <button className="button button--secondary" onClick={() => setShowCreate(true)}>
                  <Plus size={18} /> Add first station
                </button>
              )}
            </div>
          ) : (
            <StationsTable stations={visibleStations} onSelect={setSelected} />
          )}
        </section>
      </main>

      {showCreate && (
        <CreateStationModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={(station) => {
            setStations((items) => [station, ...items]);
            setShowCreate(false);
            setSelected(station);
            setNotice({ kind: 'success', message: `${station.name} was created as a draft.` });
          }}
        />
      )}
      {selected && <StationDrawer token={token} station={selected} onClose={() => setSelected(null)} onApprove={approve} onAppoint={() => setAdminStation(selected)} />}
      {adminStation && (
        <AppointAdminModal
          token={token}
          station={adminStation}
          onClose={() => setAdminStation(null)}
          onAppointed={() => setNotice({ kind: 'success', message: `A Station Admin was appointed to ${adminStation.name}.` })}
        />
      )}
    </div>
  );
}