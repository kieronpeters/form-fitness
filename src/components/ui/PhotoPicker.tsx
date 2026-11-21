import { useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { compressImageFile } from '../../lib/image';
import { toast } from '../../store/toastStore';

interface PhotoPickerProps {
  children: ReactNode;
  onPick: (dataUrl: string) => void | Promise<void>;
  className?: string;
  ariaLabel?: string;
  maxDimension?: number;
  quality?: number;
}

export function PhotoPicker({
  children,
  onPick,
  className,
  ariaLabel = 'Upload photo',
  maxDimension = 1080,
  quality = 0.8,
}: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const image = await compressImageFile(file, { maxDimension, quality });
      await onPick(image.dataUrl);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not add that photo.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <label className={clsx('photo-upload', className)} aria-label={ariaLabel}>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} />
      {children}
      {busy && (
        <span className="photo-busy">
          <Loader2 className="spin" size={18} />
        </span>
      )}
    </label>
  );
}
