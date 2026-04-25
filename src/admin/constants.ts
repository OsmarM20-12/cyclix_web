import maintenanceTabIcon from '../assets/maintenance-tab-icon.png'
import type {
  AdminSection,
  BikeStatus,
  LatLngPoint,
  MaintenanceStatus,
  NavItem,
  SupportStatus,
} from './types'

export const STORAGE_KEY = 'cyclix-admin-data-v3'
export const ADMIN_SECTION_STORAGE_KEY = 'cyclix-admin-section'
export const SIDEBAR_COLLAPSED_STORAGE_KEY = 'cyclix-admin-sidebar-collapsed'
export const BIKE_SERIAL_COUNTER_STORAGE_KEY = 'cyclix-bike-serial-seq'
export const DEFAULT_CENTER: LatLngPoint = [14.9725, -89.5301]
export const DEFAULT_ZOOM = 14

export const adminNav: NavItem<AdminSection>[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'registry', label: 'Registro', icon: 'bike' },
  { key: 'fleet', label: 'Flota', icon: 'map' },
  { key: 'maintenance', label: 'Mantenimiento', imageSrc: maintenanceTabIcon },
  { key: 'analytics', label: 'Analitica', icon: 'chart' },
  { key: 'zones', label: 'Zonas', icon: 'pin' },
  { key: 'support', label: 'Soporte', icon: 'support' },
]

export const bikeStatusOptions: Array<{ value: BikeStatus; label: string }> = [
  { value: 'available', label: 'Disponible' },
  { value: 'in_use', label: 'En uso' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'low_battery', label: 'Bateria baja' },
]

export const maintenanceStatusOptions: Array<{ value: MaintenanceStatus; label: string }> = [
  { value: 'open', label: 'Abierta' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'resolved', label: 'Resuelta' },
]

export const supportStatusOptions: Array<{ value: SupportStatus; label: string }> = [
  { value: 'open', label: 'Abierto' },
  { value: 'in_review', label: 'En revision' },
  { value: 'resolved', label: 'Resuelto' },
]

export const bikeSizeOptions = ['Pequena', 'Mediana', 'Grande'] as const
export const bikeTypeOptions = ['Urbana', 'Electrica', 'Montana', 'Plegable'] as const

export const quickActions: Array<{
  label: string
  tone: 'blue' | 'orange' | 'green'
  icon: 'bike' | 'tool' | 'support'
  target: AdminSection
}> = [
  { label: 'Registrar\nflota', tone: 'blue', icon: 'bike', target: 'registry' },
  { label: 'Registrar\nmantenimiento', tone: 'orange', icon: 'tool', target: 'maintenance' },
  { label: 'Atender\nsoporte', tone: 'green', icon: 'support', target: 'support' },
]
