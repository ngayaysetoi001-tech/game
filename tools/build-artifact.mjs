// Gộp game thành một file HTML duy nhất (CSS và JS nhúng sẵn) để đăng lên nơi không cho tải file phụ.
// Chạy: node tools/build-artifact.mjs <đường dẫn file ra>
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const out = process.argv[2] || join(root, 'dist', 'tram-kiep-phu-sinh.html');

// Thứ tự theo phụ thuộc: rng -> data -> events -> core -> ui
const mods = ['js/rng.js', 'js/version.js', 'js/art.js', 'js/data.js', 'js/items.js', 'js/combat.js', 'js/sprite.js', 'js/icons.js', 'js/events4.js', 'js/events3.js', 'js/events2.js', 'js/events.js', 'js/core.js', 'js/ui.js'];
const js = mods.map((m) => {
  let s = read(m);
  // tranh: nhúng thẳng vào tệp dưới dạng data URI
  if (m === 'js/art.js') s = s.replace('export const ART = Object.fromEntries(ART_LIST.map((k) => [k, `assets/${k}.webp`]));', `export const ART = ${JSON.stringify(Object.fromEntries(JSON.parse(s.match(/const ART_LIST = (\[.*?\]);/s)[1]).map((k) => [k, 'data:image/webp;base64,' + readFileSync(join(root, 'assets', k + '.webp')).toString('base64')])))};`);
  s = s.replace(/^import[\s\S]*?from\s+'[^']+';\s*$/gm, '');
  s = s.replace(/^export \{[^}]*\};?\s*$/gm, '');
  s = s.replace(/^export (class|const|function|let) /gm, '$1 ');
  return `// ---- ${m} ----\n${s}`;
}).join('\n');
if (/^\s*(import|export)\b/m.test(js)) throw new Error('còn sót import/export');
// các module gộp chung một phạm vi: báo lỗi nếu hai file khai báo trùng tên ở cấp ngoài cùng
const seen = new Map();
for (const m of mods) {
  for (const mm of read(m).matchAll(/^(?:export )?(?:const|let|function|class) ([A-Za-z_$][\w$]*)/gm)) {
    if (seen.has(mm[1])) throw new Error(`Trùng tên "${mm[1]}" giữa ${seen.get(mm[1])} và ${m}`);
    seen.set(mm[1], m);
  }
}
// phương thức trùng tên trong một class: cái sau âm thầm đè cái trước (từng làm hỏng nút Gieo lại)
for (const m of mods) {
  const names = [...read(m).matchAll(/^  (?:static |async )?([A-Za-z_$][\w$]*)\([^)]*\) \{$/gm)].map((x) => x[1]);
  const dup = names.filter((n, i) => names.indexOf(n) !== i && !['constructor'].includes(n));
  if (dup.length) throw new Error(`Phương thức trùng tên trong ${m}: ${[...new Set(dup)].join(', ')}`);
}

const html = read('index.html');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('<script type="module"')).trim();
const page = `<title>Trăm Kiếp Phù Sinh</title>
<meta name="theme-color" content="#1b1713" />
<style>
${read('style.css')}
</style>
${body}
<script type="module">
${js}
</script>
`;
writeFileSync(out, page);
console.log('Đã ghi', out, Math.round(page.length / 1024) + 'KB');
