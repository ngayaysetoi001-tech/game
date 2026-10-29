import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SAVE_KEY,
  applyOffline,
  deserialize,
  serialize,
  tick,
  type GameState,
  type OfflineSummary,
  type Rng,
} from '../engine/engine';
import CreateScreen from './CreateScreen';
import GameScreen from './GameScreen';
import OfflineModal from './OfflineModal';
import Gallery from './art/Gallery';

const TICK_MS = 250;
const AUTOSAVE_MS = 5000;

export type Action = (s: GameState, now: number, rng: Rng) => GameState;

function loadInitial(): { state: GameState | null; summary: OfflineSummary | null } {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch {
    // localStorage bị chặn: chơi không lưu
  }
  const saved = raw ? deserialize(raw) : null;
  if (!saved) return { state: null, summary: null };
  const { state, summary } = applyOffline(saved, Date.now(), Math.random);
  return { state, summary: summary.seconds >= 60 ? summary : null };
}

function save(s: GameState | null) {
  try {
    if (s) localStorage.setItem(SAVE_KEY, serialize(s));
    else localStorage.removeItem(SAVE_KEY);
  } catch {
    // bỏ qua
  }
}

export default function App() {
  const [initial] = useState(loadInitial);
  const [state, setState] = useState<GameState | null>(initial.state);
  const [summary, setSummary] = useState<OfflineSummary | null>(initial.summary);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const id = setInterval(() => setState((s) => s && tick(s, Date.now(), Math.random)), TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const flush = () => save(stateRef.current);
    const id = setInterval(flush, AUTOSAVE_MS);
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', flush);
    return () => {
      clearInterval(id);
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', flush);
    };
  }, []);

  const act = useCallback((fn: Action) => {
    setState((s) => s && fn(s, Date.now(), Math.random));
  }, []);

  const replace = useCallback((s: GameState | null) => {
    setState(s);
    save(s);
  }, []);

  if (typeof location !== 'undefined' && location.hash === '#gallery') {
    return (
      <main className="app">
        <Gallery />
      </main>
    );
  }

  return (
    <main className="app">
      {state ? (
        <GameScreen state={state} act={act} replace={replace} />
      ) : (
        <CreateScreen onCreate={replace} />
      )}
      {summary && <OfflineModal summary={summary} onClose={() => setSummary(null)} />}
    </main>
  );
}
