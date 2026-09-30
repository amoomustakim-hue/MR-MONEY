import { useEffect, useRef, useState } from 'react'
import { img } from '../config/content'
import { useScrollTo } from '../hooks/useLenis'
import { gsap } from '../utils/gsap'
import { pad } from '../utils/math'

const LINKS = [
  ['top', 'The stone'],
  ['bio', 'The man'],
  ['sound', 'The sound'],
  ['eras', 'The eras'],
  ['records', 'The records'],
  ['live', 'On stage'],
  ['signature', 'Signature'],
] as const

/** Stacked name and a MENU pill, top left — the inspo's corner, not a nav bar. */
export function Nav() {
  const [open, setOpen] = useState(false)
  const scrollTo = useScrollTo()
  const go = (id: string) => {
    setOpen(false)
    scrollTo(id === 'top' ? 0 : id)
  }
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <header className={`nav ${open ? 'is-open' : ''}`}>
        <button type="button" className="nav__name" onClick={() => go('top')} aria-label="Asake — back to the top">
          Asake
          <br />
          M$ney
        </button>
        <button type="button" className="nav__menu label" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="menu">
          <span>{open ? 'Close' : 'Menu'}</span>
          <i aria-hidden="true" />
        </button>
      </header>
      <nav id="menu" className={`menu ${open ? 'is-open' : ''}`} aria-label="Sections" aria-hidden={!open}>
        <ol>
          {LINKS.map(([id, label], i) => (
            <li key={id} style={{ ['--i' as string]: i }}>
              <button type="button" onClick={() => go(id)} tabIndex={open ? 0 : -1}>
                <span className="label">{pad(i)}</span>
                {label}
              </button>
            </li>
          ))}
        </ol>
        <img className="menu__img" src={img('closeup')} alt="" aria-hidden="true" />
      </nav>
    </>
  )
}

/** Blue curtain with the name counting up; lifts when the statue and the face are ready. */
export function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const num = useRef<HTMLSpanElement>(null)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const phone = window.matchMedia('(max-width: 767px)').matches
    const state = { v: 0, target: 0.1 }
    let finished = false
    const load = (src: string) =>
      new Promise<void>((r) => {
        const i = new Image()
        i.onload = i.onerror = () => r()
        i.src = src
      })
    const s = phone ? '-m' : ''
    Promise.all([
      document.fonts.ready.then(() => (state.target = Math.max(state.target, 0.4))),
      load(img(`statue${s}`)).then(() => (state.target = Math.max(state.target, 0.75))),
      load(img(`face${s}`)),
      new Promise((r) => setTimeout(r, reduced ? 100 : 1200)),
    ]).then(() => (state.target = 1))
    const failsafe = setTimeout(() => (state.target = 1), 7000)

    const tick = () => {
      state.v += (state.target - state.v) * 0.1
      if (num.current) num.current.textContent = pad(state.v * 100, 3)
      if (!finished && state.target === 1 && state.v > 0.995) {
        finished = true
        gsap.ticker.remove(tick)
        onDone()
        gsap
          .timeline({ onComplete: () => setGone(true) })
          .to('.pre__count, .pre__name', { yPercent: -110, duration: 0.7, ease: 'power3.in' }, 0)
          .to(root.current, { yPercent: -100, duration: reduced ? 0.01 : 1.1, ease: 'expo.inOut' }, 0.35)
      }
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      clearTimeout(failsafe)
    }
  }, [onDone])

  if (gone) return null
  return (
    <div className="pre" ref={root} aria-hidden="true">
      <div className="grid-bg" />
      <p className="pre__name">
        <span>Asake — M$ney</span>
      </p>
      <p className="pre__count">
        <span ref={num}>000</span>
      </p>
    </div>
  )
}
