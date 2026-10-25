import { Suspense } from 'react'
import ObservationForm from './observation-form'

export default function Page() {
  return (
    <Suspense fallback={<div className="loading-page" role="status">Menyiapkan catatan lapangan…</div>}>
      <ObservationForm />
    </Suspense>
  )
}
