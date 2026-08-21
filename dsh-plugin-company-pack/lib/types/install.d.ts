/** Confirm-gated Company Pack install cascade. Never runs at silent launch. */
import { type CompanyPackInstallPlan } from './manifest.ts';
export { COMPANY_PACK_PACKAGE_NAME, buildCompanyPackInstallPlan, } from './manifest.ts';
export type { CompanyPackInstallPlan } from './manifest.ts';
/** Exact community target resolved after the user confirms. */
export interface CompanyPackCommunityInstallTarget {
    readonly packageName: string;
    readonly packageVersion: string;
    readonly receiptId: string;
}
/** Confirmed install request. `confirmed` must be literally true. */
export interface CompanyPackConfirmedInstall {
    readonly confirmed: true;
    readonly communityTargets: readonly CompanyPackCommunityInstallTarget[];
}
/** Injectable seams so Desktop owns enablement and `desktopPnpm.installPlugin`. */
export interface CompanyPackCascadeDeps {
    /** Enable the bundled pack in the active profile / Host composition. */
    readonly enableBundledPack: () => Promise<void>;
    /**
     * Install one community recommendation through Desktop's recoverable path.
     * Desktop wires this to serial `desktopPnpm.installPlugin`.
     */
    readonly installCommunityPlugin: (target: CompanyPackCommunityInstallTarget) => Promise<void>;
}
/** Outcome of one confirmed cascade. */
export interface CompanyPackCascadeResult {
    readonly packEnabled: boolean;
    readonly communityInstalled: readonly string[];
    readonly plan: CompanyPackInstallPlan;
}
/** Refuse any path that is not an explicit user confirm. */
export declare function assertCompanyPackConfirmed(request: {
    readonly confirmed?: unknown;
}): asserts request is CompanyPackConfirmedInstall;
/**
 * After confirm: enable the bundled pack, then serially install community recs.
 * Company children arrive with the pack (bundle patch / Host apply) — not via npm.
 */
export declare function cascadeCompanyPackInstall(deps: CompanyPackCascadeDeps, request: CompanyPackConfirmedInstall): Promise<CompanyPackCascadeResult>;
