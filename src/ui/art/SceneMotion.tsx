import { hasArt } from './registry';

/** Sương trôi phía trước ảnh nền thật; hình vẽ bằng code đã có sương riêng nên không thêm */
export function SceneMist({ k }: { k: string }) {
  if (!hasArt(k)) return null;
  return (
    <div className="scene-mist" aria-hidden="true">
      <i />
      <i />
    </div>
  );
}

/** Hào quang đập nhịp sau nhân vật bằng ảnh thật */
export function FigureAura({ k, color }: { k: string; color: string }) {
  if (!hasArt(k)) return null;
  return <div className="scene-aura" style={{ ['--aura' as string]: color }} aria-hidden="true" />;
}
