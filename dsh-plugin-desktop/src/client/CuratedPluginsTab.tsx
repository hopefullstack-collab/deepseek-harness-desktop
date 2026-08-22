/**
 * Curated (featured) Plugins tab: desktop-owned recommendations + catalog.
 */

import { useEffect, useState, type ReactNode } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  COMPANY_PACK_RECOMMENDED_COMMUNITY_PLUGINS,
  OFFICE_IM_RECOMMENDED_PLUGINS,
  WORKBENCH_LATER_RECOMMENDED_PLUGINS,
  recommendedPackageInstalled,
  recommendedPluginsFor,
  summarizeWorkerPackInstallResults,
  type WorkerPackInstallKind,
} from '../worker-pack.ts'
import type { DesktopLocaleKey } from './locales.ts'
import {
  installRecommendedPlugins,
  readMarketSources,
  readWorkerPackInstallations,
  requestWorkerPackRestart,
  selectWorkerPackCatalog,
  workerPackCatalogSelected,
} from './market-actions.ts'
import { RecommendedPluginCard } from './RecommendedPluginCard.tsx'

export type CuratedPluginsTabProps = PropsRuntime<'settings.plugins.tab'>
  & PropsLocale<'dsh-desktop'>

type CatalogState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly selected: boolean }
  | { readonly status: 'busy' }
  | { readonly status: 'error' }

type InstallState =
  | { readonly status: 'idle' }
  | { readonly status: 'busy' }
  | { readonly status: 'done'; readonly tone: 'ok' | 'error'; readonly message: DesktopLocaleKey; readonly restartToken?: string }

/** Star / pick glyph for the curated Plugins tab. */
function CuratedGlyph(): ReactNode {
  return (
    <svg
      className="dshInternalMarketGlyph"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9" />
    </svg>
  )
}

