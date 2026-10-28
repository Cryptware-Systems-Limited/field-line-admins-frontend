import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Check, Copy, LoaderCircle, RefreshCw, Smartphone, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import { api } from '../api';
import type { SuspectPhotoSession } from '../types';
import { getError } from '../utils/errors';

const POLL_MS = 3000;

type Props = {
  token: string;
  /** Called with the session ID once a photo has been uploaded (null when removed). */
  onChange: (photoSessionId: string | null) => void;
  disabled?: boolean;
};

function isUploaded(session: SuspectPhotoSession) {
  return session.status === 'UPLOADED' || Boolean(session.photo?.previewUrl);
}

function secondsLeft(expiresAt?: string | null) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Number.isFinite(ms) ? Math.max(0, Math.round(ms / 1000)) : null;
}

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Desk side of suspect photo capture: opens a session, shows its capture link as a QR code,
 * and waits for a phone to upload the photo.
 */
export function SuspectPhotoCapture({ token, onChange, disabled }: Props) {
  const [session, setSession] = useState<SuspectPhotoSession | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Latest session for the unmount cleanup.
  const sessionRef = useRef<SuspectPhotoSession | null>(null);
  sessionRef.current = session;

  const uploaded = session ? isUploaded(session) : false;
  const expired = Boolean(session && !uploaded && (remaining === 0 || ['EXPIRED', 'CANCELLED'].includes(session.status)));
  const waiting = Boolean(session && !uploaded && !expired);

  const discard = useCallback(
    (target: SuspectPhotoSession | null) => {
      if (target && !isUploaded(target)) void api.cancelSuspectPhotoSession(token, target.id).catch(() => undefined);
    },
    [token],
  );

  // Cancel a session nobody used if the form closes.
  useEffect(() => () => discard(sessionRef.current), [discard]);

  // Poll until the phone uploads.
  useEffect(() => {
    if (!session || !waiting) return;
    let active = true;
    const timer = window.setInterval(() => {
      void api
        .getSuspectPhotoSession(token, session.id)
        .then((next) => {
          if (!active) return;
          setSession((current) => ({ ...current, ...next, captureUrl: next.captureUrl ?? current?.captureUrl }));
          if (isUploaded(next)) onChange(next.id);
        })
        .catch(() => undefined);
    }, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [session?.id, waiting, token, onChange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Expiry countdown.
  useEffect(() => {
    if (!session || uploaded) return;
    setRemaining(secondsLeft(session.expiresAt));
    const timer = window.setInterval(() => setRemaining(secondsLeft(session.expiresAt)), 1000);
    return () => window.clearInterval(timer);
  }, [session?.expiresAt, uploaded]); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    discard(session);
    onChange(null);
    setStarting(true);
    setError('');
    try {
      setSession(await api.createSuspectPhotoSession(token));
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setStarting(false);
    }
  }

  function remove() {
    discard(session);
    setSession(null);
    onChange(null);
  }

  async function copyLink() {
    if (!session?.captureUrl) return;
    await navigator.clipboard.writeText(session.captureUrl).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (!session) {
    return (
      <div className="ops-photo-capture">
        {error && <div className="alert alert--error">{error}</div>}
        <p className="muted small-copy">Opens a QR code. Scan it with a phone to take the photo — it appears here once uploaded.</p>
        <button type="button" className="button button--secondary" onClick={() => void start()} disabled={starting || disabled}>
          {starting ? <LoaderCircle className="spin" size={17} /> : <Camera size={17} />} Take suspect photo
        </button>
      </div>
    );
  }

  if (uploaded) {
    const preview = session.photo?.previewUrl;
    return (
      <div className="ops-photo-capture ops-photo-capture--done">
        {preview ? <img className="ops-suspect-photo" src={preview} alt="Captured suspect" /> : <div className="ops-photo-placeholder"><Check /></div>}
        <div>
          <strong>
            <Check size={16} /> Photo received
          </strong>
          <p className="muted small-copy">It will be attached when you save the suspect.</p>
          <div className="ops-actions">
            <button type="button" className="button button--ghost" onClick={() => void start()} disabled={disabled}>
              <RefreshCw size={16} /> Retake
            </button>
            <button type="button" className="button button--ghost" onClick={remove} disabled={disabled}>
              <Trash2 size={16} /> Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ops-photo-capture">
      {expired ? (
        <div className="ops-photo-expired">
          <p className="muted small-copy">This code has expired.</p>
          <button type="button" className="button button--secondary" onClick={() => void start()} disabled={starting || disabled}>
            {starting ? <LoaderCircle className="spin" size={17} /> : <RefreshCw size={17} />} Generate a new code
          </button>
        </div>
      ) : (
        <div className="ops-qr">
          <div className="ops-qr__code">{session.captureUrl ? <QRCodeSVG value={session.captureUrl} size={176} marginSize={2} /> : <LoaderCircle className="spin" />}</div>
          <div className="ops-qr__steps">
            <strong>
              <Smartphone size={16} /> Scan with a phone camera
            </strong>
            <ol>
              <li>Open the link from the QR code.</li>
              <li>Take a clear, front-facing photo.</li>
              <li>Tap upload — it appears here automatically.</li>
            </ol>
            <p className="muted small-copy">
              <LoaderCircle className="spin" size={13} /> Waiting for photo{remaining !== null ? ` · expires in ${formatCountdown(remaining)}` : ''}
            </p>
            <div className="ops-actions">
              {session.captureUrl && (
                <button type="button" className="button button--ghost" onClick={() => void copyLink()}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy link'}
                </button>
              )}
              <button type="button" className="button button--ghost" onClick={remove}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}