export default function BannedScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">🕊️</div>
        <h1 className="font-serif text-2xl text-gray-200 mb-4">Your account has been suspended</h1>
        <p className="text-text-muted leading-relaxed">
          We&apos;re unable to grant access at this time. If you believe this is a mistake,
          please reach out to a fellowship steward.
        </p>
      </div>
    </div>
  )
}
