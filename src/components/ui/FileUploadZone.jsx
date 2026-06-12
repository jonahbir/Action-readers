import { useRef, useState } from 'react'
import { Upload, FileText, Image, X, CheckCircle2 } from 'lucide-react'

export default function FileUploadZone({
  accept,
  label,
  hint,
  file,
  onFile,
  existingUrl,
  existingLabel = 'Current file',
  variant = 'default',
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const Icon = variant === 'pdf' ? FileText : Image

  const handleFiles = (files) => {
    const picked = files?.[0]
    if (picked) onFile(picked)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`w-full rounded-xl border-2 border-dashed transition-all duration-200 p-5 text-left ${
          dragging
            ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
            : file
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-border-subtle bg-surface-overlay hover:border-amber-500/40 hover:bg-amber-500/5'
        }`}
      >
        {file ? (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB — ready to upload</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFile(null) }}
              className="p-1 text-gray-500 hover:text-red-400 transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-2 py-2">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              {dragging ? (
                <Upload className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
              ) : (
                <Icon className="w-6 h-6 text-amber-400/80" strokeWidth={1.5} />
              )}
            </div>
            <p className="text-sm text-gray-200">
              <span className="text-amber-400 font-medium">Click to upload</span>
              {' '}or drag and drop
            </p>
            <p className="text-xs text-gray-500">{hint}</p>
          </div>
        )}
      </button>
      {existingUrl && !file && (
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
          {existingLabel} on file
        </p>
      )}
    </div>
  )
}
