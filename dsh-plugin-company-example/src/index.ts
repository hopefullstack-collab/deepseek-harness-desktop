/** Example company sub-plugin. Extension point for SSO and org policy — no secrets. */

import type { Context } from '@deepseek-ai/cordis'
import { EXAMPLE_COMPANY_IDENTITY } from './identity.ts'

export { EXAMPLE_COMPANY_IDENTITY } from './identity.ts'
export type { CompanyIdentityExtension } from './identity.ts'

/** Stable Cordis plugin name. */
export const name = 'company-example'

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
