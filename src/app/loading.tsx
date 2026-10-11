export default function Loading() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-line" />
        <div className="absolute inset-0 rounded-full border-4 border-brand border-t-transparent animate-spin" />
        <div className="absolute inset-3 rounded-full bg-brand/20 animate-pulse" />
      </div>
    </div>
  )
}
