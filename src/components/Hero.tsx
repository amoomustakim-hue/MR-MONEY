import { useEffect, useRef, useState } from 'react'
import { FLOATERS, img } from '../config/content'
import { useReducedMotion } from '../hooks/useMediaQuery'
import { useScrollScene } from '../hooks/useScrollScene'
import { createStatue, type StatueGL } from '../gl/statue'
import { gsap } from '../utils/gsap'
import { range } from '../utils/math'

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.decoding = 'async'
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = src
  })

/**
 * The monument. The M$NEY marble relief stands on the blue with the photos
 * floating around it; scrolling breaks the stone shard by shard and the real
 * man is underneath, lined up eye for eye.
 */
export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const gl = useRef<StatueGL | null>(null)
  const [glReady, setGlReady] = useState(false)
  const reduced = useReducedMotion()
  const readyRef = useRef(ready)
  readyRef.current = ready
  const intro = useRef<gsap.core.Timeline | null>(null)

  // Build the shader once both real images are in.
  useEffect(() => {
    if (reduced) return
    let cancelled = false
    const phone = window.matchMedia('(max-width: 767px)').matches
    const s = phone ? '-m' : ''
    Promise.all([loadImage(img(`statue${s}`)), loadImage(img(`face${s}`))])
      .then(([statue, face]) => {
        if (cancelled || !canvas.current) return
        gl.current = createStatue(canvas.current, statue, face)
        if (gl.current) setGlReady(true)
      })
      .catch(() => {})
    const onResize = () => gl.current?.resize()
    window.addEventListener('resize', onResize)
    return () => {
      cancelled = true
      window.removeEventListener('resize', onResize)
      gl.current?.destroy()
      gl.current = null
    }
  }, [reduced])

  useScrollScene(root, ({ motion, desktop }) => {
    if (!motion) return
    intro.current = gsap
      .timeline({ paused: true, defaults: { ease: 'expo.out' } })
      .fromTo('.hero__frame', { scale: 0.86, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.8 }, 0)
      .fromTo('.hero__backword .char', { yPercent: 105 }, { yPercent: 0, duration: 1.6, stagger: 0.06 }, 0.1)
      .fromTo('.floater', { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 1.6, stagger: 0.08 }, 0.35)
      .fromTo('.hero__meta > *', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1, stagger: 0.06 }, 0.8)
    if (readyRef.current) intro.current.progress(1)

    const label = root.current!.querySelector<HTMLElement>('[data-state]')
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root.current,
        start: 'top top',
        end: desktop ? '+=170%' : '+=140%',
        pin: true,
        scrub: 0.7,
        onUpdate: (self) => {
          const p = range(self.progress, 0.03, 0.74)
          gl.current?.setProgress(p)
          if (label) label.textContent = p > 0.6 ? 'Flesh' : p > 0.02 ? 'Crumbling' : 'Marble'
        },
      },
    })
    // Photos drift up past the statue at their own depths.
    gsap.utils.toArray<HTMLElement>('.floater').forEach((el) => {
      const depth = Number(el.dataset.depth)
      tl.to(el, { y: () => -innerHeight * 0.45 * depth, rotate: `+=${depth * 4}`, duration: 1 }, 0)
    })
    tl.fromTo('.hero__frame', { scale: 1 }, { scale: desktop ? 1.08 : 1.04, duration: 1 }, 0)
    tl.to('.hero__backword', { yPercent: -18, opacity: 0.35, duration: 1 }, 0)
    tl.fromTo('.hero__after', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.14 }, 0.8)
    tl.set({}, {}, 1)

    // The frame leans toward the pointer; the face inside shifts a touch more.
    if (!window.matchMedia('(hover: hover)').matches) return
    const rx = gsap.quickTo('.hero__frame', 'rotationY', { duration: 1, ease: 'power3.out' })
    const ry = gsap.quickTo('.hero__frame', 'rotationX', { duration: 1, ease: 'power3.out' })
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / innerWidth - 0.5
      const y = e.clientY / innerHeight - 0.5
      rx(x * 8)
      ry(-y * 6)
      gl.current?.setTilt(x, y)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  })

  useEffect(() => {
    if (ready) intro.current?.play()
  }, [ready])

  return (
    <section className="hero" id="top" ref={root} aria-label="Asake — from stone to man">
      <div className="grid-bg" aria-hidden="true" />
      <p className="hero__backword" aria-hidden="true">
        {'ASAKE'.split('').map((ch, i) => (
          <span className="char-mask" key={i}>
            <span className="char">{ch}</span>
          </span>
        ))}
      </p>

      {FLOATERS.map((f) => (
        <figure
          key={f.src}
          className="floater"
          data-depth={f.depth}
          style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}vw`, rotate: `${f.r}deg`, zIndex: f.depth > 1.5 ? 3 : 1 }}
        >
          <img src={f.src} alt={f.alt} loading="eager" decoding="async" />
        </figure>
      ))}

      <div className="hero__frame">
        {/* The stone is the default (and the no-WebGL fallback); the man is revealed by the shader. */}
        <img className={`hero__plate ${glReady ? 'is-hidden' : ''}`} src={img('statue')} alt="The M$NEY cover: Asake carved as a marble relief" />
        <canvas ref={canvas} className="hero__canvas" aria-hidden="true" />
        <span className="hero__state label">
          <i /> <span data-state>Marble</span>
        </span>
      </div>

      <div className="hero__meta">
        <p className="label">Fan concept — M$NEY, 2026</p>
        <p className="hero__intro">
          Ahmed Ololade.
          <br />
          Lagos, Nigeria.
        </p>
        <p className="label hero__cue">Touch the stone — scroll to break it ↓</p>
      </div>

      <p className="hero__after">
        Carved in marble.
        <br />
        <em>Made of flesh.</em>
      </p>
    </section>
  )
}
