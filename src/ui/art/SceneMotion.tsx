import type { ReactNode } from 'react';
import { Art, hasArt, type ImgMotion } from './registry';

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

/** Hiệu ứng một lần bằng ảnh nhiều khung / ảnh động đặt đè lên cảnh; không có ảnh thì không hiện gì */
export function OneShotFx({ k, className = '' }: { k: string; className?: string }) {
  if (!hasArt(k)) return null;
  return (
    <div className={`oneshot-fx ${className}`} aria-hidden="true">
      <Art k={k} alt="" loop={false}>
        {null}
      </Art>
    </div>
  );
}

const POSES = ['attack', 'cast', 'hit', 'defeated'] as const;

/**
 * Nhân vật / quái có thể có ảnh riêng cho từng tư thế: `<tiền tố>-attack`, `-cast`, `-hit`, `-defeated`.
 * Tư thế nào có ảnh thì hiện thay ảnh gốc khi khung chiến đấu có lớp tương ứng; thiếu thì vẫn dùng ảnh gốc.
 */
export function PoseArt({
  base,
  prefix,
  alt,
  motion,
  children,
}: {
  base: string;
  prefix: string;
  alt: string;
  motion?: ImgMotion;
  children: ReactNode;
}) {
  const have = POSES.filter((p) => hasArt(`${prefix}-${p}`));
  return (
    <div className={`pose-stack ${have.map((p) => `has-${p}`).join(' ')}`}>
      <Art k={base} alt={alt} motion={motion} className="pose-base">
        {children}
      </Art>
      {have.map((p) => (
        <Art key={p} k={`${prefix}-${p}`} alt={alt} className={`pose pose-${p}`}>
          {null}
        </Art>
      ))}
    </div>
  );
}
