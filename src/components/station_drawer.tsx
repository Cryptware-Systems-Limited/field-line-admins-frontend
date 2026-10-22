import { useEffect, useState } from 'react';
import { Building2, Check, LoaderCircle, MapPin, Plus, ShieldCheck, X } from 'lucide-react';

import { api } from '../api';
import { StatusBadge } from '../components/status_badge';
import type { Station, StationAdmin } from '../types';

type Props = {
  token: string;
  station: Station;
  onClose: () => void;
  onApprove: (station: Station) => Promise<void>;
  onAppoint: () => void;
};

export function StationDrawer({ token, station, onClose, onApprove, onAppoint }: Props) {
  const [approving, setApproving] = useState(false);
  const [admins, setAdmins] = useState<StationAdmin[]>([]);

  useEffect(() => {
    if (station.status === 'ACTIVE')
      void api
        .listStationAdmins(token, station.id)
        .then(setAdmins)
        .catch(() => undefined);
  }, [station.id, station.status, token]);

  async function approve() {
    setApproving(true);
    await onApprove(station);
    setApproving(false);
  }

  return (
    <>
      <button className="drawer-backdrop" onClick={onClose} aria-label="Close details" />
      <aside className="drawer">
        <header>
          <div className="station-symbol station-symbol--large">
            <Building2 />
          </div>
          <button className="icon-button" onClick={onClose}>
            <X />
          </button>
        </header>
        <span className="eyebrow">{station.code}</span>
        <h2>{station.name}</h2>
        <StatusBadge status={station.status} />
        <div className="detail-section">
          <h3>Station details</h3>
          <dl>
            <div>
              <dt>Type</dt>
              <dd>{station.type || 'Not specified'}</dd>
            </div>
            <div>
              <dt>Command</dt>
              <dd>{station.command || 'Not specified'}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>
                <MapPin size={15} /> {station.addressLine1}, {station.city}, {station.state}
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{station.phone || 'Not specified'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{station.email || 'Not specified'}</dd>
            </div>
          </dl>
        </div>
        <div className="detail-section">
          <h3>Station administrators</h3>
          {admins.length ? (
            <div className="admin-list">
              {admins.map((admin) => (
                <div key={admin.id}>
                  <span className="avatar">{admin.personnelProfile.firstName[0]}</span>
                  <span>
                    <strong>
                      {admin.personnelProfile.firstName} {admin.personnelProfile.lastName}
                    </strong>
                    <small>{admin.email}</small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted small-copy">No Station Admin has been appointed.</p>
          )}
          {station.status === 'ACTIVE' && (
            <button className="button button--secondary button--wide" onClick={onAppoint}>
              <Plus size={17} /> Appoint Station Admin
            </button>
          )}
        </div>
        <div className="detail-section">
          <h3>Record</h3>
          <dl>
            <div>
              <dt>Created</dt>
              <dd>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(station.createdAt))}</dd>
            </div>
            <div>
              <dt>Station ID</dt>
              <dd className="mono">{station.id}</dd>
            </div>
          </dl>
        </div>
        {station.status === 'DRAFT' || station.status === 'PENDING_APPROVAL' ? (
          <div className="drawer-actions">
            <p>Confirm that these details are correct before activating this station.</p>
            <button className="button button--primary button--wide" onClick={approve} disabled={approving}>
              {approving ? <LoaderCircle className="spin" size={18} /> : <ShieldCheck size={18} />} Approve and activate
            </button>
          </div>
        ) : (
          <div className="active-callout">
            <Check size={18} />
            <div>
              <strong>Station is operational</strong>
              <p>Station Administrators can now be appointed.</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}