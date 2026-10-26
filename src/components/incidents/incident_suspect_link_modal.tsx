import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

import { api, ApiError } from '../../api';
import type { Suspect } from '../../types';
import { compact, getError } from '../../utils/errors';
import { humanize } from '../../utils/incident_options';
import { TextAreaField, TextField } from '../form_fields';
import { FormModal } from '../form_modal';

type Props = { token: string; incidentId: string; linkedIds: string[]; onClose: () => void; onSaved: () => void };

export function IncidentSuspectLinkModal({ token, incidentId, linkedIds, onClose, onSaved }: Props) {
  const [suspects, setSuspects] = useState<Suspect[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let active = true;
    void api
      .listSuspects(token)
      .then((items) => active && setSuspects(items))
      .catch((requestError) => active && setLoadError(getError(requestError)));
    return () => {
      active = false;
    };
  }, [token]);

  const available = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (suspects ?? []).filter((suspect) => !linkedIds.includes(suspect.id) && (!query || [suspect.fullName, ...(suspect.aliases ?? []), suspect.phone, suspect.idNumber].some((value) => value?.toLowerCase().includes(query))));
  }, [suspects, linkedIds, search]);

  async function save() {
    if (!selectedId) throw new ApiError('Select a suspect to link.', 0);
    await api.linkSuspect(token, incidentId, selectedId, compact({ notes: notes.trim() }));
    onSaved();
  }

  return (
    <FormModal eyebrow="Suspects" title="Link suspect to incident" submitLabel="Link suspect" onClose={onClose} onSubmit={save}>
      <div className="form-section">
        <TextField label="Search suspects" value={search} onChange={setSearch} placeholder="Name, alias, phone or ID number" />
        {loadError ? (
          <div className="alert alert--error">{loadError}</div>
        ) : !suspects ? (
          <p className="muted small-copy">
            <LoaderCircle className="spin" size={14} /> Loading suspects…
          </p>
        ) : available.length === 0 ? (
          <p className="muted small-copy">{search ? 'No matching suspects.' : 'No unlinked suspects. Create one in the Suspects section first.'}</p>
        ) : (
          <div className="ops-pick-list" role="listbox" aria-label="Suspects">
            {available.map((suspect) => (
              <button key={suspect.id} type="button" role="option" aria-selected={selectedId === suspect.id} className={`button ${selectedId === suspect.id ? 'button--primary' : 'button--ghost'}`} onClick={() => setSelectedId(suspect.id)}>
                <span>
                  <strong>{suspect.fullName || 'Unnamed suspect'}</strong>
                  <small>
                    {humanize(suspect.status)}
                    {suspect.aliases?.length ? ` · aka ${suspect.aliases.join(', ')}` : ''}
                  </small>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="form-section">
        <TextAreaField label="Notes" value={notes} onChange={setNotes} rows={3} placeholder="How this suspect relates to the incident" />
      </div>
    </FormModal>
  );
}