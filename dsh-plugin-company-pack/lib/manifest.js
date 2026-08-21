//#region src/manifest.ts
/** Curated Company Pack metadata. Catalog listing is not a security review. */
/** npm package name of the optional Company Pack umbrella. */
const COMPANY_PACK_PACKAGE_NAME = "dsh-plugin-company-pack";
/** User-facing pack title. */
const COMPANY_PACK_DISPLAY_NAME = "Company Pack (example)";
/** Bundled company children inserted by the pack's Cordis patch / Host apply. */
const COMPANY_PACK_CHILDREN = Object.freeze([{
	packageName: "dsh-plugin-company-example",
	displayName: "Example Company",
	role: "company-identity"
}]);
/**
* Community recommendations cascaded after confirm.
* These are not preinstalled and are not an allowlist.
*/
const COMPANY_PACK_COMMUNITY_RECOMMENDATIONS = Object.freeze([{
	packageName: "dsh-better-sidebar",
	displayName: "DSH-better-sidebar",
	role: "workspace-shell",
	repositoryUrl: "https://github.com/omdsh-dev/DSH-better-sidebar"
}, {
	packageName: "dsh-context",
	displayName: "dsh-context",
	role: "workspace-context",
	repositoryUrl: "https://github.com/bowenliang123/dsh-context"
}]);
/** Build the confirm-to-install plan. Nothing installs until the user confirms. */
function buildCompanyPackInstallPlan() {
	const pack = {
		packageName: COMPANY_PACK_PACKAGE_NAME,
		displayName: COMPANY_PACK_DISPLAY_NAME,
		kind: "pack"
	};
	const companyChildren = COMPANY_PACK_CHILDREN.map((child) => ({
		packageName: child.packageName,
		displayName: child.displayName,
		kind: "company-child"
	}));
	const communityRecommendations = COMPANY_PACK_COMMUNITY_RECOMMENDATIONS.map((plugin) => ({
		packageName: plugin.packageName,
		displayName: plugin.displayName,
		kind: "community"
	}));
	return {
		pack,
		companyChildren,
		communityRecommendations,
		entries: [
			pack,
			...companyChildren,
			...communityRecommendations
		]
	};
}
//#endregion
export { COMPANY_PACK_CHILDREN, COMPANY_PACK_COMMUNITY_RECOMMENDATIONS, COMPANY_PACK_DISPLAY_NAME, COMPANY_PACK_PACKAGE_NAME, buildCompanyPackInstallPlan };

//# sourceMappingURL=manifest.js.map