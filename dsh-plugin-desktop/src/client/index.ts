import type { ClientContext, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/cordis-plugin-loader'
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Locale/theme/settings declarations expose settings slot rows used by the worker pack.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import { applyAdvancedShell } from './advanced-shell.ts'
import { startRendererBootReporter } from './boot-health.ts'
import { installDesktopDirectoryPickerBridge, requestDesktopDirectoryValidation } from './directory-picker.ts'
import { parseDesktopClientEnvironment } from './environment.ts'
import { installWorkspaceFolderDrop } from './workspace-folder-drop.ts'
import { en, zh, type DesktopLocaleKey } from './locales.ts'
import { DESKTOP_BUILTIN_PLUGINS_TAB_ID, DESKTOP_CURATED_PLUGINS_TAB_ID, DESKTOP_ENTERPRISE_PLUGINS_TAB_ID } from '../worker-pack.ts'
import { CommandPalette } from './CommandPalette.tsx'
import { CompanyExampleSection } from './CompanyExampleSection.tsx'
import { CuratedPluginsTab } from './CuratedPluginsTab.tsx'
import { DesktopWorkbenchHub } from './DesktopWorkbenchHub.tsx'
import { EnterprisePluginsTab } from './EnterprisePluginsTab.tsx'
import { DESKTOP_MCP_SETTINGS_KEY, type DesktopMcpSettings } from '../mcp-settings.ts'
import { DESKTOP_WORKBENCH_SETTINGS_KEY, type DesktopWorkbenchSettings } from '../workbench-settings.ts'
import { installWorkerStyles } from './worker-styles.ts'
import { readCompanyPackPreview } from './market-actions.ts'

const DESKTOP_CLIENT_LOCALE_NS = 'dsh-desktop'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh-desktop': DesktopLocaleKey
  }
}

export { applyAdvancedShell } from './advanced-shell.ts'
export {
  RENDERER_BOOT_REPORT_PATH,
  rendererBootReport,
  sendRendererBootReport,
  startRendererBootReporter,
} from './boot-health.ts'
export type { RendererBootLoader, RendererBootReport } from './boot-health.ts'
export { parseDesktopClientEnvironment } from './environment.ts'
export type { DesktopClientEnvironment, DesktopClientMode, DesktopClientPlatform } from './environment.ts'

/** Services required by advanced presentation. */
export const inject = [
  'slots',
  'sessions',
  'theme',
  'workspaces',
]

/** Register desktop-owned client surfaces for the current BrowserWindow mode. @param ctx - browser Cordis context. */
export function apply(ctx: ClientContext): void {
  const environment = parseDesktopClientEnvironment(window.location.search)
  if (!environment) return
  ctx.effect(
    () => startRendererBootReporter(ctx.loader),
    'dsh-plugin-desktop: renderer boot health report',
  )
  ctx.effect(
    () => installWorkspaceFolderDrop({
      create: input => ctx.workspaces.create(input),
      startSession: workspaceId => { ctx.workspaces.startSession(workspaceId) },
      ...(environment.platform === 'win32'
        ? { validateDirectory: (path: string) => requestDesktopDirectoryValidation(path) }
        : {}),
    }),
    'dsh-plugin-desktop: workspace folder drop',
  )
  if (environment.platform === 'win32') {
    ctx.effect(
      () => installDesktopDirectoryPickerBridge(),
      'dsh-plugin-desktop: native directory picker bridge',
    )
  }
  ctx.inject(['locale', 'settingsScope'], (settingsCtx) => {
    settingsCtx.effect(
      () => settingsCtx.locale.register(DESKTOP_CLIENT_LOCALE_NS, { zh, en }),
      'dsh-plugin-desktop: worker pack dictionaries',
    )
    settingsCtx.effect(
      () => installWorkerStyles(),
      'dsh-plugin-desktop: worker pack styles',
    )
    settingsCtx.slots.inject('settings.plugins.tab', () => settingsCtx.slots.register({
      name: 'settings.plugins.tab',
      id: DESKTOP_BUILTIN_PLUGINS_TAB_ID,
      order: 15,
      label: () => settingsCtx.locale.bind(DESKTOP_CLIENT_LOCALE_NS)('builtinTab'),
      locale: DESKTOP_CLIENT_LOCALE_NS,
      inject: () => ({
        scope: settingsCtx.settingsScope.bind<DesktopWorkbenchSettings>({
          namespace: DESKTOP_WORKBENCH_SETTINGS_KEY,
        }) as SettingsScope<DesktopWorkbenchSettings>,
        mcpScope: settingsCtx.settingsScope.bind<DesktopMcpSettings>({
          namespace: DESKTOP_MCP_SETTINGS_KEY,
        }) as SettingsScope<DesktopMcpSettings>,
      }),
    }, DesktopWorkbenchHub))
    settingsCtx.slots.inject('settings.plugins.tab', () => settingsCtx.slots.register({
      name: 'settings.plugins.tab',
      id: DESKTOP_ENTERPRISE_PLUGINS_TAB_ID,
      order: 18,
      label: () => settingsCtx.locale.bind(DESKTOP_CLIENT_LOCALE_NS)('enterpriseTab'),
      locale: DESKTOP_CLIENT_LOCALE_NS,
    }, EnterprisePluginsTab))
    settingsCtx.slots.inject('settings.plugins.tab', () => settingsCtx.slots.register({
      name: 'settings.plugins.tab',
      id: DESKTOP_CURATED_PLUGINS_TAB_ID,
      order: 20,
      label: () => settingsCtx.locale.bind(DESKTOP_CLIENT_LOCALE_NS)('curatedTab'),
      locale: DESKTOP_CLIENT_LOCALE_NS,
    }, CuratedPluginsTab))
    settingsCtx.slots.inject('shell.overlay', () => settingsCtx.slots.register({
      name: 'shell.overlay',
      id: 'desktop-command-palette',
      order: 20,
      locale: DESKTOP_CLIENT_LOCALE_NS,
      inject: () => ({
        sessions: ctx.sessions,
        workspaces: ctx.workspaces,
      }),
    }, CommandPalette))
    // Company Pack child settings: standalone section after confirm-to-install only.
    settingsCtx.effect(() => {
      const controller = new AbortController()
      let disposeSection: (() => void) | undefined
      void readCompanyPackPreview(controller.signal).then(
        (preview) => {
          if (controller.signal.aborted || !preview.enabled || disposeSection !== undefined) return
          const t = settingsCtx.locale.bind(DESKTOP_CLIENT_LOCALE_NS)
          disposeSection = settingsCtx.slots.inject('settings.section', () => settingsCtx.slots.register({
            name: 'settings.section',
            id: 'company-example',
            order: 90,
            label: () => t('companyExampleNav'),
            locale: DESKTOP_CLIENT_LOCALE_NS,
          }, CompanyExampleSection))
        },
        () => undefined,
      )
      return () => {
        controller.abort()
        disposeSection?.()
      }
    }, 'dsh-plugin-desktop: company example settings when pack enabled')
  })
  if (environment.mode === 'advanced') applyAdvancedShell(ctx, environment)
}
