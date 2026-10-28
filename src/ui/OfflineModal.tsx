import { formatDuration, formatNumber, type OfflineSummary } from '../engine/engine';

export default function OfflineModal({ summary, onClose }: { summary: OfflineSummary; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <h2>Tỉnh lại sau tĩnh tọa</h2>
        <p className="muted">Trong {formatDuration(summary.seconds)} vắng mặt, ngươi đã thu được:</p>
        <ul>
          <li>
            <b>{formatNumber(Math.max(0, summary.cultivation))}</b> tu vi
          </li>
          <li>
            <b>{formatNumber(summary.stones)}</b> linh thạch
          </li>
          {summary.levelsGained > 0 && (
            <li>
              Tinh tiến <b>{summary.levelsGained}</b> tầng
            </li>
          )}
        </ul>
        {summary.capped && (
          <p className="notice">Tu vi đã chạm bình cảnh, linh khí dư thừa tiêu tán. Hãy đột phá để tiếp tục tinh tiến!</p>
        )}
        <button className="primary" onClick={onClose}>
          Tiếp tục tu luyện
        </button>
      </div>
    </div>
  );
}
