export type MarketplaceDateFilter = "all" | "this-week" | "weekend" | "next-week";
export type MarketplaceTimeFilter = "all" | "morning" | "afternoon" | "night";
export type MarketplaceSpaceFilter = "all" | "small" | "medium" | "large";

export type MarketplaceFilters = {
  origin: string;
  destination: string;
  date: MarketplaceDateFilter;
  time: MarketplaceTimeFilter;
  space: MarketplaceSpaceFilter;
};

const PENDING_FILTERS_STORAGE_KEY = "cargoo_pending_marketplace_filters";

const validDateFilters = new Set<MarketplaceDateFilter>(["all", "this-week", "weekend", "next-week"]);
const validTimeFilters = new Set<MarketplaceTimeFilter>(["all", "morning", "afternoon", "night"]);
const validSpaceFilters = new Set<MarketplaceSpaceFilter>(["all", "small", "medium", "large"]);

export const defaultMarketplaceFilters: MarketplaceFilters = {
  origin: "all",
  destination: "all",
  date: "all",
  time: "all",
  space: "all",
};

export const marketplaceDateLabels: Record<MarketplaceDateFilter, string> = {
  all: "Cualquier fecha",
  "this-week": "Esta semana",
  weekend: "Fin de semana",
  "next-week": "Semana que viene",
};

export const marketplaceTimeLabels: Record<MarketplaceTimeFilter, string> = {
  all: "Cualquier hora",
  morning: "Manana",
  afternoon: "Tarde",
  night: "Noche",
};

export const marketplaceSpaceLabels: Record<MarketplaceSpaceFilter, string> = {
  all: "Cualquier espacio",
  small: "Espacio pequeno",
  medium: "Espacio medio",
  large: "Espacio grande",
};

function sanitizeDateFilter(value: string | null): MarketplaceDateFilter {
  return value && validDateFilters.has(value as MarketplaceDateFilter) ? (value as MarketplaceDateFilter) : "all";
}

function sanitizeTimeFilter(value: string | null): MarketplaceTimeFilter {
  return value && validTimeFilters.has(value as MarketplaceTimeFilter) ? (value as MarketplaceTimeFilter) : "all";
}

function sanitizeSpaceFilter(value: string | null): MarketplaceSpaceFilter {
  return value && validSpaceFilters.has(value as MarketplaceSpaceFilter) ? (value as MarketplaceSpaceFilter) : "all";
}

export function normalizeMarketplaceFilters(filters: Partial<MarketplaceFilters> | null | undefined): MarketplaceFilters {
  return {
    origin: filters?.origin?.trim() || "all",
    destination: filters?.destination?.trim() || "all",
    date: sanitizeDateFilter(filters?.date ?? null),
    time: sanitizeTimeFilter(filters?.time ?? null),
    space: sanitizeSpaceFilter(filters?.space ?? null),
  };
}

export function createMarketplaceSearchParams(filters: MarketplaceFilters) {
  const normalized = normalizeMarketplaceFilters(filters);
  const params = new URLSearchParams();

  if (normalized.origin !== "all") params.set("origin", normalized.origin);
  if (normalized.destination !== "all") params.set("destination", normalized.destination);
  if (normalized.date !== "all") params.set("date", normalized.date);
  if (normalized.time !== "all") params.set("time", normalized.time);
  if (normalized.space !== "all") params.set("space", normalized.space);

  return params;
}

export function readMarketplaceFiltersFromSearchParams(params: URLSearchParams): MarketplaceFilters {
  return normalizeMarketplaceFilters({
    origin: params.get("origin"),
    destination: params.get("destination"),
    date: params.get("date") as MarketplaceDateFilter | null,
    time: params.get("time") as MarketplaceTimeFilter | null,
    space: params.get("space") as MarketplaceSpaceFilter | null,
  });
}

export function getMarketplaceUrl(filters: MarketplaceFilters) {
  const params = createMarketplaceSearchParams(filters).toString();
  return params ? `/marketplace?${params}` : "/marketplace";
}

export function storePendingMarketplaceFilters(filters: MarketplaceFilters) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_FILTERS_STORAGE_KEY, JSON.stringify(normalizeMarketplaceFilters(filters)));
}

export function readPendingMarketplaceFilters() {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(PENDING_FILTERS_STORAGE_KEY);
  if (!raw) return null;

  try {
    return normalizeMarketplaceFilters(JSON.parse(raw) as Partial<MarketplaceFilters>);
  } catch {
    return null;
  }
}

export function clearPendingMarketplaceFilters() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_FILTERS_STORAGE_KEY);
}

export function takePendingMarketplaceFilters() {
  const filters = readPendingMarketplaceFilters();
  clearPendingMarketplaceFilters();
  return filters;
}
