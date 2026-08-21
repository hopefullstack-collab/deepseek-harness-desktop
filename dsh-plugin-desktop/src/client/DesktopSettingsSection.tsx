import { useState, type ReactNode } from 'react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { DESKTOP_INTERNAL_MARKET_PAGE_IDS } from '../worker-pack.ts'
import type { DesktopMcpSettings } from '../mcp-settings.ts'
import type { DesktopWorkbenchSettings } from '../workbench-settings.ts'
import type { DesktopLocaleKey } from './locales.ts'
import { DesktopWorkbenchHub } from './DesktopWorkbenchHub.tsx'
import { InternalMarketTab } from './InternalMarketTab.tsx'
import { McpSettingsTab } from './McpSettingsTab.tsx'

export interface DesktopSettingsSectionInjected {
  readonly workbenchScope: SettingsScope<DesktopWorkbenchSettings>
  readonly mcpScope: SettingsScope<DesktopMcpSettings>
}

export type DesktopSettingsSectionProps = PropsRuntime<'settings.section'>
  & PropsLocale<'dsh-desktop'>
  & InjectFace<DesktopSettingsSectionInjected>

/** Inner pills owned by the desktop settings section, not official Plugins tabs. */
export type DesktopInternalMarketPage = typeof DESKTOP_INTERNAL_MARKET_PAGE_IDS[number]

const PAGES: readonly { readonly id: DesktopInternalMarketPage; readonly label: DesktopLocaleKey }[] = [
  { id: 'featured', label: 'featuredTab' },
  { id: 'workbench', label: 'workbenchTab' },
  { id: 'mcp', label: 'mcpTab' },
]

/** One left-nav settings page: featured recommendations, workbench, and MCP. */
export function DesktopSettingsSection({
  workbenchScope,
  mcpScope,
  t,
}: DesktopSettingsSectionProps): ReactNode {
  const [page, setPage] = useState<DesktopInternalMarketPage>('featured')
  return (
    <div className="dshWorkerHub">
      <nav className="dshWorkerSubnav" aria-label={t('internalMarketNav')}>
        {PAGES.map(entry => (
          <button
            key={entry.id}
            type="button"
            data-active={page === entry.id ? 'true' : undefined}
            onClick={() => { setPage(entry.id) }}
          >
            {t(entry.label)}
          </button>
        ))}
      </nav>
      {page === 'featured' ? <InternalMarketTab t={t} /> : null}
      {page === 'workbench' ? <DesktopWorkbenchHub scope={workbenchScope} t={t} /> : null}
      {page === 'mcp' ? <McpSettingsTab scope={mcpScope} t={t} /> : null}
    </div>
  )
}
