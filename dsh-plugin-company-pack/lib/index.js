import { COMPANY_PACK_CHILDREN, COMPANY_PACK_COMMUNITY_RECOMMENDATIONS, COMPANY_PACK_DISPLAY_NAME, COMPANY_PACK_PACKAGE_NAME, buildCompanyPackInstallPlan } from "./manifest.js";
import { assertCompanyPackConfirmed, cascadeCompanyPackInstall } from "./install.js";
import * as companyExample from "dsh-plugin-company-example";
//#region src/index.ts
/** Stable Cordis plugin name. */
const name = "company-pack";
/**
* Load the umbrella pack and its bundled company children.
* Activation is opt-in through Desktop confirm-to-install — never at silent boot.
*/
function apply(ctx) {
	ctx.plugin(companyExample);
	ctx.logger.info(`${COMPANY_PACK_PACKAGE_NAME}: ${COMPANY_PACK_DISPLAY_NAME} active (example child loaded; no secrets)`);
}
//#endregion
export { COMPANY_PACK_CHILDREN, COMPANY_PACK_COMMUNITY_RECOMMENDATIONS, COMPANY_PACK_DISPLAY_NAME, COMPANY_PACK_PACKAGE_NAME, apply, assertCompanyPackConfirmed, buildCompanyPackInstallPlan, cascadeCompanyPackInstall, name };

//# sourceMappingURL=index.js.map