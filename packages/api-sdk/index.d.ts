export class SavitriApiError extends Error { status: number; body: unknown; }
export function createSavitriApi(options?: { baseUrl?: string; getToken?: () => string | Promise<string>; trustedTokenOrigins?: string[]; fetchImpl?: typeof fetch }): {
  request(path: string, options?: RequestInit): Promise<any>;
  get(path: string, options?: RequestInit): Promise<any>;
  post(path: string, body: unknown, options?: RequestInit): Promise<any>;
  patch(path: string, body: unknown, options?: RequestInit): Promise<any>;
  put(path: string, body: unknown, options?: RequestInit): Promise<any>;
};
