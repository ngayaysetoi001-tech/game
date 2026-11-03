// Tạo danh sách tranh trong assets/ cho js/art.js và sw.js (chạy lại khi thêm tranh)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const list = [];
for (const d of ['heroes', 'monsters', 'pets', 'skills']) for (const f of readdirSync(join(root, 'assets', d)).sort()) if (f.endsWith('.webp')) list.push(`${d}/${f.replace('.webp', '')}`);
const art = readFileSync(join(root, 'js/art.js'), 'utf8').replace(/\/\/ <list>[\s\S]*?\/\/ <\/list>/, `// <list>\nconst ART_LIST = ${JSON.stringify(list)};\n// </list>`);
writeFileSync(join(root, 'js/art.js'), art);
const sw = readFileSync(join(root, 'sw.js'), 'utf8').replace(/\/\/ <art>[\s\S]*?\/\/ <\/art>/, `// <art>\n  ${list.map((k) => `'assets/${k}.webp'`).join(', ')},\n  // </art>`);
writeFileSync(join(root, 'sw.js'), sw);
console.log('tranh:', list.length);
