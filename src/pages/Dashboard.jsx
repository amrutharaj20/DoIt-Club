import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'
import HabitsTab from '../components/HabitsTab'
import StatsTab from '../components/StatsTab'
import SquadTab from '../components/SquadTab'
import styles from './Dashboard.module.css'

const TABS = ['Habits', 'Stats', 'Squad']

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Habits')
  const [profileOpen, setProfileOpen] = useState(false)
  const [username, setUsername] = useState('')
  const { user, signOut } = useAuth()
  const { toast, message, visible } = useToast()
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('username').eq('id', user.id).single()
        .then(({ data }) => { if (data) setUsername(data.username) })
    }
  }, [user])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = username ? username.slice(0, 2).toUpperCase() : '?'

  return (
    <div className={styles.app}>
      <div className={styles.orb1} /><div className={styles.orb2} />

      <nav className={styles.nav}>
        <div className={styles.navTabs}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`${styles.navBtn} ${activeTab === tab ? styles.active : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className={styles.profileWrapper} ref={dropdownRef}>
          <button className={styles.avatarBtn} onClick={() => setProfileOpen(o => !o)}>
            {initials}
          </button>

          {profileOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.avatarLg}>{initials}</div>
                <div>
                  <div className={styles.dropName}>{username || 'User'}</div>
                  <div className={styles.dropEmail}>{user?.email}</div>
                </div>
              </div>
              <div className={styles.dropDivider} />
              <button className={styles.dropSignOut} onClick={signOut}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className={styles.main}>
        {activeTab === 'Habits' && <HabitsTab toast={toast} />}
        {activeTab === 'Stats' && <StatsTab />}
        {activeTab === 'Squad' && <SquadTab toast={toast} />}
      </main>

      <div className={`toast ${visible ? 'show' : ''}`}>{message}</div>
    </div>
  )
}
