import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  back?: boolean | string;
  compact?: boolean;
}

export function PageHeader({ eyebrow, title, subtitle, actions, back, compact }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof back === 'string') navigate(back);
    else navigate(-1);
  };

  return (
    <header className={compact ? 'page-head page-head-compact' : 'page-head'}>
      <div className="page-head-main">
        {back && (
          <button type="button" className="icon-btn icon-btn-sm" onClick={handleBack} aria-label="Go back" style={{ marginBottom: 6 }}>
            <ArrowLeft />
          </button>
        )}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-head-actions">{actions}</div>}
    </header>
  );
}
