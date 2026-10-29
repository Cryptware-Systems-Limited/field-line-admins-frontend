import { useEffect, useState } from 'react';
import { Activity, Building2, LayoutDashboard, LoaderCircle, MapPin, Monitor, Plus, ShieldCheck, UsersRound } from 'lucide-react';

import { api } from '../api';
import { Brand } from '../components/brands';
import { SidebarUser } from '../components/sidebar_user';
import { StatCard } from '../components/stat_cards';
import { StatusBadge } from '../components/status_badge';
import { getError } from '../utils/errors';
import type { AdminUser, Officer, Station, StationOfficer } from '../types';
import { CreatedOfficer, CreateOfficerModal } from '../components/create_officer_modal';
import { OfficerCredentialModal } from '../components/officer_credential_modal';
import { OfficerDetailsDrawer } from '../components/officer_details_drawer';
import { OfficerKind, OfficerKindToggle } from '../components/officer_toggle'
import { OfficersTable } from '../components/officer_table';
import { RemoveOfficerModal } from '../components/remove_officer_modal';
import { StationOfficersTable } from '../components/station_officer_table'
type PendingRemoval = { kind: 'FIELD'; officer: Officer } | { kind: 'STATION'; officer: StationOfficer };

export function StationAdminDashboard({ token, user, onLogout }: { token: string; user: AdminUser; onLogout: () => void }) {
  const [station, setStation] = useState<Station | null>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [stationOfficers, setStationOfficers] = useState<StationOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [listKind, setListKind] = useState<OfficerKind>('FIELD');
  const [showCreate, setShowCreate] = useState(false);
  const [credential, setCredential] = useState<CreatedOfficer | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);
  const displayName = user.personnelProfile?.firstName || user.email.split('@')[0];

  useEffect(() => {
    void Promise.all([api.getAssignedStation(token), api.listOfficers(token), api.listStationOfficers(token)])
      .then(([result, officerList, stationOfficerList]) => {
        setStation(result.station);
        setOfficers(officerList);
        setStationOfficers(stationOfficerList);
      })
      .catch((requestError) => setError(getError(requestError)))
      .finally(() => setLoading(false));
  }, [token]);

  function handleCreated(created: CreatedOfficer) {
    if (created.kind === 'FIELD') setOfficers((items) => [created.result.officer, ...items]);
    else
      void api
        .listStationOfficers(token)
        .then(setStationOfficers)
        .catch(() => undefined);
    setListKind(created.kind);
    setShowCreate(false);
    setCredential(created);
  }

  function handleRemoved(officerId: string) {
    if (pendingRemoval?.kind === 'FIELD') setOfficers((items) => items.filter((officer) => officer.id !== officerId));
    else setStationOfficers((items) => items.filter((officer) => officer.id !== officerId));
    setSelectedOfficerId(null);
    setPendingRemoval(null);
  }

  const onboarded = officers.filter((officer) => officer.devices.length > 0).length;
  const counts = { FIELD: officers.length, STATION: stationOfficers.length };
  const currentCount = counts[listKind];

  return (
    <div className="app-shell">
      <aside className="sidebar sidebar--fixed">
        <Brand compact />
        <nav>
          <span className="nav-label">My station</span>
          <a className="active">
            <LayoutDashboard size={19} /> Overview
          </a>
          <a>
            <UsersRound size={19} /> Officers <span>{officers.length + stationOfficers.length}</span>
          </a>
          <span className="nav-label">System</span>
          <a className="disabled">
            <Activity size={19} /> Station activity <small>Soon</small>
          </a>
        </nav>
        <SidebarUser name={displayName} role="Station Admin" onLogout={onLogout} />
      </aside>

      <main className="dashboard">
        <header className="topbar">
          <div>
            <span className="eyebrow">Station administration</span>
            <h1>Welcome, {displayName}</h1>
          </div>
          <button className="button button--primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} /> Add officer
          </button>
        </header>

        {loading ? (
          <section className="content-card">
            <div className="empty-state">
              <LoaderCircle className="spin" />
              <h3>Loading your station</h3>
            </div>
          </section>
        ) : error ? (
          <div className="alert alert--error">{error}</div>
        ) : (
          station && (
            <>
              <section className="station-hero">
                <div className="station-symbol station-symbol--large">
                  <Building2 />
                </div>
                <div>
                  <span className="eyebrow">{station.code}</span>
                  <h2>{station.name}</h2>
                  <p>
                    <MapPin size={15} /> {station.addressLine1}, {station.city}, {station.state}
                  </p>
                </div>
                <StatusBadge status={station.status} />
              </section>

              <section className="stats-grid">
                <StatCard icon={<UsersRound />} tone="blue" label="Field officers" value={officers.length} caption="Registered at your station" />
                <StatCard icon={<ShieldCheck />} tone="green" label="Mobile onboarded" value={onboarded} caption="Verified and device-bound" />
                <StatCard icon={<Activity />} tone="amber" label="Awaiting onboarding" value={officers.length - onboarded} caption="Issued station credentials" />
              </section>

              <section className="content-card">
                <div className="card-heading">
                  <div>
                    <h2>Station officers</h2>
                    <p>{listKind === 'FIELD' ? `Onboard and monitor field officers assigned to ${station.name}.` : `Web operations officers with portal access at ${station.name}.`}</p>
                  </div>
                  <button className="button button--secondary" onClick={() => setShowCreate(true)}>
                    <Plus size={17} /> Add officer
                  </button>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <OfficerKindToggle value={listKind} onChange={setListKind} counts={counts} />
                </div>
                {currentCount === 0 ? (
                  <div className="empty-state">
                    {listKind === 'FIELD' ? <UsersRound /> : <Monitor />}
                    <h3>{listKind === 'FIELD' ? 'No field officers yet' : 'No station officers yet'}</h3>
                    <p>{listKind === 'FIELD' ? 'Add the first officer so the mobile team can test onboarding.' : 'Add a station officer to handle web operations for this station.'}</p>
                    <button className="button button--secondary" onClick={() => setShowCreate(true)}>
                      <Plus size={17} /> Add officer
                    </button>
                  </div>
                ) : listKind === 'FIELD' ? (
                  <OfficersTable officers={officers} onSelect={setSelectedOfficerId} onRemove={(officer) => setPendingRemoval({ kind: 'FIELD', officer })} />
                ) : (
                  <StationOfficersTable officers={stationOfficers} onRemove={(officer) => setPendingRemoval({ kind: 'STATION', officer })} />
                )}
              </section>
            </>
          )
        )}
      </main>

      {showCreate && <CreateOfficerModal token={token} onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {credential && <OfficerCredentialModal created={credential} onClose={() => setCredential(null)} />}
      {selectedOfficerId && (
        <OfficerDetailsDrawer
          token={token}
          officerId={selectedOfficerId}
          onClose={() => setSelectedOfficerId(null)}
          onRemove={(officer) => {
            setSelectedOfficerId(null);
            setPendingRemoval({ kind: 'FIELD', officer });
          }}
        />
      )}
      {pendingRemoval && <RemoveOfficerModal token={token} kind={pendingRemoval.kind} officer={pendingRemoval.officer} onClose={() => setPendingRemoval(null)} onRemoved={handleRemoved} />}
    </div>
  );
}