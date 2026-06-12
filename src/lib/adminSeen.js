const PREFIX = 'action_readers_admin_seen'

function storageKey(userId, section) {
  return `${PREFIX}_${userId}_${section}`
}

/** Last time the admin opened a section — defaults to now so old backlog is not counted. */
export function getAdminSeenAt(userId, section) {
  if (!userId) return new Date().toISOString()
  const key = storageKey(userId, section)
  let value = localStorage.getItem(key)
  if (!value) {
    value = new Date().toISOString()
    localStorage.setItem(key, value)
  }
  return value
}

export function markAdminSeen(userId, section) {
  if (!userId || !section) return
  localStorage.setItem(storageKey(userId, section), new Date().toISOString())
}
