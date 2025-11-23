import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Import dev utilities (only active in development)
if (import.meta.env.DEV) {
  import('./utils/runQuoteDiagnostics')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
