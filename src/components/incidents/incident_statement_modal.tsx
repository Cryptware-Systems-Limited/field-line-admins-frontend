import { useState } from 'react';

import { api } from '../../api';
import type { IncidentEvidence, IncidentPerson, IncidentStatement, UpsertIncidentStatementInput } from '../../types';
import { compact } from '../../utils/errors';
import { formatDateTime, humanize, newId, statementMethodOptions } from '../../utils/incident_options';
import { SelectField, TextAreaField } from '../form_fields';
import { FormModal } from '../form_modal';

type Props = {
  token: string;
  incidentId: string;
  statement?: IncidentStatement;
  people: IncidentPerson[];
  evidence: IncidentEvidence[];
  onClose: () => void;
  onSaved: () => void;
};

export function IncidentStatementModal({ token, incidentId, statement, people, evidence, onClose, onSaved }: Props) {
  const [statementId] = useState(() => statement?.id ?? newId());
  const [createdAt] = useState(() => statement?.clientCreatedAt ?? new Date().toISOString());
  const [form, setForm] = useState({
    method: statement?.method ?? 'TYPED',
    personId: statement?.personId ?? '',
    content: statement?.content ?? '',
    audioEvidenceId: statement?.audioEvidenceId ?? '',
    officerSummary: statement?.officerSummary ?? '',
  });
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  const isAudio = form.method === 'AUDIO';

  const personOptions = people.map((person) => ({ value: person.id, label: `${person.fullName || 'Unnamed'} · ${humanize(person.role)}` }));
  const audioOptions = evidence.filter((item) => item.type === 'AUDIO').map((item) => ({ value: item.id, label: item.originalFileName || item.description || `Recording ${formatDateTime(item.capturedAt ?? item.createdAt)}` }));

  async function save() {
    await api.upsertIncidentStatement(
      token,
      incidentId,
      statementId,
      compact<UpsertIncidentStatementInput>({
        ...form,
        content: form.content.trim(),
        officerSummary: form.officerSummary.trim(),
        audioEvidenceId: isAudio ? form.audioEvidenceId : '',
        clientCreatedAt: createdAt,
      }),
    );
    onSaved();
  }

  return (
    <FormModal eyebrow="Statements" title={statement ? 'Edit statement' : 'Record statement'} submitLabel={statement ? 'Save statement' : 'Record statement'} onClose={onClose} onSubmit={save}>
      <div className="form-section">
        <h3>Statement</h3>
        <div className="form-grid">
          <SelectField label="Method" value={form.method} onChange={set('method')} options={statementMethodOptions} required />
          <SelectField label="Given by" value={form.personId} onChange={set('personId')} options={personOptions} placeholder={people.length ? 'Not linked to a person' : 'Add people to link them'} />
          {isAudio && (
            <div className="span-2">
              <SelectField label="Audio recording" value={form.audioEvidenceId} onChange={set('audioEvidenceId')} options={audioOptions} placeholder={audioOptions.length ? 'Select recording' : 'No audio evidence uploaded yet'} required />
              {!audioOptions.length && <p className="muted small-copy">Upload the recording under Evidence first, then link it here.</p>}
            </div>
          )}
          <TextAreaField className="span-2" label={isAudio ? 'Transcript (optional)' : 'Statement content'} value={form.content} onChange={set('content')} rows={6} required={!isAudio} />
          <TextAreaField className="span-2" label="Officer summary" value={form.officerSummary} onChange={set('officerSummary')} rows={3} placeholder="Key facts from this statement" />
        </div>
      </div>
    </FormModal>
  );
}