# DoIt Club 🔥

A social habit tracker built with React + Supabase.

---

## Step-by-Step Setup (Beginner Friendly)

### Step 1 — Install Node.js
Download and install from https://nodejs.org (pick the LTS version)

### Step 2 — Install dependencies
Open your terminal in this folder and run:
```bash
npm install
```

### Step 3 — Set up Supabase

1. Go to https://supabase.com and create a free account
2. Click "New Project" and fill in the details
3. Once created, go to **SQL Editor** → **New query**
4. Copy and paste the entire contents of `supabase_schema.sql` and click **Run**
5. Go to **Authentication** → **Providers** → make sure **Email** is enabled

### Step 4 — Add your Supabase credentials

1. In Supabase, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Create a file called `.env` in this folder (copy from `.env.example`):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5 — Run locally
```bash
npm run dev
```
Open http://localhost:5173 in your browser. 

### Step 6 — Deploy to Vercel (free)

1. Push this folder to a GitHub repo
2. Go to https://vercel.com and sign up with GitHub
3. Click "New Project" → import your repo
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` → your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key
5. Click **Deploy** — your app is live! 🎉

---

## Features
- ✅ Sign up / login with email
- ✅ Add, complete, and delete habits
- ✅ Daily streaks + points system
- ✅ Weekly progress view
- ✅ Activity heatmap (28 days)
- ✅ Squad page — add friends by username
- ✅ See friends' habits and streaks live
- ✅ Cheer friends' completions
- ✅ Assign habits to friends
- ✅ Real-time sync via Supabase

---

## Project Structure
```
src/
  components/
    HabitsTab.jsx      — main habits page
    StatsTab.jsx       — stats + heatmap
    SquadTab.jsx       — social / friends
  pages/
    Login.jsx          — login screen
    Signup.jsx         — signup screen
    Dashboard.jsx      — main app shell
  hooks/
    useAuth.jsx        — auth context
    useToast.js        — toast notifications
  lib/
    supabase.js        — supabase client
```
