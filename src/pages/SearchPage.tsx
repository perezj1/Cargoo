import { Filter, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PublicTripCard from "@/components/PublicTripCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { matchesPublicTripRoute } from "@/lib/public-trip-search";
import { getFriendlyErrorMessage, getPublicTripListings, type PublicTripListing } from "@/lib/cargoo-store";

const SearchPage = () => {
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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="bg-secondary py-8">
          <div className="container">
            <h1 className="mb-6 text-2xl font-display font-bold md:text-3xl">Buscar conductores</h1>
            <div className="flex flex-col gap-3 md:flex-row">
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
                <SelectTrigger className="w-full bg-card md:w-48">
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
          </div>
        </div>

        <div className="container py-8">
          <div className="mb-6 rounded-2xl border border-primary/15 bg-primary/5 p-5 shadow-card">
            <p className="text-sm text-muted-foreground">
              Si quieres descubrir mas transportistas, horarios disponibles y gestionar tus contactos y envios desde un
              mismo sitio, accede a la app.
            </p>
            <Button asChild className="mt-4">
              <Link to="/app">Acceder a la app</Link>
            </Button>
          </div>

          <p className="mb-6 text-sm text-muted-foreground">
            {loading ? "Buscando conductores..." : `${filtered.length} conductores encontrados`}
          </p>
          <p className="-mt-3 mb-6 text-xs text-muted-foreground">
            El buscador tambien tiene en cuenta ciudades intermedias donde el transportista ha indicado que puede parar.
          </p>
          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((trip) => (
                <PublicTripCard key={trip.id} trip={trip} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-display font-semibold">No se encontraron conductores</h3>
              <p className="text-muted-foreground">Intenta con otra ruta o fecha</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
