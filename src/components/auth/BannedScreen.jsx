import { ShieldOff } from 'lucide-react'

export default function BannedScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gray-500/10 border border-gray-500/20 flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
        </div>
        <h1 className="font-serif text-2xl text-gray-200 mb-4">Your account has been suspended</h1>
        <p className="text-text-muted leading-relaxed">
          We&apos;re unable to grant access at this time. If you believe this is a mistake,
          please talk to one of the admins.
        </p>
      </div>
    </div>
  )
}
