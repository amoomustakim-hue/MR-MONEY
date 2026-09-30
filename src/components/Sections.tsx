import { useRef, useState } from 'react'
import { AUTHOR, CREDIT, ERAS, PHOTOS, img, media } from '../config/content'
import { useReducedMotion } from '../hooks/useMediaQuery'
import { useScrollScene } from '../hooks/useScrollScene'
import { gsap } from '../utils/gsap'
import { pad } from '../utils/math'

/** Lines that rise out of their own clipped box when scrolled to. */
function useLineReveal(root: React.RefObject<HTMLElement | null>, start = 'top 78%') {
  useScrollScene(root, ({ motion }) => {
    if (!motion) return
    gsap.utils.toArray<HTMLElement>('[data-lines]').forEach((el) => {
      gsap.fromTo(el.querySelectorAll('.line > span'), { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: el, start } })
    })
    gsap.utils.toArray<HTMLElement>('[data-fade]').forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start } })
    })
  })
}

const Lines = ({ lines, className = '', as: Tag = 'h2' }: { lines: React.ReactNode[]; className?: string; as?: 'h2' | 'p' }) => (
  <Tag className={className} data-lines>
    {lines.map((l, i) => (
      <span className="line" key={i}>
        <span>{l}</span>
      </span>
    ))}
  </Tag>
)

/** 01 — who he is, set as a dense editorial column on deep blue. */
export function Bio() {
  const root = useRef<HTMLElement>(null)
  useLineReveal(root)
  useScrollScene(root, ({ motion }) => {
    if (!motion) return
    gsap.fromTo('.bio__photo img', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.bio__photo', start: 'top bottom', end: 'bottom top', scrub: true } })
    gsap.fromTo('.bio__photo', { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.6, ease: 'power4.inOut', scrollTrigger: { trigger: '.bio__photo', start: 'top 80%' } })
  })
  return (
    <section className="bio" id="bio" ref={root} aria-label="Biography">
      <div className="grid-bg grid-bg--dark" aria-hidden="true" />
      <p className="label bio__index">(01) — The man</p>
      <div className="bio__copy">
        <Lines lines={['From the streets', 'of Lagos to the', 'biggest stages.']} className="bio__head" />
        <p className="bio__text" data-fade>
          Ahmed Ololade grew up in Lagos and studied theatre arts before music took over. In 2022 Olamide signed him to YBNL, and a run of singles —
          Omo Ope, Sungba, Terminator — made his sound impossible to miss: the call-and-response of fuji and Yoruba choirs, laid over amapiano log
          drums.
        </p>
        <p className="bio__text" data-fade>
          Four albums on, the chants fill arenas. He calls his world Giran Republic; the fans call him Mr. Money.
        </p>
      </div>
      <figure className="bio__photo">
        <img src={PHOTOS.whiteTee} alt="Asake in a white tee, black sunglasses and an iced chain" loading="lazy" />
        <figcaption className="label">Mr. Money</figcaption>
      </figure>
    </section>
  )
}

/** 02 — two words at either end of a line; the line draws itself and photos land on it. */
export function Sound() {
  const root = useRef<HTMLElement>(null)
  useScrollScene(root, ({ motion, desktop }) => {
    if (!motion) return
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root.current, start: 'top top', end: desktop ? '+=260%' : '+=200%', pin: true, scrub: 0.7 },
    })
    const rows = gsap.utils.toArray<HTMLElement>('.sound__row')
    rows.forEach((row, i) => {
      const at = i * 1.1
      const words = row.querySelectorAll('.sound__word')
      if (i > 0) tl.fromTo(row, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, at)
      tl.fromTo(words[0], { xPercent: -60, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.3, ease: 'power3.out' }, at)
      tl.fromTo(words[1], { xPercent: 60, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.3, ease: 'power3.out' }, at)
      tl.fromTo(row.querySelector('.sound__rule'), { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: 'power2.inOut' }, at + 0.2)
      row.querySelectorAll('.sound__card').forEach((card, j) => {
        tl.fromTo(card, { yPercent: 60, opacity: 0, rotate: j % 2 ? 8 : -8 }, { yPercent: 0, opacity: 1, rotate: j % 2 ? 3 : -3, duration: 0.3, ease: 'back.out(1.6)' }, at + 0.35 + j * 0.12)
      })
      tl.fromTo(row.querySelector('.sound__note'), { opacity: 0 }, { opacity: 1, duration: 0.2 }, at + 0.55)
      if (i < rows.length - 1) tl.to(row, { autoAlpha: 0, y: -40, duration: 0.2 }, at + 0.95)
    })
    tl.set({}, {}, rows.length * 1.1 - 0.1)
  })

  const ROWS = [
    { a: 'Fuji', b: 'Amapiano', note: 'Talking drums and log drums in the same bar.', cards: [PHOTOS.crowd, PHOTOS.flameLagos] },
    { a: 'Lagos', b: 'Worldwide', note: 'Lagos Island on the big screen, from London to the States.', cards: [PHOTOS.street, PHOTOS.flameUsa, PHOTOS.cap] },
  ]
  return (
    <section className="sound" id="sound" ref={root} aria-label="The sound">
      <div className="grid-bg" aria-hidden="true" />
      <p className="label sound__index">(02) — The sound</p>
      {ROWS.map((r) => (
        <div className="sound__row" key={r.a}>
          <p className="sound__line" style={{ ['--size' as string]: `min(10vw, ${(58 / ((r.a.length + r.b.length) * 0.62)).toFixed(2)}vw)` }}>
            <span className="sound__word">{r.a}</span>
            <span className="sound__rule" aria-hidden="true" />
            <span className="sound__word">{r.b}</span>
          </p>
          <div className="sound__cards" aria-hidden="true">
            {r.cards.map((c) => (
              <img className="sound__card" src={c} alt="" key={c} loading="lazy" />
            ))}
          </div>
          <p className="sound__note label">{r.note}</p>
        </div>
      ))}
    </section>
  )
}

