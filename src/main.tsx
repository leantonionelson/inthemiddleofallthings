import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Import live-audio components to register them as web components
import './components/LiveAudio/index.tsx'
import './components/LiveAudio/visual-3d'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
