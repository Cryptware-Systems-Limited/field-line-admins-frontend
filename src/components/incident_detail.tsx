import { ReactNode, useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, ExternalLink, LoaderCircle, MapPin, Pencil, Plus, RefreshCw, Trash2, UserCheck, X } from 'lucide-react';

import { api } from '../api';
import type { Incident, IncidentPerson, IncidentStatement, IncidentSuspectLink, IncidentVehicle } from '../types';
import { getError } from '../utils/errors';
import { formatBytes, formatDate, formatDateTime, humanize, incidentRef, incidentStatusClass, incidentTitle, personnelName, priorityClass } from '../utils/incident_options';
import { IncidentActivityList } from '../components/incidents/incident_activity_list';
import { IncidentEditModal } from '../components/incidents/incident_edit_modal';
import { IncidentEvidenceModal } from '../components/incidents/incident_evidence_modal';
import { IncidentPersonModal } from '../components/incidents/incident_person_modal';
import { IncidentStatementModal } from '../components/incidents/incident_statement_modal';
import { IncidentSuspectLinkModal } from '../components/incidents/incident_suspect_link_modal';
import { IncidentVehicleModal } from '../components/incidents/incident_vehicle_modal';
import { AssignIncidentModal, ChangeStatusModal } from '../components/incidents/incident_workflow_modal';

type Tab = 'overview' | 'people' | 'vehicles' | 'statements' | 'evidence' | 'suspects' | 'activity';

type ModalState =
  | { kind: 'edit' }
  | { kind: 'assign' }
  | { kind: 'status' }
  | { kind: 'person'; person?: IncidentPerson }
  | { kind: 'vehicle'; vehicle?: IncidentVehicle }
  | { kind: 'statement'; statement?: IncidentStatement }
  | { kind: 'evidence' }
  | { kind: 'link-suspect' }
  | null;

type Notice = { kind: 'success' | 'error'; message: string } | null;

const suspectIdOf = (link: IncidentSuspectLink) => link.suspectId || link.suspect?.id || link.id || '';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function ItemSection({ title, actionLabel, onAction, isEmpty, emptyText, children }: { title: string; actionLabel?: string; onAction?: () => void; isEmpty: boolean; emptyText: string; children: ReactNode }) {
  return (
    <div className="detail-section">
      <div className="ops-section-heading">
        <h3>{title}</h3>
        {onAction && (
          <button type="button" className="button button--secondary" onClick={onAction}>
            <Plus size={17} /> {actionLabel}
          </button>
        )}
      </div>
      {isEmpty ? (
        <div className="ops-empty">
          <p className="muted small-copy">{emptyText}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="ops-table">{children}</table>
        </div>
      )}
    </div>
  );
}

function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="icon-button" onClick={onClick} aria-label={label} title={label}>
      <Pencil size={16} />
    </button>
  );
}

