import {
  ADMIN_SECTION_STORAGE_KEY,
  BIKE_SERIAL_COUNTER_STORAGE_KEY,
  DEFAULT_CENTER,
  STORAGE_KEY,
  adminNav,
  bikeStatusOptions,
  maintenanceStatusOptions,
  supportStatusOptions,
} from './constants'
import type {
  ActivityItem,
  AdminData,
  AdminSection,
  Bike,
  Station,
  BikeStatus,
  MaintenanceStatus,
  MarkerTone,
  SupportStatus,
} from './types'

export function createEmptyAdminData(): AdminData {
  return {
    stations: [],
    bikes: [],
    maintenance: [],
    support: [],
  }
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function getNowIso() {
  return new Date().toISOString()
}

export function formatBikeSerial(sequence: number) {
  return `CX-BIKE-${sequence.toString().padStart(4, '0')}`
}

export function extractBikeSerialSequence(value: string) {
  const match = value.match(/(\d+)(?!.*\d)/)
  return match ? Number(match[1]) : null
}

export function getHighestBikeSerialSequence(bikes: Array<Partial<Bike> & Record<string, unknown>>) {
  return bikes.reduce((highest, bike) => {
    const rawValue =
      typeof bike.serialNumber === 'string' && bike.serialNumber.trim()
        ? bike.serialNumber
        : typeof bike.code === 'string' && bike.code.trim()
          ? bike.code
          : ''
    const sequence = rawValue ? extractBikeSerialSequence(rawValue) : null

    return sequence !== null && Number.isFinite(sequence) ? Math.max(highest, sequence) : highest
  }, 0)
}

export function getNextBikeSerialSequence(bikes: Bike[]) {
  const highestExisting = getHighestBikeSerialSequence(bikes as Array<Partial<Bike> & Record<string, unknown>>)

  if (typeof window === 'undefined') {
    return highestExisting + 1
  }

  const storedValue = Number(window.localStorage.getItem(BIKE_SERIAL_COUNTER_STORAGE_KEY) ?? '0')
  return Math.max(highestExisting + 1, Number.isFinite(storedValue) ? storedValue : 1, 1)
}

export function peekNextBikeSerial(bikes: Bike[]) {
  return formatBikeSerial(getNextBikeSerialSequence(bikes))
}

export function reserveNextBikeSerial(bikes: Bike[]) {
  const nextSequence = getNextBikeSerialSequence(bikes)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(BIKE_SERIAL_COUNTER_STORAGE_KEY, String(nextSequence + 1))
  }

  return formatBikeSerial(nextSequence)
}

export function normalizeBikes(rawBikes: unknown[]) {
  const usedSerials = new Set<string>()
  let nextFallbackSequence = getHighestBikeSerialSequence(
    rawBikes as Array<Partial<Bike> & Record<string, unknown>>,
  ) + 1

  return rawBikes.map((rawBike) => {
    const bike = rawBike as Partial<Bike> & Record<string, unknown>
    const now = getNowIso()
    const preferredSerial =
      typeof bike.serialNumber === 'string' && bike.serialNumber.trim()
        ? bike.serialNumber.trim().toUpperCase()
        : typeof bike.code === 'string' && bike.code.trim()
          ? bike.code.trim().toUpperCase()
          : ''

    let serialNumber = preferredSerial

    if (!serialNumber || usedSerials.has(serialNumber)) {
      while (usedSerials.has(formatBikeSerial(nextFallbackSequence))) {
        nextFallbackSequence += 1
      }

      serialNumber = formatBikeSerial(nextFallbackSequence)
      nextFallbackSequence += 1
    }

    usedSerials.add(serialNumber)

    return {
      id: typeof bike.id === 'string' && bike.id.trim() ? bike.id : generateId('bike'),
      code: serialNumber,
      serialNumber,
      color: typeof bike.color === 'string' && bike.color.trim() ? bike.color.trim() : 'Azul',
      size: typeof bike.size === 'string' && bike.size.trim() ? bike.size.trim() : 'Mediana',
      bikeType: typeof bike.bikeType === 'string' && bike.bikeType.trim() ? bike.bikeType.trim() : 'Urbana',
      battery: clamp(typeof bike.battery === 'number' ? bike.battery : 100, 0, 100),
      status:
        bike.status === 'available' ||
        bike.status === 'in_use' ||
        bike.status === 'maintenance' ||
        bike.status === 'low_battery'
          ? bike.status
          : 'available',
      stationId: typeof bike.stationId === 'string' && bike.stationId.trim() ? bike.stationId : null,
      lat: clamp(typeof bike.lat === 'number' ? bike.lat : DEFAULT_CENTER[0], -90, 90),
      lng: clamp(typeof bike.lng === 'number' ? bike.lng : DEFAULT_CENTER[1], -180, 180),
      notes: typeof bike.notes === 'string' ? bike.notes : '',
      isActive: bike.isActive !== false,
      createdAt: typeof bike.createdAt === 'string' && bike.createdAt ? bike.createdAt : now,
      updatedAt: typeof bike.updatedAt === 'string' && bike.updatedAt ? bike.updatedAt : now,
    } satisfies Bike
  })
}

