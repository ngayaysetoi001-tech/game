// Gộp game thành một file HTML duy nhất (CSS và JS nhúng sẵn) để đăng lên nơi không cho tải file phụ.
// Chạy: node tools/build-artifact.mjs <đường dẫn file ra>
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const out = process.argv[2] || join(root, 'dist', 'tram-kiep-phu-sinh.html');

// Thứ tự theo phụ thuộc: rng -> data -> events -> core -> ui
const mods = ['js/rng.js', 'js/data.js', 'js/events.js', 'js/core.js', 'js/ui.js'];
const js = mods.map((m) => {
  let s = read(m);
  s = s.replace(/^import[\s\S]*?from\s+'[^']+';\s*$/gm, '');
  s = s.replace(/^export \{[^}]*\};?\s*$/gm, '');
  s = s.replace(/^export (class|const|function|let) /gm, '$1 ');
  return `// ---- ${m} ----\n${s}`;
}).join('\n');
if (/^\s*(import|export)\b/m.test(js)) throw new Error('còn sót import/export');

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
