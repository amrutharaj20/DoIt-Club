import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './Auth.module.css'

export default function Signup() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, username)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className={styles.page}>
      <div className={styles.orb1} /><div className={styles.orb2} />
      <div className={styles.card}>
        <div className={styles.logo}>✅</div>
        <h1 className={styles.title}>You're in!</h1>
        <p className={styles.sub}>Check your email to confirm your account, then sign in.</p>
        <Link to="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 16, textDecoration: 'none' }}>Go to login</Link>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.orb1} /><div className={styles.orb2} />
      <div className={styles.card}>
        <div className={styles.logo}>🔥</div>
        <h1 className={styles.title}>Join DoIt Club</h1>
        <p className={styles.sub}>Build habits. Beat your friends. Win.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input className="input" type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
          {error && <p className={styles.error}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className={styles.switch}>Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
