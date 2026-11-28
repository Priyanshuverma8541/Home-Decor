import type { SavitriRole } from "@savitri/shared-types";
export function createSavitriAuth(options?: { apiBaseUrl?: string; trustedApiOrigins?: string[]; fetchImpl?: typeof fetch }): {
  getCurrentUser(): Promise<({ _id: string; email: string; fullName: string; role: SavitriRole } | null)>;
  isAuthenticated(): boolean;
  hasRole(user: { role: SavitriRole } | null, roles?: SavitriRole[]): boolean;
};
