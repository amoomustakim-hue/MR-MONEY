import { useEffect, useRef } from 'react'
import { ERAS } from '../config/content'
import { useReducedMotion } from '../hooks/useMediaQuery'
import { useScrollScene } from '../hooks/useScrollScene'
import { gsap } from '../utils/gsap'
import { pad } from '../utils/math'

const base = import.meta.env.BASE_URL
const FRAMES = 140
const frame = (i: number) => `${base}turn/${pad(i + 1, 4)}.webp`

/**
 * The orbit. Asake, cut out of the walk-out footage, turns in the middle of
 * the screen like a figure on a turntable (the source camera arcs around
 * him, so scrubbing the cut-out frames reads as a rotation). The five album
 * covers spiral up around him in 3D — passing behind him and in front — and
 * whichever is closest names its era.
 */
export function Spiral() {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const images = useRef<(HTMLImageElement | null)[]>([])
  const reduced = useReducedMotion()

  // Stream the turntable frames in: every 4th first, then the rest.
  useEffect(() => {
    let cancelled = false
    const order = [...Array(FRAMES).keys()].sort((a, b) => (a % 4) - (b % 4) || a - b)
    let next = 0
    const pump = () => {
      if (cancelled || next >= order.length) return
      const i = order[next++]
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

  useScrollScene(root, ({ motion, desktop }) => {
    const c = canvas.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    const state = { target: 0, current: 0, drawn: -1 }
    const covers = gsap.utils.toArray<HTMLElement>('.orbit__cover')
    const names = gsap.utils.toArray<HTMLElement>('.orbit__name')

    const draw = (index: number) => {
      // Nearest loaded frame, so a gap never blanks him.
      for (let d = 0; d < FRAMES; d++) {
        const img = images.current[index - d] ?? images.current[index + d]
        if (img) {
          if (state.drawn === index && d === 0) return
          ctx.clearRect(0, 0, c.width, c.height)
          ctx.drawImage(img, 0, 0, c.width, c.height)
          state.drawn = d === 0 ? index : -1
          return
        }
      }
    }

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
      draw(Math.round(FRAMES * 0.45))
      layout(0.5)
      return
    }

    const tick = () => {
      state.current += (state.target - state.current) * 0.12
      draw(Math.min(FRAMES - 1, Math.round(state.current * (FRAMES - 1))))
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
    // Draw the first frame as soon as it arrives.
    const first = setInterval(() => {
      if (images.current[0]) {
        tick()
        clearInterval(first)
      }
    }, 100)
    layout(0)
    return () => {
      gsap.ticker.remove(tick)
      clearInterval(first)
    }
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
        <canvas ref={canvas} className="orbit__figure" width={560} height={1000} role="img" aria-label="Asake, cut out from the walk-out footage, turning" />
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
      <p className="label orbit__hint">Keep scrolling — he turns, the records orbit</p>
    </section>
  )
}
