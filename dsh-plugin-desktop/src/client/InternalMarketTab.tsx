import { useEffect, useState, type ReactNode } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  COMPANY_PACK_RECOMMENDED_ENTRY,
  buildCompanyPackInstallPlan,
  summarizeWorkerPackInstallResults,
} from '../worker-pack.ts'
import type { DesktopLocaleKey } from './locales.ts'
import {
  installCompanyPackWithCascade,
  readCompanyPackPreview,
  readMarketSources,
  requestWorkerPackRestart,
  selectWorkerPackCatalog,
  workerPackCatalogSelected,
} from './market-actions.ts'

export type InternalMarketTabProps = PropsRuntime<'settings.plugins.tab'>
  & PropsLocale<'dsh-desktop'>

type CatalogState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly selected: boolean }
  | { readonly status: 'busy' }
  | { readonly status: 'error' }

type InstallState =
  | { readonly status: 'idle' }
  | { readonly status: 'busy' }
  | { readonly status: 'confirm-company-pack'; readonly entries: readonly { readonly packageName: string; readonly displayName: string; readonly kind: string }[] }
  | { readonly status: 'done'; readonly tone: 'ok' | 'error'; readonly message: DesktopLocaleKey; readonly restartToken?: string }

/** Four-way move glyph matching official settings-tab chrome, without primitives. */
function InternalMarketGlyph(): ReactNode {
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
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 9 18 12 15 15" />
      <polyline points="9 15 12 18 15 15" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  )
}

/**
 * Desktop-owned curated entry for Company Pack + catalog.
 * Workspace / office / later recommendations live on Example Company settings
 * after the pack is enabled.
 */
export function InternalMarketTab({ t }: InternalMarketTabProps): ReactNode {
  const [catalog, setCatalog] = useState<CatalogState>({ status: 'loading' })
  const [companyPackEnabled, setCompanyPackEnabled] = useState(false)
  const [install, setInstall] = useState<InstallState>({ status: 'idle' })

  useEffect(() => {
    const controller = new AbortController()
    void readMarketSources(controller.signal).then(
      (sources) => {
        setCatalog({ status: 'ready', selected: workerPackCatalogSelected(sources) })
      },
      () => { setCatalog({ status: 'error' }) },
    )
    void readCompanyPackPreview(controller.signal).then(
      (preview) => { setCompanyPackEnabled(preview.enabled) },
      () => undefined,
    )
    return () => controller.abort()
  }, [])

  const addCatalog = (): void => {
    setCatalog({ status: 'busy' })
    void selectWorkerPackCatalog().then(
      (sources) => { setCatalog({ status: 'ready', selected: workerPackCatalogSelected(sources) }) },
      () => { setCatalog({ status: 'error' }) },
    )
  }

  const beginCompanyPackConfirm = (): void => {
    setInstall({
      status: 'confirm-company-pack',
      entries: buildCompanyPackInstallPlan().entries,
    })
  }

  const confirmCompanyPack = (): void => {
    setInstall({ status: 'busy' })
    void installCompanyPackWithCascade().then(
      async (outcome) => {
        setCompanyPackEnabled(outcome.packEnabled)
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

  const restartNow = (): void => {
    if (install.status !== 'done' || install.restartToken === undefined) return
    void requestWorkerPackRestart(install.restartToken).catch(() => undefined)
  }

  const busy = catalog.status === 'busy' || install.status === 'busy'

  return (
    <section className="dshWorkerRoot dshInternalMarketRoot" aria-label={t('internalMarketTitle')}>
      <header className="dshInternalMarketHeader">
        <div className="dshInternalMarketGlyphWrap">
          <InternalMarketGlyph />
        </div>
        <div className="dshInternalMarketHeaderTitle">
          <h2>{t('internalMarketTitle')}</h2>
          <p>{t('internalMarketBody')}</p>
        </div>
      </header>
      <div className="dshWorkerSection">
        <h2>{t('companyPackTitle')}</h2>
        <p>{t('companyPackBody')}</p>
        <article className="dshWorkerCard">
          <h3>{COMPANY_PACK_RECOMMENDED_ENTRY.displayName}</h3>
          <p>{t('pluginCompanyPack')}</p>
          <div className="dshWorkerMeta">
            <span>{t('pluginPackage')}</span>
            <code className="dshWorkerCode">{COMPANY_PACK_RECOMMENDED_ENTRY.packageName}</code>
            <a href={COMPANY_PACK_RECOMMENDED_ENTRY.repositoryUrl} target="_blank" rel="noreferrer">{t('openRepository')}</a>
          </div>
          <div className="dshWorkerActions">
            <button
              type="button"
              className="dshWorkerButton"
              disabled={busy || companyPackEnabled}
              onClick={beginCompanyPackConfirm}
            >
              {companyPackEnabled ? t('installed') : t('installCompanyPack')}
            </button>
          </div>
        </article>
        {companyPackEnabled
          ? <p className="dshWorkerStatus" data-tone="ok">{t('companyPackRecommendationsHint')}</p>
          : null}
        {install.status === 'confirm-company-pack'
          ? (
              <div className="dshWorkerSection" role="dialog" aria-label={t('confirmCompanyPackTitle')}>
                <h2>{t('confirmCompanyPackTitle')}</h2>
                <p>{t('confirmCompanyPackBody')}</p>
                <ul>
                  {install.entries.map(entry => (
                    <li key={`${entry.kind}:${entry.packageName}`}>
                      <code className="dshWorkerCode">{entry.packageName}</code>
                      {' '}
                      —
                      {' '}
                      {entry.displayName}
                      {' '}
                      (
                      {entry.kind}
                      )
                    </li>
                  ))}
                </ul>
                <div className="dshWorkerActions">
                  <button type="button" className="dshWorkerButton" onClick={confirmCompanyPack}>
                    {t('confirmCompanyPack')}
                  </button>
                  <button
                    type="button"
                    className="dshWorkerButton dshWorkerButtonSecondary"
                    onClick={() => setInstall({ status: 'idle' })}
                  >
                    {t('cancelCompanyPack')}
                  </button>
                </div>
              </div>
            )
          : null}
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
