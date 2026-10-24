import { useEffect, useState } from 'react';
import { Activity, Building2, Clipboard, LayoutDashboard, LoaderCircle, LogOut, UsersRound } from 'lucide-react';

import { api } from '../api';
import { Brand } from '../components/brands';
import type { AdminUser, StationOperationsDashboardResponse } from '../types';
import { getError } from '../utils/errors';

export function StationOperationsDashboard({ token, user, onLogout }: { token: string; user: AdminUser; onLogout: () => void }) {
  const [overview, setOverview] = useState<StationOperationsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const displayName = user.personnelProfile?.firstName || user.email.split('@')[0];

  useEffect(() => {
    void api
      .getStationOperationsDashboard(token)
      .then(setOverview)
      .catch((requestError) => setError(getError(requestError)))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="app-shell">
      <aside className="sidebar sidebar--fixed">
        <Brand compact />
        <nav>
          <span className="nav-label">Station operations</span>
          <a className="active">
            <LayoutDashboard size={19} /> Overview
          </a>
          <a className="disabled">
            <Clipboard size={19} /> Incidents <small>Next</small>
          </a>
          <a className="disabled">
            <UsersRound size={19} /> Suspects <small>Next</small>
          </a>
        </nav>
        <button className="sidebar-user" onClick={onLogout}>
          <span className="avatar">{displayName[0].toUpperCase()}</span>
          <span>
            <strong>{displayName}</strong>
            <small>Station Operations</small>
          </span>
          <LogOut size={17} />
        </button>
      </aside>
      <main className="dashboard">
        <header className="topbar">
          <div>
            <span className="eyebrow">Station operations</span>
            <h1>Welcome, {displayName}</h1>
          </div>
        </header>
        {loading ? (
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
                <article>
                  <span className="metric-icon metric-icon--blue">
                    <Clipboard />
                  </span>
                  <div>
                    <small>Logged today</small>
                    <strong>{overview.incidents.loggedToday}</strong>
                    <em>Incidents received by the station</em>
                  </div>
                </article>
                <article>
                  <span className="metric-icon metric-icon--green">
                    <Activity />
                  </span>
                  <div>
                    <small>Active incidents</small>
                    <strong>{overview.incidents.open + overview.incidents.underReview + overview.incidents.assigned + overview.incidents.inProgress}</strong>
                    <em>Open through in progress</em>
                  </div>
                </article>
                <article>
                  <span className="metric-icon metric-icon--amber">
                    <UsersRound />
                  </span>
                  <div>
                    <small>Unassigned</small>
                    <strong>{overview.incidents.unassigned}</strong>
                    <em>{overview.officers.active} active station personnel</em>
                  </div>
                </article>
              </section>
              <section className="content-card">
                <div className="card-heading">
                  <div>
                    <h2>Operations access is active</h2>
                    <p>Your account is restricted to {overview.station.name}.</p>
                  </div>
                </div>
              </section>
            </>
          )
        )}
      </main>
    </div>
  );
}
