import { API_BASE_URL } from "../config";

export function resolveImageUrl(url: string): string {
  // If url is already absolute, return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // If url is relative, resolve it against the API base URL
  if (url.startsWith("/")) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> ?? {}) };
  
  // Only set Content-Type for JSON if body is not FormData
  const isFormData = init?.body instanceof FormData;
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const url = `${API_BASE_URL}${path}`;
  console.log(`[API] ${init?.method || "GET"} ${url}`);

  try {
    const res = await fetch(url, {
      headers,
      ...init,
    });

    const text = await res.text();
    const body = text ? safeJson(text) : null;

    if (!res.ok) {
      const errorMsg = body?.error ?? `Request failed: ${res.status}`;
      console.error(`[API] Error ${res.status}: ${errorMsg} from ${url}`);
      throw new ApiError(errorMsg, res.status, body);
    }
    console.log(`[API] Success: ${res.status} from ${url}`);
    return body as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.error(`[API] Network error for ${url}:`, error?.message || error);
    throw new ApiError(`Failed to fetch: ${error?.message || "Unknown error"}`, 0, null);
  }
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
