export type AppRole = "emitter" | "traveler";

const ROLE_STORAGE_KEY = "cargoo_app_role";

export function getStoredAppRole(): AppRole {
  if (typeof window === "undefined") return "emitter";

  const value = window.localStorage.getItem(ROLE_STORAGE_KEY);
  return value === "traveler" ? "traveler" : "emitter";
}

export function setStoredAppRole(role: AppRole) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLE_STORAGE_KEY, role);
}

export function clearStoredAppRole() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ROLE_STORAGE_KEY);
}

export function getAppHomePath(role: AppRole) {
  return role === "traveler" ? "/carrier" : "/marketplace";
}
