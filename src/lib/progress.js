import { supabase } from './supabase'

function todayPlanEntry(planData, dateKey) {
  const raw = planData[dateKey]
  if (raw && typeof raw === 'object') {
    return { pages: raw.pages || 0, seconds: raw.seconds || 0 }
  }
  return { pages: typeof raw === 'number' ? raw : 0, seconds: 0 }
}

/** Save or update book progress and bump today's reading plan. */
export async function saveBookProgress({ userId, bookId, verifiedPages, addTimeSeconds = 0 }) {
  const { data: existing, error: fetchError } = await supabase
    .from('user_book_progress')
    .select('verified_pages, total_time_seconds')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .maybeSingle()

  if (fetchError) return { error: fetchError }

  const prevPages = existing?.verified_pages || 0
  let pages = prevPages
  if (verifiedPages !== undefined && verifiedPages !== null) {
    pages = Math.max(prevPages, verifiedPages)
  }

  const pageDelta = pages - prevPages
  const totalTime = (existing?.total_time_seconds || 0) + (addTimeSeconds || 0)

  const payload = {
    user_id: userId,
    book_id: bookId,
    verified_pages: pages,
    total_time_seconds: totalTime,
    last_read_at: new Date().toISOString(),
  }

  let result
  if (existing) {
    result = await supabase
      .from('user_book_progress')
      .update(payload)
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .select()
      .single()
  } else {
    result = await supabase
      .from('user_book_progress')
      .insert(payload)
      .select()
      .single()
  }

  if (result.error) return { error: result.error }

  if (pageDelta > 0 || addTimeSeconds > 0) {
    await bumpReadingPlan(userId, pageDelta, addTimeSeconds)
  }

  return { data: result.data }
}

export async function bumpReadingPlan(userId, pagesDelta = 0, secondsDelta = 0) {
  if (pagesDelta < 1 && secondsDelta < 1) return

  const today = new Date().toISOString().split('T')[0]
  const { data: plan } = await supabase
    .from('reading_plans')
    .select('plan_data, daily_page_goal')
    .eq('user_id', userId)
    .maybeSingle()

  const planData = { ...(plan?.plan_data || {}) }
  const entry = todayPlanEntry(planData, today)
  entry.pages += pagesDelta
  entry.seconds += secondsDelta
  planData[today] = entry

  await supabase.from('reading_plans').upsert({
    user_id: userId,
    daily_page_goal: plan?.daily_page_goal || 20,
    plan_data: planData,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

export async function addReadingTime(userId, bookId, seconds, pageNumber) {
  if ((!seconds || seconds < 1) && !pageNumber) return { error: null }
  return saveBookProgress({
    userId,
    bookId,
    verifiedPages: pageNumber,
    addTimeSeconds: seconds || 0,
  })
}

export async function logReadingSession({ userId, bookId, pageNumber, timeSpentSeconds = 0 }) {
  if (!userId || !bookId || !pageNumber) return
  await supabase.from('reading_sessions').insert({
    user_id: userId,
    book_id: bookId,
    page_number: pageNumber,
    time_spent_seconds: timeSpentSeconds,
    scroll_completed: true,
  })
}
