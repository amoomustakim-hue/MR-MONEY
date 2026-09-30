import { useCallback, useState } from 'react'
import { Nav, Preloader } from './components/Chrome'
import { Hero } from './components/Hero'
import { Bio, Discography, Footer, Live, Signature, Sound, WalkOut } from './components/Sections'
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
        <WalkOut />
        <Discography />
        <Live />
        <Signature />
      </main>
      <Footer />
    </>
  )
}
