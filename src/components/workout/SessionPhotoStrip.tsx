import { Camera, Plus, X } from 'lucide-react';
import type { SessionPhoto, WorkoutSession } from '../../types';
import { useAppStore } from '../../store/appStore';
import { PhotoPicker } from '../ui/PhotoPicker';
import { PhotoThumb } from '../ui/PhotoThumb';
import { toast } from '../../store/toastStore';

const POSES: Array<{ value: SessionPhoto['pose']; label: string; hint: string }> = [
  { value: 'front', label: 'Front', hint: 'Relaxed front pose' },
  { value: 'side', label: 'Side', hint: 'Side profile' },
  { value: 'free', label: 'Freeform', hint: 'Your choice' },
];

interface SessionPhotoStripProps {
  session: WorkoutSession;
  compact?: boolean;
}

export function SessionPhotoStrip({ session }: SessionPhotoStripProps) {
  const photos = useAppStore((state) => state.sessionPhotos);
  const addSessionPhoto = useAppStore((state) => state.addSessionPhoto);
  const removeSessionPhoto = useAppStore((state) => state.removeSessionPhoto);

  return (
    <section className="card photo-strip-card">
      <div className="between" style={{ marginBottom: 10 }}>
        <div>
          <p className="eyebrow">Check-in photos · optional</p>
          <p className="small strong" style={{ marginTop: 2 }}>
            Progress you can see
          </p>
        </div>
        <span className="badge badge-violet">
          <Camera size={11} /> {photos.filter((photo) => photo.sessionId === session.id).length}/3
        </span>
      </div>
      <div className="photo-strip">
        {POSES.map((pose) => {
          const photo = photos.find((item) => item.sessionId === session.id && item.pose === pose.value);
          return (
            <div className="photo-slot" key={pose.value}>
              {photo ? (
                <>
                  <PhotoThumb photoId={photo.id} alt={`${pose.label} progress photo`} />
                  <button
                    type="button"
                    className="photo-remove"
                    onClick={() => {
                      void removeSessionPhoto(photo.id);
                      toast('Photo removed.', 'success');
                    }}
                    aria-label={`Remove ${pose.label} photo`}
                  >
                    <X />
                  </button>
                  <span className="photo-slot-label">{pose.label}</span>
                </>
              ) : (
                <PhotoPicker
                  ariaLabel={`Add ${pose.label} photo`}
                  maxDimension={1080}
                  onPick={async (dataUrl) => {
                    await addSessionPhoto(session.id, pose.value, dataUrl);
                    toast(`${pose.label} photo added.`, 'success');
                  }}
                  className="photo-slot-picker"
                >
                  <span className="photo-empty">
                    <Plus />
                    <span className="strong tiny">{pose.label}</span>
                    <span className="tiny" style={{ opacity: 0.7 }}>
                      {pose.hint}
                    </span>
                  </span>
                </PhotoPicker>
              )}
            </div>
          );
        })}
      </div>
      <p className="tiny muted mt-2">Camera or gallery · stored privately on this device.</p>
    </section>
  );
}
