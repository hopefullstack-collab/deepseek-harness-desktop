/** Company Pack Host face. Loads company children; no secrets. */
import type { Context } from '@deepseek-ai/cordis';
/** Stable Cordis plugin name. */
export declare const name = "company-pack";
/**
 * Load the umbrella pack and its bundled company children.
 * Activation is opt-in through Desktop confirm-to-install — never at silent boot.
 */
export declare function apply(ctx: Context): void;
export { COMPANY_PACK_PACKAGE_NAME, COMPANY_PACK_DISPLAY_NAME, COMPANY_PACK_CHILDREN, COMPANY_PACK_COMMUNITY_RECOMMENDATIONS, buildCompanyPackInstallPlan, } from './manifest.ts';
export type { CompanyPackChild, CompanyPackCommunityRecommendation, CompanyPackInstallPlan, CompanyPackInstallPlanEntry, } from './manifest.ts';
export { cascadeCompanyPackInstall, assertCompanyPackConfirmed, } from './install.ts';
export type { CompanyPackCascadeDeps, CompanyPackCascadeResult, CompanyPackCommunityInstallTarget, CompanyPackConfirmedInstall, } from './install.ts';
