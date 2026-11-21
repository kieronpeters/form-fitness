import { useEffect, useRef } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useNow } from '../hooks/useNow';
import { getExercise } from '../data/exercises';
import { formatTimer } from '../lib/units';

export function RestTimerDock() {
  const timer = useAppStore((state) => state.restTimer);
  const clearRestTimer = useAppStore((state) => state.clearRestTimer);
  const adjustRestTimer = useAppStore((state) => state.adjustRestTimer);
  const haptics = useAppStore((state) => state.settings.hapticFeedback);
  const now = useNow(500, Boolean(timer));
  const notifiedRef = useRef<number | null>(null);

  const remaining = timer ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : 0;
  const expired = Boolean(timer) && remaining <= 0;

  useEffect(() => {
    if (!timer || !expired) return;
    if (notifiedRef.current === timer.startedAt) return;
    notifiedRef.current = timer.startedAt;
    if (haptics && 'vibrate' in navigator) {
      navigator.vibrate([140, 80, 140]);
    }
  }, [timer, expired, haptics]);

  if (!timer) return null;

  const exercise = getExercise(timer.label);
  const progress = timer.durationSec > 0 ? Math.min(1, remaining / timer.durationSec) : 0;

  return (
    <div className="rest-dock" data-expired={expired} role="timer" aria-live="off" aria-label="Rest timer">
      <div className="rest-dock-time">{expired ? 'Done' : formatTimer(remaining)}</div>
      <div className="rest-dock-info">
        <div className="rest-dock-label">{expired ? 'Rest complete — next set' : `${exercise?.name ?? 'Rest'} · recovery`}</div>
        <div className="rest-dock-bar">
          <span style={{ width: `${expired ? 0 : progress * 100}%` }} />
        </div>
      </div>
      {!expired && (
        <div className="row" style={{ gap: 2 }}>
          <button type="button" className="icon-btn" onClick={() => adjustRestTimer(-15)} aria-label="Reduce rest by 15 seconds">
            <Minus />
          </button>
          <button type="button" className="icon-btn" onClick={() => adjustRestTimer(15)} aria-label="Add 15 seconds">
            <Plus />
          </button>
        </div>
      )}
      <button type="button" className="icon-btn" onClick={clearRestTimer} aria-label={expired ? 'Dismiss rest timer' : 'Skip rest'}>
        <X />
      </button>
    </div>
  );
}
