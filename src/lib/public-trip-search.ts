import type { PublicTripListing } from "@/lib/cargoo-store";

export const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getMatchingRouteIndexes = (
  routeCities: string[],
  query: string,
  options: {
    allowFirst: boolean;
    allowLast: boolean;
  },
) => {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return routeCities
      .map((_, index) => index)
      .filter((index) => (options.allowFirst || index > 0) && (options.allowLast || index < routeCities.length - 1));
  }

  return routeCities.reduce<number[]>((matches, city, index) => {
    const isAllowed = (options.allowFirst || index > 0) && (options.allowLast || index < routeCities.length - 1);
    if (!isAllowed) {
      return matches;
    }

    if (normalizeSearchText(city).includes(normalizedQuery)) {
      matches.push(index);
    }

    return matches;
  }, []);
};

export const matchesPublicTripRoute = (trip: PublicTripListing, originQuery: string, destinationQuery: string) => {
  const routeCities = trip.routeCities.length > 0 ? trip.routeCities : [trip.origin, trip.destination];
  const originMatches = getMatchingRouteIndexes(routeCities, originQuery, { allowFirst: true, allowLast: false });
  const destinationMatches = getMatchingRouteIndexes(routeCities, destinationQuery, { allowFirst: false, allowLast: true });

  if (originQuery.trim() && destinationQuery.trim()) {
    return originMatches.some((originIndex) => destinationMatches.some((destinationIndex) => originIndex < destinationIndex));
  }

  if (originQuery.trim()) {
    return originMatches.length > 0;
  }

  if (destinationQuery.trim()) {
    return destinationMatches.length > 0;
  }

  return true;
};
