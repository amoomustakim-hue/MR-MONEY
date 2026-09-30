import { useLayoutEffect, type DependencyList, type RefObject } from 'react'
import { gsap, MQ, type Conditions } from '../utils/gsap'

type Setup = (conditions: Conditions, root: HTMLElement) => void | (() => void)

/**
 * Builds a component's GSAP/ScrollTrigger scene inside a scoped
 * gsap.matchMedia, so selectors are local to `scope`, every tween and
 * trigger is reverted on unmount, and the scene is rebuilt when motion or
 * breakpoint preferences change.
 */
export function useScrollScene(scope: RefObject<HTMLElement | null>, setup: Setup, deps: DependencyList = []) {
  useLayoutEffect(() => {
    const root = scope.current
    if (!root) return
    const mm = gsap.matchMedia(root)
    mm.add(MQ, (ctx) => setup(ctx.conditions as Conditions, root))
    return () => mm.revert()
  }, deps)
}
