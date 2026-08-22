/**
 * Standalone Example Company settings section.
 * Identity chrome only; curated installs live under Plugins → 精选推荐.
 */

import type { ReactNode } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { EXAMPLE_COMPANY_IDENTITY } from 'dsh-plugin-company-example/identity'

const PACKAGE_NAME = 'dsh-plugin-company-example'
const PACKAGE_VERSION = '0.1.0-dev.0'
const STYLE_TAG_ID = 'dsh-plugin-desktop/CompanyExampleSection.css'

const SECTION_CSS = `
.dshCompanyExampleSection{flex-direction:column;gap:14px;width:100%;max-width:760px;display:flex}
.dshCompanyExampleIntro{color:var(--dsw-alias-label-tertiary);margin:0;padding:0 2px;font-size:13px;line-height:20px}
.dshCompanyExampleVersionBadge{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);border-radius:999px;align-self:flex-start;align-items:center;gap:8px;padding:4px 12px 4px 14px;font-size:12px;line-height:18px;display:inline-flex}
.dshCompanyExampleVersionBadgeName{color:var(--dsw-alias-label-primary);font-weight:600}
.dshCompanyExampleVersionBadgeTag{background:var(--dsw-alias-accent-soft,var(--dsw-alias-border-l2));color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;border-radius:999px;padding:1px 8px}
.dshCompanyExampleGroup{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:16px;flex-direction:column;flex:none;gap:8px;padding:18px 20px 20px;display:flex}
.dshCompanyExampleGroupHeading{color:var(--dsw-alias-label-primary);align-items:baseline;gap:7px;padding:0 2px 6px;font-size:13px;font-weight:600;line-height:20px;display:flex}
.dshCompanyExampleRow{border-bottom:1px solid var(--dsw-alias-border-l2);justify-content:space-between;align-items:center;gap:16px;padding:12px 2px;display:flex}
.dshCompanyExampleRow:last-child{border-bottom:none}
.dshCompanyExampleRowText{flex-direction:column;gap:4px;min-width:0;display:flex}
.dshCompanyExampleTitle{color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
.dshCompanyExampleDesc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.dshCompanyExampleValue{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;white-space:nowrap}
`

function ensureStyles(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector(`style[data-plugin-css=${JSON.stringify(STYLE_TAG_ID)}]`) !== null) return
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-plugin-desktop'
  tag.dataset.pluginCss = STYLE_TAG_ID
  tag.textContent = SECTION_CSS
  document.head.appendChild(tag)
}

export type CompanyExampleSectionProps = PropsRuntime<'settings.section'>
  & PropsLocale<'dsh-desktop'>

/** Settings.section page shown after Company Pack opt-in. */
export function CompanyExampleSection({ t }: CompanyExampleSectionProps): ReactNode {
  ensureStyles()
  return (
    <div className="dshCompanyExampleSection">
      <p className="dshCompanyExampleIntro">{t('companyExampleIntro')}</p>
      <div className="dshCompanyExampleVersionBadge">
        <span className="dshCompanyExampleVersionBadgeName">{PACKAGE_NAME}</span>
        <span className="dshCompanyExampleVersionBadgeTag">{`v${PACKAGE_VERSION}`}</span>
      </div>
      <div className="dshCompanyExampleGroup">
        <div className="dshCompanyExampleGroupHeading">{t('companyExampleGeneralTitle')}</div>
        <div className="dshCompanyExampleRow">
          <span className="dshCompanyExampleRowText">
            <span className="dshCompanyExampleTitle">{t('companyExampleIdentityTitle')}</span>
            <span className="dshCompanyExampleDesc">{t('companyExampleIdentityDesc')}</span>
          </span>
          <span className="dshCompanyExampleValue">{EXAMPLE_COMPANY_IDENTITY.displayName}</span>
        </div>
        <div className="dshCompanyExampleRow">
          <span className="dshCompanyExampleRowText">
            <span className="dshCompanyExampleTitle">{t('companyExampleSsoTitle')}</span>
            <span className="dshCompanyExampleDesc">{t('companyExampleSsoDesc')}</span>
          </span>
          <span className="dshCompanyExampleValue">{t('companyExampleSsoIdle')}</span>
        </div>
      </div>
    </div>
  )
}
