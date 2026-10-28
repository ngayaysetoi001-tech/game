import { useEffect, useRef, useState } from 'react';
import { canBreakthrough, type GameState, type LogEntry } from '../engine/engine';
import { useBattleHold } from './scenes/playback';

interface Toast {
  id: number;
  text: string;
  kind: LogEntry['kind'];
}

const SHOW_MS = 3800;
const MAX_TOASTS = 3;
let nextId = 1;

/** Thông báo nổi cho các dòng nhật ký quan trọng (good/bad) và khi có thể đột phá */
export default function Toasts({ s }: { s: GameState }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Mốc nhật ký đã thấy; lần render đầu coi như đã thấy hết (popup offline đã tóm tắt)
  const seen = useRef<LogEntry | undefined>(s.log[0]);
  const couldBreak = useRef(canBreakthrough(s));
  // Đang phát lại trận thì chưa báo kết quả (vượt tầng, rơi đồ…); báo dồn sau khi hoạt ảnh xong
  const held = useBattleHold(s.lastBattle);

  useEffect(() => {
    if (held) return;
    const fresh: Toast[] = [];
    for (const entry of s.log) {
      if (entry === seen.current || (seen.current && entry.time === seen.current.time && entry.text === seen.current.text)) break;
      if (entry.kind !== 'info') fresh.push({ id: nextId++, text: entry.text, kind: entry.kind });
      if (fresh.length >= MAX_TOASTS) break;
    }
    seen.current = s.log[0];

    const can = canBreakthrough(s);
    if (can && !couldBreak.current) fresh.unshift({ id: nextId++, text: 'Tu vi đã đầy, có thể đột phá!', kind: 'good' });
    couldBreak.current = can;

    if (fresh.length) setToasts((t) => [...fresh, ...t].slice(0, MAX_TOASTS));
  }, [s, held]);

  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((list) => list.slice(0, -1)), SHOW_MS);
    return () => clearTimeout(t);
  }, [toasts]);

  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <button key={t.id} className={`toast ${t.kind}`} onClick={() => setToasts((l) => l.filter((x) => x.id !== t.id))}>
          {t.text}
        </button>
      ))}
    </div>
  );
}
