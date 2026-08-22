/**
 * Enterprise page inside Example Company settings (Company Pack confirm).
 */

import { useEffect, useState, type ReactNode } from 'react'
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

type InstallState =
  | { readonly status: 'idle' }
  | { readonly status: 'busy' }
  | { readonly status: 'confirm-company-pack'; readonly entries: readonly { readonly packageName: string; readonly displayName: string; readonly kind: string }[] }
  | { readonly status: 'done'; readonly tone: 'ok' | 'error'; readonly message: DesktopLocaleKey; readonly restartToken?: string }

/** Company Pack confirm-to-install — lives under Example Company → Enterprise. */
export function CompanyEnterprisePage({
  t,
}: {
  readonly t: (key: DesktopLocaleKey) => string
}): ReactNode {
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
    <div className="dshWorkerRoot dshCompanyExamplePage" aria-label={t('enterpriseTitle')}>
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
    </div>
  )
}
