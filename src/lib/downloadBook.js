import { resolvePdfUrl } from './pdfUrl'

export async function downloadBookPdf(book) {
  const url = await resolvePdfUrl(book)
  const response = await fetch(url)
  if (!response.ok) throw new Error('Could not download the PDF. Try again or read in the browser.')
  const blob = await response.blob()
  const filename = `${book.title.replace(/[^a-z0-9]+/gi, '_')}.pdf`
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}
