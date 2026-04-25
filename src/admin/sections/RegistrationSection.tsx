import { useEffect, useRef, useState } from 'react'
import type { Dispatch, MouseEvent as ReactMouseEvent, SetStateAction } from 'react'
import { createPortal } from 'react-dom'
import { bikeSizeOptions, bikeTypeOptions, DEFAULT_CENTER } from '../constants'
import { DataTable, EmptyState } from '../components/common'
import { FleetMap } from '../components/FleetMap'
import type { AdminData, Bike, PlacementTarget, Station } from '../types'
import {
  clamp,
  generateId,
  getNowIso,
  peekNextBikeSerial,
  reserveNextBikeSerial,
  getBikeLabel,
} from '../utils'

type RegistryTableView = 'stations' | 'bikes'

type StationFormState = {
  name: string
  zone: string
  capacity: string
  lat: string
  lng: string
}

type BikeFormState = {
  color: string
  size: string
  bikeType: string
  stationId: string
  notes: string
}

type AssignBikeFormState = {
  bikeId: string
}

type RegistryMenuAction = {
  label: string
  danger?: boolean
  disabled?: boolean
  onSelect: () => void
}

type RegistryMenuPosition = {
  top: number
  left: number
  direction: 'up' | 'down'
}

const createEmptyStationForm = (): StationFormState => ({
  name: '',
  zone: '',
  capacity: '10',
  lat: '',
  lng: '',
})

const createBikeForm = (stationId: string): BikeFormState => ({
  color: '',
  size: 'Mediana',
  bikeType: 'Urbana',
  stationId,
  notes: '',
})

const createAssignBikeForm = (): AssignBikeFormState => ({
  bikeId: '',
})

