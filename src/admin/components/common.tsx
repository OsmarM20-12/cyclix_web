import type { DataTableProps, EmptyStateProps } from '../types'

export function EmptyState({ title, copy }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{copy}</p>
    </div>
  )
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  )
}

export function DataTable({ columns, rows, rowKeys }: DataTableProps) {
  return (
    <div className="table-shell">
      <div className="table-shell__scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowKeys?.[rowIndex] ?? `row-${rowIndex}`}>
                {row.map((cell, index) => (
                  <td key={`cell-${rowIndex}-${index}`} data-label={columns[index]}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