export function normalizeStations(rawStations: unknown[]) {
  return rawStations.map((rawStation) => {
    const station = rawStation as Partial<Station> & Record<string, unknown>
    const now = getNowIso()

    return {
      id: typeof station.id === 'string' && station.id.trim() ? station.id : generateId('station'),
      name: typeof station.name === 'string' && station.name.trim() ? station.name.trim() : 'Estacion',
      zone: typeof station.zone === 'string' ? station.zone.trim() : '',
      capacity: clamp(typeof station.capacity === 'number' ? station.capacity : 10, 1, 500),
      lat: clamp(typeof station.lat === 'number' ? station.lat : DEFAULT_CENTER[0], -90, 90),
      lng: clamp(typeof station.lng === 'number' ? station.lng : DEFAULT_CENTER[1], -180, 180),
      isActive: station.isActive !== false,
      createdAt: typeof station.createdAt === 'string' && station.createdAt ? station.createdAt : now,
      updatedAt: typeof station.updatedAt === 'string' && station.updatedAt ? station.updatedAt : now,
    } satisfies Station
  })
}

export function loadAdminData(): AdminData {
  if (typeof window === 'undefined') {
    return createEmptyAdminData()
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)
    if (!rawValue) {
      return createEmptyAdminData()
    }

    const parsed = JSON.parse(rawValue) as Partial<AdminData>

    return {
      stations: Array.isArray(parsed.stations) ? normalizeStations(parsed.stations) : [],
      bikes: Array.isArray(parsed.bikes) ? normalizeBikes(parsed.bikes) : [],
      maintenance: Array.isArray(parsed.maintenance) ? parsed.maintenance : [],
      support: Array.isArray(parsed.support) ? parsed.support : [],
    }
  } catch {
    return createEmptyAdminData()
  }
}

export function loadAdminSection(): AdminSection {
  if (typeof window === 'undefined') {
    return 'dashboard'
  }

  const savedSection = window.localStorage.getItem(ADMIN_SECTION_STORAGE_KEY)

  if (savedSection && adminNav.some((item) => item.key === savedSection)) {
    return savedSection as AdminSection
  }

  return 'dashboard'
}

export function getDisplayName(userEmail: string): string {
  const baseName = userEmail.split('@')[0]?.trim()
  if (!baseName) {
    return 'Usuario'
  }

  return baseName
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ')
}

export function getBikeLabel(bike: Pick<Bike, 'serialNumber' | 'code'>) {
  return bike.serialNumber || bike.code
}

export function getBikeStatusLabel(status: BikeStatus) {
  return bikeStatusOptions.find((option) => option.value === status)?.label ?? status
}

