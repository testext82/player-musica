/* Basalto · Remix: «ascolto» la musica che passa nel motore audio, per agganciare la batteria al punto che si sente davvero.
   Non registra e non salva niente: per ogni centesimo di secondo calcola solo quanto cresce l'energia in quattro bande
   (lo stesso calcolo che l'app fa sul file) e manda questi numeri, con l'orario esatto, alla pagina. */
const CUT = [150, 800, 3000];
class RxAscolto extends AudioWorkletProcessor {
  constructor() {
    super();
    this.on = true; this.a = CUT.map(f => Math.exp(-2 * Math.PI * f / sampleRate)); this.z = new Float64Array(6); this.e = new Float64Array(4);
    this.cnt = 0; this.hop = Math.round(sampleRate / 100); this.t0 = 0; this.prev = null; this.out = new Float64Array(100); this.k = 0;
    this.port.onmessage = e => { if (e.data === 'fine') this.on = false; };
  }
  process(inputs) {
    if (!this.on) return false;
    const inp = inputs[0], nch = inp ? inp.length : 0, n = nch ? inp[0].length : 128, a = this.a, z = this.z, e = this.e;
    for (let i = 0; i < n; i++) {
      let v = 0; for (let c = 0; c < nch; c++) v += inp[c][i]; if (nch) v /= nch;
      if (this.cnt === 0) this.t0 = currentTime + i / sampleRate;
      for (let b = 0; b < 3; b++) { z[2 * b] = a[b] * z[2 * b] + (1 - a[b]) * v; z[2 * b + 1] = a[b] * z[2 * b + 1] + (1 - a[b]) * z[2 * b]; }
      const l0 = z[1], l1 = z[3], l2 = z[5], b1 = l1 - l0, b2 = l2 - l1, b3 = v - l2;
      e[0] += l0 * l0; e[1] += b1 * b1; e[2] += b2 * b2; e[3] += b3 * b3;
      if (++this.cnt >= this.hop) {
        const cur = [0, 1, 2, 3].map(b => Math.log(1e-10 + e[b] / this.cnt));
        this.out[this.k++] = this.t0;
        for (let b = 0; b < 4; b++) { const d = this.prev ? cur[b] - this.prev[b] : 0; this.out[this.k++] = d > 0 ? d : 0; }
        this.prev = cur; e.fill(0); this.cnt = 0;
        if (this.k >= this.out.length) { this.port.postMessage(this.out); this.out = new Float64Array(100); this.k = 0; }
      }
    }
    return true;
  }
}
registerProcessor('rx-ascolto', RxAscolto);
