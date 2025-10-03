// Centralize here your public domain to ensure shared links always use it
// If left empty, the app will fallback to window.location.origin
export const PUBLIC_BASE_URL = "https://meetlines.com.br";

export function getPublicBaseUrl() {
  if (typeof PUBLIC_BASE_URL === "string" && PUBLIC_BASE_URL.trim().length > 0) {
    return PUBLIC_BASE_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}
