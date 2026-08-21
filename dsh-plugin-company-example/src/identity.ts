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
