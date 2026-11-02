// Bộ sinh số ngẫu nhiên có seed (mulberry32).
// Trạng thái là một số nguyên, lưu được vào save: cùng seed + cùng lựa chọn = cùng kết quả.
export class Rng {
  constructor(seed) {
    this.s = seed >>> 0;
  }
  next() {
    let t = (this.s = (this.s + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) {
    return a + this.next() * (b - a);
  }
  int(a, b) {
    return a + Math.floor(this.next() * (b - a + 1));
  }
  chance(p) {
    return this.next() < p;
  }
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
  /** Chọn theo trọng số. wf(item) trả về trọng số >= 0. */
  weighted(arr, wf) {
    let total = 0;
    const ws = arr.map((x) => {
      const w = Math.max(0, wf(x));
      total += w;
      return w;
    });
    if (total <= 0) return null;
    let r = this.next() * total;
    for (let i = 0; i < arr.length; i++) {
      r -= ws[i];
      if (r < 0) return arr[i];
    }
    return arr[arr.length - 1];
  }
}
