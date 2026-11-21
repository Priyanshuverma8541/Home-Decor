# Savitri Explorer: architecture and delivery plan

**Status:** Architecture baseline, Phase 1, and initial HR CRM implementation  
**Last updated:** 2026-11-21

## Product shape

Savitri Explorer is the connected discovery and opportunity layer inside Savitri Livings. It brings together four journeys: Growth Livings (professional profiles and career growth), Savinexa Talent (recruiting), SL Business (business discovery and partnerships), and Opportunities (jobs, projects, internships, referrals and collaboration).

The first release is an integrated navigation and operations layer over existing products. It does not create a second user directory, job board, company registry, or admin CRUD system. Existing products remain the source of truth until a later phase proves a canonical model is needed.

## Existing system audit

| Area | Existing implementation | Decision |
|---|---|---|
| Customer product | `frontend/`, React/Vite; `/explorer`, `/growth-livings`, `/partner-with-us`, `/savinexa/*` | Evolve `/explorer` into the four-pillar entry point; keep existing product routes. |
| Admin | `admin/`, React/Vite, protected shared admin | Add Explorer operations landing and link to existing module screens. |
| API and identity | `backend/`, Express/Mongoose; existing Savitri account and admin JWT | Keep the existing backend and authentication. No new identity provider. |
| Growth / talent | `backend/modules/growthLivings`; `trust-them/` separate frontend reusing account, API and admin | Retain GrowthProfile, GrowthCandidate, TrustCompany, TrustJob and TrustApplication as initial sources of truth. |
| Savinexa Talent | Existing Savinexa jobs and enquiries, surfaced through admin | Reuse existing job and enquiry management; do not silently merge internal roles with TrustJob. |
| SL Business | PartnerBusiness model, public directory, application form and admin relationship stages | Reuse for business partnerships. It is not an HR-person CRM. |
| Client stores | Tenant/ClientAdmin scoped sessions and tenant/module permissions | Keep tenant business/customer records isolated from Explorer unless an explicit scoped integration is designed. |
| AI / files | Shared Gemini client, Cloudinary; portfolio AI and existing privacy controls | Reuse services. Private resumes and HR notes require explicit authorization and data minimization before AI use. |
| Integrations | Platform app registry and scoped event API documented in `docs/platform/README.md` | Use existing app/event foundation where useful; Salesforce connectors and automation are future work, not assumed present. |

## Architecture decisions

1. **Modular monolith first.** Keep the current React apps and Express/MongoDB backend. A separate Explorer service would add deployment, identity and support cost without current scale evidence.
2. **Adapters before migrations.** Build read-only aggregation/adapters over existing modules for central summaries. Preserve original records and approvals; migrate only when an explicit canonical data contract and rollback plan exist.
3. **Central admin as an operations shell.** Explorer admin routes users into current Growth, Savinexa, Business Opportunities, Privacy and Analytics screens. New workflows can be added there without cloning CRUD.
4. **Explicit access boundaries.** Public visibility remains opt-in/published. Candidate application sharing remains consent-based. HR contact CRM is admin-only by default. Tenant/client-store sessions do not grant Explorer access.
5. **AI proposes; people decide.** Matching and writing assistance must show evidence, let a human review, and never automatically reject, rank for rejection, or make hiring decisions.
6. **Audit and provenance.** New HR/contact actions record actor, time, source, purpose, consent/lawful basis where relevant, and change history. Sensitive notes/files have restricted access and retention/deletion controls.
7. **No new infrastructure in Phase 1.** Continue using existing deployment, MongoDB, shared API, Gemini and Cloudinary where appropriate.

## Target domain and API boundaries

Phase 1 keeps current schemas. Later, if cross-module workflows require it, introduce stable Explorer references with `sourceSystem` + `sourceId`, never destructive replacement:

- `ExplorerOrganization`: normalized identity and verified public profile, with references to TrustCompany, Savinexa organization, PartnerBusiness, or an explicitly authorized tenant record.
- `ExplorerPerson`: identity reference to an existing User or a restricted HR CRM contact; no duplicate public/private profile payload by default.
- `ExplorerOpportunity`: normalized discovery projection for jobs, internships, projects and collaborations, retaining its source record and source-specific application flow.
- `HRContact` and `HRActivity`: restricted CRM records for manually discovered HR professionals, company/role/technologies/hiring notes, connection state, follow-up date, and append-only conversation/activity history.
- `ExplorerApplication` is not an initial replacement for TrustApplication or SavinexaEnquiry. Define it only after common consent, ownership and status rules are agreed.