export function getMaintenanceStatusLabel(status: MaintenanceStatus) {
  return maintenanceStatusOptions.find((option) => option.value === status)?.label ?? status
}

export function getSupportStatusLabel(status: SupportStatus) {
  return supportStatusOptions.find((option) => option.value === status)?.label ?? status
}

export function getBikeTone(status: BikeStatus): MarkerTone {
  if (status === 'available') {
    return 'blue'
  }
  if (status === 'in_use') {
    return 'green'
  }
  if (status === 'maintenance') {
    return 'orange'
  }
  return 'red'
}

export function getMaintenanceTone(status: MaintenanceStatus): 'green' | 'orange' | 'blue' {
  if (status === 'resolved') {
    return 'green'
  }
  if (status === 'in_progress') {
    return 'orange'
  }
  return 'blue'
}

export function getSupportTone(status: SupportStatus): 'green' | 'orange' | 'blue' {
  if (status === 'resolved') {
    return 'green'
  }
  if (status === 'in_review') {
    return 'orange'
  }
  return 'blue'
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000))

  if (diffMinutes < 60) {
    return `Hace ${diffMinutes} min`
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return `Hace ${diffHours} h`
  }

  const diffDays = Math.round(diffHours / 24)
  return `Hace ${diffDays} d`
}

export function getStationOccupancy(stationId: string, bikes: Bike[]) {
  return bikes.filter((bike) => bike.stationId === stationId).length
}

export function getZoneSummaries(data: AdminData) {
  const zoneMap = new Map<
    string,
    { zone: string; stations: number; bikes: number; capacity: number; occupancy: number }
  >()

  const activeStations = data.stations.filter((station) => station.isActive)
  const activeBikes = data.bikes.filter((bike) => bike.isActive)

  activeStations.forEach((station) => {
    const current = zoneMap.get(station.zone) ?? {
      zone: station.zone,
      stations: 0,
      bikes: 0,
      capacity: 0,
      occupancy: 0,
    }

    const parkedBikes = getStationOccupancy(station.id, activeBikes)
    current.stations += 1
    current.bikes += parkedBikes
    current.capacity += station.capacity
    current.occupancy = current.capacity === 0 ? 0 : Math.round((current.bikes / current.capacity) * 100)

    zoneMap.set(station.zone, current)
  })

  return Array.from(zoneMap.values()).sort((left, right) => left.zone.localeCompare(right.zone))
}

export function buildActivityItems(data: AdminData): ActivityItem[] {
  const bikeActivity: ActivityItem[] = data.bikes.map((bike) => {
    const bikeTone = getBikeTone(bike.status)

    return {
      id: bike.id,
      title: `Bicicleta ${getBikeLabel(bike)}`,
      subtitle:
        bike.stationId !== null
          ? `Asignada a ${data.stations.find((station) => station.id === bike.stationId)?.name ?? 'estacion eliminada'}`
          : `Ubicacion libre (${bike.lat.toFixed(5)}, ${bike.lng.toFixed(5)})`,
      time: bike.updatedAt,
      icon: 'bike',
      tone: bikeTone,
    }
  })

  const maintenanceActivity: ActivityItem[] = data.maintenance.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: `${item.technician || 'Sin tecnico'} - ${getMaintenanceStatusLabel(item.status)}`,
    time: item.updatedAt,
    icon: 'tool',
    tone: getMaintenanceTone(item.status),
  }))

  const supportActivity: ActivityItem[] = data.support.map((ticket) => ({
    id: ticket.id,
    title: ticket.subject,
    subtitle: `${ticket.requester || 'Sin solicitante'} - ${getSupportStatusLabel(ticket.status)}`,
    time: ticket.updatedAt,
    icon: 'ticket',
    tone: getSupportTone(ticket.status),
  }))

  return [...bikeActivity, ...maintenanceActivity, ...supportActivity]
    .sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime())
    .slice(0, 6)
    .map((item) => ({
      ...item,
      time: formatRelativeTime(item.time),
    }))
}
