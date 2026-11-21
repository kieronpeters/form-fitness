import { useEffect, useState } from 'react';
import { photoUrl } from '../lib/photoDb';

export function usePhotoUrl(photoId?: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photoId) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    photoUrl(photoId).then((value) => {
      if (!cancelled) setUrl(value);
    });
    return () => {
      cancelled = true;
    };
  }, [photoId]);

  return url;
}
