import { useState } from 'react';
import { LoaderCircle, Trash2 } from 'lucide-react';

import { api } from '../api';
import { getError } from '../utils/errors';
import type { OfficerKind } from '../components/officer_toggle';

type RemovableOfficer = { id: string; personnelProfile: { firstName: string; lastName: string } };

type Props = {
  token: string;
  kind: OfficerKind;
  officer: RemovableOfficer;
  onClose: () => void;
  onRemoved: (officerId: string) => void;
};

export function RemoveOfficerModal({ token, kind, officer, onClose, onRemoved }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fullName = `${officer.personnelProfile.firstName} ${officer.personnelProfile.lastName}`;
  const isField = kind === 'FIELD';

  async function remove() {
    setLoading(true);
    setError('');
    try {
      if (isField) await api.removeOfficer(token, officer.id);
      else await api.removeStationOfficer(token, officer.id);
      onRemoved(officer.id);
    } catch (requestError) {
      setError(getError(requestError));
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal credential-modal">
        <div className="credential-success removal-confirm">
          <span className="round-icon round-icon--danger">
            <Trash2 />
          </span>
          <span className="eyebrow">{isField ? 'Revoke field officer access' : 'Revoke station officer access'}</span>
          <h2>Remove {fullName}?</h2>
          <p>
            {isField
              ? 'This immediately disables the officer account, ends their station assignment, and revokes all registered devices and sessions.'
              : 'This immediately removes the officer from web operations at this station and revokes their session.'}
          </p>
          {error && <div className="alert alert--error">{error}</div>}
          {isField && <div className="alert alert--warning">Historical records and audit activity will be retained. This action does not erase policing records.</div>}
          <div className="confirmation-actions">
            <button className="button button--ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="button button--danger" onClick={() => void remove()} disabled={loading}>
              {loading ? <LoaderCircle className="spin" size={18} /> : <Trash2 size={17} />} Remove officer
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}