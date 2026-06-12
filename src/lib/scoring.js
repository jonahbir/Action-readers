export function calculateScore(verifiedPages, correctCount, totalChecks) {
  const pageScore = (verifiedPages || 0) * 10
  if (!totalChecks || totalChecks === 0) return pageScore
  const comprehensionScore = Math.round(((correctCount || 0) / totalChecks) * 50)
  return pageScore + comprehensionScore
}

export function comprehensionAccuracy(correct, total) {
  if (!total) return 0
  return Math.round((correct / total) * 100)
}

export function formatReadingTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function estimateMinReadTime(wordCount, wpm = 200) {
  const minutes = wordCount / wpm
  return Math.max(15, Math.ceil(minutes * 60))
}

export function estimateWordsPerPage(totalPages, totalWords = null) {
  if (totalWords) return Math.ceil(totalWords / totalPages)
  return 250
}
