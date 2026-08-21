import { COMPANY_PACK_COMMUNITY_RECOMMENDATIONS, COMPANY_PACK_PACKAGE_NAME, buildCompanyPackInstallPlan } from "./manifest.js";
//#region src/install.ts
/** Confirm-gated Company Pack install cascade. Never runs at silent launch. */
/** Refuse any path that is not an explicit user confirm. */
function assertCompanyPackConfirmed(request) {
	if (request.confirmed !== true) throw new Error(`${COMPANY_PACK_PACKAGE_NAME}: company pack install requires explicit user confirmation`);
}
/**
* After confirm: enable the bundled pack, then serially install community recs.
* Company children arrive with the pack (bundle patch / Host apply) — not via npm.
*/
async function cascadeCompanyPackInstall(deps, request) {
	assertCompanyPackConfirmed(request);
	const plan = buildCompanyPackInstallPlan();
	const allowed = new Set(COMPANY_PACK_COMMUNITY_RECOMMENDATIONS.map((plugin) => plugin.packageName));
	for (const target of request.communityTargets) {
		if (!allowed.has(target.packageName)) throw new Error(`${COMPANY_PACK_PACKAGE_NAME}: refusing non-recommended community package ${target.packageName}`);
		if (!/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u.test(target.packageVersion)) throw new Error(`${COMPANY_PACK_PACKAGE_NAME}: community install requires an exact stable SemVer`);
	}
	await deps.enableBundledPack();
	const communityInstalled = [];
	for (const target of request.communityTargets) {
		await deps.installCommunityPlugin(target);
		communityInstalled.push(target.packageName);
	}
	return {
		packEnabled: true,
		communityInstalled,
		plan
	};
}
//#endregion
export { COMPANY_PACK_PACKAGE_NAME, assertCompanyPackConfirmed, buildCompanyPackInstallPlan, cascadeCompanyPackInstall };

//# sourceMappingURL=install.js.map