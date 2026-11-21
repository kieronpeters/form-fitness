import { ImageOff } from 'lucide-react';
import { usePhotoUrl } from '../../hooks/usePhotoUrl';

interface PhotoThumbProps {
  photoId: string;
  alt: string;
  className?: string;
  meta?: React.ReactNode;
}

export function PhotoThumb({ photoId, alt, className, meta }: PhotoThumbProps) {
  const url = usePhotoUrl(photoId);

  return (
    <div className={className ?? 'photo-frame'}>
      {url ? (
        <img src={url} alt={alt} loading="lazy" />
      ) : (
        <div className="photo-empty">
          <ImageOff />
          <span>{url === null ? 'Loading photo…' : 'Photo'}</span>
        </div>
      )}
      {meta && <div className="photo-meta">{meta}</div>}
    </div>
  );
}
