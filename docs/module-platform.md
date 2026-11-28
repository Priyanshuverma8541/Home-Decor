# Savitri Livings modular product platform

The Module Registry adds a controlled product lifecycle to the existing React/Vite frontend, Express/Mongoose backend, and React Admin. It reuses the existing backend, JWT authentication, Mongo URI and Admin role. It does not create a second platform service or execute registry-supplied JavaScript.

## Current architecture

```text
Existing Savitri Admin
  └── Product & Module Management
      ├── ModuleProduct (registry, live release, release candidate, versions, visibility)
      ├── DeveloperAssignment (task, requirements, owner, deadline, feedback)
      ├── ModuleSubmission (version/repository/PR/commit/docs link and review)
      └── ModuleAuditEvent (admin/developer lifecycle activity)
              ↓
Existing Express backend /api/modules
              ↓
Existing MongoDB (MONGO_URI)
              ↓
Existing React/Vite frontend + approved integration adapters
```

Packages in `packages/` define shared contracts. New sample apps belong in their own GitHub repository or assigned module directory under `modules/`; existing product folders are not moved. See [`modules/README.md`](../modules/README.md) and the [`_starter`](../modules/_starter/README.md).

## Integration types

| Type | Runtime behavior | Boundary |
| --- | --- | --- |
| `internal` | Central frontend maps a fixed `internalKey` to a component already shipped in its bundle. | Registry cannot upload executable code; adding a new internal adapter still requires a reviewed frontend release. |
| `deployed` | Central route shows product details and opens the public deployment in a new tab. | HTTPS only; no Savitri session token is shared with the other origin. |
| `iframe` | Central route embeds the deployment using the exact origin allowlist. | HTTPS, validated origin, sandbox (`allow-scripts`, `allow-forms`, `allow-popups`, `allow-downloads`); no `allow-same-origin` or shared cookies. |
| `microfrontend` | Uses the same conservative iframe adapter until a reviewed runtime contract is implemented. | Not a module-federation loader; it must not execute remote JavaScript in the central origin. |
| `api` | Registry entry documents an API product and its permissions; there is no generic UI renderer. | Scopes are descriptive metadata until a separate credential/API authorization workflow is configured. |

The frontend route adapter resolves `/:section/:productId` using the backend registry. Fixed Savitri routes have precedence. Only published products, the saved route section, access settings, and active approved release resolve. For `directRoute=false`, product cards can link to the deployment URL when one exists; the central route itself returns not found.

## Lifecycle and releases

1. Admin registers a product as **Draft** and assigns developers by the email on their Savitri account. A deployment URL may be added later; external URLs and iframe origin allowlists are required before approval.
2. Developers sign in at `/developer`. The API queries assignments by the authenticated account email and never accepts a browser-supplied email as identity.
3. Developers can move a task from Assigned to In Development. A submission records version, repository, branch, optional PR/commit/documentation links and summary.
4. Admin requests changes, rejects, or approves. Approval stores a **release candidate** and version-history entry. The currently published release stays active.
5. Admin explicitly publishes the candidate; it then becomes the active release. Unpublish, suspend, archive and rollback are separate actions.

Statuses supported by the registry include Draft, Assigned, In Development, Submitted, Under Review, Changes Requested, Approved, Published, Suspended, Rejected, and Archived. Versions must use `MAJOR.MINOR.PATCH` semver. A route slug is unique and permanent after product creation.

The deployment has no connected CI provider. `lastBuildStatus` remains `not-run`; Admin explicitly labels this unverified. Do not claim automated integration tests, dependency scanning, source review, deployment checks, or merge automation. Product code is linked for human review; approval and publishing do not merge or deploy a GitHub repository.

## HTTP API

Public, optional-authenticated endpoints:

- `GET /api/modules/discover/:placement` — `homepage`, `tools`, `games`, `jobs`, or `networking`.
- `GET /api/modules/resolve/:section/:productId` — published release and route adapter data.
- `POST /api/modules/github/webhook` — GitHub `check_suite` events, authenticated with the signed raw-body HMAC and `GITHUB_WEBHOOK_SECRET`.

Authenticated developer endpoints:

- `GET /api/modules/developer/assignments`
- `PATCH /api/modules/developer/assignments/:id` — only Assigned/In Development progress changes.
- `POST /api/modules/developer/assignments/:id/submissions`

Admin-only endpoints (existing JWT and Admin role):

