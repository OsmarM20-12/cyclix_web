import type { Dispatch, SetStateAction } from 'react'
import { EmptyState, SectionHeader } from '../components/common'
import type { AdminData } from '../types'
import { formatDateTime, getBikeLabel } from '../utils'

export function MaintenanceSection({
  data,
  setData: _setData,
}: {
  data: AdminData
  setData: Dispatch<SetStateAction<AdminData>>
}) {
  const activeMaintenance = data.maintenance.filter((item) => {
    const bike = data.bikes.find((entry) => entry.id === item.bikeId)
    return item.status === 'in_progress' && bike?.isActive !== false
  })

  return (
    <>
      <SectionHeader title="Mantenimiento" />

      <section className="stack-grid">
        <article className="card detail-card">
          <div className="card-head">
            <h2>Procesos en curso</h2>
            <span className="tag tag--orange">{activeMaintenance.length} activos</span>
          </div>

          {activeMaintenance.length === 0 ? (
            <EmptyState
              title="Sin procesos de mantenimiento en curso"
              copy="Cuando una orden pase a En proceso aparecera aqui."
            />
          ) : (
            <div className="record-list">
              {activeMaintenance.map((item) => {
                const bike = data.bikes.find((entry) => entry.id === item.bikeId)

                return (
                  <article key={item.id} className="record-card">
                    <div className="record-card__header">
                      <div>
                        <strong>{item.title}</strong>
                        <p>{bike ? getBikeLabel(bike) : 'Bicicleta eliminada'}</p>
                      </div>
                      <span className="tag tag--orange">En proceso</span>
                    </div>

                    <div className="record-card__meta">
                      <span>Tecnico: {item.technician || 'Sin asignar'}</span>
                      <span>Creada: {formatDateTime(item.createdAt)}</span>
                    </div>

                    <div className="fleet-detail-list">
                      <div className="fleet-detail-list__row">
                        <span>Ultima actualizacion</span>
                        <strong>{formatDateTime(item.updatedAt)}</strong>
                      </div>
                    </div>

                    {item.notes ? (
                      <div className="fleet-note-card fleet-note-card--compact">
                        <strong>Notas</strong>
                        <p>{item.notes}</p>
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}
        </article>
      </section>
    </>
  )
}
