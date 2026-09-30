import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter-tight/index.css'
import '@fontsource/cinzel/400.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/mrs-saint-delafield/400.css'
import './styles/base.css'
import './styles/hero.css'
import './styles/sections.css'
import App from './App'
import { LenisProvider } from './hooks/useLenis'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LenisProvider>
      <App />
    </LenisProvider>
  </StrictMode>,
)