- `GET /api/modules/admin` (dashboard), `GET /api/modules/admin/products`, `GET /api/modules/admin/audit`.
- `POST /api/modules/admin/products`, `PATCH /api/modules/admin/products/:id`.
- `POST /api/modules/admin/products/:id/assignments`, `PATCH /api/modules/admin/assignments/:id`.
- `GET /api/modules/admin/submissions`, `PATCH /api/modules/admin/submissions/:id/review`.
- `POST /api/modules/admin/products/:id/publish|unpublish|suspend|restore|archive|rollback`.

Validation rejects non-HTTPS/credential-bearing/private-IP deployment URLs, malformed GitHub repository and PR URLs, unknown roles/scopes/internal keys, invalid versions, route collisions, and iframe origins that do not match the validated deployment origin. The backend does not fetch deployment or repository URLs.

## Packages and starter

- `packages/ui-kit`: small React buttons/cards/fields and design tokens; React is a peer dependency.
- `packages/api-sdk`: fetch wrapper with typed status/body errors and caller-supplied token getter.
- `packages/auth-sdk`: helper over Savitri's existing `sl_token`; it never creates tokens and the API client sends a bearer token only to the browser's own origin or an explicitly allowlisted Savitri API origin.
- `packages/shared-types`: TypeScript contracts for products, roles, scopes, routes and releases.

The installed frontend/admin apps are JavaScript/Vite and do not yet consume these packages as workspace dependencies. They establish the SDK contract for new module projects without changing existing app bundling. Use a reviewed package publish/link workflow before importing packages in deployed apps.

## GitHub and deployment setup still required

Repository, branch, PR, full commit SHA, and documentation links are stored after validation. A signed `check_suite` webhook can update a matching submission's build state (`pending`, `passed`, or `failed`). Matching requires the exact GitHub repository and full commit SHA; duplicate delivery IDs are recorded for 30 days. A candidate with pending or failed checks cannot be published. If there is no configured webhook/build workflow, the status remains `not-run` and the reviewer must verify it manually.

To enable the status webhook, configure a strong random `GITHUB_WEBHOOK_SECRET` on the Render backend, create a GitHub App or repository webhook using that secret, subscribe to the `check_suite` event, and point it at `https://<your-render-backend>/api/modules/github/webhook`. Deliveries without a valid `X-Hub-Signature-256` are rejected. The webhook only processes checks tied to a submitted full commit SHA in a registered repository; it does not fetch source or run code.

GitHub OAuth, GitHub App API calls, repository checkout, CI/build execution, vulnerability/dependency scanning, and automatic deployment are **not connected**. To add them, create an organization GitHub App with only the repository permissions needed for the intended flow, configure callback and webhook URLs, keep installation IDs and private keys in backend-only Render secrets, validate repository access server-side, and run any build in an isolated CI runner without production secrets. Required IDs/secrets depend on the chosen GitHub organization/App. Never put them in Vite `VITE_*` variables, registry records, or browser code. Do not enable auto-merge.

The frontend has SPA rewrites in `frontend/vercel.json`. The new Admin route is client-side under `/modules`. Ensure the production API deployment includes these backend model/route files and uses the existing `MONGO_URI` and `JWT_SECRET`; Mongoose creates the new collections/indexes when first used. No destructive migration or seed is required.

## First external developer onboarding

1. In Admin, open **Product & Module Management → Products**, register the product, its supported integration type, category/route, visibility, repository/deployment origin, and access requirements.
2. Open **Assign task** and enter the developer's name, the email on their Savitri account, task requirements, optional deadline, and module path.
3. Give them the repository link and `modules/_starter/README.md`. A developer needs a standard Savitri Livings account; do not grant Admin or expose service credentials.
4. They open `/developer`, mark the task in development, and submit a version and review references.
5. Review the code and documentation in GitHub, run required checks in a safe environment, record feedback, approve, then explicitly publish in Admin.

## Data and retention notes

MongoDB collections are `moduleproducts`, `developerassignments`, `modulesubmissions`, and `moduleauditevents`. The audit event logger is best-effort to avoid returning an error after the associated change has already saved; monitor backend logs for `Module audit write failed`. Product records are archived rather than hard-deleted, preserving route ownership and review/version references. Establish a retention policy before storing developer personal data at scale.

The first implementation accepts a documentation URL (for example a README or review document hosted in the repository); it does not upload binary artifacts. No migration is needed for pre-existing data because these collections are new. Existing routes and Mongo data are not modified by a module record unless its configured route is explicitly requested.
