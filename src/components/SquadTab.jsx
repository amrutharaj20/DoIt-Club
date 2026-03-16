import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import styles from './SquadTab.module.css'

const todayKey = new Date().toISOString().split('T')[0]

function initials(name) { return name ? name.slice(0, 2).toUpperCase() : '?' }

export default function SquadTab({ toast }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [friends, setFriends] = useState([])
  const [myHabits, setMyHabits] = useState([])
  const [friendInput, setFriendInput] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const [{ data: prof }, { data: myHab }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('habits').select('*').eq('user_id', user.id)
    ])
    setProfile(prof)
    setMyHabits(myHab || [])

    // Get friendships
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id, profiles!friendships_friend_id_fkey(id, username, points)')
      .eq('user_id', user.id)

    if (!friendships?.length) { setFriends([]); setLoading(false); return }

    const friendIds = friendships.map(f => f.friend_id)

    // Get their habits + completions today
    const [{ data: fHabits }, { data: fComps }, { data: cheers }] = await Promise.all([
      supabase.from('habits').select('*').in('user_id', friendIds),
      supabase.from('completions').select('habit_id, user_id').in('user_id', friendIds).eq('completed_date', todayKey),
      supabase.from('cheers').select('*').eq('from_user_id', user.id).eq('cheer_date', todayKey)
    ])

    const compSet = new Set(fComps?.map(c => `${c.user_id}-${c.habit_id}`) || [])
    const cheerSet = new Set(cheers?.map(c => `${c.to_user_id}-${c.habit_id}`) || [])

    const enriched = friendships.map(f => ({
      id: f.friend_id,
      username: f.profiles?.username,
      points: f.profiles?.points || 0,
      habits: (fHabits || [])
        .filter(h => h.user_id === f.friend_id)
        .map(h => ({
          ...h,
          done: compSet.has(`${f.friend_id}-${h.id}`),
          cheered: cheerSet.has(`${f.friend_id}-${h.id}`)
        }))
    }))
    setFriends(enriched)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addFriend = async () => {
    const username = friendInput.trim()
    if (!username) return
    const { data: found } = await supabase.from('profiles').select('id, username').eq('username', username).single()
    if (!found) { toast('User not found!'); return }
    if (found.id === user.id) { toast("That's you!"); return }
    const { error } = await supabase.from('friendships').insert({ user_id: user.id, friend_id: found.id })
    if (error) { toast('Already friends!'); return }
    setFriendInput('')
    toast(`Added ${found.username} to your squad!`)
    fetchAll()
  }

  const cheerHabit = async (friendId, habitId) => {
    const { error } = await supabase.from('cheers').insert({ from_user_id: user.id, to_user_id: friendId, habit_id: habitId, cheer_date: todayKey })
    if (error) { toast('Already cheered!'); return }
    await supabase.from('profiles').update({ points: (friends.find(f => f.id === friendId)?.points || 0) + 20 }).eq('id', friendId)
    toast('🎉 Cheered!')
    fetchAll()
  }

  const assignHabit = async (friendId, habitId) => {
    const habit = myHabits.find(h => h.id === habitId)
    if (!habit) return
    const { error } = await supabase.from('habits').insert({ user_id: friendId, name: habit.name, streak: 0, total_done: 0, assigned_by: profile?.username })
    if (error) { toast('Could not assign habit'); return }
    toast(`✅ Assigned "${habit.name}"!`)
    fetchAll()
  }

  if (loading) return <div style={{ color: '#444', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Loading squad...</div>

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Squad</h1>
        <p className={styles.sub}>Grind together, grow together</p>
      </div>

      <div className={`glass-card ${styles.profileCard}`}>
        <div className={styles.avatar}>{initials(profile?.username)}</div>
        <div>
          <div className={styles.myName}>{profile?.username}</div>
          <div className={styles.myPts}>{profile?.points || 0}✨ points</div>
        </div>
      </div>

      <div className="sec-label">Friends</div>

      {friends.length === 0 && (
        <p className={styles.empty}>No friends yet — add someone below!</p>
      )}

      {friends.map(f => (
        <div key={f.id} className={`glass-card ${styles.friendCard}`}>
          <div className={styles.friendHeader}>
            <div className={styles.friendAvatar}>{initials(f.username)}</div>
            <div style={{ flex: 1 }}>
              <div className={styles.friendName}>{f.username}</div>
              <div className={styles.friendPts}>{f.points}✨ points</div>
            </div>
            <div className={styles.friendProgress}>{f.habits.filter(h => h.done).length}/{f.habits.length} done</div>
          </div>

          <div className={styles.friendHabits}>
            {f.habits.map(h => (
              <div key={h.id} className={styles.fhRow}>
                <div className={`${styles.fhDot} ${h.done ? styles.fhDone : ''}`}>{h.done ? '✓' : ''}</div>
                <div className={styles.fhName}>{h.name}</div>
                <div className={styles.fhStreak}>{h.streak}🔥</div>
                <button
                  className={`${styles.cheerBtn} ${h.cheered ? styles.cheered : ''}`}
                  onClick={() => !h.cheered && cheerHabit(f.id, h.id)}
                >
                  {h.cheered ? '🎉 Cheered' : '👏 Cheer'}
                </button>
              </div>
            ))}
            {f.habits.length === 0 && <p className={styles.noHabits}>No habits yet</p>}
          </div>

          {myHabits.length > 0 && (
            <div className={styles.assignRow}>
              <select className={styles.assignSel} id={`sel-${f.id}`}>
                {myHabits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              <button
                className={styles.assignBtn}
                onClick={() => {
                  const sel = document.getElementById(`sel-${f.id}`)
                  assignHabit(f.id, parseInt(sel.value))
                }}
              >
                Assign →
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="sec-label">Add a friend</div>
      <div className={styles.addRow}>
        <input
          className="input"
          placeholder="Enter their username..."
          value={friendInput}
          onChange={e => setFriendInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addFriend()}
        />
        <button className="btn-primary" onClick={addFriend}>+ Add</button>
      </div>
    </div>
  )
}