/** 03 — the walk-out, framed like a portrait on the wall; scroll walks him to the edge of the stage. */
export function WalkOut() {
  const root = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const reduced = useReducedMotion()
  const [src] = useState(() => {
    const v = document.createElement('video')
    return media(v.canPlayType('video/mp4; codecs="avc1.640028"') ? 'walk.mp4' : 'walk.webm')
  })

  useScrollScene(root, ({ motion, desktop }) => {
    const v = video.current
    if (!motion || !v) return
    v.muted = true
    v.play().then(() => v.pause()).catch(() => {})
    const state = { target: 0, current: 0 }
    const seek = () => {
      if (!v.duration) return
      state.current += (state.target - state.current) * 0.14
      const t = Math.min(v.duration - 0.05, state.current * v.duration)
      if (!v.seeking && Math.abs(v.currentTime - t) > 1 / 60) v.currentTime = t
    }
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root.current,
        start: 'top top',
        end: desktop ? '+=260%' : '+=200%',
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => (state.target = self.progress),
        onToggle: (self) => (self.isActive ? gsap.ticker.add(seek) : gsap.ticker.remove(seek)),
      },
    })
    tl.fromTo('.walk__frame', { scale: 0.82 }, { scale: 1, duration: 0.3, ease: 'power2.out' }, 0)
    gsap.utils.toArray<HTMLElement>('.walk__beat').forEach((el, i) => {
      tl.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.08 }, 0.12 + i * 0.26)
      tl.to(el, { opacity: 0.18, duration: 0.08 }, 0.34 + i * 0.26)
    })
    tl.fromTo('.walk__word--a', { xPercent: -30 }, { xPercent: 0, duration: 1 }, 0)
    tl.fromTo('.walk__word--b', { xPercent: 30 }, { xPercent: 0, duration: 1 }, 0)
    tl.set({}, {}, 1)
    return () => gsap.ticker.remove(seek)
  })

  return (
    <section className="walk" id="walk" ref={root} aria-label="The walk-out">
      <p className="label walk__index">(03) — The walk-out</p>
      <p className="walk__word walk__word--a" aria-hidden="true">
        Walk
      </p>
      <p className="walk__word walk__word--b" aria-hidden="true">
        Out
      </p>
      <figure className="walk__frame">
        <video ref={video} src={reduced ? undefined : src} poster={media('walk.jpg')} muted playsInline preload="auto" aria-hidden="true" tabIndex={-1} />
        <figcaption className="label">Live — the walk to the edge</figcaption>
      </figure>
      <ol className="walk__beats">
        <li className="walk__beat">The lights drop.</li>
        <li className="walk__beat">The phones go up.</li>
        <li className="walk__beat">He walks to the edge.</li>
      </ol>
    </section>
  )
}

