// Kiểm tra tự động: chạy nhiều kiếp, báo lỗi nếu kỳ ngộ xuất hiện sai tuổi hoặc sai việc đang làm.
// Chạy: node tools/check-events.mjs [số thế giới]
import { Game } from '../js/core.js';
import { EVENT_MAP } from '../js/events.js';
import { MAP_MAP } from '../js/data.js';

const worlds = +(process.argv[2] || 40);
const bad = [];
const seenIds = {};
let checked = 0, paths = {}, daoDo = 0;
for (let w = 0; w < worlds; w++) {
  const g = Game.create(7000 + w);
  for (let l = 0; l < 4; l++) {
    g.start();
    let guard = 0;
    while (g.s.phase === 'play' && guard++ < 6000) {
      const P = g.P;
      const r = g.r.next();
      P.action = r < 0.3 ? 'tu_luyen' : r < 0.55 ? 'lich_luyen' : r < 0.8 ? 'muu_sinh' : 'ket_giao';
      if (P.action === 'lich_luyen' && g.r.next() < 0.1) P.map = ['ngoai_o', 'hac_phong', 'vu_an', 'xich_diem', 'co_chien', 'hu_khong'][Math.floor(g.r.next() * 6)];
      const p = g.s.pending;
      if (p) {
        const e = EVENT_MAP[p.id];
        if (p.act !== undefined && p.result === undefined && !p.checked) {
          p.checked = true;
          checked++;
          seenIds[p.id] = (seenIds[p.id] || 0) + 1;
          const ru = e.rule || {};
          if (p.age < 6 && !ru.child) bad.push(`${p.id} lúc ${p.age} tuổi (chỉ chuyện tuổi thơ trước 6 tuổi)`);
          if (p.age < (ru.age ?? 14)) bad.push(`${p.id} lúc ${p.age} tuổi (cần từ ${ru.age ?? 14})`);
          if (ru.place === 'xa' && p.act !== 'lich_luyen') bad.push(`${p.id} khi đang ${p.act} (chỉ khi lịch luyện)`);
          if (ru.place === 'thanh' && p.act !== 'muu_sinh' && p.act !== 'ket_giao') bad.push(`${p.id} khi đang ${p.act} (chỉ trong thành)`);
          if (ru.map && p.map !== ru.map) bad.push(`${p.id} ở vùng ${p.map || 'không lịch luyện'} (chỉ ở ${ru.map})`);
          if (ru.minD !== undefined && !(p.map && MAP_MAP[p.map].d >= ru.minD)) bad.push(`${p.id} ở vùng ${p.map || 'không lịch luyện'} (cần độ khó từ ${ru.minD})`);
          if (ru.realm && P.realm < ru.realm) bad.push(`${p.id} khi cảnh giới ${P.realm} (cần từ ${ru.realm})`);
          if (ru.path && P.path !== ru.path) bad.push(`${p.id} khi con đường ${P.path} (chỉ ${ru.path})`);
          if (ru.sect && !P.sect) bad.push(`${p.id} khi không có tông môn`);
          if (ru.plane !== undefined && (P.plane || 0) !== ru.plane) bad.push(`${p.id} ở giới ${P.plane} (chỉ giới ${ru.plane})`);
        }
        if (p.id === 'dao_do' && p.result === undefined) daoDo++;
        const v = g.eventView();
        if (v.done) g.dismiss(); else g.choose(Math.floor(g.r.next() * v.choices.length));
        continue;
      }
      g.tick();
    }
    if (g.P && g.P.path) paths[g.P.path] = (paths[g.P.path] || 0) + 1;
    g.chooseLegacy(g.s.deadInfo.options[0]);
  }
}
const never = Object.keys(EVENT_MAP).filter((id) => !seenIds[id] && !EVENT_MAP[id].queued);
console.log(`Kỳ ngộ ngẫu nhiên chưa xuất hiện lần nào (${never.length}): ${never.join(' ')}`);
console.log(`Đã kiểm ${checked} kỳ ngộ ngẫu nhiên trong ${worlds * 4} kiếp. Gặp ngã rẽ đạo đồ ${daoDo} lần. Con đường đã chọn:`, paths);
if (bad.length) { console.log(`SAI ${bad.length}:`); for (const b of [...new Set(bad)].slice(0, 20)) console.log('  ' + b); process.exit(1); }
console.log('Không có kỳ ngộ nào sai tuổi hay sai nơi.');
