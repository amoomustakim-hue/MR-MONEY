import { useCallback, useState } from 'react'
import { Nav, Preloader } from './components/Chrome'
import { Hero } from './components/Hero'
import { Spiral } from './components/Spiral'
import { Bio, Discography, Footer, Live, Signature, Sound } from './components/Sections'
import { useScrollLock } from './hooks/useLenis'

export default function App() {
  const [ready, setReady] = useState(false)
  const onDone = useCallback(() => setReady(true), [])
  useScrollLock(!ready)

  return (
    <>
      <a className="skip label" href="#bio">
        Skip to the story
      </a>
      <Preloader onDone={onDone} />
      <Nav />
      <main>
        <Hero ready={ready} />
        <Bio />
        <Sound />
        <Spiral />
        <Discography />
        <Live />
        <Signature />
      </main>
      <Footer />
    </>
  )
}
