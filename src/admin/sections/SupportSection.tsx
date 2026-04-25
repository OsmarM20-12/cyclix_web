import type { Dispatch, SetStateAction } from 'react'
import { EmptyState, SectionHeader } from '../components/common'
import type { AdminData } from '../types'
import { formatDateTime, getSupportStatusLabel, getSupportTone } from '../utils'

export function SupportSection({
  data,
  setData: _setData,
}: {
  data: AdminData
  setData: Dispatch<SetStateAction<AdminData>>
}) {
  return (
    <>
      <SectionHeader title="Soporte" />

      <section className="stack-grid">
        <article className="card detail-card">
          <div className="card-head">
            <h2>Tickets registrados</h2>
            <span className="tag tag--blue">{data.support.length} totales</span>
          </div>

          {data.support.length === 0 ? (
            <EmptyState title="Sin tickets" copy="Aqui aparecera el listado cuando existan tickets registrados." />
          ) : (
            <div className="record-list">
              {data.support.map((ticket) => (
                <article key={ticket.id} className="record-card">
                  <div className="record-card__header">
                    <div>
                      <strong>{ticket.subject}</strong>
                      <p>{ticket.requester || 'Sin solicitante'}</p>
                    </div>
                    <span className={`tag tag--${getSupportTone(ticket.status)}`}>
                      {getSupportStatusLabel(ticket.status)}
                    </span>
                  </div>

                  <div className="record-card__meta">
                    <span>Canal: {ticket.channel || 'No definido'}</span>
                    <span>Creado: {formatDateTime(ticket.createdAt)}</span>
                    <span>Actualizado: {formatDateTime(ticket.updatedAt)}</span>
                  </div>

                  {ticket.notes ? (
                    <div className="fleet-note-card fleet-note-card--compact">
                      <strong>Notas</strong>
                      <p>{ticket.notes}</p>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </>
  )
}
