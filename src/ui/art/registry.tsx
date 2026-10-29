import { useEffect, useState, type ReactNode } from 'react';
import { prefersReducedMotion } from './Particles';

// Ảnh thật đặt trong src/assets/art/ được Vite gom tự động. Có ảnh thì dùng ảnh,
// không có thì dùng hình vẽ bằng code (fallback). Xem src/assets/art/README.md.
const files = import.meta.glob('../../assets/art/**/*.{webp,png,jpg,jpeg,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** Ảnh nhiều khung (sprite sheet): tên file `<khóa>.sheet-<cột>x<hàng>-<fps>.<đuôi>`, các khung xếp trái sang phải, trên xuống dưới */
interface SheetMeta {
  cols: number;
  rows: number;
  fps: number;
}

const byKey = new Map<string, string>();
const sheets = new Map<string, SheetMeta>();
for (const [path, url] of Object.entries(files)) {
  let key = path.replace('../../assets/art/', '').replace(/\.[a-z]+$/, '');
  const m = key.match(/^(.*)\.sheet-(\d+)x(\d+)-(\d+)$/);
  if (m) {
    key = m[1];
    sheets.set(key, { cols: Math.max(1, +m[2]), rows: Math.max(1, +m[3]), fps: Math.max(1, +m[4]) });
  }
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

/** Phát lần lượt các khung của sprite sheet; loop=false thì dừng ở khung cuối. Giảm chuyển động thì chỉ hiện khung đầu. */
function Sheet({ url, meta, loop, alt, className }: { url: string; meta: SheetMeta; loop: boolean; alt: string; className: string }) {
  const { cols, rows, fps } = meta;
  const total = cols * rows;
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion() || total <= 1) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      if (i >= total) {
        if (!loop) {
          clearInterval(t);
          return;
        }
        i = 0;
      }
      setFrame(i);
    }, 1000 / fps);
    return () => clearInterval(t);
  }, [total, fps, loop]);
  const col = frame % cols;
  const row = Math.floor(frame / cols);
  return (
    <div
      className={`art-img art-sheet ${className}`}
      role="img"
      aria-label={alt}
      style={{
        backgroundImage: `url(${url})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `${cols > 1 ? (col / (cols - 1)) * 100 : 0}% ${rows > 1 ? (row / (rows - 1)) * 100 : 0}%`,
      }}
    />
  );
}

export function Art({
  k,
  alt,
  className,
  motion,
  loop = true,
  children,
}: {
  k: string;
  alt: string;
  className?: string;
  motion?: ImgMotion;
  /** Chỉ dùng cho ảnh nhiều khung: false = phát một lần */
  loop?: boolean;
  children: ReactNode;
}) {
  const url = artUrl(k);
  if (!url) return <>{children}</>;
  const cls = `${motion ? `img-${motion}` : ''} ${className ?? ''}`;
  const meta = sheets.get(k);
  if (meta) return <Sheet url={url} meta={meta} loop={loop} alt={alt} className={cls} />;
  return <img className={`art-img ${cls}`} src={url} alt={alt} />;
}

/** Có ảnh thật cho khóa này không (để chỉ thêm lớp hiệu ứng khi dùng ảnh) */
export const hasArt = (k: string) => artUrl(k) !== undefined;
