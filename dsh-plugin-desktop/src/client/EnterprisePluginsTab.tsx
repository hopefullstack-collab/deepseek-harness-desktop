/**
 * Enterprise (company-internal) Plugins tab: Company Pack confirm-to-install.
 */

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
  requestWorkerPackRestart,
} from './market-actions.ts'

export type EnterprisePluginsTabProps = PropsRuntime<'settings.plugins.tab'>
  & PropsLocale<'dsh-desktop'>

type InstallState =
  | { readonly status: 'idle' }
  | { readonly status: 'busy' }
  | { readonly status: 'confirm-company-pack'; readonly entries: readonly { readonly packageName: string; readonly displayName: string; readonly kind: string }[] }
  | { readonly status: 'done'; readonly tone: 'ok' | 'error'; readonly message: DesktopLocaleKey; readonly restartToken?: string }

/** Building / org glyph for the enterprise Plugins tab. */
function EnterpriseGlyph(): ReactNode {
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
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" />
      <path d="M10 21v-4h4v4" />
    </svg>
  )
}

/** Company Pack and enterprise children — not the open community store. */
export function EnterprisePluginsTab({ t }: EnterprisePluginsTabProps): ReactNode {
  const [companyPackEnabled, setCompanyPackEnabled] = useState(false)
  const [install, setInstall] = useState<InstallState>({ status: 'idle' })

  useEffect(() => {
    const controller = new AbortController()
    void readCompanyPackPreview(controller.signal).then(
      (preview) => { setCompanyPackEnabled(preview.enabled) },
      () => undefined,
    )
    return () => controller.abort()
  }, [])

  const beginCompanyPackConfirm = (): void => {
    setInstall({
      status: 'confirm-company-pack',
      entries: buildCompanyPackInstallPlan().entries,
    })
  }

  const confirmCompanyPack = (): void => {
    setInstall({ status: 'busy' })
    void installCompanyPackWithCascade().then(
      (outcome) => {
        setCompanyPackEnabled(outcome.packEnabled)
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

  const busy = install.status === 'busy'

  return (
    <section className="dshWorkerRoot dshInternalMarketRoot" aria-label={t('enterpriseTitle')}>
      <header className="dshInternalMarketHeader">
        <div className="dshInternalMarketGlyphWrap">
          <EnterpriseGlyph />
        </div>
        <div className="dshInternalMarketHeaderTitle">
          <h2>{t('enterpriseTitle')}</h2>
          <p>{t('enterpriseBody')}</p>
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
    </section>
  )
}
