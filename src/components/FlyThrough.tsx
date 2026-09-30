import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { media } from '../config/content'
import { useReducedMotion } from '../hooks/useMediaQuery'
import { useScrollScene } from '../hooks/useScrollScene'
import { gsap } from '../utils/gsap'
import { range } from '../utils/math'

type Props = {
  id: string
  index: string
  /** The word cut out of the screen; the footage plays through its letters. */
  word: string
  /** Which letter the camera flies through (counting letters only). */
  through: number
  /** Where inside that letter's box to aim — on the stroke, not in a hole (0..1, 0..1). */
  aim?: [number, number]
  font: 'sans' | 'serif'
  /** public/media/{clip}.mp4|.webm|.jpg */
  clip: string
  /** Scrubbed by scroll, or looping on its own. */
  mode: 'scrub' | 'loop'
  aspect: number
  /** Colour of the screen the word is cut from. */
  cover: string
  scroll: number
  children?: ReactNode
  label: string
}

const easeInExpo = (k: number) => (k === 0 ? 0 : Math.pow(2, 10 * k - 10))

/**
 * Footage seen through a giant cut-out word; scrolling flies the camera
 * through one of its letters and into the film, which then plays full-screen
 * over a blurred, glowing copy of itself.
 */
export function FlyThrough({ id, index, word, through, aim = [0.5, 0.5], font, clip, mode, aspect, cover, scroll, children, label }: Props) {
  const root = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const ambient = useRef<HTMLCanvasElement>(null)
  const wordRef = useRef<SVGGElement>(null)
  const text = useRef<SVGTextElement>(null)
  const maskRect = useRef<SVGRectElement>(null)
  const maskId = `fly-${useId().replace(/:/g, '')}`
  const reduced = useReducedMotion()
  const [box, setBox] = useState({ w: 1600, h: 900 })
  const [src] = useState(() => {
    const v = document.createElement('video')
    return media(`${clip}.${v.canPlayType('video/mp4; codecs="avc1.640028"') ? 'mp4' : 'webm'}`)
  })

  // The mask's coordinate space matches the viewport's shape, so the word always fits.
  useEffect(() => {
    const fit = () => setBox({ w: 1600, h: Math.round((1600 * innerHeight) / innerWidth) })
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  const phone = box.h > box.w
  const lines = phone && word.includes(' ') ? word.split(' ') : [word]
  const longest = Math.max(...lines.map((l) => l.length))
  const fontSize = Math.min((box.h * 0.8) / lines.length, (box.w * 0.9) / (longest * (font === 'serif' ? 0.78 : 0.66)))

  useScrollScene(
    root,
    ({ motion }) => {
      const v = video.current
      if (!motion || !v) return
      v.muted = true
      const ctx = ambient.current?.getContext('2d')
      const state = { target: 0, current: 0 }
      let centre: { x: number; y: number } | null = null

      // Where the letter we fly through sits, measured once the font is in.
      const measure = () => {
        const t = text.current
        if (!t) return null
        try {
          // `through` counts letters only (spaces skipped), across lines.
          let n = 0
          for (const span of t.querySelectorAll('tspan')) {
            const chars = [...(span.textContent ?? '')]
            for (let i = 0; i < chars.length; i++) {
              if (chars[i] === ' ') continue
              if (n === through) {
                const r = span.getExtentOfChar(i)
                return { x: r.x + r.width * aim[0], y: r.y + r.height * aim[1] }
              }
              n++
            }
          }
        } catch {
          return null
        }
        return null
      }

      const render = (p: number) => {
        centre ??= measure()
        const g = wordRef.current
        if (!g || !centre) return
        // Hold, then an accelerating dive through the letter.
        const k = range(p, 0.12, 0.5)
        const s = 1 + easeInExpo(k) * 90
        const px = centre.x + (box.w / 2 - centre.x) * k
        const py = centre.y + (box.h / 2 - centre.y) * k
        g.setAttribute('transform', `translate(${px} ${py}) scale(${s}) translate(${-centre.x} ${-centre.y})`)
        if (maskRect.current) maskRect.current.style.opacity = String(1 - range(p, 0.42, 0.52))
      }

      const tick = () => {
        if (mode === 'scrub' && v.duration) {
          state.current += (state.target - state.current) * 0.14
          const t = Math.min(v.duration - 0.05, state.current * v.duration)
          if (!v.seeking && Math.abs(v.currentTime - t) > 1 / 60) v.currentTime = t
        }
        // A tiny copy of the frame, blown up and blurred behind the film.
        if (ctx && v.readyState >= 2) ctx.drawImage(v, 0, 0, 48, 27)
      }

      if (mode === 'scrub') v.play().then(() => v.pause()).catch(() => {})
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: `+=${scroll}%`,
          pin: true,
          scrub: 0.5,
          onUpdate: (self) => {
            state.target = self.progress
            render(self.progress)
          },
          onToggle: (self) => {
            if (self.isActive) {
              gsap.ticker.add(tick)
              if (mode === 'loop') v.play().catch(() => {})
            } else {
              gsap.ticker.remove(tick)
              if (mode === 'loop') v.pause()
            }
          },
        },
      })
      tl.fromTo('.fly__word-in', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.08, ease: 'power3.out' }, 0)
      tl.fromTo('.fly__film', { scale: 1.25 }, { scale: 1, duration: 0.5, ease: 'power2.out' }, 0.1)
      tl.fromTo('.fly__flash', { opacity: 0 }, { opacity: 0.55, duration: 0.03 }, 0.47).to('.fly__flash', { opacity: 0, duration: 0.08 }, 0.5)
      tl.fromTo('.fly__after', { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.55)
      gsap.utils.toArray<HTMLElement>('.fly__beat').forEach((el, i, all) => {
        const at = 0.58 + (i * 0.36) / all.length
        tl.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.06 }, at)
      })
      tl.set({}, {}, 1)
      render(0)
      document.fonts.ready.then(() => {
        centre = measure()
        render(state.target)
      })
      return () => gsap.ticker.remove(tick)
    },
    [box.w, box.h],
  )

  return (
    <section className={`fly fly--${id}`} id={id} ref={root} aria-label={label} style={{ ['--aspect' as string]: aspect }}>
      <canvas ref={ambient} className="fly__ambient" width={48} height={27} aria-hidden="true" />
      <div className="fly__film">
        <video
          ref={video}
          src={reduced ? undefined : src}
          poster={media(`${clip}.jpg`)}
          muted
          playsInline
          loop={mode === 'loop'}
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
      <div className="fly__vignette" aria-hidden="true" />

      {!reduced && (
        <svg className="fly__mask fly__word-in" viewBox={`0 0 ${box.w} ${box.h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={box.w} height={box.h}>
              <rect width={box.w} height={box.h} fill="#fff" />
              <g ref={wordRef}>
                <text
                  ref={text}
                  x={box.w / 2}
                  y={box.h / 2 - ((lines.length - 1) * fontSize * 0.86) / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={fontSize}
                  className={`fly__glyphs fly__glyphs--${font}`}
                  fill="#000"
                >
                  {lines.map((l, i) => (
                    <tspan key={l} x={box.w / 2} dy={i === 0 ? 0 : fontSize * 0.86}>
                      {l}
                    </tspan>
                  ))}
                </text>
              </g>
            </mask>
          </defs>
          <rect ref={maskRect} width={box.w} height={box.h} fill={cover} mask={`url(#${maskId})`} />
        </svg>
      )}
      <div className="fly__flash" aria-hidden="true" />

      <p className="label fly__index">{index}</p>
      <div className="fly__after">{children}</div>
    </section>
  )
}
