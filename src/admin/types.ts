import type { ReactNode } from 'react'

export type AdminSection = 'dashboard' | 'registry' | 'fleet' | 'maintenance' | 'analytics' | 'zones' | 'support'
export type BikeStatus = 'available' | 'in_use' | 'maintenance' | 'low_battery'
export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved'
export type SupportStatus = 'open' | 'in_review' | 'resolved'
export type MarkerTone = 'green' | 'blue' | 'orange' | 'red'

export type IconName =
  | 'bike'
  | 'users'
  | 'tool'
  | 'grid'
  | 'map'
  | 'chart'
  | 'support'
  | 'ticket'
  | 'clock'
  | 'logout'
  | 'pin'
  | 'chevron-left'
  | 'chevron-right'

export type NavItem<T extends string> = {
  key: T
  label: string
  icon?: IconName
  imageSrc?: string
}

export type AuthenticatedAppProps = {
  userEmail: string
  onLogout: () => void
}

export type Station = {
  id: string
  name: string
  zone: string
  capacity: number
  lat: number
  lng: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type Bike = {
  id: string
  code: string
  serialNumber: string
  color: string
  size: string
  bikeType: string
  battery: number
  status: BikeStatus
  stationId: string | null
  lat: number
  lng: number
  notes: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type MaintenanceItem = {
  id: string
  bikeId: string
  title: string
  technician: string
  notes: string
  status: MaintenanceStatus
  createdAt: string
  updatedAt: string
}

export type SupportTicket = {
  id: string
  subject: string
  requester: string
  channel: string
  notes: string
  status: SupportStatus
  createdAt: string
  updatedAt: string
}

export type AdminData = {
  stations: Station[]
  bikes: Bike[]
  maintenance: MaintenanceItem[]
  support: SupportTicket[]
}

export type ActivityItem = {
  id: string
  title: string
  subtitle: string
  time: string
  icon: 'bike' | 'tool' | 'ticket'
  tone: 'blue' | 'green' | 'orange' | 'red'
}

export type PlacementTarget =
  | {
      type: 'station'
      id: string
    }
  | {
      type: 'bike'
      id: string
    }
  | {
      type: 'new_station'
    }
  | null

export type EmptyStateProps = {
  title: string
  copy: string
}

export type DataTableProps = {
  columns: string[]
  rows: ReactNode[][]
  rowKeys?: string[]
}

export type LatLngPoint = [number, number]
