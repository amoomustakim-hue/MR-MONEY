export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

/** 0 → 1 as `v` moves from `a` to `b`, clamped. */
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a))

export const smooth = (t: number) => t * t * (3 - 2 * t)

export const pad = (n: number, len = 2) => String(Math.max(0, Math.round(n))).padStart(len, '0')
