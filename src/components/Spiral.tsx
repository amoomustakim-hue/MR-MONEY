import { useEffect, useRef } from 'react'
import { ERAS } from '../config/content'
import { useReducedMotion } from '../hooks/useMediaQuery'
import { useScrollScene } from '../hooks/useScrollScene'
import { gsap } from '../utils/gsap'
import { pad } from '../utils/math'

const base = import.meta.env.BASE_URL
/** Cut-out frames of the walk, 20 fps, re-centred so he walks on the spot. */
const FRAMES = 124
const FPS = 20
/** The last frames are cross-faded into the first so the loop has no seam. */
const XF = 8
const LOOP = FRAMES - XF
const frame = (i: number) => `${base}turn/${pad(i + 1, 4)}.webp`

/**
 * The orbit. Asake, cut out of the stage footage, walks in the middle of the
 * screen in real time, on a seamless loop, while the five album covers
 * spiral round him in 3D with the scroll — passing behind him and in front —
 * and whichever is closest names its era.
 */
export function Spiral() {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const images = useRef<(HTMLImageElement | null)[]>([])
  const reduced = useReducedMotion()

  // Stream the frames in order (the walk plays from the start as they land).
  useEffect(() => {
    let cancelled = false
    let next = 0
    const pump = () => {
      if (cancelled || next >= FRAMES) return
      const i = next++
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        images.current[i] = img
        pump()
      }
      img.onerror = pump
      img.src = frame(i)
    }
    for (let k = 0; k < 4; k++) pump()
    return () => {
      cancelled = true
    }
  }, [])

  // The walk: real time, independent of scroll, only while on screen.
  useEffect(() => {
    const c = canvas.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    let raf = 0
    let visible = false
    const start = performance.now()
    const get = (i: number) => {
      for (let d = 0; d < FRAMES; d++) {
        const img = images.current[i - d]
        if (img) return img
      }
      return null
    }
    const draw = () => {
      raf = requestAnimationFrame(draw)
      if (!visible) return
      const f = reduced ? 30 : Math.floor(((performance.now() - start) / 1000) * FPS) % LOOP
      const img = get(f)
      if (!img) return
      ctx.clearRect(0, 0, c.width, c.height)
      ctx.globalAlpha = 1
      ctx.drawImage(img, 0, 0, c.width, c.height)
      // Seam: the tail of the previous pass fades out over the head of this one.
      if (!reduced && f < XF) {
        const tail = images.current[f + LOOP]
        if (tail) {
          ctx.globalAlpha = 1 - (f + 1) / (XF + 1)
          ctx.drawImage(tail, 0, 0, c.width, c.height)
          ctx.globalAlpha = 1
        }
      }
    }
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '20% 0px' })
    io.observe(c)
    draw()
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [reduced])

  useScrollScene(root, ({ motion, desktop }) => {
    const covers = gsap.utils.toArray<HTMLElement>('.orbit__cover')
    const names = gsap.utils.toArray<HTMLElement>('.orbit__name')
    const state = { target: 0, current: 0 }

    const layout = (p: number) => {
      const R = desktop ? Math.min(innerWidth * 0.36, 620) : innerWidth * 0.62
      const rise = innerHeight * 1.25
      let front = -1
      let frontZ = -Infinity
      covers.forEach((el, i) => {
        // Each cover rides the same helix, spaced out along it.
        const s = p * 1.35 - i * 0.2
        const angle = s * Math.PI * 2.4 + i * 0.9
        const x = Math.sin(angle) * R
        const z = Math.cos(angle) * R
        const y = (0.62 - s) * rise
        const on = s > -0.2 && s < 1.25
        // A gentle sway, never past 90° — covers always face out, never mirrored.
        el.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${Math.sin(angle) * 28}deg)`
        el.style.opacity = on ? String(Math.min(1, (s + 0.2) * 5, (1.25 - s) * 5)) : '0'
        if (on && z > frontZ && Math.abs(y) < innerHeight * 0.45) {
          frontZ = z
          front = i
        }
      })
      names.forEach((n, i) => n.classList.toggle('is-on', i === front))
    }

    if (!motion) {
      layout(0.5)
      return
    }
    const tick = () => {
      state.current += (state.target - state.current) * 0.12
      layout(state.current)
    }
    gsap.timeline({
      scrollTrigger: {
        trigger: root.current,
        start: 'top top',
        end: desktop ? '+=340%' : '+=280%',
        pin: true,
        scrub: true,
        onUpdate: (self) => (state.target = self.progress),
        onToggle: (self) => (self.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
      },
    })
    gsap.fromTo('.orbit__title .line > span', { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: root.current, start: 'top 60%' } })
    layout(0)
    return () => gsap.ticker.remove(tick)
  })

  return (
    <section className="orbit" id="eras" ref={root} aria-label="The eras">
      <div className="grid-bg" aria-hidden="true" />
      <p className="orbit__back" aria-hidden="true">
        Eras
      </p>
      <p className="label orbit__index">(03) — The eras</p>
      <h2 className="orbit__title">
        <span className="line">
          <span>Five eras.</span>
        </span>
        <span className="line">
          <span>One orbit.</span>
        </span>
      </h2>

      <div className="orbit__stage">
        <canvas ref={canvas} className="orbit__figure" width={900} height={1200} role="img" aria-label="Asake walking, cut out from stage footage" />
        {ERAS.map((e) => (
          <figure className="orbit__cover" key={e.id}>
            <img src={e.cover} alt={`${e.title} cover`} loading="lazy" />
          </figure>
        ))}
      </div>

      <ol className="orbit__names" aria-label="Albums">
        {ERAS.map((e, i) => (
          <li className={`orbit__name ${reduced && i === 0 ? 'is-on' : ''}`} key={e.id}>
            <span className="label">
              {pad(i + 1)} — {e.year}
            </span>
            <span className={`orbit__era ${e.id === 'money' ? 'orbit__era--serif' : ''}`}>{e.title}</span>
          </li>
        ))}
      </ol>
      <p className="label orbit__hint">Keep scrolling — the records orbit him</p>
    </section>
  )
}
