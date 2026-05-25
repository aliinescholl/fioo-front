const API_BASE_URL = process.env.API_BASE_URL;

/**
 * Simple server‑side wrapper that forwards a request to the .NET backend.
 * It automatically prepends the backend base URL and returns the native fetch
 * response so the caller can forward status, headers and body.
 */
export async function apiFetch(
  endpoint: string,
  init?: RequestInit
) {
  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, init);
}