/** Desktop-curated community picks — not an allowlist, never silent-preinstalled. */
export function CuratedPluginsTab({ t }: CuratedPluginsTabProps): ReactNode {
  const [catalog, setCatalog] = useState<CatalogState>({ status: 'loading' })
  const [installedNames, setInstalledNames] = useState<readonly string[]>([])
  const [install, setInstall] = useState<InstallState>({ status: 'idle' })

  const refreshInstallations = async (signal?: AbortSignal): Promise<void> => {
    const installations = await readWorkerPackInstallations(signal)
    setInstalledNames([
      ...COMPANY_PACK_RECOMMENDED_COMMUNITY_PLUGINS,
      ...WORKBENCH_LATER_RECOMMENDED_PLUGINS,
      ...OFFICE_IM_RECOMMENDED_PLUGINS,
    ].filter(plugin => recommendedPackageInstalled(plugin.packageName, installations)).map(plugin => plugin.packageName))
  }

  useEffect(() => {
    const controller = new AbortController()
    void readMarketSources(controller.signal).then(
      (sources) => {
        setCatalog({ status: 'ready', selected: workerPackCatalogSelected(sources) })
      },
      () => { setCatalog({ status: 'error' }) },
    )
    void refreshInstallations(controller.signal).catch(() => undefined)
    return () => controller.abort()
  }, [])

  const addCatalog = (): void => {
    setCatalog({ status: 'busy' })
    void selectWorkerPackCatalog().then(
      (sources) => { setCatalog({ status: 'ready', selected: workerPackCatalogSelected(sources) }) },
      () => { setCatalog({ status: 'error' }) },
    )
  }

  const runInstall = (packageNames: readonly string[]): void => {
    setInstall({ status: 'busy' })
    void installRecommendedPlugins(packageNames).then(
      async (outcome) => {
        await refreshInstallations().catch(() => undefined)
        setCatalog({ status: 'ready', selected: true })
        const message = summarizeWorkerPackInstallResults(outcome.results)
        setInstall({
          status: 'done',
          tone: message === 'installError' || message === 'installMissing' ? 'error' : 'ok',
          message,
          ...(outcome.restartToken === undefined ? {} : { restartToken: outcome.restartToken }),
        })
      },
      () => { setInstall({ status: 'done', tone: 'error', message: 'installError' }) },
    )
  }

  const installKind = (kind: WorkerPackInstallKind): void => {
    runInstall(recommendedPluginsFor(kind).map(plugin => plugin.packageName))
  }

  const restartNow = (): void => {
    if (install.status !== 'done' || install.restartToken === undefined) return
    void requestWorkerPackRestart(install.restartToken).catch(() => undefined)
  }

  const busy = catalog.status === 'busy' || install.status === 'busy'
  const isInstalled = (packageName: string): boolean => installedNames.includes(packageName)

  return (
    <section className="dshWorkerRoot dshInternalMarketRoot" aria-label={t('curatedTitle')}>
      <header className="dshInternalMarketHeader">
        <div className="dshInternalMarketGlyphWrap">
          <CuratedGlyph />
        </div>
        <div className="dshInternalMarketHeaderTitle">
          <h2>{t('curatedTitle')}</h2>
          <p>{t('curatedBody')}</p>
        </div>
      </header>
      <div className="dshWorkerSection">
        <h2>{t('pluginsTitle')}</h2>
        <p>{t('pluginsBody')}</p>
        <div className="dshWorkerActions">
          <button
            type="button"
            className="dshWorkerButton"
            disabled={busy || COMPANY_PACK_RECOMMENDED_COMMUNITY_PLUGINS.every(plugin => isInstalled(plugin.packageName))}
            onClick={() => installKind('company-pack')}
          >
            {t('installWorkspace')}
          </button>
        </div>
        {COMPANY_PACK_RECOMMENDED_COMMUNITY_PLUGINS.map(plugin => (
          <RecommendedPluginCard
            key={plugin.packageName}
            plugin={plugin}
            t={t}
            installed={isInstalled(plugin.packageName)}
            busy={busy}
            onInstall={packageName => runInstall([packageName])}
          />
        ))}
      </div>
      <div className="dshWorkerSection">
        <h2>{t('laterTitle')}</h2>
        <p>{t('laterBody')}</p>
        <div className="dshWorkerActions">
          <button
            type="button"
            className="dshWorkerButton dshWorkerButtonSecondary"
            disabled={busy || WORKBENCH_LATER_RECOMMENDED_PLUGINS.every(plugin => isInstalled(plugin.packageName))}
            onClick={() => installKind('later')}
          >
            {t('installLater')}
          </button>
        </div>
        {WORKBENCH_LATER_RECOMMENDED_PLUGINS.map(plugin => (
          <RecommendedPluginCard
            key={plugin.packageName}
            plugin={plugin}
            t={t}
            installed={isInstalled(plugin.packageName)}
            busy={busy}
            onInstall={packageName => runInstall([packageName])}
          />
        ))}
      </div>
      <div className="dshWorkerSection">
        <h2>{t('officeImTitle')}</h2>
        <p>{t('officeImBody')}</p>
        <div className="dshWorkerActions">
          <button
            type="button"
            className="dshWorkerButton"
            disabled={busy || OFFICE_IM_RECOMMENDED_PLUGINS.every(plugin => isInstalled(plugin.packageName))}
            onClick={() => installKind('office-im')}
          >
            {t('installOfficeIm')}
          </button>
        </div>
        {OFFICE_IM_RECOMMENDED_PLUGINS.map(plugin => (
          <RecommendedPluginCard
            key={plugin.packageName}
            plugin={plugin}
            t={t}
            installed={isInstalled(plugin.packageName)}
            busy={busy}
            onInstall={packageName => runInstall([packageName])}
          />
        ))}
      </div>
      {install.status === 'busy' ? <p className="dshWorkerStatus">{t('installBusy')}</p> : null}
      {install.status === 'done'
        ? (
            <div className="dshWorkerSection">
              <p className="dshWorkerStatus" data-tone={install.tone}>{t(install.message)}</p>
              {install.restartToken === undefined
                ? null
                : (
                    <div className="dshWorkerActions">
                      <button type="button" className="dshWorkerButton" onClick={restartNow}>
                        {t('installRestartNow')}
                      </button>
                    </div>
                  )}
            </div>
          )
        : null}
      <div className="dshWorkerSection">
        <h2>{t('catalogTitle')}</h2>
        <p>{t('catalogBody')}</p>
        <div className="dshWorkerActions">
          <button
            type="button"
            className="dshWorkerButton"
            disabled={catalog.status === 'busy' || (catalog.status === 'ready' && catalog.selected)}
            onClick={addCatalog}
          >
            {t('addCatalog')}
          </button>
        </div>
        {catalog.status === 'busy' ? <p className="dshWorkerStatus">{t('catalogBusy')}</p> : null}
        {catalog.status === 'error' ? <p className="dshWorkerStatus" data-tone="error">{t('catalogError')}</p> : null}
        {catalog.status === 'ready' && catalog.selected
          ? <p className="dshWorkerStatus" data-tone="ok">{t('catalogReady')}</p>
          : null}
      </div>
    </section>
  )
}
