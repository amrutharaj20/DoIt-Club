import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import styles from './StatsTab.module.css'

export default function StatsTab() {
  const { user } = useAuth()
  const [habits, setHabits] = useState([])
  const [profile, setProfile] = useState(null)
  const [heatmap, setHeatmap] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const [{ data: prof }, { data: hab }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('habits').select('*').eq('user_id', user.id)
      ])
      setProfile(prof)
      setHabits(hab || [])

      // Heatmap: last 28 days
      const dates = Array.from({ length: 28 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - 27 + i)
        return d.toISOString().split('T')[0]
      })
      const { data: comps } = await supabase
        .from('completions')
        .select('completed_date')
        .eq('user_id', user.id)
        .in('completed_date', dates)

      const countMap = {}
      comps?.forEach(c => { countMap[c.completed_date] = (countMap[c.completed_date] || 0) + 1 })
      const total = hab?.length || 1
      setHeatmap(dates.map(d => ({ date: d, count: countMap[d] || 0, total })))
      setLoading(false)
    }
    fetchStats()
  }, [user])

  const bestStreak = habits.reduce((m, h) => h.streak > m.streak ? h : m, { streak: 0, name: '—' })
  const totalCheckins = habits.reduce((s, h) => s + h.total_done, 0)
  const maxDone = Math.max(...habits.map(h => h.total_done), 1)

  if (loading) return <div style={{ color: '#444', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Loading stats...</div>

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Stats</h1>
        <p className={styles.sub}>All-time overview</p>
      </div>

      <div className={styles.grid}>
        <div className={`glass-card ${styles.card}`}>
          <div className={styles.cardLabel}>Total points</div>
          <div className={styles.cardBig}>{profile?.points || 0}</div>
          <div className={styles.cardSub}>earned overall</div>
        </div>
        <div className={`glass-card ${styles.card}`}>
          <div className={styles.cardLabel}>Total check-ins</div>
          <div className={styles.cardBig}>{totalCheckins}</div>
          <div className={styles.cardSub}>across all habits</div>
        </div>
        <div className={`glass-card ${styles.card}`}>
          <div className={styles.cardLabel}>Best streak</div>
          <div className={styles.cardBig}>{bestStreak.streak}</div>
          <div className={styles.cardSub}>{bestStreak.name}</div>
        </div>
        <div className={`glass-card ${styles.card}`}>
          <div className={styles.cardLabel}>Habits tracked</div>
          <div className={styles.cardBig}>{habits.length}</div>
          <div className={styles.cardSub}>active habits</div>
        </div>

        <div className={`glass-card ${styles.card} ${styles.wide}`}>
          <div className={styles.cardLabel}>Habit completion</div>
          {habits.length === 0
            ? <p style={{ fontSize: 12, color: '#333', fontWeight: 500 }}>No habits yet</p>
            : habits.map(h => (
              <div key={h.id} className={styles.barRow}>
                <div className={styles.barLabel}>{h.name}</div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${Math.round(h.total_done / maxDone * 100)}%` }} />
                </div>
                <div className={styles.barPct}>{h.total_done}</div>
              </div>
            ))}
        </div>

        <div className={`glass-card ${styles.card} ${styles.wide}`}>
          <div className={styles.cardLabel}>Activity — last 28 days</div>
          <div className={styles.heatmap}>
            {heatmap.map((cell, i) => {
              const r = cell.total > 0 ? cell.count / cell.total : 0
              const lvl = r >= 1 ? 4 : r >= 0.66 ? 3 : r >= 0.33 ? 2 : cell.count > 0 ? 1 : 0
              return <div key={i} className={`${styles.hmCell} ${lvl > 0 ? styles[`l${lvl}`] : ''}`} title={cell.date} />
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
