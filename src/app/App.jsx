import { BrowserRouter, Link } from 'react-router-dom'
import { AuthProvider }         from './providers/AuthProvider'
import { SiteSettingsProvider } from './providers/SiteSettingsProvider'
import Router from './Router'
import WhatsAppButton from '@/shared/components/WhatsAppButton/WhatsAppButton'
import Toast from '@/shared/components/ui/Toast'

/* TODO: remove before launch */
function TempAdminBtn() {
  return (
    <Link
      to="/admin"
      style={{
        position: 'fixed', bottom: '1.25rem', left: '1.25rem',
        zIndex: 9999, background: '#2F2A33', color: '#fff',
        fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
        fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
        textDecoration: 'none', padding: '0.45rem 0.9rem',
        borderRadius: '999px', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        opacity: 0.85,
      }}
    >
      ⚙ Admin
    </Link>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteSettingsProvider>
          <Router />
          <WhatsAppButton />
          <Toast />
          <TempAdminBtn />
        </SiteSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
