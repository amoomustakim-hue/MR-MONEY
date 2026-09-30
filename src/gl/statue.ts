/**
 * Stone to man: the M$NEY marble relief breaks apart along a cracked cell
 * pattern and falls away, revealing the real portrait underneath — lined up
 * eye for eye. Two real images, one fragment shader, no generated likeness.
 *
 * `progress` (0 → 1) is driven by scroll. Everything else is procedural.
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
uniform float uP;      // break progress 0..1
uniform float uT;      // time
uniform vec2 uTilt;    // pointer, -0.5..0.5

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
float hash1(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// Voronoi: distance to the nearest edge, and that cell's id + centre.
vec3 cells(vec2 x, out vec2 id, out vec2 centre) {
  vec2 n = floor(x), f = fract(x);
  vec2 mg, mr; float md = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = hash2(n + g);
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  md = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j));
    vec2 o = hash2(n + g);
    vec2 r = g + o - f;
    if (dot(mr - r, mr - r) > 0.00001) md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
  }
  id = n + mg;
  centre = (n + mg + hash2(n + mg));
  return vec3(md, mr);
}

void main() {
  vec2 uv = vUv;
  uv.y = 1.0 - uv.y;

  // Big shards over the face, finer ones towards the edges.
  const float SCALE = 7.0;
  vec2 id, centre;
  vec3 c = cells(uv * SCALE, id, centre);
  float edge = c.x;

  // Each shard has its moment: the break starts at the eyes and runs outward.
  vec2 cUv = centre / SCALE;
  float order = distance(cUv, vec2(0.5, 0.44)) * 1.25 + hash1(id) * 0.28;
  float t = uP * 1.45;
  float fall = clamp((t - order) / 0.16, 0.0, 1.0);     // 0 = in place, 1 = gone
  float crackIn = smoothstep(order - 0.42, order - 0.05, t) * smoothstep(0.0, 0.06, uP); // cracks appear first; none before the first scroll

  // A falling shard drops, tilts and darkens before it disappears.
  vec2 drop = vec2((hash1(id + 3.1) - 0.5) * 0.05, 0.14) * fall * fall;
  vec2 sUv = uv - drop;
  vec4 stone = texture(uStatue, sUv);
  float shade = 1.0 - fall * 0.45;
  stone.rgb *= shade;

  // Hairline cracks, dark with a lit lip, as they open.
  float line = 1.0 - smoothstep(0.0, 0.012 + crackIn * 0.01, edge);
  stone.rgb = mix(stone.rgb, vec3(0.16, 0.15, 0.14), line * crackIn * 0.9);
  float lip = (1.0 - smoothstep(0.012, 0.03, edge)) * crackIn * (1.0 - line);
  stone.rgb += lip * 0.12;

  // Underneath: the man. A breath of warmth at the break edge.
  vec2 fUv = uv + uTilt * 0.006;
  vec4 face = texture(uFace, fUv);
  float gone = step(0.999, fall);
  float glow = (1.0 - smoothstep(0.0, 0.03, edge)) * gone * (1.0 - clamp((t - order - 0.16) / 0.25, 0.0, 1.0));
  vec3 under = face.rgb + vec3(0.95, 0.72, 0.38) * glow * 0.35;

  // Marble dust: fine sparkle over the stone while it is breaking.
  float dust = step(0.996, hash1(floor(uv * 900.0) + floor(uT * 12.0))) * crackIn * (1.0 - fall) * 0.5;

  vec3 col = fall < 0.999 ? mix(stone.rgb + dust, under, smoothstep(0.75, 1.0, fall)) : under;
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

/** Returns null when WebGL2 is unavailable; the caller keeps the plain images. */
export function createStatue(canvas: HTMLCanvasElement, statue: HTMLImageElement, face: HTMLImageElement): StatueGL | null {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false })
  if (!gl) return null

  const prog = gl.createProgram()!
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
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
  const uP = gl.getUniformLocation(prog, 'uP')
  const uT = gl.getUniformLocation(prog, 'uT')
  const uTilt = gl.getUniformLocation(prog, 'uTilt')

  const state = { p: 0, tx: 0, ty: 0, raf: 0, dirty: true, visible: true }
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

  // Only animate while breaking (the dust sparkles); otherwise draw on demand.
  const frame = () => {
    state.raf = requestAnimationFrame(frame)
    const breaking = state.p > 0.01 && state.p < 0.99
    if (!state.visible || (!state.dirty && !breaking)) return
    state.dirty = false
    gl.uniform1f(uP, state.p)
    gl.uniform1f(uT, (performance.now() - start) / 1000)
    gl.uniform2f(uTilt, state.tx, state.ty)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  const io = new IntersectionObserver(([e]) => (state.visible = e.isIntersecting))
  io.observe(canvas)
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
      io.disconnect()
      gl.deleteTexture(tStatue)
      gl.deleteTexture(tFace)
      gl.deleteProgram(prog)
    },
  }
}
