/**
 * Stone to man: the M$NEY marble relief crumbles into pieces that erode to
 * dust and drift away, revealing the real portrait underneath — lined up eye
 * for eye. The cursor pushes pieces aside wherever it goes, so you can peek
 * at the face before you scroll; they settle back when it leaves.
 *
 * Two real images, one fragment shader, no generated likeness.
 */

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uStatue;
uniform sampler2D uFace;
uniform float uP;      // crumble progress 0..1 (scroll)
uniform float uT;      // time
uniform vec2 uMouse;   // cursor in uv
uniform float uHover;  // 0..1 while the cursor is over the stone
uniform vec2 uTilt;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
float hash1(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// Voronoi: distance to the nearest edge, the cell id and its centre.
float cells(vec2 x, out vec2 id, out vec2 centre) {
  vec2 n = floor(x), f = fract(x);
  vec2 mg, mr; float md = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 r = g + hash2(n + g) - f;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  md = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j));
    vec2 r = g + hash2(n + g) - f;
    if (dot(mr - r, mr - r) > 0.00001) md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
  }
  id = n + mg;
  centre = n + mg + hash2(n + mg);
  return md;
}

// One pass of the stone at a given piece scale; returns colour and coverage.
vec4 stoneLayer(vec2 uv, float scale, float t, float seed) {
  vec2 id, centre;
  // Sample the piece under this pixel *before* it moved: find which piece
  // would land here by testing the pixel's own cell (pieces are small, so the
  // error of this approximation reads as the piece tearing at its edge).
  float edge = cells(uv * scale + seed, id, centre);
  vec2 cUv = (centre - seed) / scale;

  // When this piece crumbles: from the eyes outward, with some randomness.
  float order = distance(cUv, vec2(0.5, 0.44)) * 1.2 + hash1(id) * 0.3;
  float scroll = clamp((t - order) / 0.22, 0.0, 1.0);

  // The cursor pushes pieces out of its way.
  float d = distance(cUv, uMouse);
  float hover = uHover * (1.0 - smoothstep(0.03, 0.17, d));
  float fall = max(scroll, hover * 0.85);

  // Crumbling = eroding from its edges inward while it drifts away.
  float erode = fall * 0.5;
  float alive = step(erode, edge) * (1.0 - step(0.999, fall));

  vec2 away = normalize(cUv - vec2(0.5, 0.46) + 0.0001) * 0.05 + vec2(0.0, -0.08);
  vec2 push = normalize(cUv - uMouse + 0.0001) * 0.035 * hover;
  vec2 offset = away * scroll * scroll + push;
  float ang = (hash1(id + 7.0) - 0.5) * 1.6 * fall;
  vec2 p = uv - cUv;
  p = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p;
  vec2 sUv = cUv + p - offset;

  vec3 c = texture(uStatue, sUv).rgb;
  // Pieces darken a little as they lift, and cracks open before they go.
  c *= 1.0 - fall * 0.35;
  float crack = (1.0 - smoothstep(0.0, 0.012, edge)) * smoothstep(order - 0.4, order, t) * smoothstep(0.0, 0.05, uP);
  c = mix(c, vec3(0.14, 0.13, 0.12), crack * 0.85);

  // Embers along the eroding edge: marble turning to glowing dust.
  float rim = (1.0 - smoothstep(erode, erode + 0.03, edge)) * step(0.02, fall) * alive;
  c += vec3(1.0, 0.72, 0.36) * rim * 0.9;

  return vec4(c, alive);
}

void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  float t = uP * 1.5;

  vec4 stone = stoneLayer(uv, 11.0, t, 0.0);

  // The man underneath; a breath of parallax against the stone.
  vec3 face = texture(uFace, uv + uTilt * 0.008).rgb;

  // Dust: fine sparks drifting up where pieces have gone.
  vec2 g = floor(uv * vec2(260.0, 260.0) + vec2(0.0, uT * 40.0));
  float spark = step(0.9965, hash1(g)) * (1.0 - stone.a) * (smoothstep(0.02, 0.2, uP) * (1.0 - smoothstep(0.75, 1.0, uP)) + uHover * 0.6);

  vec3 col = mix(face, stone.rgb, stone.a) + vec3(1.0, 0.85, 0.6) * spark * 0.8;
  outColor = vec4(col, 1.0);
}`

export type StatueGL = {
  setProgress: (p: number) => void
  setTilt: (x: number, y: number) => void
  resize: () => void
  destroy: () => void
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, source)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
  return s
}

function loadTexture(gl: WebGL2RenderingContext, img: HTMLImageElement) {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return tex
}

/** Returns null when WebGL2 is unavailable; the caller keeps the plain image. */
export function createStatue(canvas: HTMLCanvasElement, statue: HTMLImageElement, face: HTMLImageElement): StatueGL | null {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false })
  if (!gl) return null

  const prog = gl.createProgram()!
  try {
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
  } catch {
    return null
  }
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'aPos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  gl.activeTexture(gl.TEXTURE0)
  const tStatue = loadTexture(gl, statue)
  gl.activeTexture(gl.TEXTURE1)
  const tFace = loadTexture(gl, face)
  gl.uniform1i(gl.getUniformLocation(prog, 'uStatue'), 0)
  gl.uniform1i(gl.getUniformLocation(prog, 'uFace'), 1)
  const u = (n: string) => gl.getUniformLocation(prog, n)
  const uP = u('uP'), uT = u('uT'), uTilt = u('uTilt'), uMouse = u('uMouse'), uHover = u('uHover')

  const state = {
    p: 0, tx: 0, ty: 0, raf: 0, dirty: true,
    // cursor: target and eased values
    mx: 0.5, my: 0.5, ex: 0.5, ey: 0.5, inside: 0, hover: 0,
  }
  const start = performance.now()

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.round(canvas.clientWidth * dpr)
    const h = Math.round(canvas.clientHeight * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
    }
    state.dirty = true
  }

  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    state.mx = (e.clientX - r.left) / r.width
    state.my = (e.clientY - r.top) / r.height
    state.inside = state.mx >= 0 && state.mx <= 1 && state.my >= 0 && state.my <= 1 ? 1 : 0
  }
  const onLeave = () => (state.inside = 0)
  window.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerleave', onLeave)

  const frame = () => {
    state.raf = requestAnimationFrame(frame)
    // Ease the cursor so pieces glide rather than snap; pieces settle back slowly.
    state.ex += (state.mx - state.ex) * 0.18
    state.ey += (state.my - state.ey) * 0.18
    state.hover += (state.inside - state.hover) * (state.inside ? 0.12 : 0.04)
    const moving = state.hover > 0.002 || (state.p > 0.01 && state.p < 0.99)
    if (!state.dirty && !moving) return
    state.dirty = false
    gl.uniform1f(uP, state.p)
    gl.uniform1f(uT, (performance.now() - start) / 1000)
    gl.uniform2f(uTilt, state.tx, state.ty)
    gl.uniform2f(uMouse, state.ex, state.ey)
    gl.uniform1f(uHover, state.hover * (1 - state.p))
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  resize()
  frame()

  return {
    setProgress(p) {
      state.p = p
      state.dirty = true
    },
    setTilt(x, y) {
      state.tx = x
      state.ty = y
      state.dirty = true
    },
    resize,
    destroy() {
      cancelAnimationFrame(state.raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      gl.deleteTexture(tStatue)
      gl.deleteTexture(tFace)
      gl.deleteProgram(prog)
    },
  }
}
