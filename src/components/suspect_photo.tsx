import { useCallback, useEffect, useState } from 'react';
import { ImageOff, LoaderCircle } from 'lucide-react';

import { api } from '../api';

type Props = { token: string; suspectId: string; photoId: string; alt: string };

/** Shows a stored suspect photo through its short-lived access link, refreshing the link when it expires. */
export function SuspectPhoto({ token, suspectId, photoId, alt }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [retried, setRetried] = useState(false);

  const load = useCallback(async () => {
    try {
      const access = await api.getSuspectPhotoAccess(token, suspectId, photoId);
      setUrl(access.previewUrl);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [token, suspectId, photoId]);

  useEffect(() => {
    setUrl(null);
    setRetried(false);
    void load();
  }, [load]);

  if (failed)
    return (
      <div className="ops-photo-placeholder" title="Photo unavailable">
        <ImageOff />
      </div>
    );

  if (!url)
    return (
      <div className="ops-photo-placeholder">
        <LoaderCircle className="spin" />
      </div>
    );

  return (
    <img
      className="ops-suspect-photo"
      src={url}
      alt={alt}
      onError={() => {
        // The link is valid for ~5 minutes; fetch a fresh one once.
        if (retried) return setFailed(true);
        setRetried(true);
        void load();
      }}
    />
  );
}