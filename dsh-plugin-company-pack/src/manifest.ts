/** Curated Company Pack metadata. Catalog listing is not a security review. */

/** npm package name of the optional Company Pack umbrella. */
export const COMPANY_PACK_PACKAGE_NAME = 'dsh-plugin-company-pack'

/** User-facing pack title. */
export const COMPANY_PACK_DISPLAY_NAME = 'Company Pack (example)'

/** One bundled company child that ships with the pack installer graph. */
export interface CompanyPackChild {
  readonly packageName: string
  readonly displayName: string
  readonly role: 'company-identity'
}

/** Community plugin recommended after the user confirms the pack install. */
export interface CompanyPackCommunityRecommendation {
  readonly packageName: string
  readonly displayName: string
  readonly role: 'workspace-shell' | 'workspace-context'
  readonly repositoryUrl: string
  /**
   * Exact SemVer when the company pins an audited release.
   * When omitted, Desktop resolves a catalog version only after confirm.
   */
  readonly packageVersion?: string
}

/** One row shown in the confirm-to-install dialog. */
export interface CompanyPackInstallPlanEntry {
  readonly packageName: string
  readonly displayName: string
  readonly kind: 'pack' | 'company-child' | 'community'
}

/** Confirm dialog payload: pack + children + community recommendations. */
export interface CompanyPackInstallPlan {
  readonly pack: CompanyPackInstallPlanEntry
  readonly companyChildren: readonly CompanyPackInstallPlanEntry[]
  readonly communityRecommendations: readonly CompanyPackInstallPlanEntry[]
  /** Flat list in display order for the confirm UI. */
  readonly entries: readonly CompanyPackInstallPlanEntry[]
}

/** Bundled company children inserted by the pack's Cordis patch / Host apply. */
export const COMPANY_PACK_CHILDREN: readonly CompanyPackChild[] = Object.freeze([
  {
    packageName: 'dsh-plugin-company-example',
    displayName: 'Example Company',
    role: 'company-identity',
  },
])

/**
 * Community recommendations cascaded after confirm.
 * These are not preinstalled and are not an allowlist.
 */
export const COMPANY_PACK_COMMUNITY_RECOMMENDATIONS: readonly CompanyPackCommunityRecommendation[] = Object.freeze([
  {
    packageName: 'dsh-better-sidebar',
    displayName: 'DSH-better-sidebar',
    role: 'workspace-shell',
    repositoryUrl: 'https://github.com/omdsh-dev/DSH-better-sidebar',
  },
  {
    packageName: 'dsh-context',
    displayName: 'dsh-context',
    role: 'workspace-context',
    repositoryUrl: 'https://github.com/bowenliang123/dsh-context',
  },
])

/** Build the confirm-to-install plan. Nothing installs until the user confirms. */
export function buildCompanyPackInstallPlan(): CompanyPackInstallPlan {
  const pack: CompanyPackInstallPlanEntry = {
    packageName: COMPANY_PACK_PACKAGE_NAME,
    displayName: COMPANY_PACK_DISPLAY_NAME,
    kind: 'pack',
  }
  const companyChildren = COMPANY_PACK_CHILDREN.map(child => ({
    packageName: child.packageName,
    displayName: child.displayName,
    kind: 'company-child' as const,
  }))
  const communityRecommendations = COMPANY_PACK_COMMUNITY_RECOMMENDATIONS.map(plugin => ({
    packageName: plugin.packageName,
    displayName: plugin.displayName,
    kind: 'community' as const,
  }))
  return {
    pack,
    companyChildren,
    communityRecommendations,
    entries: [pack, ...companyChildren, ...communityRecommendations],
  }
}
