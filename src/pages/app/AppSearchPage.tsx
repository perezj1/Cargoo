import { MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import CityAutocompleteInput from "@/components/CityAutocompleteInput";
import PublicTripCard from "@/components/PublicTripCard";
import TripSortDropdown from "@/components/TripSortDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getCityOptionLabel, resolveCityIdFromInput, type CityId } from "@/lib/location-catalog";
import { buildPublicTripRouteQuery, matchesPublicTripRoute } from "@/lib/public-trip-search";
import { getFriendlyErrorMessage, getPublicTripListings, type PublicTripListing } from "@/lib/cargoo-store";

const AppSearchPage = () => {
  const { loading: authLoading, profile, profileLoading } = useAuth();
  const { locale, messages } = useLocale();
  const [searchParams] = useSearchParams();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originCityId, setOriginCityId] = useState<CityId | null>(null);
  const [destinationCityId, setDestinationCityId] = useState<CityId | null>(null);
  const [sortBy, setSortBy] = useState("date");
  const [trips, setTrips] = useState<PublicTripListing[]>([]);
  const [loading, setLoading] = useState(true);
  const sortOptions = useMemo(
    () => [
      { value: "date", label: messages.searchPage.sortDate },
      { value: "rating", label: messages.searchPage.sortRating },
      { value: "capacity", label: messages.searchPage.sortCapacity },
    ],
    [messages.searchPage.sortCapacity, messages.searchPage.sortDate, messages.searchPage.sortRating],
  );

  useEffect(() => {
    const originParam = searchParams.get("origin") || "";
    const destinationParam = searchParams.get("destination") || "";
    const nextOriginCityId = (searchParams.get("originCity") as CityId | null) ?? resolveCityIdFromInput(originParam);
    const nextDestinationCityId = (searchParams.get("destinationCity") as CityId | null) ?? resolveCityIdFromInput(destinationParam);

    setOriginCityId(nextOriginCityId);
    setDestinationCityId(nextDestinationCityId);
    setOrigin(nextOriginCityId ? getCityOptionLabel(nextOriginCityId, locale) : originParam);
    setDestination(nextDestinationCityId ? getCityOptionLabel(nextDestinationCityId, locale) : destinationParam);
  }, [locale, searchParams]);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        setTrips(await getPublicTripListings());
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadTrips();
  }, []);

  const filtered = useMemo(() => {
    const originQuery = buildPublicTripRouteQuery(origin, originCityId);
    const destinationQuery = buildPublicTripRouteQuery(destination, destinationCityId);

    return trips
      .filter((trip) => matchesPublicTripRoute(trip, originQuery, destinationQuery))
      .sort((left, right) => {
        if (sortBy === "rating") {
          const ratingDelta = (right.averageRating ?? -1) - (left.averageRating ?? -1);
          if (ratingDelta !== 0) {
            return ratingDelta;
          }

          const reviewsDelta = right.reviewsCount - left.reviewsCount;
          if (reviewsDelta !== 0) {
            return reviewsDelta;
          }
        }

        if (sortBy === "capacity") {
          return right.capacityKg - left.capacityKg;
        }

        return new Date(left.date).getTime() - new Date(right.date).getTime();
      });
  }, [destination, destinationCityId, origin, originCityId, sortBy, trips]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (profile?.isTraveler) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="mx-auto min-h-[calc(100dvh-5rem)] w-full max-w-lg overflow-x-hidden px-4 pb-24 pt-6">
      <h1 className="mb-6 text-2xl font-display font-bold">{messages.searchPage.title}</h1>

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <CityAutocompleteInput
            listId="app-search-origin-cities"
            value={origin}
            selectedCityId={originCityId}
            onValueChange={setOrigin}
            onSelectedCityIdChange={setOriginCityId}
            placeholder={messages.searchPage.originPlaceholder}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3">
          <MapPin className="h-4 w-4 shrink-0 text-accent" />
          <CityAutocompleteInput
            listId="app-search-destination-cities"
            value={destination}
            selectedCityId={destinationCityId}
            onValueChange={setDestination}
            onSelectedCityIdChange={setDestinationCityId}
            placeholder={messages.searchPage.destinationPlaceholder}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>
        <TripSortDropdown value={sortBy} onValueChange={setSortBy} options={sortOptions} placeholder={messages.searchPage.sortPlaceholder} />
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        {loading ? messages.searchPage.loading : messages.searchPage.resultsFound(filtered.length)}
      </p>
      <p className="-mt-3 mb-6 text-xs text-muted-foreground">{messages.searchPage.routeHint}</p>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 pb-4">
          {filtered.map((trip) => (
            <PublicTripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-display font-semibold">{messages.searchPage.emptyTitle}</h3>
          <p className="text-muted-foreground">{messages.searchPage.emptyDescription}</p>
        </div>
      )}
    </div>
  );
};

export default AppSearchPage;
