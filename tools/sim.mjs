// Mô phỏng không giao diện: chơi tự động nhiều kiếp để kiểm lỗi và cân bằng.
// Chạy: node tools/sim.mjs [số thế giới] [số kiếp mỗi thế giới]
import { Game, REALMS } from '../js/core.js';

const worlds = +(process.argv[2] || 20);
const livesPer = +(process.argv[3] || 8);
const realmHist = new Array(REALMS.length).fill(0);
let asc = 0, totalAge = 0, n = 0, years = 0;
const causes = {};
const t0 = Date.now();

for (let w = 0; w < worlds; w++) {
  let g = Game.create(1000 + w);
  for (let l = 0; l < livesPer; l++) {
    g.start();
    let guard = 0;
    while (g.s.phase === 'play' && guard++ < 5000) {
      const P = g.P;
      // chiến lược đơn giản: tu luyện, thỉnh thoảng làm việc khác
      const r = g.r.next();
      P.action = !P.dao ? (P.age >= 10 ? 'lich_luyen' : 'muu_sinh') : r < 0.6 ? 'tu_luyen' : r < 0.75 ? 'ket_giao' : r < 0.9 ? 'lich_luyen' : 'muu_sinh';
      if (P.hp < 50 && (P.pills.hoi_xuan || 0) > 0) g.usePill('hoi_xuan');
      if (P.money > g.pillPrice('pha_canh') * 2) g.buy('pha_canh');
      if (g.s.pending) {
        const v = g.eventView();
        if (v.done) g.dismiss();
        else g.choose(Math.floor(g.r.next() * v.choices.length));
        continue;
      }
      g.tick();
      years++;
    }
    if (g.s.phase !== 'dead') throw new Error('kiếp không kết thúc: ' + g.s.phase);
    const rec = g.s.deadInfo.rec;
    realmHist[rec.realm]++;
    if (rec.asc) asc++;
    totalAge += rec.age; n++;
    const key = rec.cause.replace(/ [A-ZĐ][^ ]* [A-ZĐ][^ ,]*/g, ' X');
    causes[key] = (causes[key] || 0) + 1;
    g.chooseLegacy(g.s.deadInfo.options[0]);
    // kiểm tra lưu/tải giữa các kiếp
    g = Game.load(g.save());
  }
}
console.log(`${n} kiếp, ${years} năm, ${Date.now() - t0}ms`);
console.log('Tuổi thọ trung bình:', (totalAge / n).toFixed(1), '| Phi thăng:', asc);
console.log('Cảnh giới lúc chết:');
REALMS.forEach((r, i) => console.log(`  ${r.n.padEnd(12)} ${realmHist[i]}`));
console.log('Cách chết hay gặp:');
Object.entries(causes).sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([k, v]) => console.log(`  ${v}\t${k}`));
