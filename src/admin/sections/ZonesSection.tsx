import { EmptyState, SectionHeader } from '../components/common'
import type { AdminData } from '../types'

export function ZonesSection({ data: _data }: { data: AdminData }) {
  return (
    <>
      <SectionHeader title="Zonas" />

      <section className="card detail-card">
        <EmptyState
          title="Sin datos de zonas"
          copy="Esta seccion queda oculta hasta que las zonas se manejen como perimetros reales en el mapa."
        />
      </section>
    </>
  )
}
