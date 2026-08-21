/** Example company sub-plugin. Extension point for SSO and org policy — no secrets. */

import type { Context } from '@deepseek-ai/cordis'

/** Stable Cordis plugin name. */
export const name = 'company-example'

/**
 * Optional company identity seam. Real deployments replace this with an SSO
 * adapter; the example only exposes the hook and never ships credentials.
 */
export interface CompanyIdentityExtension {
  /** Stable org id when SSO is wired; undefined in the example. */
  readonly organizationId?: string
  /** Display label for settings and diagnostics. */
  readonly displayName: string
}

/** Example identity surface with no credentials. */
export const EXAMPLE_COMPANY_IDENTITY: CompanyIdentityExtension = Object.freeze({
  displayName: 'Example Company',
})

/**
 * Register the example company Host face.
 * Real company plugins should inject SSO here without embedding secrets.
 */
export function apply(ctx: Context): void {
  ctx.logger.info(
    `company-example: loaded for ${EXAMPLE_COMPANY_IDENTITY.displayName} `
    + '(SSO extension point idle; no secrets in package)',
  )
}
