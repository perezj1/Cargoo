import { Filter, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import PublicTripCard from "@/components/PublicTripCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { matchesPublicTripRoute } from "@/lib/public-trip-search";
import { getFriendlyErrorMessage, getPublicTripListings, type PublicTripListing } from "@/lib/cargoo-store";

const AppSearchPage = () => {
  const { loading: authLoading, profile, profileLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [origin, setOrigin] = useState(searchParams.get("origin") || "");
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [sortBy, setSortBy] = useState("date");
  const [trips, setTrips] = useState<PublicTripListing[]>([]);
  const [loading, setLoading] = useState(true);

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
    return trips
      .filter((trip) => matchesPublicTripRoute(trip, origin, destination))
      .sort((left, right) => {
        if (sortBy === "capacity") {
          return right.availableKg - left.availableKg;
        }

        if (sortBy === "trips") {
          return right.tripsCount - left.tripsCount;
        }

        return new Date(left.date).getTime() - new Date(right.date).getTime();
      });
  }, [destination, origin, sortBy, trips]);

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
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-6 text-2xl font-display font-bold">Buscar transportistas</h1>

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <Input
            placeholder="Origen"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            value={origin}
            onChange={(event) => setOrigin(event.target.value)}
          />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3">
          <MapPin className="h-4 w-4 shrink-0 text-accent" />
          <Input
            placeholder="Destino"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full bg-card">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Fecha mas proxima</SelectItem>
            <SelectItem value="capacity">Mas espacio</SelectItem>
            <SelectItem value="trips">Mas viajes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        {loading ? "Buscando transportistas..." : `${filtered.length} transportistas encontrados`}
      </p>
      <p className="-mt-3 mb-6 text-xs text-muted-foreground">
        El buscador tambien tiene en cuenta ciudades intermedias del itinerario donde el transportista ha indicado que
        puede parar.
      </p>

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
          <h3 className="mb-2 text-xl font-display font-semibold">No se encontraron transportistas</h3>
          <p className="text-muted-foreground">Intenta con otra ruta o fecha</p>
        </div>
      )}
    </div>
  );
};

export default AppSearchPage;
