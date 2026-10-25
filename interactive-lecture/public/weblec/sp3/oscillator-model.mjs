/* Forced linear oscillator. SI units: x in m, t in s; f0 is force / mass. */
export const OMEGA0 = 2 * Math.PI;
export const STATIC_DISPLACEMENT = 0.01;
export const DEFAULT_FORCE = OMEGA0 ** 2 * STATIC_DISPLACEMENT;

function parameters(p = {}) {
  const omega0 = p.omega0 ?? OMEGA0;
  const omega = p.omega ?? omega0 * (p.r ?? 1.1);
  const beta = p.beta ?? omega0 * (p.z ?? 0.1);
  const f0 = p.f0 ?? omega0 ** 2 * STATIC_DISPLACEMENT;
  const x0 = p.x0 ?? -0.04, v0 = p.v0 ?? -0.3;
  if (![omega0, omega, beta, f0, x0, v0].every(Number.isFinite) || omega0 <= 0 || omega < 0 || beta < 0)
    throw new RangeError('Require finite parameters, omega0 > 0, omega >= 0, beta >= 0.');
  return { omega0, omega, beta, f0, x0, v0 };
}

/** phi is displacement lag in x_p = A cos(omega*t - phi), in [0, pi]. */
export function steadyState(p = {}) {
  const { omega0, omega, beta, f0 } = parameters(p);
  const a = omega0 ** 2 - omega ** 2, b = 2 * beta * omega;
  const denominator = Math.hypot(a, b);
  // Exact undamped resonance has a growing particular solution, not a finite steady amplitude.
  if (denominator === 0) return {
    A: f0 === 0 ? 0 : Infinity, phi: null, C: 0, S: 0,
    boundedPeriodic: f0 === 0, attracting: false, resonant: f0 !== 0
  };
  return {
    A: Math.abs(f0) / denominator,
    phi: Math.atan2(b * Math.sign(f0 || 1), a * Math.sign(f0 || 1)),
    C: f0 / denominator * (a / denominator),
    S: f0 / denominator * (b / denominator),
    boundedPeriodic: true, attracting: beta > 0, resonant: false
  };
}

/** Positive-frequency displacement peak exists iff beta < omega0 / sqrt(2).
 * beta=0 has an unbounded resonance singularity; beta>=threshold has its maximum at omega=0.
 */
export function displacementPeak(p = {}) {
  const { omega0, beta, f0 } = parameters(p);
  if (beta === 0) return { exists: true, omega: omega0, r: 1, A: f0 === 0 ? 0 : Infinity, finite: f0 === 0 };
  if (beta >= omega0 / Math.SQRT2) return { exists: false, omega: 0, r: 0, A: Math.abs(f0) / omega0 ** 2, finite: true };
  const omega = Math.sqrt(omega0 ** 2 - 2 * beta ** 2);
  return { exists: true, omega, r: omega / omega0, A: steadyState({ ...p, omega }).A, finite: true };
}

/** Complete analytic solution including under-, critical-, and overdamped transients. */
export function responseAt(t, p = {}) {
  if (!Number.isFinite(t) || t < 0) throw new RangeError('Require finite t >= 0.');
  const cfg = parameters(p), { omega0, omega, beta, f0, x0, v0 } = cfg;
  const steady = steadyState(cfg);
  let xp, vp, ap;
  if (steady.resonant) {
    const k = f0 / (2 * omega0), s = Math.sin(omega0 * t), c = Math.cos(omega0 * t);
    xp = k * t * s;
    vp = k * (s + omega0 * t * c);
    ap = k * (2 * omega0 * c - omega0 ** 2 * t * s);
  } else {
    const c = Math.cos(omega * t), s = Math.sin(omega * t);
    xp = steady.C * c + steady.S * s;
    vp = omega * (-steady.C * s + steady.S * c);
    ap = -(omega ** 2) * xp;
  }
  const y0 = x0 - steady.C;
  const yv = v0 - omega * steady.S;
  const delta = omega0 ** 2 - beta ** 2;
  let yh, vh, regime;
  if (Math.abs(delta) <= 1e-12 * omega0 ** 2) {
    regime = 'critical';
    const b = yv + beta * y0, e = Math.exp(-beta * t);
    yh = e * (y0 + b * t);
    vh = e * (b - beta * (y0 + b * t));
  } else if (delta > 0) {
    regime = 'underdamped';
    const wd = Math.sqrt(delta), c = Math.cos(wd * t), s = Math.sin(wd * t);
    const b = (yv + beta * y0) / wd, e = Math.exp(-beta * t);
    yh = e * (y0 * c + b * s);
    vh = e * (-beta * (y0 * c + b * s) + wd * (-y0 * s + b * c));
  } else {
    regime = 'overdamped';
    const q = Math.sqrt(-delta);
    const rp = -(omega0 ** 2) / (beta + q), rm = -beta - q;
    const cp = (yv - rm * y0) / (rp - rm), cm = (rp * y0 - yv) / (rp - rm);
    const ep = Math.exp(rp * t), em = Math.exp(rm * t);
    yh = cp * ep + cm * em;
    vh = rp * cp * ep + rm * cm * em;
  }
  const ah = -2 * beta * vh - omega0 ** 2 * yh;
  return {
    x: xp + yh, v: vp + vh, a: ap + ah,
    particular: xp, particularVelocity: vp, transient: yh, transientVelocity: vh,
    forcing: f0 * Math.cos(omega * t), regime, ...steady
  };
}

export function normalizedAmplitude(r, z) {
  return 1 / Math.hypot(1 - r ** 2, 2 * z * r);
}
