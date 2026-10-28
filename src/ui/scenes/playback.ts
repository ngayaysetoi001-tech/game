// Trạng thái phát lại trận đấu dùng chung. Engine tính xong trận ngay lập tức (tầng đã tăng, đồ đã rơi),
// nên các phần khác của giao diện phải "giữ" hiển thị cũ cho tới khi hoạt ảnh kết thúc, kẻo lộ kết quả sớm.

import { useSyncExternalStore } from 'react';
import type { BattleReport } from '../../engine/engine';

/** Chỉ phát lại trận vừa đánh (không phát trận đánh lúc offline hay đã cũ) */
export const FRESH_MS = 5000;

let busy = false;
let playedUntil = 0;
let mounted = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Sân đấu đang hiện trên màn hình (có thì mới phát lại trận mới) */
export function mountStage(): () => void {
  mounted++;
  return () => {
    mounted--;
    release();
  };
}

export function playedTime(): number {
  return playedUntil;
}

/** Sân đấu nhận một trận: đánh dấu đã xử lý và, nếu phát lại, bật chế độ giữ hiển thị ngay */
export function claim(b: BattleReport, play: boolean) {
  playedUntil = Math.max(playedUntil, b.time);
  if (play && !busy) {
    busy = true;
    emit();
  }
}

export function release() {
  if (busy) {
    busy = false;
    emit();
  }
}

/** Trận mới chưa được phát lại, còn mới, và sân đấu đang hiện → sắp phát (kể cả khung hình trước khi sân đấu kịp nhận) */
function aboutToPlay(b: BattleReport | null): boolean {
  return mounted > 0 && !!b?.events?.length && b.time > playedUntil && Date.now() - b.time <= FRESH_MS;
}

/**
 * true khi cần giữ nguyên hiển thị của trận đang phát: thẻ đối thủ, tiến độ tầng, chiến báo, thông báo.
 * Dùng trong render nên đồng bộ với dữ liệu mới, không có khung hình nào lộ kết quả sớm.
 */
export function useBattleHold(b: BattleReport | null): boolean {
  const playing = useSyncExternalStore(subscribe, () => busy);
  return playing || aboutToPlay(b);
}
