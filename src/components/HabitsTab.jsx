import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import styles from './HabitsTab.module.css'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const todayKey = new Date().toISOString().split('T')[0]

export default function HabitsTab({ toast }) {
  const { user } = useAuth()
  const [habits, setHabits] = useState([])
  const [completedToday, setCompletedToday] = useState([])
  const [newHabit, setNewHabit] = useState('')
  const [profile, setProfile] = useState(null)
  const [weekData, setWeekData] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    const [{ data: prof }, { data: hab }, { data: comp }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('habits').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('completions').select('habit_id').eq('user_id', user.id).eq('completed_date', todayKey)
    ])
    setProfile(prof)
    setHabits(hab || [])
    setCompletedToday((comp || []).map(c => c.habit_id))

    // Fetch week data
    const start = new Date()
    start.setDate(start.getDate() - start.getDay())
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i)
      return d.toISOString().split('T')[0]
    })
    const { data: weekComp } = await supabase
      .from('completions')
      .select('completed_date, habit_id')
      .eq('user_id', user.id)
      .in('completed_date', dates)
    const map = {}
    dates.forEach(d => { map[d] = { done: 0, total: hab?.length || 0 } })
    weekComp?.forEach(c => { if (map[c.completed_date]) map[c.completed_date].done++ })
    setWeekData(map)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Realtime subscription
  useEffect(() => {
    const sub = supabase.channel('habits-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${user?.id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'completions', filter: `user_id=eq.${user?.id}` }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [user, fetchAll])

  const toggleHabit = async (habitId) => {
    const isDone = completedToday.includes(habitId)
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return

    if (isDone) {
      await supabase.from('completions').delete()
        .eq('user_id', user.id).eq('habit_id', habitId).eq('completed_date', todayKey)
      await supabase.from('habits').update({ streak: Math.max(0, habit.streak - 1), total_done: Math.max(0, habit.total_done - 1) }).eq('id', habitId)
      await supabase.from('profiles').update({ points: Math.max(0, (profile?.points || 0) - 10) }).eq('id', user.id)
    } else {
      await supabase.from('completions').insert({ user_id: user.id, habit_id: habitId, completed_date: todayKey })
      const newStreak = habit.streak + 1
      await supabase.from('habits').update({ streak: newStreak, total_done: habit.total_done + 1 }).eq('id', habitId)
      await supabase.from('profiles').update({ points: (profile?.points || 0) + 10 }).eq('id', user.id)
      checkMilestone(habit.name, newStreak)
    }
    fetchAll()
  }

  const checkMilestone = (name, streak) => {
    const milestones = { 3: '3-day streak!', 7: 'One full week!', 14: '2 weeks!', 30: '30 days!' }
    if (milestones[streak]) toast(`🏆 ${name} — ${milestones[streak]}`)
    else if (completedToday.length + 1 === habits.length) toast('🌟 Perfect day! All done!')
  }

  const addHabit = async () => {
    const name = newHabit.trim()
    if (!name) return
    await supabase.from('habits').insert({ user_id: user.id, name, streak: 0, total_done: 0 })
    setNewHabit('')
    fetchAll()
  }

  const deleteHabit = async (habitId) => {
    await supabase.from('habits').delete().eq('id', habitId)
    fetchAll()
  }

  const total = habits.length
  const done = completedToday.length
  const pct = total > 0 ? Math.round(done / total * 100) : 0
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0)

  if (loading) return <div className={styles.loading}>Loading your habits...</div>

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Hey {profile?.username || 'there'} 👋</h1>
        <p className={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className={styles.statStrip}>
        <div className={`glass-card ${styles.statCard}`}>
          <div className={styles.statVal}>{done}/{total}</div>
          <div className={styles.statLbl}>Today</div>
        </div>
        <div className={`glass-card ${styles.statCard}`}>
          <div className={styles.statVal}>{bestStreak}🔥</div>
          <div className={styles.statLbl}>Streak</div>
        </div>
        <div className={`glass-card ${styles.statCard}`}>
          <div className={styles.statVal}>{profile?.points || 0}✨</div>
          <div className={styles.statLbl}>Points</div>
        </div>
      </div>

      <div className="sec-label">This week</div>
      <div className={styles.weekGrid}>
        {Array.from({ length: 7 }, (_, i) => {
          const start = new Date(); start.setDate(start.getDate() - start.getDay())
          const d = new Date(start); d.setDate(start.getDate() + i)
          const key = d.toISOString().split('T')[0]
          const isToday = key === todayKey
          const data = weekData[key]
          const isFull = data && data.done === data.total && data.total > 0
          const isPartial = data && data.done > 0 && !isFull
          return (
            <div key={i} className={styles.dayCol}>
              <div className={styles.dayLabel}>{DAYS[d.getDay()]}</div>
              <div className={`${styles.dayDot} ${isToday ? styles.today : ''} ${isFull ? styles.full : ''} ${isPartial ? styles.partial : ''}`}>
                {data ? `${data.done}/${data.total}` : ''}
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.progWrap}>
        <div className={styles.progBar} style={{ width: `${pct}%` }} />
      </div>
      <p className={styles.progLabel}>{pct}% complete today</p>

      <div className="sec-label">My habits</div>
      <div className={styles.habitsList}>
        {habits.length === 0 && <p className={styles.empty}>No habits yet — add one below!</p>}
        {habits.map(h => {
          const isDone = completedToday.includes(h.id)
          return (
            <div key={h.id} className={`glass-card ${styles.habitCard} ${isDone ? styles.done : ''}`} onClick={() => toggleHabit(h.id)}>
              <div className={`${styles.check} ${isDone ? styles.checked : ''}`}>{isDone ? '✓' : ''}</div>
              <div className={styles.habitInfo}>
                <div className={`${styles.habitName} ${isDone ? styles.strikethrough : ''}`}>{h.name}</div>
                <div className={styles.habitMeta}>
                  {h.streak > 0 && <span className={styles.fire}>{h.streak}🔥 · </span>}
                  {h.total_done} total
                </div>
              </div>
              <button className={styles.delBtn} onClick={e => { e.stopPropagation(); deleteHabit(h.id) }}>✕</button>
            </div>
          )
        })}
      </div>

      <div className={styles.addRow}>
        <input
          className="input"
          placeholder="Add a habit..."
          value={newHabit}
          onChange={e => setNewHabit(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addHabit()}
          maxLength={50}
        />
        <button className="btn-primary" onClick={addHabit}>+ Add</button>
      </div>
    </div>
  )
}