export function IncidentDetail({ token, incidentId, onBack }: { token: string; incidentId: string; onBack: () => void }) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [modal, setModal] = useState<ModalState>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [activityKey, setActivityKey] = useState(0);
  const [confirmUnlink, setConfirmUnlink] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      try {
        setIncident(await api.getIncident(token, incidentId));
        setError('');
      } catch (requestError) {
        if (isRefresh) setNotice({ kind: 'error', message: getError(requestError) });
        else setError(getError(requestError));
      }
    },
    [token, incidentId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function saved(message: string) {
    setModal(null);
    setNotice({ kind: 'success', message });
    setActivityKey((key) => key + 1);
    void load(true);
  }

  async function unlink(suspectId: string) {
    setUnlinking(true);
    try {
      await api.unlinkSuspect(token, incidentId, suspectId);
      saved('Suspect removed from this incident.');
    } catch (requestError) {
      setNotice({ kind: 'error', message: getError(requestError) });
    } finally {
      setUnlinking(false);
      setConfirmUnlink(null);
    }
  }

  if (error)
    return (
      <section className="content-card ops-detail">
        <button className="button button--ghost" onClick={onBack}>
          <ArrowLeft size={17} /> All incidents
        </button>
        <div className="alert alert--error">{error}</div>
      </section>
    );

  if (!incident)
    return (
      <section className="content-card ops-detail">
        <div className="empty-state">
          <LoaderCircle className="spin" />
          <h3>Loading incident</h3>
        </div>
      </section>
    );

  const people = incident.people ?? [];
  const vehicles = incident.vehicles ?? [];
  const statements = incident.statements ?? [];
  const evidence = incident.evidence ?? [];
  const suspects = incident.suspects ?? [];
  const location = incident.location;
  const assigned = personnelName(incident.assignedOfficer) || incident.assignedOfficerId;
  const personName = (personId?: string | null) => people.find((person) => person.id === personId)?.fullName || '—';

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'people', label: 'People', count: people.length },
    { id: 'vehicles', label: 'Vehicles', count: vehicles.length },
    { id: 'statements', label: 'Statements', count: statements.length },
    { id: 'evidence', label: 'Evidence', count: evidence.length },
    { id: 'suspects', label: 'Suspects', count: suspects.length },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <>
      {notice && (
        <div className={`toast toast--${notice.kind}`}>
          {notice.kind === 'success' ? <Check size={18} /> : <X size={18} />}
          {notice.message}
        </div>
      )}

      <section className="content-card ops-detail">
        <button className="button button--ghost" onClick={onBack}>
          <ArrowLeft size={17} /> All incidents
        </button>

        <div className="ops-detail-header">
          <div className="ops-detail-title">
            <span className="eyebrow">{incidentRef(incident)}</span>
            <h2>{incidentTitle(incident)}</h2>
            <div className="ops-badges">
              <span className={incidentStatusClass(incident.status)}>
                <i />
                {humanize(incident.status)}
              </span>
              {incident.priority && (
                <span className={priorityClass(incident.priority)}>
                  <i />
                  {humanize(incident.priority)} priority
                </span>
              )}
            </div>
          </div>
          <div className="ops-actions">
            <button className="button button--secondary" onClick={() => setModal({ kind: 'edit' })}>
              <Pencil size={17} /> Edit
            </button>
            <button className="button button--secondary" onClick={() => setModal({ kind: 'assign' })}>
              <UserCheck size={17} /> {assigned ? 'Reassign' : 'Assign'}
            </button>
            <button className="button button--primary" onClick={() => setModal({ kind: 'status' })}>
              <RefreshCw size={17} /> Change status
            </button>
          </div>
        </div>

        <div className="ops-tabs" role="tablist">
          {tabs.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className="ops-tab" onClick={() => setTab(item.id)}>
              {item.label}
              {item.count !== undefined && <span className="ops-tab-count">{item.count}</span>}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <div className="detail-section">
              <h3>Description</h3>
              <p className="ops-description">{incident.description || 'No description recorded.'}</p>
            </div>
            <div className="detail-section">
              <h3>Incident details</h3>
              <dl className="ops-dl">
                <Row label="Type">{incidentTitle(incident)}</Row>
                <Row label="Priority">{humanize(incident.priority)}</Row>
                <Row label="Status">{humanize(incident.status)}</Row>
                <Row label="Occurred">{formatDateTime(incident.occurredAt)}</Row>
                <Row label="Reported">{formatDateTime(incident.clientCreatedAt ?? incident.createdAt)}</Row>
                <Row label="Reported by">{personnelName(incident.reportingOfficer ?? incident.reportedBy) || '—'}</Row>
                {incident.case?.referenceNumber && (
                  <Row label="Case">
                    {incident.case.referenceNumber}
                    {incident.case.status ? ` · ${humanize(incident.case.status)}` : ''}
                  </Row>
                )}
                <Row label="Assigned officer">{assigned || 'Unassigned'}</Row>
              </dl>
            </div>
            <div className="detail-section">
              <h3>Location</h3>
              {location ? (
                <dl className="ops-dl">
                  <Row label="Address">
                    <span className="ops-inline-icon">
                      <MapPin size={15} />
                      <span>{location.resolvedAddress || 'Not resolved'}</span>
                    </span>
                  </Row>
                  <Row label="Landmark">{location.landmarkOrDirections || '—'}</Row>
                  <Row label="Coordinates">
                    {location.latitude != null && location.longitude != null ? `${location.latitude}, ${location.longitude}${location.accuracyMeters ? ` (±${location.accuracyMeters} m)` : ''}` : '—'}
                  </Row>
                  <Row label="Source">{humanize(location.source)}</Row>
                </dl>
              ) : (
                <p className="muted small-copy">No location recorded.</p>
              )}
            </div>
          </>
        )}

        {tab === 'people' && (
          <ItemSection title="People involved" actionLabel="Add person" onAction={() => setModal({ kind: 'person' })} isEmpty={!people.length} emptyText="No victims, complainants or witnesses recorded.">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Identification</th>
                <th className="row-actions">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.id}>
                  <td>
                    <strong>{person.fullName || 'Unnamed'}</strong>
                    {person.dateOfBirth && <span className="ops-sub muted">Born {formatDate(person.dateOfBirth)}</span>}
                  </td>
                  <td>{humanize(person.role)}</td>
                  <td>{person.phone || '—'}</td>
                  <td>{person.idType ? `${humanize(person.idType)} ${person.idNumber ?? ''}` : '—'}</td>
                  <td className="row-actions">
                    <EditButton label="Edit person" onClick={() => setModal({ kind: 'person', person })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </ItemSection>
        )}

        {tab === 'vehicles' && (
          <ItemSection title="Vehicles" actionLabel="Add vehicle" onAction={() => setModal({ kind: 'vehicle' })} isEmpty={!vehicles.length} emptyText="No vehicles recorded.">
            <thead>
              <tr>
                <th>Plate</th>
                <th>Vehicle</th>
                <th>Colour</th>
                <th>Role</th>
                <th>Driver / owner</th>
                <th className="row-actions">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>
                    <strong>{vehicle.plateNumber || 'No plate'}</strong>
                  </td>
                  <td>{[humanize(vehicle.type), vehicle.makeModel].filter((value) => value && value !== '—').join(' · ') || '—'}</td>
                  <td>{vehicle.colour || '—'}</td>
                  <td>{humanize(vehicle.role)}</td>
                  <td>{humanize(vehicle.driverOwnerStatus)}</td>
                  <td className="row-actions">
                    <EditButton label="Edit vehicle" onClick={() => setModal({ kind: 'vehicle', vehicle })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </ItemSection>
        )}

        {tab === 'statements' && (
          <ItemSection title="Statements" actionLabel="Record statement" onAction={() => setModal({ kind: 'statement' })} isEmpty={!statements.length} emptyText="No statements recorded.">
            <thead>
              <tr>
                <th>Given by</th>
                <th>Method</th>
                <th>Summary</th>
                <th>Recorded</th>
                <th className="row-actions">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {statements.map((statement) => (
                <tr key={statement.id}>
                  <td>
                    <strong>{personName(statement.personId)}</strong>
                  </td>
                  <td>{humanize(statement.method)}</td>
                  <td className="ops-cell-text">{statement.officerSummary || statement.content || '—'}</td>
                  <td className="ops-nowrap">{formatDateTime(statement.clientCreatedAt ?? statement.createdAt)}</td>
                  <td className="row-actions">
                    <EditButton label="Edit statement" onClick={() => setModal({ kind: 'statement', statement })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </ItemSection>
        )}

        {tab === 'evidence' && (
          <ItemSection title="Evidence" actionLabel="Upload evidence" onAction={() => setModal({ kind: 'evidence' })} isEmpty={!evidence.length} emptyText="No evidence uploaded.">
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th>Size</th>
                <th>Captured</th>
                <th>Status</th>
                <th className="row-actions">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {evidence.map((item) => {
                const href = item.secureUrl || item.url;
                return (
                  <tr key={item.id}>
                    <td>
                      <strong className="ops-break">{item.originalFileName || 'Untitled file'}</strong>
                      {item.description && <span className="ops-sub muted">{item.description}</span>}
                    </td>
                    <td>{humanize(item.type)}</td>
                    <td className="ops-nowrap">{formatBytes(item.sizeBytes)}</td>
                    <td className="ops-nowrap">{formatDateTime(item.capturedAt ?? item.createdAt)}</td>
                    <td>{humanize(item.status)}</td>
                    <td className="row-actions">
                      {href && (
                        <a className="icon-button" href={href} target="_blank" rel="noreferrer" aria-label="Open file" title="Open file">
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </ItemSection>
        )}

        {tab === 'suspects' && (
          <ItemSection title="Linked suspects" actionLabel="Link suspect" onAction={() => setModal({ kind: 'link-suspect' })} isEmpty={!suspects.length} emptyText="No suspects linked to this incident.">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Notes</th>
                <th className="row-actions">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {suspects.map((link, index) => {
                const suspectId = suspectIdOf(link);
                return (
                  <tr key={suspectId || index}>
                    <td>
                      <strong>{link.suspect?.fullName || link.fullName || 'Unnamed suspect'}</strong>
                    </td>
                    <td>{humanize(link.suspect?.status ?? link.status)}</td>
                    <td className="ops-cell-text">{link.notes || '—'}</td>
                    <td className="row-actions">
                      {confirmUnlink === suspectId ? (
                        <span className="ops-actions ops-actions--end">
                          <button type="button" className="button button--ghost" onClick={() => setConfirmUnlink(null)} disabled={unlinking}>
                            Cancel
                          </button>
                          <button type="button" className="button button--danger" onClick={() => void unlink(suspectId)} disabled={unlinking}>
                            {unlinking ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />} Unlink
                          </button>
                        </span>
                      ) : (
                        <button type="button" className="icon-button" onClick={() => setConfirmUnlink(suspectId)} disabled={!suspectId} aria-label="Unlink suspect" title="Unlink suspect">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </ItemSection>
        )}

        {tab === 'activity' && (
          <div className="detail-section">
            <h3>Activity log</h3>
            <IncidentActivityList token={token} incidentId={incident.id} refreshKey={activityKey} />
          </div>
        )}
      </section>

      {modal?.kind === 'edit' && <IncidentEditModal token={token} incident={incident} onClose={() => setModal(null)} onSaved={() => saved('Incident details updated.')} />}
      {modal?.kind === 'assign' && <AssignIncidentModal token={token} incident={incident} onClose={() => setModal(null)} onSaved={() => saved('Incident assigned.')} />}
      {modal?.kind === 'status' && <ChangeStatusModal token={token} incident={incident} onClose={() => setModal(null)} onSaved={() => saved('Incident status updated.')} />}
      {modal?.kind === 'person' && <IncidentPersonModal token={token} incidentId={incident.id} person={modal.person} onClose={() => setModal(null)} onSaved={() => saved(modal.person ? 'Person updated.' : 'Person added.')} />}
      {modal?.kind === 'vehicle' && <IncidentVehicleModal token={token} incidentId={incident.id} vehicle={modal.vehicle} onClose={() => setModal(null)} onSaved={() => saved(modal.vehicle ? 'Vehicle updated.' : 'Vehicle added.')} />}
      {modal?.kind === 'statement' && (
        <IncidentStatementModal token={token} incidentId={incident.id} statement={modal.statement} people={people} evidence={evidence} onClose={() => setModal(null)} onSaved={() => saved(modal.statement ? 'Statement updated.' : 'Statement recorded.')} />
      )}
      {modal?.kind === 'evidence' && <IncidentEvidenceModal token={token} incidentId={incident.id} onClose={() => setModal(null)} onSaved={() => saved('Evidence uploaded.')} />}
      {modal?.kind === 'link-suspect' && (
        <IncidentSuspectLinkModal token={token} incidentId={incident.id} linkedIds={suspects.map(suspectIdOf).filter(Boolean)} onClose={() => setModal(null)} onSaved={() => saved('Suspect linked to this incident.')} />
      )}
    </>
  );
}