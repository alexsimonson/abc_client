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

  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL;
    console.log("[Config] Using VITE_API_URL:", url);
    return url;
  }

  const host = window.location.hostname;
  
  // If accessing via an IP address (not localhost), use same IP for API
  // Check if it's an IP address pattern (contains dots)
  if (host && host !== "localhost" && host !== "127.0.0.1" && host.includes(".")) {
    const protocol = window.location.protocol;
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
