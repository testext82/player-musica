/* rx-tono.js: cambio di tonalità di qualità per il Remix dal vivo (AudioWorklet).
   Stesso calcolo del salvataggio del remix: il vocoder di fase allunga il suono senza cambiarne il tono (fasi agganciate
   ai picchi, riallineate sugli attacchi), poi il ricampionamento (sinc con finestra di Kaiser) lo riporta alla durata
   giusta con il tono spostato. Ritardo fisso e noto («lat» campioni), così la batteria si può allineare.
   v1.42, contro i gracchi:
   · un blocco del vocoder si calcolava tutto in una sola chiamata del motore audio (1-4 ms, quando il motore ne concede 2,7
     per 128 campioni a 48 kHz): ora è diviso in 4 passi, uno per chiamata; anche il ricampionamento va a ritmo costante;
   · le fasi vengono riportate tra −π e π: prima crescevano senza fine (stesso suono, ma ora restano piccole e precise);
   · durante l'ascolto non viene creato nessun oggetto (niente pulizie della memoria in mezzo al suono);
   · limitatore a −0,1 dBFS con 5 ms di anticipo, come nel salvataggio: spostando il tono i picchi possono superare 0 dBFS
     di 1-2 dB e prima venivano tagliati di netto;
   · quando la pagina sostituisce il modulo (nuova tonalità) gli dice di fermarsi: prima restava acceso a calcolare.
   Il calcolo è lo stesso di prima (verificato campione per campione), cambia solo quando viene fatto. */
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

const RXT_HR = typeof performance !== 'undefined' && !!performance && typeof performance.now === 'function';   // orologio fine? (altrimenti al millisecondo)
const RXT_NOW = RXT_HR ? () => performance.now() : () => Date.now();

// contenitore di campioni stereo con indici assoluti: si aggiunge in fondo e si scarta dall'inizio.
// Cresce solo nei primi istanti, poi riusa sempre la stessa memoria.
function rxtFifo() {
  const F = { base: 0, n: 0, cap: 0, d: [null, null] };
  F.need = add => {
    if (F.d[0] && F.n + add <= F.cap) return;
    const cap = Math.max(65536, (F.n + add) * 2);
    for (let c = 0; c < 2; c++) { const b = new Float32Array(cap); if (F.d[c]) b.set(F.d[c].subarray(0, F.n)); F.d[c] = b; }
    F.cap = cap;
  };
  F.push = (L, R, k) => { F.need(k); const a = F.d[0], b = F.d[1], o = F.n; for (let i = 0; i < k; i++) { a[o + i] = L[i]; b[o + i] = R[i]; } F.n += k; };
  F.pushRange = (S, from, to) => {        // copia [from, to) da un altro contenitore
    const k = to - from; if (k <= 0) return; F.need(k);
    const o = F.n, s = from - S.base;
    for (let c = 0; c < 2; c++) { const D = F.d[c], X = S.d[c]; for (let i = 0; i < k; i++) D[o + i] = X[s + i]; }
    F.n += k;
  };
  F.zeros = k => { F.need(k); F.d[0].fill(0, F.n, F.n + k); F.d[1].fill(0, F.n, F.n + k); F.n += k; };
  F.end = () => F.base + F.n;
  F.drop = abs => {                       // scarta tutto ciò che sta prima di «abs»
    const k = Math.max(0, Math.min(F.n, abs - F.base)); if (!k) return;
    F.d[0].copyWithin(0, k, F.n); F.d[1].copyWithin(0, k, F.n);
    F.n -= k; F.base += k;
  };
  return F;
}

/* cambio di velocità senza cambiare la tonalità: vocoder di fase con aggancio delle fasi ai picchi (Laroche-Dolson)
   e fasi riallineate sui colpi forti, così l'attacco di batteria e chitarre resta netto.
   alpha > 1 allunga (più lento), alpha < 1 accorcia. Il campione n in uscita corrisponde al campione n / alpha in entrata.
   Ogni blocco si calcola in 4 passi (work), uno per chiamata del motore audio. */
