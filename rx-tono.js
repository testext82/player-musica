/* rx-tono.js: cambio di tonalità di qualità per il Remix dal vivo (AudioWorklet).
   Stesso calcolo del salvataggio del remix: il vocoder di fase allunga il suono senza cambiarne il tono (fasi agganciate
   ai picchi, riallineate sugli attacchi), poi il ricampionamento (sinc con finestra di Kaiser) lo riporta alla durata
   giusta con il tono spostato. Ritardo fisso e noto («lat» campioni), così la batteria si può allineare. */
function btFft(re, im) {                 // FFT complessa sul posto (lunghezza potenza di 2)
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < h; k++) {
        const a = i + k, b = a + h, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}

// contenitore di campioni per più canali, con indici assoluti: si aggiunge in fondo e si scarta dall'inizio
function rxsFifo(nch) {
  const F = { base: 0, n: 0, cap: 0, d: [] };
  F.need = add => {
    if (F.d.length && F.n + add <= F.cap) return;
    const cap = Math.max(65536, (F.n + add) * 2);
    F.d = F.d.length ? F.d.map(a => { const b = new Float32Array(cap); b.set(a.subarray(0, F.n)); return b; }) : Array.from({ length: nch }, () => new Float32Array(cap));
    F.cap = cap;
  };
  F.push = chans => { const k = chans[0].length; F.need(k); for (let c = 0; c < nch; c++) F.d[c].set(chans[c], F.n); F.n += k; };
  F.zeros = k => { F.need(k); for (let c = 0; c < nch; c++) F.d[c].fill(0, F.n, F.n + k); F.n += k; };
  F.end = () => F.base + F.n;
  F.drop = abs => {                       // scarta tutto ciò che sta prima di «abs»
    const k = Math.max(0, Math.min(F.n, abs - F.base)); if (!k) return;
    for (let c = 0; c < nch; c++) F.d[c].copyWithin(0, k, F.n);
    F.n -= k; F.base += k;
  };
  F.take = (a, b) => F.d.map(x => x.slice(a - F.base, b - F.base));       // copia [a, b)
  return F;
}

/* cambio di velocità senza cambiare la tonalità: vocoder di fase con aggancio delle fasi ai picchi (Laroche-Dolson)
   e fasi riallineate sui colpi forti, così l'attacco di batteria e chitarre resta netto.
   alpha > 1 allunga (più lento), alpha < 1 accorcia. Il campione n in uscita corrisponde al campione n / alpha in entrata. */
