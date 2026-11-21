import clsx from 'clsx';
import { initials } from '../../lib/image';

interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
  square?: boolean;
  ring?: boolean;
  className?: string;
}

export function Avatar({ name, src, size = 40, square, ring, className }: AvatarProps) {
  return (
    <span
      className={clsx('avatar', square && 'avatar-sq', ring && 'avatar-ring', className)}
      style={{ ['--size' as string]: `${size}px` }}
      aria-label={name}
    >
      {src ? <img src={src} alt="" /> : <span aria-hidden="true">{initials(name) || 'F'}</span>}
    </span>
  );
}