var RXS_TR = 0.25;
function rxtStretch(N, alpha) {
  const H = N >> 2, B = N >> 1, win = new Float64Array(N), om = new Float64Array(B + 1), TAU = 2 * Math.PI;
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
  for (let k = 0; k <= B; k++) om[k] = 2 * Math.PI * k / N;
  const NORM = 1 / (1.5 * N);                            // Hann² con sovrapposizione di 3/4 somma a 1,5; 1/N dell'antitrasformata
  const IN = rxtFifo(), OUT = rxtFifo(), re = new Float64Array(N), im = new Float64Array(N);
  const mk = () => [new Float64Array(B + 1), new Float64Array(B + 1)];
  const mag = mk(), ana = mk(), prevAna = mk(), prevMag = mk(), syn = mk(), peaks = new Int32Array(B + 1);
  const lm = new Float64Array(B + 1), hist = new Float64Array(24), srt = new Float64Array(24);
  let hn = 0, hpos = 0;                                  // ultimi 24 valori di «flux» (in giro)
  let m = 0, prevA0 = 0, a0 = 0, step = 0, reset = false, sinceReset = 99, resets = 0, frames = 0, emitted = 0;
  OUT.zeros(0);
  const startOf = k => Math.round(k * H / alpha) - B;    // primo campione in entrata del blocco k
  // passo 1: finestra e trasformata dei due canali insieme (sinistro reale, destro immaginario)
  function s1() {
    a0 = startOf(m);
    const L = IN.d[0], R = IN.d[1], off = a0 - IN.base, n = IN.n;
    for (let i = 0; i < N; i++) {
      const j = off + i, ok = j >= 0 && j < n;
      re[i] = ok ? L[j] * win[i] : 0; im[i] = ok ? R[j] * win[i] : 0;
    }
    btFft(re, im);
  }
  // passo 2: ampiezza e fase di ogni canale; colpo forte? (lo spettro cresce di colpo molto più del solito)
  function s2() {
    const M0 = mag[0], M1 = mag[1], A0 = ana[0], A1 = ana[1];
    for (let k = 0; k <= B; k++) {
      const k2 = (N - k) % N;
      const ar = (re[k] + re[k2]) / 2, ai = (im[k] - im[k2]) / 2, br = (im[k] + im[k2]) / 2, bi = (re[k2] - re[k]) / 2;
      M0[k] = Math.sqrt(ar * ar + ai * ai); A0[k] = Math.atan2(ai, ar);
      M1[k] = Math.sqrt(br * br + bi * bi); A1[k] = Math.atan2(bi, br);
    }
    let up = 0, tot = 0;
    for (let k = 1; k < B; k++) { const s = M0[k] + M1[k]; if (m) up += Math.max(0, s - lm[k]); tot += s; lm[k] = s; }
    const flux = tot > 0 ? up / tot : 0;
    let med = Infinity;
    if (hn >= 8) {                                       // mediana degli ultimi valori (ordinamento per inserzione, senza memoria nuova)
      for (let i = 0; i < hn; i++) { const v = hist[i]; let j = i - 1; while (j >= 0 && srt[j] > v) { srt[j + 1] = srt[j]; j--; } srt[j + 1] = v; }
      med = srt[hn >> 1];
    }
    reset = m === 0 || (sinceReset >= 4 && flux > RXS_TR && flux > 2.5 * med);
    if (hn < 24) hist[hn++] = flux; else { hist[hpos] = flux; hpos = (hpos + 1) % 24; }
    if (reset) { sinceReset = 0; if (m) resets++; } else sinceReset++;
  }
  // passo 3: fasi in uscita, agganciate ai picchi; sul colpo riallineo solo le frequenze che crescono di colpo (+6 dB)
  function s3() {
    const hop = a0 - prevA0;
    for (let c = 0; c < 2; c++) {
      const M = mag[c], A = ana[c], P = prevAna[c], S = syn[c], PM = prevMag[c];
      if (m === 0 || hop <= 0) S.set(A);
      else {
        let np = 0;
        for (let k = 2; k < B - 1; k++) if (M[k] > M[k - 1] && M[k] >= M[k + 1] && M[k] > M[k - 2] && M[k] >= M[k + 2]) peaks[np++] = k;
        if (!np) for (let k = 0; k <= B; k++) { let d = A[k] - P[k] - om[k] * hop; d -= TAU * Math.round(d / TAU); S[k] = S[k] + (om[k] + d / hop) * H; }
        else {
          let lo = 0;
          for (let q = 0; q < np; q++) {
            const pk = peaks[q], hi = q + 1 < np ? (pk + peaks[q + 1]) >> 1 : B;
            let d = A[pk] - P[pk] - om[pk] * hop; d -= TAU * Math.round(d / TAU);
            const s = S[pk] + (om[pk] + d / hop) * H, dd = s - A[pk];
            for (let k = lo; k <= hi; k++) S[k] = k === pk ? s : A[k] + dd;
            lo = hi + 1;
          }
        }
        if (reset) for (let k = 1; k < B; k++) if (M[k] > 2 * PM[k]) S[k] = A[k];
        S[0] = A[0]; S[B] = A[B];
        // fasi tra −π e π: stesso suono, ma coseno e seno restano veloci e precisi
        for (let k = 1; k < B; k++) { const v = S[k]; if (v > 3.2 || v < -3.2) S[k] = v - TAU * Math.round(v / TAU); }
      }
      P.set(A); PM.set(M);
    }
    prevA0 = a0;
  }
  // passo 4: antitrasformata dei due canali insieme (Z = Y0 + i·Y1) e somma con sovrapposizione
  function s4() {
    const M0 = mag[0], M1 = mag[1], S0 = syn[0], S1 = syn[1];
    for (let k = 0; k <= B; k++) {
      const a = M0[k] * Math.cos(S0[k]), b = M0[k] * Math.sin(S0[k]), cc = M1[k] * Math.cos(S1[k]), d = M1[k] * Math.sin(S1[k]);
      re[k] = a - d; im[k] = -(b + cc);                  // coniugo per usare la trasformata diretta come inversa
      if (k && k < B) { re[N - k] = a + d; im[N - k] = -(cc - b); }
    }
    btFft(re, im);
    const o0 = m * H - B;
    OUT.need(0);
    const need = o0 + N - OUT.end(); if (need > 0) OUT.zeros(need);
    const L = OUT.d[0], R = OUT.d[1], off = o0 - OUT.base;
    for (let i = 0; i < N; i++) {
      const j = off + i; if (j < 0) continue;
      const w = win[i] * NORM;
      L[j] += re[i] * w; R[j] -= im[i] * w;
    }
    m++; frames++;
    IN.drop(startOf(m) - 4);
  }
  return {
    IN,
    work() {                                             // un passo, se c'è; true se ha lavorato
      if (step === 0) { if (startOf(m) + N > IN.end()) return false; s1(); step = 1; return true; }
      if (step === 1) { s2(); step = 2; return true; }
      if (step === 2) { s3(); step = 3; return true; }
      s4(); step = 0; return true;
    },
    behind: () => startOf(m + 1) + N <= IN.end(),        // è già pronto anche il blocco dopo: sono indietro
    flushTo(D) {                                         // il suono ormai definitivo passa al ricampionamento
      const upto = m * H - B; if (upto <= emitted) return;
      D.pushRange(OUT, Math.max(emitted, OUT.base), upto); OUT.drop(upto); emitted = upto;
    },
    info: () => ({ frames, resets }),
  };
}