var RXS_TR = 0.25;
function rxsStretcher(nch, N, alpha) {
  const H = N >> 2, B = N >> 1, win = new Float64Array(N), om = new Float64Array(B + 1);
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
  for (let k = 0; k <= B; k++) om[k] = 2 * Math.PI * k / N;
  const NORM = 1 / (1.5 * N);                            // Hann² con sovrapposizione di 3/4 somma a 1,5; 1/N dell'antitrasformata
  const IN = rxsFifo(nch), OUT = rxsFifo(nch), re = new Float64Array(N), im = new Float64Array(N);
  const mag = [], ana = [], prevAna = [], prevMag = [], syn = [], peaks = new Int32Array(B + 1);
  for (let c = 0; c < nch; c++) { mag.push(new Float64Array(B + 1)); ana.push(new Float64Array(B + 1)); prevAna.push(new Float64Array(B + 1)); prevMag.push(new Float64Array(B + 1)); syn.push(new Float64Array(B + 1)); }
  const lm = new Float64Array(B + 1), hist = [];
  let m = 0, prevA0 = 0, ended = false, emitted = 0, sinceReset = 99, resets = 0, frames = 0;
  OUT.zeros(0);
  function frame() {
    const ca = m * H / alpha, a0 = Math.round(ca) - B;
    for (let i = 0; i < N; i++) {
      const j = a0 + i - IN.base, ok = j >= 0 && j < IN.n;
      re[i] = ok ? IN.d[0][j] * win[i] : 0; im[i] = ok && nch > 1 ? IN.d[1][j] * win[i] : 0;
    }
    btFft(re, im);
    // spettri dei due canali dal trasformato complesso unico
    for (let k = 0; k <= B; k++) {
      const k2 = (N - k) % N;
      let ar, ai, br = 0, bi = 0;
      if (nch > 1) { ar = (re[k] + re[k2]) / 2; ai = (im[k] - im[k2]) / 2; br = (im[k] + im[k2]) / 2; bi = (re[k2] - re[k]) / 2; }
      else { ar = re[k]; ai = im[k]; }
      mag[0][k] = Math.sqrt(ar * ar + ai * ai); ana[0][k] = Math.atan2(ai, ar);
      if (nch > 1) { mag[1][k] = Math.sqrt(br * br + bi * bi); ana[1][k] = Math.atan2(bi, br); }
    }
    // colpo forte? (lo spettro cresce di colpo molto più del solito)
    let up = 0, tot = 0;
    for (let k = 1; k < B; k++) { let s = 0; for (let c = 0; c < nch; c++) s += mag[c][k]; if (m) up += Math.max(0, s - lm[k]); tot += s; lm[k] = s; }
    const flux = tot > 0 ? up / tot : 0;
    const med = hist.length >= 8 ? hist.slice().sort((x, y) => x - y)[hist.length >> 1] : Infinity;
    const reset = m === 0 || (sinceReset >= 4 && flux > RXS_TR && flux > 2.5 * med);
    hist.push(flux); if (hist.length > 24) hist.shift();
    if (reset) { sinceReset = 0; if (m) resets++; } else sinceReset++;
    const hop = a0 - prevA0;
    for (let c = 0; c < nch; c++) {
      const M = mag[c], A = ana[c], P = prevAna[c], S = syn[c], PM = prevMag[c];
      if (m === 0 || hop <= 0) S.set(A);
      else {
        let np = 0;
        for (let k = 2; k < B - 1; k++) if (M[k] > M[k - 1] && M[k] >= M[k + 1] && M[k] > M[k - 2] && M[k] >= M[k + 2]) peaks[np++] = k;
        const adv = k => { let d = A[k] - P[k] - om[k] * hop; d -= 2 * Math.PI * Math.round(d / (2 * Math.PI)); return S[k] + (om[k] + d / hop) * H; };
        if (!np) for (let k = 0; k <= B; k++) S[k] = adv(k);
        else {
          let lo = 0;
          for (let q = 0; q < np; q++) {
            const pk = peaks[q], hi = q + 1 < np ? (pk + peaks[q + 1]) >> 1 : B, s = adv(pk), d = s - A[pk];
            for (let k = lo; k <= hi; k++) S[k] = k === pk ? s : A[k] + d;
            lo = hi + 1;
          }
        }
        // sul colpo riallineo solo le frequenze che crescono di colpo (+6 dB): le note che continuano non si toccano
        if (reset) for (let k = 1; k < B; k++) if (M[k] > 2 * PM[k]) S[k] = A[k];
        S[0] = A[0]; S[B] = A[B];
      }
      P.set(A); PM.set(M);
    }
    prevA0 = a0;
    // antitrasformata dei due canali insieme: Z = Y0 + i·Y1
    for (let k = 0; k <= B; k++) {
      const a = mag[0][k] * Math.cos(syn[0][k]), b = mag[0][k] * Math.sin(syn[0][k]);
      const cc = nch > 1 ? mag[1][k] * Math.cos(syn[1][k]) : 0, d = nch > 1 ? mag[1][k] * Math.sin(syn[1][k]) : 0;
      // coniugo per usare la trasformata diretta come inversa
      re[k] = a - d; im[k] = -(b + cc);
      if (k && k < B) { re[N - k] = a + d; im[N - k] = -(cc - b); }
    }
    btFft(re, im);
    const o0 = m * H - B;
    OUT.need(0);
    const need = o0 + N - OUT.end(); if (need > 0) OUT.zeros(need);
    for (let i = 0; i < N; i++) {
      const j = o0 + i - OUT.base; if (j < 0) continue;
      const w = win[i] * NORM;
      OUT.d[0][j] += re[i] * w; if (nch > 1) OUT.d[1][j] -= im[i] * w;
    }
    m++; frames++;
    IN.drop(Math.round(m * H / alpha) - B - 4);
  }
  const ready = () => { const a0 = Math.round(m * H / alpha) - B; return ended || a0 + N <= IN.end(); };
  function run() {
    while (ready() && (!ended || m * H - B < endOut)) frame();
    const upto = Math.min(m * H - B, ended ? endOut : Infinity);     // prima di qui nessun blocco aggiunge più niente
    if (upto <= emitted) return null;
    const out = OUT.take(Math.max(emitted, OUT.base), upto); OUT.drop(upto); emitted = upto;
    return out;
  }
  let endOut = Infinity;
  return {
    push(chans) { IN.push(chans); return run(); },
    end(totalOut) { ended = true; endOut = totalOut; return run(); },
    info: () => ({ frames, resets }),
  };
}

