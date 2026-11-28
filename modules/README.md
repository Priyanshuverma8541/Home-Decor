# Savitri modules

Existing products stay in their current project folders and are registered through the Module Registry. A module does not need to be moved here to be managed.

- [`_starter`](./_starter/README.md) is the integration-contract example for a new standalone React/Vite module.
- Internal integrations must use an entry key explicitly supported by the central frontend adapter. Registry records never contain executable JavaScript.
- External products are deployed independently and connected by approved HTTPS URL, iframe origin allowlist, or API contract.

See [`docs/module-platform.md`](../docs/module-platform.md) for the lifecycle, security boundary, routes, and first-developer workflow.
