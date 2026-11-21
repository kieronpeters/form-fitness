import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

export function ToastViewport() {
  const items = useToastStore((state) => state.items);
  const dismiss = useToastStore((state) => state.dismiss);

  if (items.length === 0) return null;

  return (
    <div className="toast-viewport" role="status" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className="toast" data-tone={item.tone}>
          {item.tone === 'success' ? <CheckCircle2 /> : item.tone === 'error' ? <AlertTriangle /> : <Info />}
          <span className="grow">{item.message}</span>
          <button type="button" className="icon-btn icon-btn-sm" onClick={() => dismiss(item.id)} aria-label="Dismiss notification">
            <X />
          </button>
        </div>
      ))}
    </div>
  );
}