Potential future API namespaces: `/api/explorer/v1/discovery` (public, published only), `/api/explorer/v1/me` (authenticated self-service), `/api/explorer/v1/admin/*` (existing admin authorization plus scoped capabilities). HR endpoints must require explicit admin/recruiter permission and audit reads/changes. Do not expose private resume/contact fields through public aggregation endpoints.

## HR Networking CRM requirements

The CRM is a high-priority phase, but requires a distinct restricted schema rather than overloading PartnerBusiness or generic sales Lead. Capture only details the team is entitled to retain: name, professional role/company, public work contact/social links, source and discovery date, technologies/hiring areas, relationship status, next follow-up, and dated interaction records. Make consent/contact basis, suppression/opt-out, retention and deletion visible. Do not scrape private contact data or put HR notes into general LivingsAI context.

## Phased roadmap

### Phase 0 — Audit and architecture (completed for this baseline)

Map apps, routes, source-of-truth schemas, auth, admin, AI, storage, integrations, deployment boundaries and risks. Record decisions here.

### Phase 1 — Explorer shell and admin entry (this implementation)

Upgrade `/explorer` to clearly present four pillars, their real destinations and availability. Add a central admin Explorer overview that links to existing modules. Do not claim not-yet-built capabilities or duplicate their data management.

### Phase 2 — HR Networking CRM (initial release implemented)

Added `ExplorerHRContact` and append-only `ExplorerHRActivity` collections, under `/api/explorer/admin/hr`. All routes use Savitri `protect` + `adminOnly`; contact source and contact basis/details are required; private notes are excluded by default from Mongoose projections; list/filter, stage, activity and follow-up workflows are available in the admin UI. CRM records are separate from customer User profiles, tenant data, candidate records and partner businesses.

This first release deliberately does not provide bulk import, automated outreach, AI access, candidate matching, recruiter role grants, or deletion/retention automation. Before storing real contact data, define retention/deletion controls and the review process for do-not-contact requests. Add organization-level audit/retention policy before opening this workspace to non-admin recruiters.

### Phase 3 — Organization and opportunity discovery

Define source adapters and deduplication/verification for existing published records. Preserve per-product moderation and apply/source navigation. Add admin review queue using existing approval state.

### Phase 4 — Shared networking workflows

Add professional connection requests and messaging only with clear consent, blocking/reporting, notification preferences, abuse controls and moderation. Do not expose contact data merely because a profile is discoverable.

### Phase 5 — AI assistance

Add opt-in profile/resume analysis, skills and opportunity explanations, recruiter search assistance, and reviewed outreach drafts. Document Gemini data handling, avoid sending restricted fields by default, record human review, and evaluate bias/accessibility before broad release.

### Phase 6 — Operations, integrations and scale

Add analytics, role-specific permissions, monitoring, retention workflows, rate limits and connector integrations (including Salesforce only if configured and authorized). Use the existing platform event/credential foundation; add shared-store rate limiting before public high-volume API usage.

## Delivery and verification

- Keep changes in small phases and preserve unrelated working tree state (including the existing `thikana` submodule state).
- For each phase: build affected frontend/backend, run relevant automated tests, inspect responsive states, verify auth/consent and update this document.
- Deployment remains on the existing frontend/admin hosting and backend hosting. Phase 1 requires no database migration or new environment variables.
- Before production release, confirm deployment root/build commands for each app and verify route rewrites; deployment itself is separate from code readiness.

## Phase 1 acceptance

- `/explorer` identifies Growth Livings, Savinexa Talent, SL Business and Opportunities and sends each to a valid current destination.
- In-development or external experiences are labeled honestly; no invented counts, users, opportunities or AI features.
- Explorer admin is protected by the existing admin layout and offers links into current tools, including growth/talent, business opportunities, Savinexa, privacy and analytics.
- Customer and admin apps build successfully; existing APIs and data are unchanged.
