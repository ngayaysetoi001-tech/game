// Đánh số phiên bản mới (theo ngày giờ) cho js/version.js và version.json.
// Chạy trước mỗi lần đẩy bản mới: node tools/bump-version.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const d = new Date();
const p = (n) => String(n).padStart(2, '0');
const v = `${d.getUTCFullYear()}.${p(d.getUTCMonth() + 1)}.${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}`;
writeFileSync(join(root, 'js/version.js'), `// Số phiên bản, do tools/bump-version.mjs ghi. Trang so với version.json trên máy chủ để báo có bản mới.\nexport const APP_VERSION = '${v}';\n`);
writeFileSync(join(root, 'version.json'), JSON.stringify({ v }) + '\n');
console.log('Phiên bản', v);
