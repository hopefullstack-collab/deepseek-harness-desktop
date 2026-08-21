/** Curated Company Pack metadata. Catalog listing is not a security review. */
/** npm package name of the optional Company Pack umbrella. */
export declare const COMPANY_PACK_PACKAGE_NAME = "dsh-plugin-company-pack";
/** User-facing pack title. */
export declare const COMPANY_PACK_DISPLAY_NAME = "Company Pack (example)";
/** One bundled company child that ships with the pack installer graph. */
export interface CompanyPackChild {
    readonly packageName: string;
    readonly displayName: string;
    readonly role: 'company-identity';
}
/** Community plugin recommended after the user confirms the pack install. */
export interface CompanyPackCommunityRecommendation {
    readonly packageName: string;
    readonly displayName: string;
    readonly role: 'workspace-shell' | 'workspace-context';
    readonly repositoryUrl: string;
    /**
     * Exact SemVer when the company pins an audited release.
     * When omitted, Desktop resolves a catalog version only after confirm.
     */
    readonly packageVersion?: string;
}
/** One row shown in the confirm-to-install dialog. */
export interface CompanyPackInstallPlanEntry {
    readonly packageName: string;
    readonly displayName: string;
    readonly kind: 'pack' | 'company-child' | 'community';
}
/** Confirm dialog payload: pack + children + community recommendations. */
export interface CompanyPackInstallPlan {
    readonly pack: CompanyPackInstallPlanEntry;
    readonly companyChildren: readonly CompanyPackInstallPlanEntry[];
    readonly communityRecommendations: readonly CompanyPackInstallPlanEntry[];
    /** Flat list in display order for the confirm UI. */
    readonly entries: readonly CompanyPackInstallPlanEntry[];
}
/** Bundled company children inserted by the pack's Cordis patch / Host apply. */
export declare const COMPANY_PACK_CHILDREN: readonly CompanyPackChild[];
/**
 * Community recommendations cascaded after confirm.
 * These are not preinstalled and are not an allowlist.
 */
export declare const COMPANY_PACK_COMMUNITY_RECOMMENDATIONS: readonly CompanyPackCommunityRecommendation[];
/** Build the confirm-to-install plan. Nothing installs until the user confirms. */
export declare function buildCompanyPackInstallPlan(): CompanyPackInstallPlan;
