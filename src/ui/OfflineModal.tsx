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
          {summary.fragments > 0 && (
            <li>
              <b>{summary.fragments}</b> tàn quyển
            </li>
          )}
          {summary.items > 0 && (
            <li>
              <b>{summary.items}</b> pháp bảo
            </li>
          )}
          {summary.herbs > 0 && (
            <li>
              Thu hoạch <b>{summary.herbs}</b> thảo dược
            </li>
          )}
          {summary.pillsMade > 0 && (
            <li>
              Luyện xong <b>{summary.pillsMade}</b> viên đan
            </li>
          )}
          {summary.floors > 0 && (
            <li>
              Vượt thêm <b>{summary.floors}</b> tầng bí cảnh
            </li>
          )}
          {summary.battlesWon + summary.battlesLost > 0 && (
            <li>
              Giao chiến <b>{summary.battlesWon}</b> thắng, <b>{summary.battlesLost}</b> bại
            </li>
          )}
          {summary.seclusions > 0 && (
            <li>
              Hoàn thành <b>{summary.seclusions}</b> lần bế quan
            </li>
          )}
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
