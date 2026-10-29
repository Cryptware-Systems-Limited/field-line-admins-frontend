import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

import { api } from '../../api';
import type { IncidentActivity } from '../../types';
import { getError } from '../../utils/errors';
import { formatDateTime, humanize, personnelName } from '../../utils/incident_options';

type Props = { token: string; incidentId: string; refreshKey: number };

export function IncidentActivityList({ token, incidentId, refreshKey }: Props) {
  const [items, setItems] = useState<IncidentActivity[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');
    void api
      .listIncidentActivity(token, incidentId)
      .then((result) => active && setItems(result))
      .catch((requestError) => active && setError(getError(requestError)));
    return () => {
      active = false;
    };
  }, [token, incidentId, refreshKey]);

  if (error) return <div className="alert alert--error">{error}</div>;
  if (!items)
    return (
      <p className="muted small-copy">
        <LoaderCircle className="spin" size={14} /> Loading activity…
      </p>
    );
  if (items.length === 0) return <p className="muted small-copy">No activity recorded yet.</p>;

  return (
    <ol className="ops-timeline">
      {items.map((item, index) => {
        const detail = item.description || item.message || item.summary || item.reason;
        const actor = personnelName(item.actor);
        return (
          <li key={item.id ?? index}>
            <strong>{humanize(item.action || item.type || item.event || 'UPDATE')}</strong>
            {detail && <span>{detail}</span>}
            <small className="muted">
              {actor ? `${actor} · ` : ''}
              {formatDateTime(item.createdAt)}
            </small>
          </li>
        );
      })}
    </ol>
  );
}