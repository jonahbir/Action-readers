import { supabase } from './supabase'

/** Extract storage object path from a Supabase signed/public storage URL. */
export function extractPdfStoragePath(url) {
  if (!url || typeof url !== 'string') return null
  const patterns = [
    /\/storage\/v1\/object\/sign\/book-pdfs\/([^?]+)/,
    /\/storage\/v1\/object\/public\/book-pdfs\/([^?]+)/,
    /\/storage\/v1\/object\/authenticated\/book-pdfs\/([^?]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return decodeURIComponent(match[1])
  }
  return null
}

/**
 * Resolve a book PDF URL for react-pdf.
 * Prefers pdf_storage_path (fresh signed URL). Falls back to parsing legacy signed URLs.
 * External URLs are returned as-is (may fail CORS — upload via Admin instead).
 */
export async function resolvePdfUrl(book) {
  const path = book.pdf_storage_path || extractPdfStoragePath(book.pdf_url)

  if (path) {
    const { data, error } = await supabase.storage
      .from('book-pdfs')
      .createSignedUrl(path, 60 * 60)
    if (error) throw error
    return data.signedUrl
  }

  if (!book.pdf_url) throw new Error('No PDF file attached to this book.')
  return book.pdf_url
}