// ricampionamento di qualità (sinc con finestra di Kaiser): campione n in uscita = posizione n·rho in entrata.
// run(max) produce al massimo «max» campioni: così lavora un po' a ogni chiamata invece che tutto insieme.
function rxsBesselI0(x) { let s = 1, t = 1; for (let k = 1; k < 40; k++) { t *= (x / (2 * k)) ** 2; s += t; if (t < 1e-12 * s) break; } return s; }
function rxtResampler(rho) {
  const fc = Math.min(1, 1 / rho) * (rho > 1 ? 0.92 : 0.97), Z = 24, W = Math.ceil(Z / fc), PH = 512, beta = 8.6, i0b = rxsBesselI0(beta);
  const T = new Float32Array((2 * W + 1) * (PH + 1));         // tabella: h(d) per d = j + p/PH, j da -W a W
  for (let j = -W; j <= W; j++) for (let p = 0; p <= PH; p++) {
    const d = j + p / PH, x = d / W, w = Math.abs(x) >= 1 ? 0 : rxsBesselI0(beta * Math.sqrt(1 - x * x)) / i0b;
    T[(j + W) * (PH + 1) + p] = w * fc * (d === 0 ? 1 : Math.sin(Math.PI * fc * d) / (Math.PI * fc * d));
  }
  const IN = rxtFifo(); let n = 0;
  function run(max, oL, oR) {
    const avail = IN.end();
    let nEnd = Math.max(n, Math.floor((avail - W - 1) / rho));
    while (nEnd > n && Math.floor(nEnd * rho) + W >= avail) nEnd--;      // serve il campione floor(x) + W
    let len = nEnd - n; if (len > max) len = max; if (len <= 0) return 0;
    const D0 = IN.d[0], D1 = IN.d[1], base = IN.base, last = IN.end() - 1;
    for (let q = 0; q < len; q++) {
      const x = (n + q) * rho, i = Math.floor(x), pf = (x - i) * PH, p = Math.floor(pf), t = pf - p;
      const jlo = Math.max(-W, i - last), jhi = Math.min(W - 1, i - base);
      let s0 = 0, s1 = 0;
      for (let j = jlo; j <= jhi; j++) {                // campione k = i - j, distanza d = x - k = j + frazione
        const b = (j + W) * (PH + 1) + p, h = T[b] + (T[b + 1] - T[b]) * t, k = i - j - base;
        s0 += D0[k] * h; s1 += D1[k] * h;
      }
      oL[q] = s0; oR[q] = s1;
    }
    n += len; IN.drop(Math.floor(n * rho) - W - 2);
    return len;
  }
  return { IN, run, W };
}

