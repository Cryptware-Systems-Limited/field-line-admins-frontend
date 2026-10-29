import { useEffect, useState } from 'react';
import { LoaderCircle, Pencil, X } from 'lucide-react';

import { api } from '../api';
import type { Suspect } from '../types';
import { getError } from '../utils/errors';
import { formatDate, humanize, suspectPhotoId } from '../utils/incident_options';
import { SuspectPhoto } from './suspect_photo';

type Props = { token: string; suspectId: string; refreshKey: number; onClose: () => void; onEdit: (suspect: Suspect) => void };

export function SuspectDrawer({ token, suspectId, refreshKey, onClose, onEdit }: Props) {
  const [suspect, setSuspect] = useState<Suspect | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');
    void api
      .getSuspect(token, suspectId)
      .then((result) => active && setSuspect(result))
      .catch((requestError) => active && setError(getError(requestError)));
    return () => {
      active = false;
    };
  }, [token, suspectId, refreshKey]);

  return (
    <>
      <button className="drawer-backdrop" onClick={onClose} aria-label="Close suspect details" />
      <aside className="drawer officer-drawer" aria-label="Suspect details">
        <header>
          <div>
            <span className="eyebrow">Suspect record</span>
            <h2>{suspect ? suspect.fullName || 'Unnamed suspect' : 'Loading suspect…'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </header>
        {error ? (
          <div className="alert alert--error">{error}</div>
        ) : !suspect ? (
          <div className="empty-state officer-loading">
            <LoaderCircle className="spin" />
          </div>
        ) : (
          <>
            {suspectPhotoId(suspect) && (
              <section className="detail-section">
                <SuspectPhoto token={token} suspectId={suspect.id} photoId={suspectPhotoId(suspect)!} alt={suspect.fullName || 'Suspect photo'} />
              </section>
            )}
            <div className="officer-profile">
              <span className="avatar officer-avatar">{(suspect.fullName || '?')[0].toUpperCase()}</span>
              <div>
                <strong>{suspect.aliases?.length ? `aka ${suspect.aliases.join(', ')}` : 'No known aliases'}</strong>
                <small>{suspect.idType ? `${humanize(suspect.idType)} ${suspect.idNumber ?? ''}` : 'No ID recorded'}</small>
              </div>
              <span className="status status--suspended">
                <i />
                {humanize(suspect.status)}
              </span>
            </div>
            <section className="detail-section">
              <h3>Identity and contact</h3>
              <dl>
                <div>
                  <dt>Date of birth</dt>
                  <dd>{formatDate(suspect.dateOfBirth)}</dd>
                </div>
                <div>
                  <dt>Gender</dt>
                  <dd>{humanize(suspect.gender)}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{suspect.phone || '—'}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{suspect.address || '—'}</dd>
                </div>
                <div>
                  <dt>Added</dt>
                  <dd>{formatDate(suspect.createdAt)}</dd>
                </div>
              </dl>
            </section>
            <section className="detail-section">
              <h3>Identifying marks</h3>
              <p className="ops-description">{suspect.identifyingMarks || 'None recorded.'}</p>
            </section>
            <section className="detail-section">
              <h3>Notes</h3>
              <p className="ops-description">{suspect.notes || 'No notes.'}</p>
            </section>
            <div className="drawer-actions">
              <button className="button button--primary button--wide" onClick={() => onEdit(suspect)}>
                <Pencil size={17} /> Edit suspect
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}