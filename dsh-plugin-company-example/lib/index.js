//#region src/index.ts
/** Stable Cordis plugin name. */
const name = "company-example";
/** Example identity surface with no credentials. */
const EXAMPLE_COMPANY_IDENTITY = Object.freeze({ displayName: "Example Company" });
/**
* Register the example company Host face.
* Real company plugins should inject SSO here without embedding secrets.
*/
function apply(ctx) {
	ctx.logger.info(`company-example: loaded for ${EXAMPLE_COMPANY_IDENTITY.displayName} (SSO extension point idle; no secrets in package)`);
}
//#endregion
export { EXAMPLE_COMPANY_IDENTITY, apply, name };

//# sourceMappingURL=index.js.map