export type ModuleStatus = "draft" | "assigned" | "in-development" | "submitted" | "under-review" | "changes-requested" | "approved" | "published" | "suspended" | "rejected" | "archived";
export type IntegrationType = "internal" | "deployed" | "microfrontend" | "iframe" | "api";
export type ProductPlacement = "homepage" | "tools" | "games" | "jobs" | "networking";
export type SavitriRole = "customer" | "admin" | "delivery" | "vendor";
export type PermissionScope = "profile:read" | "catalog:read" | "orders:read" | "leads:write" | "media:read" | "notifications:send";

export interface ModuleVisibility extends Record<ProductPlacement | "directRoute" | "featured", boolean> {}
export interface ModuleRelease {
  version: string;
  integrationType: IntegrationType;
  internalKey?: "portfolio-builder" | "games" | "media-downloader" | "developer-zone" | "";
  deploymentUrl?: string;
  allowedOrigins?: string[];
  repositoryUrl?: string;
  branch?: string;
  commitSha?: string;
  changelog?: string;
  buildStatus?: "not-run" | "pending" | "passed" | "failed";
  status: "submitted" | "under-review" | "changes-requested" | "approved" | "published" | "rejected" | "archived";
}
export interface ModuleProduct {
  productId: string;
  name: string;
  description: string;
  category: string;
  version: string;
  integrationType: IntegrationType;
  routeSection: "apps" | "tools" | "games" | "jobs" | "networking";
  frontendRoute: string;
  authenticationRequired: boolean;
  allowedRoles: SavitriRole[];
  permissions: PermissionScope[];
  visibility: ModuleVisibility;
  isPublished: boolean;
  status: ModuleStatus;
  approvedRelease?: ModuleRelease | null;
  releaseCandidate?: ModuleRelease | null;
}