function RegistryTableMenu({
  menuId,
  openMenuId,
  setOpenMenuId,
  actions,
}: {
  menuId: string
  openMenuId: string | null
  setOpenMenuId: Dispatch<SetStateAction<string | null>>
  actions: RegistryMenuAction[]
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<RegistryMenuPosition | null>(null)
  const isOpen = openMenuId === menuId

  const toggleMenu = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    if (isOpen) {
      setOpenMenuId(null)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const estimatedHeight = actions.length * 44 + 20
    const direction = rect.bottom + estimatedHeight > window.innerHeight - 16 ? 'up' : 'down'

    setPosition({
      top: direction === 'down' ? rect.bottom + 8 : rect.top - 8,
      left: rect.right,
      direction,
    })
    setOpenMenuId(menuId)
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node

      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return
      }

      setOpenMenuId(null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuId(null)
      }
    }

    const handleResize = () => {
      setOpenMenuId(null)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, setOpenMenuId])

  return (
    <>
      <div className="registry-table-menu">
        <button
          ref={triggerRef}
          type="button"
          className="registry-table-menu__trigger"
          aria-label="Opciones"
          aria-expanded={isOpen}
          onClick={toggleMenu}
        >
          ...
        </button>
      </div>
      {isOpen && position
        ? createPortal(
            <div
              ref={menuRef}
              className={`registry-floating-menu registry-floating-menu--${position.direction}`}
              style={{ top: position.top, left: position.left }}
            >
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={`registry-floating-menu__item${
                    action.danger ? ' registry-floating-menu__item--danger' : ''
                  }`}
                  disabled={action.disabled}
                  onClick={() => {
                    setOpenMenuId(null)
                    action.onSelect()
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

export function RegistrationSection({
  data,
  setData,
}: {
  data: AdminData
  setData: Dispatch<SetStateAction<AdminData>>
}) {
  const activeStations = data.stations.filter((station) => station.isActive)
  const activeBikes = data.bikes.filter((bike) => bike.isActive)
  const operationalStationId = activeStations[0]?.id ?? ''
  const [placementTarget, setPlacementTarget] = useState<PlacementTarget>(null)
  const [showStationModal, setShowStationModal] = useState(false)
  const [showBikeModal, setShowBikeModal] = useState(false)
  const [showAssignBikeModal, setShowAssignBikeModal] = useState(false)
  const [registryTableView, setRegistryTableView] = useState<RegistryTableView>('stations')
  const [editingStationId, setEditingStationId] = useState<string | null>(null)
  const [editingBikeId, setEditingBikeId] = useState<string | null>(null)
  const [assignStationId, setAssignStationId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [stationForm, setStationForm] = useState<StationFormState>(createEmptyStationForm)
  const [bikeForm, setBikeForm] = useState<BikeFormState>(() => createBikeForm(operationalStationId))
  const [assignBikeForm, setAssignBikeForm] = useState<AssignBikeFormState>(createAssignBikeForm)

  const hasStationLocation = stationForm.lat !== '' && stationForm.lng !== ''
  const nextBikeSerial = peekNextBikeSerial(data.bikes)
  const isEditingStation = editingStationId !== null
  const isEditingBike = editingBikeId !== null
  const assignStation = assignStationId
    ? data.stations.find((station) => station.id === assignStationId && station.isActive) ?? null
    : null
  const assignableBikes = activeBikes
    .filter((bike) => bike.stationId !== assignStationId)
    .sort((left, right) => getBikeLabel(left).localeCompare(getBikeLabel(right)))

  const resetStationForm = () => {
    setEditingStationId(null)
    setStationForm(createEmptyStationForm())
    setPlacementTarget(null)
  }

  const resetBikeForm = () => {
    setEditingBikeId(null)
    setBikeForm(createBikeForm(activeStations[0]?.id ?? ''))
  }

  const resetAssignBikeForm = () => {
    setAssignStationId(null)
    setAssignBikeForm(createAssignBikeForm())
  }

  const closeStationModal = () => {
    setShowStationModal(false)
    resetStationForm()
  }

  const closeBikeModal = () => {
    setShowBikeModal(false)
    resetBikeForm()
  }

  const closeAssignBikeModal = () => {
    setShowAssignBikeModal(false)
    resetAssignBikeForm()
  }

  const openCreateStationModal = () => {
    resetStationForm()
    setShowStationModal(true)
  }

  const openEditStationModal = (station: Station) => {
    setEditingStationId(station.id)
    setStationForm({
      name: station.name,
      zone: station.zone,
      capacity: String(station.capacity),
      lat: station.lat.toFixed(5),
      lng: station.lng.toFixed(5),
    })
    setPlacementTarget(null)
    setShowStationModal(true)
  }

  const openCreateBikeModal = (stationId?: string) => {
    setEditingBikeId(null)
    setBikeForm(createBikeForm(stationId ?? activeStations[0]?.id ?? ''))
    setShowBikeModal(true)
  }

  const openAssignBikeModal = (stationId: string) => {
    setAssignStationId(stationId)
    setAssignBikeForm(createAssignBikeForm())
    setShowAssignBikeModal(true)
  }

  const openEditBikeModal = (bike: Bike) => {
    setEditingBikeId(bike.id)
    setBikeForm({
      color: bike.color,
      size: bike.size,
      bikeType: bike.bikeType,
      stationId: bike.stationId ?? '',
      notes: bike.notes,
    })
    setShowBikeModal(true)
  }

  const saveStation = () => {
    if (!stationForm.name.trim() || !stationForm.zone.trim() || !hasStationLocation) {
      return
    }

    const now = getNowIso()

    if (editingStationId) {
      setData((current) => ({
        ...current,
        stations: current.stations.map((station) =>
          station.id === editingStationId
            ? {
                ...station,
                name: stationForm.name.trim(),
                zone: stationForm.zone.trim(),
                capacity: clamp(Number(stationForm.capacity) || 0, 1, 500),
                lat: clamp(Number(stationForm.lat) || DEFAULT_CENTER[0], -90, 90),
                lng: clamp(Number(stationForm.lng) || DEFAULT_CENTER[1], -180, 180),
                updatedAt: now,
              }
            : station,
        ),
        bikes: current.bikes.map((bike) =>
          bike.stationId === editingStationId
            ? {
                ...bike,
                lat: clamp(Number(stationForm.lat) || DEFAULT_CENTER[0], -90, 90),
                lng: clamp(Number(stationForm.lng) || DEFAULT_CENTER[1], -180, 180),
                updatedAt: now,
              }
            : bike,
        ),
      }))
    } else {
      const station: Station = {
        id: generateId('station'),
        name: stationForm.name.trim(),
        zone: stationForm.zone.trim(),
        capacity: clamp(Number(stationForm.capacity) || 0, 1, 500),
        lat: clamp(Number(stationForm.lat) || DEFAULT_CENTER[0], -90, 90),
        lng: clamp(Number(stationForm.lng) || DEFAULT_CENTER[1], -180, 180),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }

      setData((current) => ({
        ...current,
        stations: [...current.stations, station],
      }))

      setBikeForm((current) => ({
        ...current,
        stationId: current.stationId || station.id,
      }))
    }

    setRegistryTableView('stations')
    closeStationModal()
  }

  const saveBike = () => {
    if (!bikeForm.color.trim() || !bikeForm.stationId) {
      return
    }

    const station = data.stations.find((item) => item.id === bikeForm.stationId && item.isActive)
    if (!station) {
      return
    }

    const now = getNowIso()

    if (editingBikeId) {
      setData((current) => ({
        ...current,
        bikes: current.bikes.map((bike) =>
          bike.id === editingBikeId
            ? {
                ...bike,
                color: bikeForm.color.trim(),
                size: bikeForm.size,
                bikeType: bikeForm.bikeType,
                stationId: station.id,
                lat: station.lat,
                lng: station.lng,
                notes: bikeForm.notes.trim(),
                updatedAt: now,
              }
            : bike,
        ),
      }))
    } else {
      const serialNumber = reserveNextBikeSerial(data.bikes)
      const bike: Bike = {
        id: generateId('bike'),
        code: serialNumber,
        serialNumber,
        color: bikeForm.color.trim(),
        size: bikeForm.size,
        bikeType: bikeForm.bikeType,
        battery: 100,
        status: 'available',
        stationId: station.id,
        lat: station.lat,
        lng: station.lng,
        notes: bikeForm.notes.trim(),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }

      setData((current) => ({
        ...current,
        bikes: [...current.bikes, bike],
      }))
    }

    setRegistryTableView('bikes')
    closeBikeModal()
  }

  const deactivateStation = (station: Station) => {
    if (!station.isActive) {
      return
    }

    const now = getNowIso()

    setData((current) => ({
      ...current,
      stations: current.stations.map((item) =>
        item.id === station.id
          ? {
              ...item,
              isActive: false,
              updatedAt: now,
            }
          : item,
      ),
      bikes: current.bikes.map((bike) =>
        bike.stationId === station.id && bike.isActive
          ? {
              ...bike,
              stationId: null,
              lat: station.lat,
              lng: station.lng,
              updatedAt: now,
            }
          : bike,
      ),
    }))
  }

  const deactivateBike = (bikeId: string) => {
    const now = getNowIso()

    setData((current) => ({
      ...current,
      bikes: current.bikes.map((bike) =>
        bike.id === bikeId
          ? {
              ...bike,
              isActive: false,
              updatedAt: now,
            }
          : bike,
      ),
    }))
  }

  const assignExistingBike = () => {
    if (!assignStation || !assignBikeForm.bikeId) {
      return
    }

    const now = getNowIso()

    setData((current) => ({
      ...current,
      bikes: current.bikes.map((bike) =>
        bike.id === assignBikeForm.bikeId
          ? {
              ...bike,
              stationId: assignStation.id,
              lat: assignStation.lat,
              lng: assignStation.lng,
              updatedAt: now,
            }
          : bike,
      ),
    }))

    setRegistryTableView('stations')
    closeAssignBikeModal()
  }

  const placeOnMap = (lat: number, lng: number) => {
    if (!placementTarget || (placementTarget.type !== 'new_station' && placementTarget.type !== 'station')) {
      return
    }

    setStationForm((current) => ({
      ...current,
      lat: lat.toFixed(5),
      lng: lng.toFixed(5),
    }))
    setPlacementTarget(null)
  }

  const sortedStations = [...data.stations].sort(
    (left, right) => Number(right.isActive) - Number(left.isActive) || left.name.localeCompare(right.name),
  )
  const sortedBikes = [...data.bikes].sort(
    (left, right) => Number(right.isActive) - Number(left.isActive) || getBikeLabel(left).localeCompare(getBikeLabel(right)),
  )

  return (
    <>
      <header className="page-header registry-header">
        <h1>Registro</h1>
        <div className="registry-header__actions">
          <button type="button" className="secondary-button" onClick={openCreateStationModal}>
            Registrar estacion
          </button>
          <button
            type="button"
            className="primary-button registry-header__primary-action"
            onClick={() => openCreateBikeModal()}
            disabled={activeStations.length === 0}
          >
            Registrar bicicleta
          </button>
        </div>
      </header>

      <section className="summary-grid">
        <article className="card summary-card">
          <span className="summary-card__label">Estaciones registradas</span>
          <strong>{data.stations.length}</strong>
        </article>
        <article className="card summary-card">
          <span className="summary-card__label">Bicicletas registradas</span>
          <strong>{data.bikes.length}</strong>
        </article>
        <article className="card summary-card">
          <span className="summary-card__label">Proximo numero de serie</span>
          <strong>{nextBikeSerial}</strong>
        </article>
      </section>

      <section className="card detail-card">
        <div className="card-head">
          <h2>Registros existentes</h2>
          <div className="registry-table-switch" role="tablist" aria-label="Cambiar tabla de registro">
            <button
              type="button"
              className={`registry-table-switch__button${
                registryTableView === 'stations' ? ' registry-table-switch__button--active' : ''
              }`}
              onClick={() => setRegistryTableView('stations')}
            >
              Estaciones
            </button>
            <button
              type="button"
              className={`registry-table-switch__button${
                registryTableView === 'bikes' ? ' registry-table-switch__button--active' : ''
              }`}
              onClick={() => setRegistryTableView('bikes')}
            >
              Bicicletas
            </button>
          </div>
        </div>

        {registryTableView === 'stations' ? (
          sortedStations.length === 0 ? (
            <EmptyState title="Sin estaciones" copy="Cuando registres la primera estacion, aparecera aqui." />
          ) : (
            <DataTable
              columns={['Nombre', 'Ubicacion', 'Capacidad', 'Estado', 'Opciones']}
              rowKeys={sortedStations.map((station) => station.id)}
              rows={sortedStations.map((station) => [
                station.name,
                station.zone,
                `${station.capacity} espacios`,
                <span key={`${station.id}-status`} className={`tag tag--${station.isActive ? 'green' : 'red'}`}>
                  {station.isActive ? 'Activa' : 'Desactivada'}
                </span>,
                <RegistryTableMenu
                  key={`${station.id}-actions`}
                  menuId={`station-${station.id}`}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  actions={[
                    {
                      label: 'Editar',
                      onSelect: () => openEditStationModal(station),
                    },
                    {
                      label: 'Agregar bicicleta',
                      disabled: !station.isActive || activeBikes.length === 0,
                      onSelect: () => openAssignBikeModal(station.id),
                    },
                    {
                      label: 'Desactivar',
                      danger: true,
                      disabled: !station.isActive,
                      onSelect: () => deactivateStation(station),
                    },
                  ]}
                />,
              ])}
            />
          )
        ) : sortedBikes.length === 0 ? (
          <EmptyState title="Sin bicicletas" copy="Cuando registres la primera bicicleta, aparecera aqui." />
        ) : (
          <DataTable
            columns={['Serie', 'Tipo', 'Color', 'Estacion', 'Estado', 'Opciones']}
            rowKeys={sortedBikes.map((bike) => bike.id)}
            rows={sortedBikes.map((bike) => [
              getBikeLabel(bike),
              bike.bikeType,
              bike.color,
              data.stations.find((station) => station.id === bike.stationId)?.name ?? 'Sin estacion',
              <span key={`${bike.id}-status`} className={`tag tag--${bike.isActive ? 'green' : 'red'}`}>
                {bike.isActive ? 'Activa' : 'Desactivada'}
              </span>,
              <RegistryTableMenu
                key={`${bike.id}-actions`}
                menuId={`bike-${bike.id}`}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                actions={[
                  {
                    label: 'Editar',
                    onSelect: () => openEditBikeModal(bike),
                  },
                  {
                    label: 'Desactivar',
                    danger: true,
                    disabled: !bike.isActive,
                    onSelect: () => deactivateBike(bike.id),
                  },
                ]}
              />,
            ])}
          />
        )}
      </section>

      {showStationModal && (
        <div className="registry-location-modal" role="dialog" aria-modal="true" aria-labelledby="station-register-title">
          <div className="registry-location-modal__backdrop" onClick={closeStationModal}></div>
          <div className="registry-location-modal__panel">
            <div className="registry-location-modal__header">
              <div>
                <span className="fleet-shell__eyebrow">{isEditingStation ? 'Edicion de estacion' : 'Nueva estacion'}</span>
                <h2 id="station-register-title">{isEditingStation ? 'Editar estacion' : 'Registrar estacion'}</h2>
                <p>Completa la informacion y asigna la ubicacion desde el mapa.</p>
              </div>
              <button type="button" className="secondary-button" onClick={closeStationModal}>
                Cerrar
              </button>
            </div>

            <div className="registry-location-modal__body">
              <div className="card detail-card">
                <div className="card-head">
                  <h2>Datos de la estacion</h2>
                  <span
                    className={`tag tag--${
                      placementTarget
                        ? 'blue'
                        : hasStationLocation
                          ? 'green'
                          : 'orange'
                    }`}
                  >
                    {placementTarget
                      ? 'Seleccionando en mapa'
                      : hasStationLocation
                        ? 'Ubicacion seleccionada'
                        : 'Ubicacion pendiente'}
                  </span>
                </div>

                <div className="form-grid">
                  <label className="control">
                    <span>Nombre</span>
                    <input
                      value={stationForm.name}
                      onChange={(event) => setStationForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Estacion Centro"
                    />
                  </label>
                  <label className="control">
                    <span>Ubicacion</span>
                    <input
                      value={stationForm.zone}
                      onChange={(event) => setStationForm((current) => ({ ...current, zone: event.target.value }))}
                      placeholder="Parque Central, Zacapa"
                    />
                  </label>
                  <label className="control">
                    <span>Cuantas bicicletas tendra</span>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={stationForm.capacity}
                      onChange={(event) =>
                        setStationForm((current) => ({ ...current, capacity: event.target.value }))
                      }
                    />
                  </label>
                </div>

                <p className="fleet-form-hint">
                  La ubicacion se define desde un menu flotante con mapa. Abre la seleccion y marca el punto exacto.
                </p>

                <div className="button-row">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setPlacementTarget((current) =>
                        current
                          ? null
                          : isEditingStation && editingStationId
                            ? { type: 'station', id: editingStationId }
                            : { type: 'new_station' },
                      )
                    }
                  >
                    {placementTarget ? 'Cancelar seleccion en mapa' : 'Seleccionar ubicacion en mapa'}
                  </button>
                  <button type="button" className="primary-button" onClick={saveStation} disabled={!hasStationLocation}>
                    {isEditingStation ? 'Guardar cambios' : 'Crear estacion'}
                  </button>
                </div>
              </div>

              <aside className="registry-location-modal__aside">
                <div className="fleet-sidebar-panel__block">
                  <div className="fleet-sidebar-panel__head">
                    <div>
                      <span className="fleet-shell__eyebrow">Resumen</span>
                      <h3>{stationForm.name || (isEditingStation ? 'Estacion en edicion' : 'Nueva estacion')}</h3>
                      <p>{stationForm.zone || 'Agrega una referencia de ubicacion antes de guardar la estacion.'}</p>
                    </div>
                    <span className={`tag tag--${hasStationLocation ? 'green' : 'orange'}`}>
                      {hasStationLocation ? 'Punto seleccionado' : 'Punto pendiente'}
                    </span>
                  </div>

                  <div className="fleet-detail-list">
                    <div className="fleet-detail-list__row">
                      <span>Estaciones activas</span>
                      <strong>{activeStations.length}</strong>
                    </div>
                    <div className="fleet-detail-list__row">
                      <span>Capacidad planificada</span>
                      <strong>{stationForm.capacity || '0'} espacios</strong>
                    </div>
                    <div className="fleet-detail-list__row">
                      <span>Coordenadas</span>
                      <strong>{hasStationLocation ? `${stationForm.lat}, ${stationForm.lng}` : 'Pendientes'}</strong>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {showBikeModal && (
        <div className="registry-location-modal" role="dialog" aria-modal="true" aria-labelledby="bike-register-title">
          <div className="registry-location-modal__backdrop" onClick={closeBikeModal}></div>
          <div className="registry-location-modal__panel registry-location-modal__panel--narrow">
            <div className="registry-location-modal__header">
              <div>
                <span className="fleet-shell__eyebrow">{isEditingBike ? 'Edicion de bicicleta' : 'Nueva bicicleta'}</span>
                <h2 id="bike-register-title">{isEditingBike ? 'Editar bicicleta' : 'Registrar bicicleta'}</h2>
                <p>Completa los datos de la bicicleta y asignala a una estacion.</p>
              </div>
              <button type="button" className="secondary-button" onClick={closeBikeModal}>
                Cerrar
              </button>
            </div>

            {activeStations.length === 0 ? (
              <EmptyState
                title="No hay estaciones activas"
                copy="Necesitas al menos una estacion activa para registrar o reasignar bicicletas."
              />
            ) : (
              <>
                <div className="form-grid">
                  <label className="control">
                    <span>Numero de serie</span>
                    <input
                      value={
                        isEditingBike
                          ? getBikeLabel(data.bikes.find((bike) => bike.id === editingBikeId) as Bike)
                          : nextBikeSerial
                      }
                      readOnly
                    />
                  </label>
                  <label className="control">
                    <span>Color</span>
                    <input
                      value={bikeForm.color}
                      onChange={(event) => setBikeForm((current) => ({ ...current, color: event.target.value }))}
                      placeholder="Azul"
                    />
                  </label>
                  <label className="control">
                    <span>Tamano</span>
                    <select
                      value={bikeForm.size}
                      onChange={(event) => setBikeForm((current) => ({ ...current, size: event.target.value }))}
                    >
                      {bikeSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="control">
                    <span>Tipo</span>
                    <select
                      value={bikeForm.bikeType}
                      onChange={(event) => setBikeForm((current) => ({ ...current, bikeType: event.target.value }))}
                    >
                      {bikeTypeOptions.map((bikeType) => (
                        <option key={bikeType} value={bikeType}>
                          {bikeType}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="control">
                    <span>Estacion</span>
                    <select
                      value={bikeForm.stationId}
                      onChange={(event) => setBikeForm((current) => ({ ...current, stationId: event.target.value }))}
                    >
                      <option value="">Selecciona una estacion</option>
                      {activeStations.map((station) => (
                        <option key={station.id} value={station.id}>
                          {station.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="control control--full">
                    <span>Notas</span>
                    <textarea
                      rows={3}
                      value={bikeForm.notes}
                      onChange={(event) => setBikeForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Observaciones de la bicicleta"
                    />
                  </label>
                </div>

                <div className="button-row">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={saveBike}
                    disabled={!bikeForm.color.trim() || !bikeForm.stationId}
                  >
                    {isEditingBike ? 'Guardar cambios' : 'Registrar bicicleta'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showAssignBikeModal && (
        <div className="registry-location-modal" role="dialog" aria-modal="true" aria-labelledby="assign-bike-title">
          <div className="registry-location-modal__backdrop" onClick={closeAssignBikeModal}></div>
          <div className="registry-location-modal__panel registry-location-modal__panel--narrow">
            <div className="registry-location-modal__header">
              <div>
                <span className="fleet-shell__eyebrow">Bicicleta existente</span>
                <h2 id="assign-bike-title">Agregar bicicleta a estación</h2>
                <p>
                  {assignStation
                    ? `Selecciona una bicicleta ya creada para asignarla a ${assignStation.name}.`
                    : 'Selecciona una estación válida para continuar.'}
                </p>
              </div>
              <button type="button" className="secondary-button" onClick={closeAssignBikeModal}>
                Cerrar
              </button>
            </div>

            {!assignStation ? (
              <EmptyState title="Estación no disponible" copy="La estación seleccionada ya no está activa." />
            ) : assignableBikes.length === 0 ? (
              <EmptyState
                title="No hay bicicletas disponibles"
                copy="Primero registra bicicletas o deja alguna sin esa estación para poder agregarla aquí."
              />
            ) : (
              <>
                <div className="form-grid">
                  <label className="control">
                    <span>Estación</span>
                    <input value={assignStation.name} readOnly />
                  </label>
                  <label className="control">
                    <span>Bicicleta creada</span>
                    <select
                      value={assignBikeForm.bikeId}
                      onChange={(event) =>
                        setAssignBikeForm((current) => ({ ...current, bikeId: event.target.value }))
                      }
                    >
                      <option value="">Selecciona una bicicleta</option>
                      {assignableBikes.map((bike) => {
                        const currentStation =
                          bike.stationId
                            ? data.stations.find((station) => station.id === bike.stationId)?.name ?? 'Estación eliminada'
                            : 'Sin estación'

                        return (
                          <option key={bike.id} value={bike.id}>
                            {getBikeLabel(bike)} - {bike.color} - {currentStation}
                          </option>
                        )
                      })}
                    </select>
                  </label>
                </div>

                <div className="button-row">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={assignExistingBike}
                    disabled={!assignBikeForm.bikeId}
                  >
                    Agregar bicicleta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {placementTarget && (placementTarget.type === 'new_station' || placementTarget.type === 'station') && (
        <div className="registry-location-modal" role="dialog" aria-modal="true" aria-labelledby="station-map-title">
          <div className="registry-location-modal__backdrop" onClick={() => setPlacementTarget(null)}></div>
          <div className="registry-location-modal__panel">
            <div className="registry-location-modal__header">
              <div>
                <span className="fleet-shell__eyebrow">Ubicacion de estacion</span>
                <h2 id="station-map-title">Seleccionar ubicacion en mapa</h2>
                <p>Haz clic en el mapa para fijar la ubicacion exacta de la estacion.</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setPlacementTarget(null)}>
                Cerrar
              </button>
            </div>

            <div className="registry-location-modal__body">
              <div className="registry-location-modal__map">
                <FleetMap
                  stations={activeStations}
                  bikes={activeBikes}
                  visibleBikeIds={[]}
                  draftStationPoint={
                    hasStationLocation
                      ? [Number(stationForm.lat) || DEFAULT_CENTER[0], Number(stationForm.lng) || DEFAULT_CENTER[1]]
                      : null
                  }
                  selectedStationId={editingStationId}
                  selectedBikeId={null}
                  placementTarget={placementTarget}
                  onSelectStation={() => undefined}
                  onSelectBike={() => undefined}
                  onPlace={placeOnMap}
                />
              </div>

              <aside className="registry-location-modal__aside">
                <div className="fleet-sidebar-panel__block">
                  <div className="fleet-sidebar-panel__head">
                    <div>
                      <span className="fleet-shell__eyebrow">Resumen</span>
                      <h3>{stationForm.name || (isEditingStation ? 'Estacion en edicion' : 'Nueva estacion')}</h3>
                      <p>{stationForm.zone || 'Agrega una referencia de ubicacion antes de guardar la estacion.'}</p>
                    </div>
                    <span className={`tag tag--${hasStationLocation ? 'green' : 'orange'}`}>
                      {hasStationLocation ? 'Punto seleccionado' : 'Punto pendiente'}
                    </span>
                  </div>

                  <div className="fleet-detail-list">
                    <div className="fleet-detail-list__row">
                      <span>Estaciones activas</span>
                      <strong>{activeStations.length}</strong>
                    </div>
                    <div className="fleet-detail-list__row">
                      <span>Capacidad planificada</span>
                      <strong>{stationForm.capacity || '0'} espacios</strong>
                    </div>
                    <div className="fleet-detail-list__row">
                      <span>Coordenadas</span>
                      <strong>{hasStationLocation ? `${stationForm.lat}, ${stationForm.lng}` : 'Pendientes'}</strong>
                    </div>
                  </div>

                  <p className="fleet-form-hint">
                    Cuando hagas clic en el mapa, el punto quedara guardado y podras volver al formulario.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
