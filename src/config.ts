/**
 * Configuration for local network development
 * 
 * Client: port 3001
 * API Server: port 4001
 * 
 * To test on a mobile device or another computer:
 * 1. Note your desktop machine's IP address from server startup output
 * 2. Access the app at http://<your-ip>:3001 on mobile/other device
 * 3. The frontend will automatically use the correct API URL (port 4001)
 */

// Option 1: Auto-detect based on current host
// This works when accessing via network IP (e.g., 192.168.1.100:3001)
export function getApiUrl(): string {
  console.log("[Config] Detecting API URL...");
  
  if (typeof window === "undefined") {
    console.log("[Config] No window object, using default");
    return "http://localhost:4001";
  }

  console.log("[Config] window.location.hostname =", window.location.hostname);
  console.log("[Config] window.location.href =", window.location.href);

  const pageHost = window.location.hostname;
  const pageProtocol = window.location.protocol;

  function isLocalHost(hostname: string) {
    return hostname === "localhost" || hostname === "127.0.0.1";
  }

  function isIpAddress(hostname: string) {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
  }

  if (import.meta.env.VITE_API_URL) {
    const envUrl = import.meta.env.VITE_API_URL;
    const forceEnvUrl = import.meta.env.VITE_FORCE_API_URL === "true";

    try {
      const parsed = new URL(envUrl);
      const apiHost = parsed.hostname;
      const mixedLocalHosts =
        (isLocalHost(pageHost) && isIpAddress(apiHost)) ||
        (isIpAddress(pageHost) && isLocalHost(apiHost));

      if (mixedLocalHosts && !forceEnvUrl) {
        const fallback = `${pageProtocol}//${pageHost}:4001`;
        console.warn("[Config] VITE_API_URL host differs from app host and can break auth cookies. Falling back to same-host API URL:", fallback);
        console.warn("[Config] Set VITE_FORCE_API_URL=true to force VITE_API_URL.");
        return fallback;
      }
    } catch {
      console.warn("[Config] Invalid VITE_API_URL. Falling back to auto-detection.");
    }

    console.log("[Config] Using VITE_API_URL:", envUrl);
    return envUrl;
  }

  const host = pageHost;
  
  // If accessing via an IP address (not localhost), use same IP for API
  // Check if it's an IP address pattern (contains dots)
  if (host && host !== "localhost" && host !== "127.0.0.1" && host.includes(".")) {
    const protocol = pageProtocol;
    const port = 4001; // API server port
    const url = `${protocol}//${host}:${port}`;
    console.log("[Config] Detected IP address. Using API URL:", url);
    return url;
  }

  // Default to localhost
  console.log("[Config] Using default localhost API URL");
  return "http://localhost:4001";
}

export const API_BASE_URL = getApiUrl();
console.log("[Config] Final API_BASE_URL:", API_BASE_URL);