// ricampionamento di qualità (sinc con finestra di Kaiser): campione n in uscita = posizione n·rho in entrata
function rxsBesselI0(x) { let s = 1, t = 1; for (let k = 1; k < 40; k++) { t *= (x / (2 * k)) ** 2; s += t; if (t < 1e-12 * s) break; } return s; }
function rxsResampler(nch, rho) {
  const fc = Math.min(1, 1 / rho) * (rho > 1 ? 0.92 : 0.97), Z = 24, W = Math.ceil(Z / fc), PH = 512, beta = 8.6, i0b = rxsBesselI0(beta);
  const T = new Float32Array((2 * W + 1) * (PH + 1));         // tabella: h(d) per d = j + p/PH, j da -W a W
  for (let j = -W; j <= W; j++) for (let p = 0; p <= PH; p++) {
    const d = j + p / PH, x = d / W, w = Math.abs(x) >= 1 ? 0 : rxsBesselI0(beta * Math.sqrt(1 - x * x)) / i0b;
    T[(j + W) * (PH + 1) + p] = w * fc * (d === 0 ? 1 : Math.sin(Math.PI * fc * d) / (Math.PI * fc * d));
  }
  const IN = rxsFifo(nch); let n = 0, ended = false, endOut = Infinity;
  function run() {
    const avail = IN.end();
    let nEnd = ended ? endOut : Math.max(n, Math.floor((avail - W - 1) / rho));
    while (!ended && nEnd > n && Math.floor(nEnd * rho) + W >= avail) nEnd--;      // serve il campione floor(x) + W
    const len = nEnd - n; if (len <= 0) return null;
    const outs = []; for (let c = 0; c < nch; c++) outs.push(new Float32Array(len));
    for (let q = 0; q < len; q++) {
      const x = (n + q) * rho, i = Math.floor(x), pf = (x - i) * PH, p = Math.floor(pf), t = pf - p;
      const jlo = Math.max(-W, i - (IN.end() - 1)), jhi = Math.min(W - 1, i - IN.base);
      for (let c = 0; c < nch; c++) {
        const D = IN.d[c]; let s = 0;
        for (let j = jlo; j <= jhi; j++) {                // campione k = i - j, distanza d = x - k = j + frazione
          const b = (j + W) * (PH + 1) + p;
          s += D[i - j - IN.base] * (T[b] + (T[b + 1] - T[b]) * t);
        }
        outs[c][q] = s;
      }
    }
    n = nEnd; IN.drop(Math.floor(n * rho) - W - 2);
    return outs;
  }
  return { push(chans) { IN.push(chans); return run(); }, end(totalOut) { ended = true; endOut = totalOut; return run(); } };
}


class RxTono extends AudioWorkletProcessor {
  constructor(o) {
    super();
    const p = (o && o.processorOptions) || {};
    this.ratio = p.ratio || 1; this.N = p.N || 4096; this.lat = p.lat || this.N * 2;
    this.st = rxsStretcher(2, this.N, this.ratio); this.rs = rxsResampler(2, this.ratio);
    this.Q = 1 << 17; this.q = [new Float32Array(this.Q), new Float32Array(this.Q)]; this.made = 0; this.sent = 0; this.under = 0;
    this.zero = new Float32Array(128);
  }
  keep(y) {
    const n = y[0].length, Q = this.Q;
    for (let i = 0; i < n; i++) { const k = (this.made + i) & (Q - 1); this.q[0][k] = y[0][i]; this.q[1][k] = y[1] ? y[1][i] : y[0][i]; }
    this.made += n;
  }
  process(inputs, outputs) {
    const inp = inputs[0] || [], out = outputs[0], n = out[0].length;
    const L = inp[0] || this.zero, R = inp[1] || L;
    let y = this.st.push([L.slice(0, n), R.slice(0, n)]);
    if (y) { y = this.rs.push(y); if (y) this.keep(y); }
    // uscita = campione (sent - lat) del suono spostato: ritardo sempre uguale, anche se il vocoder lavora a scatti
    for (let i = 0; i < n; i++) {
      const idx = this.sent - this.lat; let a = 0, b = 0;
      if (idx >= 0 && idx < this.made && idx >= this.made - this.Q) { const k = idx & (this.Q - 1); a = this.q[0][k]; b = this.q[1][k]; }
      else if (idx >= this.made) this.under++;
      out[0][i] = a; if (out[1]) out[1][i] = b; this.sent++;
    }
    return true;
  }
}
registerProcessor('rx-tono', RxTono);
