import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SlidesOnly from './pages/SlidesOnly.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SlidesOnly />
  </StrictMode>,
)
