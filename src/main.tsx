import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAuth } from './store/useAuthStore'
import { initSync } from './store/sync'

initSync()
initAuth()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

const splash = document.getElementById('splash')
if (splash) {
  const hideSplash = () => {
    splash.classList.add('is-hidden')
    splash.addEventListener('transitionend', () => splash.remove(), { once: true })
  }
  requestAnimationFrame(() => requestAnimationFrame(hideSplash))
}
