import { ReactNode, useEffect, useState } from 'react';
import { Activity, ArrowRight, Building2, Clipboard, LayoutDashboard, LoaderCircle, UsersRound, UserX } from 'lucide-react';

import { api } from '../api';
import { Brand } from '../components/brands';
import { IncidentDetail } from '../components/incident_detail';
import { IncidentsPage } from '../components/incidents_page';
import { SidebarUser } from '../components/sidebar_user';
import { StatCard } from '../components/stat_cards';
import { SuspectsPage } from '../pages/SuspectPage';
import type { AdminUser, StationOperationsDashboardResponse } from '../types';
import { getError } from '../utils/errors';

type View = 'overview' | 'incidents' | 'suspects';

const titles: Record<View, string> = {
  overview: '',
  incidents: 'Incidents',
  suspects: 'Suspects',
};

function NavLink({ active, onSelect, children }: { active: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <a
      className={active ? 'active' : ''}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      {children}
    </a>
  );
}

export function StationOperationsDashboard({ token, user, onLogout }: { token: string; user: AdminUser; onLogout: () => void }) {
  const [view, setView] = useState<View>('overview');
  const [openIncidentId, setOpenIncidentId] = useState<string | null>(null);
  const [overview, setOverview] = useState<StationOperationsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const displayName = user.personnelProfile?.firstName || user.email.split('@')[0];

  // Refresh the overview counts whenever the user comes back to it.
  useEffect(() => {
    if (view !== 'overview') return;
    let active = true;
    void api
      .getStationOperationsDashboard(token)
      .then((result) => {
        if (!active) return;
        setOverview(result);
        setError('');
      })
      .catch((requestError) => active && setError(getError(requestError)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token, view]);

  function go(next: View) {
    setView(next);
    setOpenIncidentId(null);
  }

  const activeIncidents = overview ? overview.incidents.open + overview.incidents.underReview + overview.incidents.assigned + overview.incidents.inProgress : 0;

  return (
    <div className="app-shell">
      <aside className="sidebar sidebar--fixed">
        <Brand compact />
        <nav>
          <span className="nav-label">Station operations</span>
          <NavLink active={view === 'overview'} onSelect={() => go('overview')}>
            <LayoutDashboard size={19} /> Overview
          </NavLink>
          <NavLink active={view === 'incidents'} onSelect={() => go('incidents')}>
            <Clipboard size={19} /> Incidents
          </NavLink>
          <NavLink active={view === 'suspects'} onSelect={() => go('suspects')}>
            <UsersRound size={19} /> Suspects
          </NavLink>
        </nav>
        <SidebarUser name={displayName} role="Station Operations" onLogout={onLogout} />
      </aside>

      <main className="dashboard">
        <header className="topbar">
          <div>
            <span className="eyebrow">{overview ? overview.station.name : 'Station operations'}</span>
            <h1>{view === 'overview' ? `Welcome, ${displayName}` : titles[view]}</h1>
          </div>
        </header>

        {view === 'incidents' &&
          (openIncidentId ? <IncidentDetail key={openIncidentId} token={token} incidentId={openIncidentId} onBack={() => setOpenIncidentId(null)} /> : <IncidentsPage token={token} onOpen={setOpenIncidentId} />)}

        {view === 'suspects' && <SuspectsPage token={token} />}

        {view === 'overview' &&
          (loading ? (
            <section className="content-card">
              <div className="empty-state">
                <LoaderCircle className="spin" />
                <h3>Loading station operations</h3>
              </div>
            </section>
          ) : error ? (
            <div className="alert alert--error">{error}</div>
          ) : (
            overview && (
              <>
                <section className="station-hero">
                  <div className="station-symbol station-symbol--large">
                    <Building2 />
                  </div>
                  <div>
                    <span className="eyebrow">{overview.station.code}</span>
                    <h2>{overview.station.name}</h2>
                    <p>Operational records for {overview.date}</p>
                  </div>
                </section>
                <section className="stats-grid">
                  <StatCard icon={<Clipboard />} tone="blue" label="Logged today" value={overview.incidents.loggedToday} caption="Incidents received by the station" />
                  <StatCard icon={<Activity />} tone="green" label="Active incidents" value={activeIncidents} caption="Open through in progress" />
                  <StatCard icon={<UsersRound />} tone="amber" label="Unassigned" value={overview.incidents.unassigned} caption={`${overview.officers.active} active station personnel`} />
                </section>
                <section className="content-card">
                  <div className="card-heading">
                    <div>
                      <h2>Operations access is active</h2>
                      <p>Your account is restricted to {overview.station.name}.</p>
                    </div>
                    <div className="ops-actions">
                      <button className="button button--primary" onClick={() => go('incidents')}>
                        <Clipboard size={17} /> Review incidents <ArrowRight size={17} />
                      </button>
                      <button className="button button--secondary" onClick={() => go('suspects')}>
                        <UserX size={17} /> Suspect register
                      </button>
                    </div>
                  </div>
                </section>
              </>
            )
          ))}
      </main>
    </div>
  );
}