import { quickActions, bikeStatusOptions } from '../constants'
import { EmptyState } from '../components/common'
import { Icon } from '../components/Icon'
import type { AdminData, AdminSection, IconName } from '../types'
import { buildActivityItems, getBikeTone, getStationOccupancy } from '../utils'

export function DashboardSection({
  data,
  onQuickAction,
}: {
  data: AdminData
  onQuickAction: (target: AdminSection) => void
}) {
  const activeStationsData = data.stations.filter((station) => station.isActive)
  const activeBikesData = data.bikes.filter((bike) => bike.isActive)
  const availableBikes = activeBikesData.filter((bike) => bike.status === 'available').length
  const activeStations = activeStationsData.length
  const openMaintenance = data.maintenance.filter((item) => {
    const bike = data.bikes.find((entry) => entry.id === item.bikeId)
    return item.status !== 'resolved' && bike?.isActive !== false
  }).length
  const openSupport = data.support.filter((ticket) => ticket.status !== 'resolved').length
  const topStations = activeStationsData
    .map((station) => {
      const parkedBikes = getStationOccupancy(station.id, activeBikesData)
      const occupancy = station.capacity === 0 ? 0 : Math.round((parkedBikes / station.capacity) * 100)

      return {
        station,
        parkedBikes,
        occupancy,
      }
    })
    .sort((left, right) => right.occupancy - left.occupancy)
    .slice(0, 3)
  const fleetStatus = bikeStatusOptions.map((option) => ({
    label: option.label,
    value: activeBikesData.filter((bike) => bike.status === option.value).length,
    tone: getBikeTone(option.value),
  }))
  const activityItems = buildActivityItems(data)

  return (
    <>
      <section className="hero-section">
        <header className="page-header">
          <h1>Dashboard Principal</h1>
        </header>

        <div className="stats-grid">
          {[
            { title: 'Bicicletas disponibles', value: String(availableBikes), icon: 'bike', tone: 'blue' },
            { title: 'Estaciones activas', value: String(activeStations), icon: 'map', tone: 'green' },
            { title: 'Mantenimientos abiertos', value: String(openMaintenance), icon: 'tool', tone: 'orange' },
            { title: 'Tickets abiertos', value: String(openSupport), icon: 'support', tone: 'red' },
          ].map((card) => (
            <article key={card.title} className="card stat-card">
              <div className="stat-card__top">
                <span className={`icon-chip icon-chip--${card.tone}`}>
                  <Icon name={card.icon as IconName} className="icon" />
                </span>
              </div>
              <p className="stat-card__title">{card.title}</p>
              <strong className="stat-card__value">{card.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="content-grid">
        <article className="card panel">
          <h2>Estado de Flota</h2>
          {data.bikes.length === 0 ? (
            <EmptyState
              title="No hay bicicletas registradas"
              copy="Crea bicicletas en la seccion Registro para ver la distribucion real de estados."
            />
          ) : (
            <div className="fleet-list">
              {fleetStatus.map((item) => (
                <div key={item.label} className="fleet-list__row">
                  <div className="fleet-list__label">
                    <span className={`status-dot status-dot--${item.tone}`}></span>
                    <span>{item.label}</span>
                  </div>
                  <span className={`status-pill status-pill--${item.tone}`}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="card panel">
          <h2>Estaciones con mayor ocupacion</h2>
          {topStations.length === 0 ? (
            <EmptyState
              title="Sin estaciones"
              copy="Agrega estaciones y asigna bicicletas para calcular ocupacion real."
            />
          ) : (
            <div className="peak-list">
              {topStations.map((item) => (
                <div key={item.station.id} className="peak-list__item">
                  <div className="peak-list__header">
                    <span className="peak-list__label">{item.station.name}</span>
                    <span className="peak-list__amount">{item.occupancy}%</span>
                  </div>
                  <div className="peak-list__progress">
                    <div className="peak-list__track">
                      <span style={{ width: `${item.occupancy}%` }}></span>
                    </div>
                    <span className="peak-list__count">
                      {item.parkedBikes}/{item.station.capacity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="card panel">
          <h2>Acciones Rapidas</h2>
          <div className="quick-actions">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className={`quick-action quick-action--${action.tone}`}
                onClick={() => onQuickAction(action.target)}
              >
                <Icon name={action.icon} className="icon quick-action__icon" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="card activity-panel">
        <h2>Actividad Reciente</h2>
        {activityItems.length === 0 ? (
          <EmptyState
            title="Aun no hay actividad"
            copy="Cuando registres bicicletas, mantenimientos o tickets, apareceran aqui."
          />
        ) : (
          <div className="activity-list">
            {activityItems.map((item, index) => (
              <article
                key={item.id}
                className={`activity-row${index === activityItems.length - 1 ? ' activity-row--last' : ''}`}
              >
                <div className={`activity-icon activity-icon--${item.tone}`}>
                  <Icon name={item.icon} className="icon" />
                </div>
                <div className="activity-copy">
                  <strong>{item.title}</strong>
                  <p>{item.subtitle}</p>
                </div>
                <div className="activity-time">
                  <Icon name="clock" className="clock-icon" />
                  <span>{item.time}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
