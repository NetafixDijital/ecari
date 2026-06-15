import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '../../design/html/assets/css/nexlink/app.css'
import '../../design/html/assets/css/table-search.css'
import '../../design/html/assets/css/datatables.css'
import '../../design/html/assets/css/pages/hizli-satis.css'
import './styles/hs-fullscreen.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
