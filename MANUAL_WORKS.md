# Manual Works — Fellowship Readers Platform

Everything **you** need to do manually. The code is ready; follow these steps in order.

---

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Pick a name (e.g. `fellowship-readers`), set a database password, choose a region close to your users.
4. Wait until the project is fully provisioned (~2 minutes).

---

## Step 2: Run the Database Setup

1. In your Supabase dashboard, open **SQL Editor**.
2. Open the file `supabase/schema.sql` from this project on your computer.
3. Copy the **entire file** and paste it into the SQL Editor.
4. Click **Run**.
5. Confirm there are no errors. You should see success messages for tables, policies, buckets, and seed data.

> If `alter publication supabase_realtime` fails, go to **Database → Replication** and manually enable realtime for `user_book_progress` and `announcements`.

---

## Step 3: Configure Google OAuth

### 3a. Google Cloud Console

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com).
2. Create a project (or use an existing one).
3. Go to **APIs & Services → OAuth consent screen** → configure it (External, add your email as test user if in testing mode).
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
5. Application type: **Web application**.
6. Add **Authorized redirect URI**:
   ```
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
   ```
   Replace `YOUR-PROJECT-REF` with your Supabase project reference (found in Project Settings → General).
7. Copy the **Client ID** and **Client Secret**.

### 3b. Supabase Auth Settings

1. In Supabase, go to **Authentication → Providers → Google**.
2. Enable Google provider.
3. Paste your Google **Client ID** and **Client Secret**.
4. Save.

### 3c. Site URL (important for redirects)

1. Go to **Authentication → URL Configuration**.
2. Set **Site URL** to `http://localhost:5173` for local dev.
3. Add **Redirect URLs**:
   ```
   http://localhost:5173/**
   https://your-vercel-domain.vercel.app/**
   ```
   (Add your production URL after deploying in Step 7.)

---

## Step 4: Get Supabase API Keys

1. In Supabase, go to **Project Settings → API**.
2. Copy:
   - **Project URL** → this is `VITE_SUPABASE_URL`
   - **anon public** key → this is `VITE_SUPABASE_ANON_KEY`

---

## Step 5: Set Up Local Environment

> **If the site looks blank or broken**, you almost certainly skipped this step. The app cannot load books, reviews, or auth without these keys.

1. In the project folder, copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and paste your values:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
3. **Restart the dev server** after saving `.env` (`Ctrl+C`, then `npm run dev` again).

---

## Step 6: Run Locally & Test

```bash
cd "/home/jonah-bi/Desktop/Action team"
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Test checklist

- [ ] Landing page loads with book of the week
- [ ] Sign in with Google works
- [ ] Onboarding appears: pick a biblical handle, see the playful "is this from the Bible?" joke
- [ ] Home dashboard shows book, announcements, reviews
- [ ] Open a book in `/read` — PDF loads, scroll gate + timer work
- [ ] Write a review → appears as pending
- [ ] Profile page: edit handle, set daily reading goal

---

## Step 7: Make Yourself Super Admin

After your **first Google sign-in**:

1. Go to Supabase **SQL Editor** and run (replace the email):
   ```sql
   UPDATE public.users
   SET role = 'super_admin'
   WHERE email = 'YOUR-EMAIL@gmail.com';
   ```
2. Sign out and sign back in on the site.
3. You should now see the **Admin** link in the navbar.

---

## Step 8: Deploy to Vercel

1. Push this project to a **GitHub repository** (create one on github.com, then):
   ```bash
   cd "/home/jonah-bi/Desktop/Action team"
   git init
   git add .
   git commit -m "Initial fellowship readers platform"
   git remote add origin https://github.com/YOUR-USERNAME/fellowship-readers.git
   git push -u origin main
   ```
2. Go to [https://vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo.
3. Framework preset: **Vite**.
4. Add **Environment Variables**:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
5. Click **Deploy**.
6. Copy your Vercel URL (e.g. `https://fellowship-readers.vercel.app`).

### After deploy

1. In Supabase **Authentication → URL Configuration**, add your Vercel URL to **Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   ```
2. Update **Site URL** to your production URL when going live.

---

## Step 9: Upload Real Books (Admin Panel)

The seed data includes sample books with external PDF URLs. For production:

1. Sign in as super admin → go to **Admin → Books**.
2. Upload your own cover image and PDF file.
3. Set week number, total pages, and toggle **active** for the current week.
4. Add comprehension questions as JSON:
   ```json
   [
     {
       "page": 10,
       "id": "q1",
       "question": "What is the main theme of this chapter?",
       "options": ["Faith", "Doubt", "Anger"],
       "correct": 0
     }
   ]
   ```

---

## Step 10: Seed Test User (Yonas Birhanu)

A ready-made seed file is at `supabase/seed-data.sql`.

**Order matters:**

1. Run `supabase/schema.sql` in Supabase SQL Editor (if not done yet).
2. Start the app locally with `.env` configured.
3. Open http://localhost:5173 and **Sign in with Google** using `birhanuyonas056@gmail.com`.
4. Complete onboarding OR skip — then go to Supabase SQL Editor and run **`supabase/seed-data.sql`**.
5. Sign out and sign back in. You should see:
   - Handle: **@jonah**
   - Bio: *I am loved!*
   - Reading progress on the home page
   - **Admin** tab (super_admin role for testing)

To add more members later, use `supabase/seed-users-template.sql` after each person signs in once.

**To promote someone to admin** (super admin only, or via SQL):
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'member@gmail.com';
```

---

## Step 11: Promote Additional Admins

As super admin, use **Admin → Users** tab:
- Click **Make Admin** next to any user (super admin only).
- Regular admins can ban users and manage books but cannot promote/demote admins.

---

## Privacy Reminder

- **Members only see `@biblical_handle`** everywhere (reviews, leaderboard, announcements).
- **Real names are visible only in the Admin panel** (Users tab, Leaderboard real name column).
- Members can edit their handle anytime on the **Profile** page.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Google sign-in redirects to wrong page | Check Supabase Site URL and Redirect URLs match your domain |
| PDF won't load | Upload PDF via Admin panel to Supabase storage; external URLs may block CORS |
| "Missing env" warnings | Ensure `.env` exists locally; on Vercel, env vars are set in project settings |
| Realtime not updating | Enable replication for `user_book_progress` and `announcements` in Supabase |
| User stuck on onboarding | Run: `UPDATE users SET onboarding_complete = true WHERE email = '...'` |
| RLS permission denied | Re-run `supabase/schema.sql` or check user role/is_banned status |

---

## Quick Reference

| What | Where |
|------|-------|
| Database SQL | `supabase/schema.sql` |
| Local dev | `npm run dev` → http://localhost:5173 |
| Production build test | `npm run build && npm run preview` |
| Env variables | `.env` (local) / Vercel dashboard (production) |
| Admin panel | `/admin` (admin + super_admin only) |

---

**That's it.** Once Steps 1–8 are done, the platform is live. Steps 9–11 are ongoing fellowship management.
