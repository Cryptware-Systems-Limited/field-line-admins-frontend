import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, LoaderCircle, Plus, Search, UserX } from 'lucide-react';

import { api } from '../api';
import type { Suspect } from '../types';
import { getError } from '../utils/errors';
import { formatDate, humanize } from '../utils/incident_options';
import { SuspectDrawer } from '../components/suspect_drawer';
import { SuspectFormModal } from '../components/suspect_form';

export function SuspectsPage({ token }: { token: string }) {
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<{ suspect?: Suspect } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerKey, setDrawerKey] = useState(0);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      setSuspects(await api.listSuspects(token));
      setError('');
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return suspects;
    return suspects.filter((suspect) => [suspect.fullName, ...(suspect.aliases ?? []), suspect.phone, suspect.idNumber].some((value) => value?.toLowerCase().includes(query)));
  }, [search, suspects]);

  function saved(isEdit: boolean) {
    setForm(null);
    setNotice(isEdit ? 'Suspect updated.' : 'Suspect added to the register.');
    setDrawerKey((key) => key + 1);
    void load();
  }

  return (
    <>
      {notice && (
        <div className="toast toast--success">
          <Check size={18} />
          {notice}
        </div>
      )}
      <section className="content-card">
        <div className="card-heading">
          <div>
            <h2>Suspect register</h2>
            <p>People of interest recorded by your station. Link them to incidents from the incident's Suspects tab.</p>
          </div>
          <div className="ops-actions">
            <label className="search">
              <Search size={18} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search suspects" />
            </label>
            <button className="button button--primary" onClick={() => setForm({})}>
              <Plus size={18} /> Add suspect
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <LoaderCircle className="spin" />
            <h3>Loading suspects</h3>
          </div>
        ) : error ? (
          <div className="alert alert--error">{error}</div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <UserX />
            <h3>{search ? 'No matching suspects' : 'No suspects recorded'}</h3>
            <p>{search ? 'Try a different name, alias, phone or ID number.' : 'Add a suspect to start the station register.'}</p>
            {!search && (
              <button className="button button--secondary" onClick={() => setForm({})}>
                <Plus size={17} /> Add first suspect
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Suspect</th>
                  <th>Status</th>
                  <th>Phone</th>
                  <th>Identification</th>
                  <th>Added</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((suspect) => (
                  <tr
                    key={suspect.id}
                    className="officer-row"
                    tabIndex={0}
                    onClick={() => setSelectedId(suspect.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedId(suspect.id);
                      }
                    }}
                  >
                    <td>
                      <span className="station-cell">
                        <span className="avatar">{(suspect.fullName || '?')[0].toUpperCase()}</span>
                        <span>
                          <strong>{suspect.fullName || 'Unnamed suspect'}</strong>
                          <small>{suspect.aliases?.length ? `aka ${suspect.aliases.join(', ')}` : 'No known aliases'}</small>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="status status--suspended">
                        <i />
                        {humanize(suspect.status)}
                      </span>
                    </td>
                    <td>{suspect.phone || '—'}</td>
                    <td>{suspect.idType ? `${humanize(suspect.idType)} ${suspect.idNumber ?? ''}` : '—'}</td>
                    <td>{formatDate(suspect.createdAt)}</td>
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

      {selectedId && <SuspectDrawer token={token} suspectId={selectedId} refreshKey={drawerKey} onClose={() => setSelectedId(null)} onEdit={(suspect) => setForm({ suspect })} />}
      {form && <SuspectFormModal token={token} suspect={form.suspect} onClose={() => setForm(null)} onSaved={() => saved(Boolean(form.suspect))} />}
    </>
  );
}