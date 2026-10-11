import { PageLoader } from '@/components/ui/Loading'
export default function Loading() {
  return (
    <div className="min-h-screen bg-bg">
      <PageLoader label="Loading app..." />
    </div>
  )
}
