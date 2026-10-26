import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Clipboard, LoaderCircle, Search } from 'lucide-react';

import { api } from '../api';
import type { Incident } from '../types';
import { getError } from '../utils/errors';
import { formatDateTime, humanize, incidentRef, incidentStatusClass, incidentStatusOptions, incidentTitle, personnelName, priorityClass } from '../utils/incident_options';

export function IncidentsPage({ token, onOpen }: { token: string; onOpen: (incidentId: string) => void }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    void api
      .listIncidents(token)
      .then(setIncidents)
      .catch((requestError) => setError(getError(requestError)))
      .finally(() => setLoading(false));
  }, [token]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return incidents.filter(
      (incident) =>
        (!status || incident.status === status) &&
        (!query || [incidentRef(incident), incident.type, incident.otherTypeDescription, incident.description, incident.location?.resolvedAddress].some((value) => value?.toLowerCase().includes(query))),
    );
  }, [incidents, search, status]);

  return (
    <section className="content-card">
      <div className="card-heading">
        <div>
          <h2>Incidents</h2>
          <p>Reports received by your station. Select one to review and update it.</p>
        </div>
        <div className="ops-actions">
          <label className="search">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search incidents" />
          </label>
          <select className="ops-filter" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {incidentStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <LoaderCircle className="spin" />
          <h3>Loading incidents</h3>
        </div>
      ) : error ? (
        <div className="alert alert--error">{error}</div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <Clipboard />
          <h3>{search || status ? 'No matching incidents' : 'No incidents yet'}</h3>
          <p>{search || status ? 'Try a different search or status.' : 'Incidents reported to your station will appear here.'}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Incident</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Occurred</th>
                <th>Assigned to</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((incident) => (
                <tr
                  key={incident.id}
                  className="officer-row"
                  tabIndex={0}
                  onClick={() => onOpen(incident.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onOpen(incident.id);
                    }
                  }}
                >
                  <td>
                    <span className="station-cell">
                      <span className="station-symbol">
                        <Clipboard size={18} />
                      </span>
                      <span>
                        <strong>{incidentTitle(incident)}</strong>
                        <small>
                          {incidentRef(incident)}
                          {incident.location?.resolvedAddress ? ` · ${incident.location.resolvedAddress}` : ''}
                        </small>
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className={priorityClass(incident.priority)}>
                      <i />
                      {humanize(incident.priority)}
                    </span>
                  </td>
                  <td>
                    <span className={incidentStatusClass(incident.status)}>
                      <i />
                      {humanize(incident.status)}
                    </span>
                  </td>
                  <td>{formatDateTime(incident.occurredAt)}</td>
                  <td>{personnelName(incident.assignedOfficer) || (incident.assignedOfficerId ? 'Assigned' : 'Unassigned')}</td>
                  <td>
                    <ChevronRight size={18} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}