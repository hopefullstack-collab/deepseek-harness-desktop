/**
 * Shared recommended-plugin card used by Internal Market and Company settings.
 */

import type { ReactNode } from 'react'
import type {
  WorkerPackRecommendedPlugin,
} from '../worker-pack.ts'
import type { DesktopLocaleKey } from './locales.ts'

export const RECOMMENDED_PLUGIN_ROLE_KEY: Record<
  WorkerPackRecommendedPlugin['role'],
  DesktopLocaleKey
> = {
  'workspace-shell': 'pluginWorkspaceShell',
  'workspace-context': 'pluginWorkspaceContext',
  'workspace-mobile': 'pluginWorkspaceMobile',
  'office-dingtalk': 'pluginOfficeDingtalk',
  'office-wecom': 'pluginOfficeWecom',
  'company-pack': 'pluginCompanyPack',
}

export function RecommendedPluginCard({
  plugin,
  t,
  installed,
  busy,
  onInstall,
}: {
  readonly plugin: WorkerPackRecommendedPlugin
  readonly t: (key: DesktopLocaleKey) => string
  readonly installed: boolean
  readonly busy: boolean
  readonly onInstall: (packageName: string) => void
}): ReactNode {
  return (
    <article className="dshWorkerCard">
      <h3>{plugin.displayName}</h3>
      <p>{t(RECOMMENDED_PLUGIN_ROLE_KEY[plugin.role])}</p>
      <div className="dshWorkerMeta">
        <span>{t('pluginPackage')}</span>
        <code className="dshWorkerCode">{plugin.packageName}</code>
        <a href={plugin.repositoryUrl} target="_blank" rel="noreferrer">{t('openRepository')}</a>
      </div>
      <div className="dshWorkerActions">
        <button
          type="button"
          className="dshWorkerButton dshWorkerButtonSecondary"
          disabled={busy || installed}
          onClick={() => onInstall(plugin.packageName)}
        >
          {installed ? t('installed') : t('installPlugin')}
        </button>
      </div>
    </article>
  )
}
