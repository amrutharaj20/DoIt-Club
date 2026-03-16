import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import HabitsTab from '../components/HabitsTab'
import StatsTab from '../components/StatsTab'
import SquadTab from '../components/SquadTab'
import styles from './Dashboard.module.css'

const TABS = ['Habits', 'Stats', 'Squad']

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Habits')
  const { signOut } = useAuth()
  const { toast, message, visible } = useToast()

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
        <button className={styles.signOutBtn} onClick={signOut} title="Sign out">↩</button>
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
