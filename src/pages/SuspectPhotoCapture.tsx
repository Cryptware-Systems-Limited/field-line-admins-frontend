import { useEffect, useState } from 'react';
import { Camera, Check, LoaderCircle, RefreshCw, Upload } from 'lucide-react';

import { api, ApiError } from '../api';
import { Brand } from '../components/brands';
import { getError } from '../utils/errors';
import { sha256Hex, toCompleteInput, uploadToCloudinary } from '../utils/evidence_upload';

/** Path of the public capture page that the QR code opens. */
export const SUSPECT_PHOTO_CAPTURE_PATH = '/capture/suspect-photo';

type Stage = 'pick' | 'preview' | 'uploading' | 'done';

/**
 * Phone side of suspect photo capture. Opened from the QR code — no login; the one-time
 * token in the URL authorises the upload.
 */
export function SuspectPhotoCapture({ captureToken }: { captureToken: string | null }) {
  const [stage, setStage] = useState<Stage>('pick');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [step, setStep] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) return setPreviewUrl(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(next: File | null) {
    setError('');
    if (!next) return;
    if (!next.type.startsWith('image/')) return setError('Please choose a photo.');
    setFile(next);
    setStage('preview');
  }

  async function upload() {
    if (!file || !captureToken) return;
    setStage('uploading');
    setError('');
    try {
      setStep('Preparing photo…');
      const sha256 = await sha256Hex(file);

      setStep('Requesting secure upload…');
      const ticket = await api.requestSuspectPhotoUpload(captureToken, {
        mimeType: file.type || 'image/jpeg',
        sizeBytes: file.size,
        sha256,
        capturedAt: new Date(file.lastModified || Date.now()).toISOString(),
      });

      setStep('Uploading photo…');
      const uploaded = await uploadToCloudinary(ticket, file);

      setStep('Finishing…');
      await api.completeSuspectPhotoUpload(captureToken, toCompleteInput(uploaded));
      setStage('done');
    } catch (requestError) {
      setError(requestError instanceof ApiError && (requestError.status === 404 || requestError.status === 410) ? 'This capture link has expired or was already used. Ask the officer for a new QR code.' : getError(requestError));
      setStage('preview');
    } finally {
      setStep('');
    }
  }

  return (
    <main className="centered-page">
      <div className="password-card ops-capture-card">
        <Brand compact />

        {!captureToken ? (
          <>
            <span className="eyebrow">Suspect photo</span>
            <h1>Invalid link</h1>
            <p className="muted">This capture link is incomplete. Scan the QR code on the officer's screen again.</p>
          </>
        ) : stage === 'done' ? (
          <>
            <div className="round-icon">
              <Check size={28} />
            </div>
            <span className="eyebrow">Suspect photo</span>
            <h1>Photo sent</h1>
            <p className="muted">It now shows on the officer's screen. You can close this page.</p>
          </>
        ) : (
          <>
            <span className="eyebrow">Suspect photo</span>
            <h1>{stage === 'pick' ? 'Take the suspect’s photo' : 'Check the photo'}</h1>
            <p className="muted">{stage === 'pick' ? 'Use good light and a plain background. Face the camera straight on.' : 'Make sure the face is clear and in focus before uploading.'}</p>

            {error && <div className="alert alert--error">{error}</div>}

            {previewUrl && stage !== 'pick' && <img className="ops-capture-preview" src={previewUrl} alt="Captured photo preview" />}

            {stage === 'pick' && (
              <label className="button button--primary button--wide ops-capture-button">
                <Camera size={20} /> Open camera
                <input type="file" accept="image/*" capture="environment" hidden onChange={(event) => pick(event.target.files?.[0] ?? null)} />
              </label>
            )}

            {stage === 'preview' && (
              <div className="ops-capture-actions">
                <button type="button" className="button button--primary button--wide" onClick={() => void upload()}>
                  <Upload size={18} /> Upload photo
                </button>
                <label className="button button--ghost button--wide ops-capture-button">
                  <RefreshCw size={18} /> Retake
                  <input type="file" accept="image/*" capture="environment" hidden onChange={(event) => pick(event.target.files?.[0] ?? null)} />
                </label>
              </div>
            )}

            {stage === 'uploading' && (
              <p className="muted">
                <LoaderCircle className="spin" size={16} /> {step}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}