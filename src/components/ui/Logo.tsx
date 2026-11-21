interface LogoProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 30, className }: LogoProps) {
  return (
    <span className={className} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 512 512" width={size} height={size} fill="none">
        <rect width="512" height="512" rx="120" fill="var(--accent)" />
        <path d="M150 124h232v70H230v54h128v68H230v108h-80V124z" fill="var(--ink-on-accent)" />
      </svg>
    </span>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-mark">
        <svg viewBox="0 0 512 512" aria-hidden="true">
          <path d="M150 124h232v70H230v54h128v68H230v108h-80V124z" fill="currentColor" />
        </svg>
      </span>
      {!compact && <span className="brand-word">FORM</span>}
    </span>
  );
}
