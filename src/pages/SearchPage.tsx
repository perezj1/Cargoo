import { Filter, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import TravelerCard from "@/components/TravelerCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_TRAVELERS } from "@/lib/mock-travelers";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [origin, setOrigin] = useState(searchParams.get("origin") || "");
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [sortBy, setSortBy] = useState("date");

  const filtered = MOCK_TRAVELERS.filter((traveler) => {
    const matchOrigin = !origin || traveler.origin.toLowerCase().includes(origin.toLowerCase());
    const matchDestination = !destination || traveler.destination.toLowerCase().includes(destination.toLowerCase());
    return matchOrigin && matchDestination;
  }).sort((left, right) => {
    if (sortBy === "rating") {
      return right.rating - left.rating;
    }

    if (sortBy === "trips") {
      return right.trips - left.trips;
    }

    return new Date(left.date).getTime() - new Date(right.date).getTime();
  });

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
                  <SelectItem value="rating">Mejor valoracion</SelectItem>
                  <SelectItem value="trips">Mas viajes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <p className="mb-6 text-sm text-muted-foreground">{filtered.length} conductores encontrados</p>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((traveler) => (
                <TravelerCard key={traveler.id} traveler={traveler} />
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
