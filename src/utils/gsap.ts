import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
gsap.defaults({ ease: 'power3.out', duration: 1.2 })
// Mobile address-bar show/hide resizes the viewport; don't re-layout every pin for it.
ScrollTrigger.config({ ignoreMobileResize: true })

/** Conditions every scene is built against, via gsap.matchMedia. */
export const MQ = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
  desktop: '(min-width: 768px)',
  mobile: '(max-width: 767px)',
} as const

export type Conditions = Record<keyof typeof MQ, boolean>

export { gsap, ScrollTrigger }
