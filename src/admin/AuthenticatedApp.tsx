import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { ADMIN_SECTION_STORAGE_KEY, SIDEBAR_COLLAPSED_STORAGE_KEY, STORAGE_KEY, adminNav } from './constants'
import { Icon } from './components/Icon'
import { DashboardSection } from './sections/DashboardSection'
import { RegistrationSection } from './sections/RegistrationSection'
import { FleetSection } from './sections/FleetSection'
import { MaintenanceSection } from './sections/MaintenanceSection'
import { AnalyticsSection } from './sections/AnalyticsSection'
import { ZonesSection } from './sections/ZonesSection'
import { SupportSection } from './sections/SupportSection'
import type { AdminData, AdminSection, AuthenticatedAppProps } from './types'
import { getDisplayName, loadAdminData, loadAdminSection } from './utils'
import './styles.css'

function AdminSectionView({
  section,
  data,
  setData,
  onQuickAction,
}: {
  section: AdminSection
  data: AdminData
  setData: Dispatch<SetStateAction<AdminData>>
  onQuickAction: (target: AdminSection) => void
}) {
  if (section === 'dashboard') {
    return <DashboardSection data={data} onQuickAction={onQuickAction} />
  }

  if (section === 'registry') {
    return <RegistrationSection data={data} setData={setData} />
  }

  if (section === 'fleet') {
    return <FleetSection data={data} setData={setData} />
  }

  if (section === 'maintenance') {
    return <MaintenanceSection data={data} setData={setData} />
  }

  if (section === 'analytics') {
    return <AnalyticsSection data={data} />
  }

  if (section === 'zones') {
    return <ZonesSection data={data} />
  }

  return <SupportSection data={data} setData={setData} />
}

export function AuthenticatedApp({ userEmail, onLogout }: AuthenticatedAppProps) {
  const [adminSection, setAdminSection] = useState<AdminSection>(loadAdminSection)
  const [data, setData] = useState<AdminData>(loadAdminData)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
  })
  const displayName = getDisplayName(userEmail)
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    window.localStorage.setItem(ADMIN_SECTION_STORAGE_KEY, adminSection)
  }, [adminSection])

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  return (
    <div className={`app-shell${isSidebarCollapsed ? ' app-shell--sidebar-collapsed' : ''}`}>
      <aside className={`sidebar${isSidebarCollapsed ? ' sidebar--collapsed' : ''}`}>
        <div className="sidebar__section">
          <div className="sidebar__header">
            <div className="brand brand--with-logo">
              <img className="brand__logo" src="/cyclix-logo-transparent.png" alt="Cyclix" />
              <div className="brand__copy">
                <h2>Cyclix Admin</h2>
              </div>
            </div>

            <button
              type="button"
              className="sidebar-toggle"
              aria-label={isSidebarCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
              aria-expanded={!isSidebarCollapsed}
              title={isSidebarCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
              onClick={() => setIsSidebarCollapsed((current) => !current)}
            >
              <Icon
                name={isSidebarCollapsed ? 'chevron-right' : 'chevron-left'}
                className="sidebar-toggle__icon"
              />
            </button>
          </div>

          <nav className="sidebar-nav" aria-label="Navegacion lateral">
            {adminNav.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`sidebar-link${adminSection === item.key ? ' sidebar-link--active' : ''}`}
                aria-label={item.label}
                title={isSidebarCollapsed ? item.label : undefined}
                onClick={() => setAdminSection(item.key)}
              >
                {item.imageSrc ? (
                  <img src={item.imageSrc} alt="" aria-hidden="true" className="sidebar-link__image" />
                ) : (
                  <Icon name={item.icon!} className="sidebar-link__icon" />
                )}
                <span className="sidebar-link__label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="system-card" title={isSidebarCollapsed ? 'Datos locales activos' : undefined}>
          <strong className="system-card__title">Datos locales activos</strong>
          <p className="system-card__copy">
            <span className="system-card__dot"></span>
            <span className="system-card__text">Los cambios se guardan en este navegador</span>
          </p>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-title">
            <strong>Panel Admin</strong>
          </div>

          <div className="topbar-user">
            <div className="user-chip">
              <span className="user-chip__avatar">{initials}</span>
              <div>
                <strong>{displayName}</strong>
                <p>{userEmail}</p>
              </div>
            </div>
            <button type="button" className="logout-button" onClick={onLogout}>
              <Icon name="logout" className="logout-button__icon" />
              <span>Cerrar sesion</span>
            </button>
          </div>
        </header>

        <main className="content-shell">
          <div className="content-scroll">
            <AdminSectionView
              section={adminSection}
              data={data}
              setData={setData}
              onQuickAction={setAdminSection}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