/* limitatore di sicurezza (lo stesso del salvataggio): guarda 5 ms avanti e abbassa solo i picchi oltre «ceil»,
   con attacco morbido sui 5 ms e rilascio di 150 ms. Sotto il limite non tocca niente.
   put(j, pk) riceve il picco del campione j e restituisce il guadagno da dare al campione j − L. */
function rxtLimiter(sr, ceil) {
  const L = Math.max(8, Math.round(sr * 0.005)), rel = 1 - Math.exp(-1 / (0.15 * sr)), QL = 4 * L + 8;
  const box = new Float64Array(L).fill(1), dq = new Float64Array(QL), dv = new Float64Array(QL);
  let bi = 0, bsum = L, g = 1, dh = 0, dt = 0, t = 0;
  return {
    L,
    put(pk) {
      const req = pk > ceil ? ceil / pk : 1;
      while (dt > dh && dv[(dt - 1) % QL] >= req) dt--;
      dq[dt % QL] = t; dv[dt % QL] = req; dt++;
      while (dq[dh % QL] <= t - 2 * L) dh++;
      const h = dv[dh % QL];
      bsum += h - box[bi]; box[bi] = h; bi = (bi + 1) % L;
      if (!(t & 65535)) { bsum = 0; for (let i = 0; i < L; i++) bsum += box[i]; }   // ogni tanto ricalcolo la somma: niente errori che si accumulano
      const g2 = Math.min(1, bsum / L);
      g = g2 < g ? g2 : g + (g2 - g) * rel;
      t++;
      return g;
    },
  };
}

