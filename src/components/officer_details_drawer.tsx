import { useEffect, useState } from 'react';
import { CalendarDays, LoaderCircle, Mail, Smartphone, Trash2, X } from 'lucide-react';

import { api } from '../api';
import { OnboardingBadge } from '../components/status_badge';
import { getError } from '../utils/errors';
import type { Officer } from '../types';

type Props = { token: string; officerId: string; onClose: () => void; onRemove: (officer: Officer) => void };

export function OfficerDetailsDrawer({ token, officerId, onClose, onRemove }: Props) {
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void api
      .getOfficer(token, officerId)
      .then((result) => {
        if (active) setOfficer(result);
      })
      .catch((requestError) => {
        if (active) setError(getError(requestError));
      });
    return () => {
      active = false;
    };
  }, [officerId, token]);

  return (
    <>
      <button className="drawer-backdrop" onClick={onClose} aria-label="Close officer details" />
      <aside className="drawer officer-drawer" aria-label="Officer details">
        <header>
          <div>
            <span className="eyebrow">Officer record</span>
            <h2>{officer ? `${officer.personnelProfile.firstName} ${officer.personnelProfile.lastName}` : 'Loading officer…'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </header>
        {error ? (
          <div className="alert alert--error">{error}</div>
        ) : !officer ? (
          <div className="empty-state officer-loading">
            <LoaderCircle className="spin" />
          </div>
        ) : (
          <>
            <div className="officer-profile">
              <span className="avatar officer-avatar">{officer.personnelProfile.firstName[0]}</span>
              <div>
                <strong>{officer.personnelProfile.personnelNumber}</strong>
                <small>
                  {officer.personnelProfile.rankOrPosition || 'Rank not specified'}
                  {officer.personnelProfile.department ? ` · ${officer.personnelProfile.department}` : ''}
                </small>
              </div>
              <OnboardingBadge onboarded={officer.devices.length > 0} />
            </div>
            <section className="detail-section">
              <h3>Identity and contact</h3>
              <dl>
                <div>
                  <dt>Email</dt>
                  <dd>
                    <Mail size={15} /> {officer.email}
                  </dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{officer.phone}</dd>
                </div>
                <div>
                  <dt>Authorisation</dt>
                  <dd>{officer.personnelProfile.authorisationRef}</dd>
                </div>
                <div>
                  <dt>Added</dt>
                  <dd>
                    <CalendarDays size={15} /> {new Date(officer.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </section>
            <section className="detail-section">
              <h3>Mobile access</h3>
              {officer.devices.length === 0 ? (
                <p className="muted small-copy">The officer has not completed mobile onboarding.</p>
              ) : (
                <div className="device-list">
                  {officer.devices.map((device) => (
                    <article key={device.id}>
                      <Smartphone size={18} />
                      <span>
                        <strong>{device.platform}</strong>
                        <small className="mono">{device.installationId}</small>
                        <small>{device.lastSeenAt ? `Last active ${new Date(device.lastSeenAt).toLocaleString()}` : 'No activity recorded'}</small>
                      </span>
                      <span className={`status ${device.status === 'ACTIVE' ? 'status--active' : 'status--suspended'}`}>
                        <i />
                        {device.status}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </section>
            <div className="drawer-actions drawer-actions--danger">
              <p>Removing this officer immediately revokes their station assignment, devices, and sessions while retaining historical records.</p>
              <button className="button button--danger button--wide" onClick={() => onRemove(officer)}>
                <Trash2 size={17} /> Remove officer
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}