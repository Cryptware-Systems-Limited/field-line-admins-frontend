import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';

import { ApiError } from '../../api';
import { uploadEvidenceFile, evidenceTypeForMime } from '../../utils/evidence_upload';
import { evidenceTypeOptions, formatBytes, fromDateTimeLocal, newId, toDateTimeLocal } from '../../utils/incident_options';
import { SelectField, TextField } from '../form_fields';
import { FormModal } from '../form_modal';

type Props = { token: string; incidentId: string; onClose: () => void; onSaved: () => void };

export function IncidentEvidenceModal({ token, incidentId, onClose, onSaved }: Props) {
  const [evidenceId] = useState(newId);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [capturedAt, setCapturedAt] = useState('');
  const [step, setStep] = useState('');

  function pick(next: File | null) {
    setFile(next);
    if (!next) return;
    setType(evidenceTypeForMime(next.type));
    setCapturedAt(toDateTimeLocal(new Date(next.lastModified).toISOString()));
  }

  async function save() {
    if (!file) throw new ApiError('Choose a file to upload.', 0);
    try {
      await uploadEvidenceFile({
        token,
        incidentId,
        evidenceId,
        file,
        type,
        description: description.trim(),
        capturedAt: fromDateTimeLocal(capturedAt),
        onStep: setStep,
      });
    } finally {
      setStep('');
    }
    onSaved();
  }

  return (
    <FormModal eyebrow="Evidence" title="Upload evidence" submitLabel="Upload evidence" onClose={onClose} onSubmit={save}>
      <div className="form-section">
        <h3>File</h3>
        <div className="form-grid">
          <label className="span-2">
            Evidence file
            <input type="file" accept="image/*,video/*,audio/*,application/pdf" onChange={(event) => pick(event.target.files?.[0] ?? null)} required />
          </label>
          {file && (
            <p className="muted small-copy span-2">
              {file.name} · {formatBytes(file.size)}
            </p>
          )}
          <SelectField label="Evidence type" value={type} onChange={setType} options={evidenceTypeOptions} placeholder="Select type" required />
          <TextField type="datetime-local" label="Captured at" value={capturedAt} onChange={setCapturedAt} />
          <TextField className="span-2" label="Description" value={description} onChange={setDescription} placeholder="Scene photograph facing north" />
        </div>
      </div>
      {step && (
        <p className="muted small-copy">
          <LoaderCircle className="spin" size={14} /> {step}
        </p>
      )}
    </FormModal>
  );
}