import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const LOGIN_ENDPOINT = `${API_BASE_URL}/api/v1/auth/login`

type LoginStatus = {
  type: 'success' | 'error'
  message: string
}

function findToken(payload: unknown): string | null {
  if (typeof payload === 'string') {
    return payload.trim() || null
  }

  if (!payload || typeof payload !== 'object') {
    return null
  }

  const response = payload as Record<string, unknown>
  const tokenKeys = ['token', 'accessToken', 'access_token', 'jwt']

  for (const key of tokenKeys) {
    const value = response[key]

    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  for (const value of Object.values(response)) {
    const token = findToken(value)

    if (token) {
      return token
    }
  }

  return null
}

function getApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const response = payload as Record<string, unknown>
  const message = response.message ?? response.error ?? response.detail

  return typeof message === 'string' && message.trim() ? message : null
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.5 7.5h15a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15V9a1.5 1.5 0 0 1 1.5-1.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="m4 8 8 5 8-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.5 10V8a3.5 3.5 0 1 1 7 0v2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="2.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 4 20 20"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M10.6 6.3A9.8 9.8 0 0 1 12 6c5.5 0 9 6 9 6a14.4 14.4 0 0 1-3 3.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M6.6 9.1A14.2 14.2 0 0 0 3 12s3.5 6 9 6c1 0 2-.2 2.8-.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10.3 10.2A2.9 2.9 0 0 0 9.5 12a2.5 2.5 0 0 0 4 2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.5c2.8 2 5.8 2.4 7.5 2.4v5.4c0 4.2-2.8 8-7.5 9.2-4.7-1.2-7.5-5-7.5-9.2V5.9c1.7 0 4.7-.4 7.5-2.4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginStatus, setLoginStatus] = useState<LoginStatus | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setLoginStatus(null)

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const isJson = response.headers.get('content-type')?.includes('application/json')
      const payload: unknown = isJson ? await response.json() : await response.text()

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload) ?? 'No se pudo iniciar sesion.')
      }

      const token = findToken(payload)

      if (!token) {
        throw new Error('La API respondio correctamente, pero no envio un token.')
      }

      localStorage.setItem('authToken', token)
      localStorage.setItem('authUserEmail', email)
      setLoginStatus({
        type: 'success',
        message: 'Sesion iniciada correctamente.',
      })
    } catch (error) {
      setLoginStatus({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'No se pudo conectar con el servidor de autenticacion.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <header className="brand-panel">
          <div className="brand-mark" aria-hidden="true">
            <ShieldIcon />
          </div>
          <div className="brand-copy">
            <p className="brand-title">ControlZero</p>
            <p className="brand-subtitle">Sistema de Control de Alcoholemia Laboral</p>
          </div>
        </header>

        <form className="form-panel" onSubmit={handleSubmit}>
          <div className="heading">
            <h1 id="login-title">Iniciar Sesi&oacute;n</h1>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          <label className="field">
            <span>Correo Electr&oacute;nico</span>
            <div className="input-wrap">
              <span className="input-icon">
                <MailIcon />
              </span>
              <input
                type="email"
                placeholder="usuario@empresa.com"
                value={email}
                autoComplete="email"
                required
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </label>

          <label className="field">
            <span>Contrase&ntilde;a</span>
            <div className="input-wrap">
              <span className="input-icon">
                <LockIcon />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                autoComplete="current-password"
                required
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                className="visibility-toggle"
                type="button"
                aria-label={showPassword ? 'Ocultar contrase\u00f1a' : 'Mostrar contrase\u00f1a'}
                onClick={() => setShowPassword((current) => !current)}
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>
          </label>

          {loginStatus && (
            <p className={`form-message ${loginStatus.type}`} role="status">
              {loginStatus.message}
            </p>
          )}

          <button className="submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando...' : 'Iniciar Sesi\u00f3n'}
          </button>
        </form>
      </section>

      <p className="footer-note">© 2026 ControlZero. Todos los derechos reservados.</p>
    </main>
  )
}

export default App