let RXT_LIVE = 0;                         // moduli di tonalità accesi in questo motore audio (per il registro)
const RXT_AHEAD = 512;                    // il ricampionamento tiene pronto il suono fino a 512 campioni oltre quello che serve
class RxTono extends AudioWorkletProcessor {
  constructor(o) {
    super();
    const p = (o && o.processorOptions) || {};
    this.ratio = p.ratio || 1; this.N = p.N || 4096; this.lat = p.lat || this.N * 2;
    this.st = rxtStretch(this.N, this.ratio); this.rs = rxtResampler(this.ratio); this.lim = rxtLimiter(sampleRate, 0.989);
    this.Q = 1 << 17; this.q = [new Float32Array(this.Q), new Float32Array(this.Q)];
    this.prod = 0; this.made = 0; this.sent = 0;      // prodotti dal ricampionamento · pronti (limitatore applicato) · mandati in uscita
    this.zero = new Float32Array(128); this.yL = new Float32Array(1024); this.yR = new Float32Array(1024);
    this.on = true; RXT_LIVE++;
    this.calls = 0; this.busy = 0; this.maxMs = 0; this.under = 0; this.limN = 0; this.minG = 1; this.statN = 0; this.next = Math.round(sampleRate * 5);
    this.port.onmessage = e => { if (e.data === 'fine' && this.on) { this.on = false; RXT_LIVE--; } };
  }
  process(inputs, outputs) {
    if (!this.on) return false;                     // sostituito: il motore audio può liberarlo
    const t0 = RXT_NOW();
    const inp = inputs[0] || [], out = outputs[0], n = out[0].length, Q = this.Q, M = Q - 1, qL = this.q[0], qR = this.q[1];
    const L = inp[0] || this.zero, R = inp[1] || L, st = this.st;
    st.IN.push(L, R, n);
    if (st.work() && st.behind()) st.work();        // vocoder: un passo per chiamata, due se è indietro di un blocco
    st.flushTo(this.rs.IN);
    // ricampionamento a ritmo costante, poi limitatore: il guadagno del campione j arriva quando ho visto fino a j + L
    const want = this.sent + n - this.lat + this.lim.L + RXT_AHEAD - this.prod;
    if (want > 0) {
      const k = this.rs.run(Math.min(want, 1024), this.yL, this.yR), lim = this.lim, Ll = lim.L;
      for (let i = 0; i < k; i++) {
        const a = this.yL[i], b = this.yR[i], j = this.prod++, w = j & M;
        qL[w] = a; qR[w] = b;
        const g = lim.put(Math.max(a < 0 ? -a : a, b < 0 ? -b : b));
        if (j >= Ll) {
          if (g < 0.99999) { const r = (j - Ll) & M; qL[r] *= g; qR[r] *= g; if (g < 0.944) this.limN++; if (g < this.minG) this.minG = g; }   // limN: abbassati di oltre 0,5 dB
          this.made = j - Ll + 1;
        }
      }
    }
    // uscita = campione (sent - lat) del suono spostato: ritardo sempre uguale, anche se il vocoder lavora a scatti
    for (let i = 0; i < n; i++) {
      const idx = this.sent - this.lat; let a = 0, b = 0;
      if (idx >= 0) {
        if (idx < this.made && idx >= this.made - Q) { const k = idx & M; a = qL[k]; b = qR[k]; }
        else if (idx >= this.made) this.under++;
      }
      out[0][i] = a; if (out[1]) out[1][i] = b; this.sent++;
    }
    // registro: quanto pesa il calcolo, buchi, picchi abbassati (la prima volta dopo 5 s, poi ogni 30 s)
    const dt = RXT_NOW() - t0; this.busy += dt; if (dt > this.maxMs) this.maxMs = dt; this.calls++; this.statN += n;
    if (this.statN >= this.next) {
      this.port.postMessage({ t: 'stat', sec: this.statN / sampleRate, load: this.busy / (this.statN / sampleRate * 1000), maxMs: this.maxMs,
        quantMs: n / sampleRate * 1000, under: this.under, lim: this.limN, minG: this.minG, live: RXT_LIVE, sr: sampleRate, hr: RXT_HR });
      this.busy = 0; this.maxMs = 0; this.calls = 0; this.under = 0; this.limN = 0; this.minG = 1; this.statN = 0; this.next = Math.round(sampleRate * 30);
    }
    return true;
  }
}
registerProcessor('rx-tono', RxTono);
