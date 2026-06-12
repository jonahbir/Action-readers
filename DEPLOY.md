# Deploy to Vercel — Final Step

Your code is ready. Do these steps once (~10 minutes).

---

## Option A: Vercel Website (Recommended)

### 1. Push to GitHub

```bash
cd "/home/jonah-bi/Desktop/Action team"
```

Create a new repo on [github.com/new](https://github.com/new) — name it e.g. `fellowship-readers` (Private is fine).

Then run (replace `YOUR-USERNAME`):

```bash
git remote add origin https://github.com/YOUR-USERNAME/fellowship-readers.git
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com](https://vercel.com) → Sign in (use GitHub).
2. **Add New Project** → Import `fellowship-readers`.
3. Framework: **Vite** (auto-detected).
4. **Environment Variables** — add both (paste **only the value**, not the `NAME=` part):

   | Name | Value (example — use yours from `.env`) |
   |------|--------|
   | `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `sb_publishable_...` or `eyJhbGci...` |

   **Common mistake:** putting `VITE_SUPABASE_ANON_KEY=sb_publishable_...` in the Value field. Vercel already has the name — the value must be **only** the key string.

5. Click **Deploy**.
6. Wait ~1–2 minutes. Copy your live URL (e.g. `https://fellowship-readers.vercel.app`).

### 3. Update Supabase for Production

1. Supabase → **Authentication → URL Configuration**.
2. **Site URL**: set to your Vercel URL.
3. **Redirect URLs** — add all of these:
   ```
   https://YOUR-APP.vercel.app/**
   https://YOUR-APP.vercel.app/auth/callback
   http://localhost:5173/**
   http://localhost:5173/auth/callback
   ```
4. Save.

### 4. Update Google OAuth (if needed)

In Google Cloud Console → OAuth client → **Authorized redirect URIs** — keep:
```
https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
```
(No change needed if already set for Supabase.)

### 5. Test Live Site

- [ ] Landing page loads with book of the week
- [ ] Sign in with Google works on production URL
- [ ] Home dashboard loads after sign-in

---

## Option B: Vercel CLI (Terminal)

```bash
cd "/home/jonah-bi/Desktop/Action team"
npx vercel login
npx vercel
```

When prompted, add env vars or set them in Vercel dashboard after.

Production deploy:
```bash
npx vercel --prod
```

---

## After Every Code Change

Push to GitHub — Vercel redeploys automatically:

```bash
git add .
git commit -m "Your change description"
git push
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank page on Vercel | Env vars missing in Vercel project settings → Redeploy |
| Book/reviews empty + login loops on live URL | `VITE_SUPABASE_ANON_KEY` value likely includes `VITE_SUPABASE_ANON_KEY=` prefix — fix in Vercel → **Redeploy** |
| Google sign-in fails on live URL | Add Vercel URL to Supabase Redirect URLs |
| 404 on `/home` refresh | `vercel.json` rewrites are already configured ✓ |
| Build fails | Run `npm run build` locally first to see errors |

---

**You are done when** the Vercel URL loads and Google sign-in works.