/** 04 — the records, on a white wall like a sponsor board: pick one and the room takes its colour. */
export function Discography() {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(ERAS.length - 1)
  const era = ERAS[active]
  useLineReveal(root)
  useScrollScene(root, ({ motion }) => {
    if (!motion) return
    gsap.fromTo('.disco__cover', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.disco__covers', start: 'top 85%' } })
  })

  return (
    <section className="disco" id="records" ref={root} aria-label="Discography" style={{ ['--era-bg' as string]: era.bg, ['--era-fg' as string]: era.fg }}>
      <div className="disco__head">
        <p className="label">(04) — The records</p>
        <Lines lines={['Discography']} className="disco__title" />
      </div>

      <div className="disco__covers" role="tablist" aria-label="Albums">
        {ERAS.map((e, i) => (
          <button
            key={e.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls="era-panel"
            className={`disco__cover ${i === active ? 'is-active' : ''}`}
            onClick={() => setActive(i)}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
          >
            <img src={e.cover} alt={`${e.title} cover`} loading="lazy" />
            <span className="label">
              {pad(i + 1)} — {e.year}
            </span>
          </button>
        ))}
      </div>

      <div className="disco__panel" id="era-panel" role="tabpanel" key={era.id}>
        <div className="disco__about">
          <p className="label">Released {era.released}</p>
          <h3 className={`disco__name ${era.id === 'money' ? 'disco__name--serif' : ''}`}>{era.title}</h3>
          <p className="disco__note">{era.note}</p>
          <a className="disco__listen label" href={era.listen} target="_blank" rel="noreferrer">
            Listen on Spotify ↗
          </a>
        </div>
        {era.tracks.length > 0 ? (
          <ol className="disco__tracks">
            {era.tracks.map((t, i) => (
              <li key={t}>
                <span className="label">{pad(i + 1)}</span> {t}
              </li>
            ))}
          </ol>
        ) : (
          <p className="disco__tracks disco__tracks--empty label">Out now — the full tracklist lives on streaming.</p>
        )}
      </div>
    </section>
  )
}

/** 05 — M$NEY live: the promo cut plays in a frame, the name set in carved capitals. */
export function Live() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [src] = useState(() => {
    const v = document.createElement('video')
    return media(v.canPlayType('video/mp4; codecs="avc1.640028"') ? 'live.mp4' : 'live.webm')
  })
  useLineReveal(root)
  useScrollScene(root, ({ motion }) => {
    if (!motion) return
    gsap.fromTo('.live__frame', { clipPath: 'inset(12% 12% 12% 12%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 80%', end: 'center center', scrub: true } })
    gsap.fromTo('.live__side', { yPercent: 30 }, { yPercent: -30, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } })
  })
  return (
    <section className="live" id="live" ref={root} aria-label="M$NEY live in concert">
      <div className="live__copy">
        <p className="label">(05) — On stage</p>
        <Lines lines={['M$NEY']} className="live__title" />
        <Lines as="p" lines={['Live in concert.']} className="live__sub" />
        <p className="live__text" data-fade>
          Flame cannons, a choir in white, the name spelled out in letters taller than the band. The album, played loud.
        </p>
      </div>
      <figure className="live__frame">
        <video src={reduced ? undefined : src} poster={media('live.jpg')} muted playsInline autoPlay loop preload="metadata" aria-hidden="true" tabIndex={-1} />
      </figure>
      <img className="live__side" src={PHOTOS.flameUsa} alt="Asake on stage firing a flame cannon" loading="lazy" />
    </section>
  )
}

/** 06 — the quiet ending: the portrait, a line, and his name signed across it. */
export function Signature() {
  const root = useRef<HTMLElement>(null)
  useLineReveal(root)
  useScrollScene(root, ({ motion }) => {
    if (!motion) return
    gsap.fromTo('.sign__name', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 2.2, ease: 'power2.inOut', scrollTrigger: { trigger: '.sign__name', start: 'top 85%' } })
    gsap.fromTo('.sign__portrait img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.sign__portrait', start: 'top bottom', end: 'bottom top', scrub: true } })
  })
  return (
    <section className="sign" id="signature" ref={root} aria-label="Signature">
      <div className="grid-bg" aria-hidden="true" />
      <div className="sign__copy">
        <Lines lines={['From stone', 'to flesh,', <em key="e">and back to legend.</em>]} className="sign__head" />
        <p className="sign__name" aria-label="Asake">
          Asake
        </p>
      </div>
      <figure className="sign__portrait">
        <img src={img('face')} alt="Asake, studio portrait in a white shirt and black tie" loading="lazy" />
      </figure>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="foot" aria-label="Credits">
      <img className="foot__img" src={PHOTOS.giran} alt="Asake from behind, arms raised, the word GIRAN tattooed across his back" loading="lazy" />
      <div className="foot__copy">
        <p className="foot__word">Giran</p>
        <p className="label">Republic</p>
        <p className="foot__credit">{CREDIT}</p>
        <p className="foot__credit">
          Concept, design & development — {AUTHOR.name} ({AUTHOR.alias})
        </p>
        <a className="label foot__top" href="#top">
          Back to the stone ↑
        </a>
      </div>
    </footer>
  )
}
