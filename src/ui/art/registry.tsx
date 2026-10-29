import type { ReactNode } from 'react';

// Ảnh thật đặt trong src/assets/art/ được Vite gom tự động. Có ảnh thì dùng ảnh,
// không có thì dùng hình vẽ bằng code (fallback). Xem src/assets/art/README.md.
const files = import.meta.glob('../../assets/art/**/*.{webp,png,jpg,jpeg,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const byKey = new Map<string, string>();
for (const [path, url] of Object.entries(files)) {
  const key = path.replace('../../assets/art/', '').replace(/\.[a-z]+$/, '');
  byKey.set(key, url);
}

/** "Lang Vương" → "lang-vuong" */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function artUrl(key: string): string | undefined {
  return byKey.get(key);
}

/** Chuyển động nhẹ thêm cho ảnh thật (hình vẽ bằng code đã tự có chuyển động riêng) */
export type ImgMotion = 'breathe' | 'float' | 'kenburns';

export function Art({
  k,
  alt,
  className,
  motion,
  children,
}: {
  k: string;
  alt: string;
  className?: string;
  motion?: ImgMotion;
  children: ReactNode;
}) {
  const url = artUrl(k);
  return url ? <img className={`art-img ${motion ? `img-${motion}` : ''} ${className ?? ''}`} src={url} alt={alt} /> : <>{children}</>;
}

/** Có ảnh thật cho khóa này không (để chỉ thêm lớp hiệu ứng khi dùng ảnh) */
export const hasArt = (k: string) => artUrl(k) !== undefined;
