import { ShareGate } from '@/components/ShareGate'
import { Shell } from '@/components/Shell'

export default function Page() {
  return (
    <ShareGate>
      <Shell />
    </ShareGate>
  )
}
