# dsh-plugin-company-pack

Optional Company Pack umbrella for AI Buddy.

## Rules

- **Opt-in only.** Desktop does not insert this pack into `cordis.patch.yml` by default and does not silent-preinstall on launch.
- **Confirm-to-install.** The install plan shows the pack, bundled company children, and recommended community plugins. Community installs cascade only after confirm, serially through `desktopPnpm.installPlugin`.
- **No secrets** in the package. SSO and credentials stay in user-owned stores.

## Layout

- `cordis.patch.yml` — inserts the pack Host row and `dsh-plugin-company-example` when the pack is an active profile bundle.
- `src/manifest.ts` — confirm-dialog plan metadata.
- `src/install.ts` — confirm gate + cascade orchestration (pure library).
- `src/index.ts` — Cordis Host that loads the example child when the pack is active.
