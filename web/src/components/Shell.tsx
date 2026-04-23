import type { ReactNode } from 'react'
import { useSettings } from '../store'
import './Shell.css'

type Props = {
  header: ReactNode
  left: ReactNode
  main: ReactNode
  right: ReactNode
}

export function Shell({ header, left, main, right }: Props) {
  const { leftSidebarOpen, rightSidebarOpen } = useSettings()

  return (
    <div
      className="shell-grid"
      data-left-open={leftSidebarOpen}
      data-right-open={rightSidebarOpen}
    >
      <div className="shell-grid__header">{header}</div>
      <aside
        className="shell-grid__left"
        aria-hidden={!leftSidebarOpen}
        inert={!leftSidebarOpen || undefined}
      >
        {left}
      </aside>
      <main className="shell-grid__main">{main}</main>
      <aside
        className="shell-grid__right"
        aria-hidden={!rightSidebarOpen}
        inert={!rightSidebarOpen || undefined}
      >
        {right}
      </aside>
    </div>
  )
}
