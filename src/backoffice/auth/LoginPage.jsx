import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import styles from './LoginPage.module.css'

const REGISTER_CODE = import.meta.env.VITE_ADMIN_REGISTER_CODE ?? ''

const AUTH_ERRORS = {
  'auth/invalid-credential':        'Email o contraseña incorrectos.',
  'auth/user-not-found':            'No existe una cuenta con ese email.',
  'auth/wrong-password':            'Contraseña incorrecta.',
  'auth/too-many-requests':         'Demasiados intentos. Intentá más tarde.',
  'auth/email-already-in-use':      'Ya existe una cuenta con ese email.',
  'auth/weak-password':             'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email':             'El email no es válido.',
}

export default function LoginPage() {
  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()

  const [tab,      setTab]      = useState('login')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm,   setRegForm]   = useState({ name: '', email: '', password: '', confirm: '', code: '' })

  if (user) { navigate('/admin', { replace: true }); return null }

  function switchTab(t) { setTab(t); setError(null) }

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(loginForm.email, loginForm.password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(AUTH_ERRORS[err.code] ?? 'Error al iniciar sesión. Intentá nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError(null)

    if (!REGISTER_CODE) {
      setError('El registro de cuentas está deshabilitado. Configurá VITE_ADMIN_REGISTER_CODE.')
      return
    }
    if (regForm.code !== REGISTER_CODE) {
      setError('Código de activación incorrecto.')
      return
    }
    if (regForm.password !== regForm.confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (regForm.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      await signUp(regForm.email, regForm.password, regForm.name)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(AUTH_ERRORS[err.code] ?? 'Error al crear la cuenta. Intentá nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>Serena Glow</div>
        <p className={styles.sub}>Backoffice</p>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === 'login' ? styles.tabActive : ''}`}
            onClick={() => switchTab('login')}
          >
            Ingresar
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === 'register' ? styles.tabActive : ''}`}
            onClick={() => switchTab('register')}
          >
            Crear cuenta
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="l-email" className={styles.label}>Email</label>
              <input
                id="l-email"
                type="email"
                value={loginForm.email}
                onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
                className={styles.input}
                placeholder="admin@serenaglow.com"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="l-password" className={styles.label}>Contraseña</label>
              <input
                id="l-password"
                type="password"
                value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
                className={styles.input}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className={styles.btn}>
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="r-name" className={styles.label}>Nombre</label>
              <input
                id="r-name"
                type="text"
                value={regForm.name}
                onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
                required
                className={styles.input}
                placeholder="Tu nombre"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="r-email" className={styles.label}>Email</label>
              <input
                id="r-email"
                type="email"
                value={regForm.email}
                onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
                className={styles.input}
                placeholder="admin@serenaglow.com"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="r-password" className={styles.label}>Contraseña</label>
              <input
                id="r-password"
                type="password"
                value={regForm.password}
                onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                required
                className={styles.input}
                placeholder="••••••••"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="r-confirm" className={styles.label}>Confirmar contraseña</label>
              <input
                id="r-confirm"
                type="password"
                value={regForm.confirm}
                onChange={e => setRegForm(f => ({ ...f, confirm: e.target.value }))}
                required
                className={styles.input}
                placeholder="••••••••"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="r-code" className={styles.label}>Código de activación</label>
              <input
                id="r-code"
                type="password"
                value={regForm.code}
                onChange={e => setRegForm(f => ({ ...f, code: e.target.value }))}
                required
                className={styles.input}
                placeholder="Código secreto"
              />
            </div>
            <button type="submit" disabled={loading} className={styles.btn}>
              {loading ? 'Creando cuenta…' : 'Crear cuenta admin'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
