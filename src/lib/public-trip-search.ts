import type { PublicTripListing } from "@/lib/cargoo-store";
import {
  getCityCountryCode,
  getCitySearchTerms,
  resolveCityIdFromInput,
  resolveCountryCodeFromInput,
  type CityId,
  type CountryCode,
} from "@/lib/location-catalog";
import { normalizeSearchText } from "@/lib/search-normalization";

type PublicTripRouteSegment = {
  cityId: CityId | null;
  countryCode: CountryCode | null;
  normalizedLabel: string;
};

export type PublicTripRouteQuery = {
  cityId: CityId | null;
  countryCode: CountryCode | null;
  normalizedText: string;
};

export const buildPublicTripRouteQuery = (value: string, selectedCityId?: CityId | null): PublicTripRouteQuery => {
  const normalizedText = normalizeSearchText(value);
  const resolvedCityId = selectedCityId ?? resolveCityIdFromInput(value);
  const countryCodeFromCity = getCityCountryCode(resolvedCityId);
  const cityId = countryCodeFromCity ? resolvedCityId : null;
  const countryCode = countryCodeFromCity ?? resolveCountryCodeFromInput(value);

  return {
    cityId: cityId ?? null,
    countryCode,
    normalizedText,
  };
};

const buildSearchableRouteSegments = (trip: PublicTripListing) => {
  const fallbackRoute = [trip.origin, ...trip.stopCities, trip.destination];
  const sourceRoute = trip.routeCities.length > 0 ? trip.routeCities : fallbackRoute;

  return sourceRoute.reduce<PublicTripRouteSegment[]>((segments, city, index) => {
    const nextLabel = city.trim();
    if (!nextLabel) {
      return segments;
    }

    const isFirst = index === 0;
    const isLast = index === sourceRoute.length - 1;
    const cityId = isFirst
      ? trip.originCityId
      : isLast
        ? trip.destinationCityId
        : resolveCityIdFromInput(nextLabel);
    const countryCode = isFirst
      ? trip.originCountryCode
      : isLast
        ? trip.destinationCountryCode
        : getCityCountryCode(cityId);
    const normalizedLabel = normalizeSearchText(nextLabel);
    const previousSegment = segments[segments.length - 1];

    if (previousSegment && previousSegment.normalizedLabel === normalizedLabel) {
      return segments;
    }

    segments.push({
      cityId: cityId ?? null,
      countryCode: countryCode ?? null,
      normalizedLabel,
    });
    return segments;
  }, []);
};

const matchesRouteSegment = (segment: PublicTripRouteSegment, query: PublicTripRouteQuery) => {
  if (query.cityId) {
    if (segment.cityId === query.cityId) {
      return true;
    }

    const citySearchTerms = getCitySearchTerms(query.cityId);
    return citySearchTerms.some((term) => segment.normalizedLabel.includes(term));
  }

  if (query.countryCode) {
    return segment.countryCode === query.countryCode;
  }

  if (!query.normalizedText) {
    return true;
  }

  return segment.normalizedLabel.includes(query.normalizedText);
};

const getMatchingRouteIndexes = (
  routeSegments: PublicTripRouteSegment[],
  query: PublicTripRouteQuery,
  options: {
    allowFirst: boolean;
    allowLast: boolean;
  },
) => {
  if (!query.cityId && !query.countryCode && !query.normalizedText) {
    return routeSegments
      .map((_, index) => index)
      .filter((index) => (options.allowFirst || index > 0) && (options.allowLast || index < routeSegments.length - 1));
  }

  return routeSegments.reduce<number[]>((matches, segment, index) => {
    const isAllowed = (options.allowFirst || index > 0) && (options.allowLast || index < routeSegments.length - 1);
    if (!isAllowed) {
      return matches;
    }

    if (matchesRouteSegment(segment, query)) {
      matches.push(index);
    }

    return matches;
  }, []);
};

const matchesFlexibleTripRoute = (trip: PublicTripListing, originQuery: PublicTripRouteQuery, destinationQuery: PublicTripRouteQuery) => {
  const originHasQuery = Boolean(originQuery.cityId || originQuery.countryCode || originQuery.normalizedText);
  const destinationHasQuery = Boolean(destinationQuery.cityId || destinationQuery.countryCode || destinationQuery.normalizedText);
  const originMatches = !originHasQuery
    ? true
    : originQuery.countryCode
      ? trip.originCountryCode === originQuery.countryCode
      : normalizeSearchText(trip.origin).includes(originQuery.normalizedText);
  const destinationMatches = !destinationHasQuery
    ? true
    : destinationQuery.countryCode
      ? trip.destinationCountryCode === destinationQuery.countryCode
      : normalizeSearchText(trip.destination).includes(destinationQuery.normalizedText);

  return originMatches && destinationMatches;
};

export const matchesPublicTripRoute = (
  trip: PublicTripListing,
  originQuery: PublicTripRouteQuery,
  destinationQuery: PublicTripRouteQuery,
) => {
  if (trip.coverageMode === "country_flexible") {
    return matchesFlexibleTripRoute(trip, originQuery, destinationQuery);
  }

  const routeSegments = buildSearchableRouteSegments(trip);
  const originMatches = getMatchingRouteIndexes(routeSegments, originQuery, { allowFirst: true, allowLast: false });
  const destinationMatches = getMatchingRouteIndexes(routeSegments, destinationQuery, { allowFirst: false, allowLast: true });
  const hasOriginQuery = Boolean(originQuery.cityId || originQuery.countryCode || originQuery.normalizedText);
  const hasDestinationQuery = Boolean(destinationQuery.cityId || destinationQuery.countryCode || destinationQuery.normalizedText);

  if (hasOriginQuery && hasDestinationQuery) {
    return originMatches.some((originIndex) => destinationMatches.some((destinationIndex) => originIndex < destinationIndex));
  }

  if (hasOriginQuery) {
    return originMatches.length > 0;
  }

  if (hasDestinationQuery) {
    return destinationMatches.length > 0;
  }

  return true;
};
