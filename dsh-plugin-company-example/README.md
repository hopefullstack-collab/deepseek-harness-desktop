# dsh-plugin-company-example

Example company sub-plugin for the optional AI Buddy Company Pack.

It registers a Host identity extension point for SSO and org policy. It ships **no secrets**. Replace the idle SSO hook in a real company plugin; keep credentials in the local credential store or plugin config the user owns.

After Company Pack confirm-to-install, Desktop registers a standalone **Settings** section for this example (name + version badge + General), matching the community-plugin settings chrome pattern.
