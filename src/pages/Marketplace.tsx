import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";

import { PlatformLayout } from "@/components/cargoo/PlatformLayout";
import { TravelerCard } from "@/components/cargoo/TravelerCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trips } from "@/lib/cargoo-data";
import {
  createMarketplaceSearchParams,
  getTripDetailsUrl,
  marketplaceDateLabels,
  marketplaceSpaceLabels,
  marketplaceTimeLabels,
  readMarketplaceFiltersFromSearchParams,
} from "@/lib/marketplace-filters";

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { origin, destination, date, time, space } = readMarketplaceFiltersFromSearchParams(searchParams);
  const selectedTripId = searchParams.get("selected") ?? "";

  const originOptions = ["all", ...new Set(trips.map((trip) => trip.originCity))];
  const destinationOptions = ["all", ...new Set(trips.map((trip) => trip.destinationCity))];

  const updateFilters = (nextValues: Partial<ReturnType<typeof readMarketplaceFiltersFromSearchParams>>) => {
    const nextFilters = {
      origin,
      destination,
      date,
      time,
      space,
      ...nextValues,
    };

    setSearchParams(createMarketplaceSearchParams(nextFilters), { replace: true });
  };

  const selectTrip = (tripId: string) => {
    setSearchParams(createMarketplaceSearchParams({ origin, destination, date, time, space }, tripId), { replace: true });
  };

  const openTripDetails = (tripId: string) => {
    selectTrip(tripId);
    navigate(getTripDetailsUrl(tripId, { origin, destination, date, time, space }));
  };

  const filteredTrips = trips.filter((trip) => {
    const matchesOrigin = origin === "all" || trip.originCity === origin;
    const matchesDestination = destination === "all" || trip.destinationCity === destination;
    const matchesDate = date === "all" || trip.dateBucket === date;
    const matchesTime = time === "all" || trip.timeBucket === time;
    const matchesSpace = space === "all" || trip.spaceCategory === space;

    return matchesOrigin && matchesDestination && matchesDate && matchesTime && matchesSpace;
  });

  return (
    <PlatformLayout
      title="Buscar transportistas"
      subtitle="Filtra, compara y elige un perfil para abrir el contacto. Todo en una vista clara y directa."
    >
      <section className="space-y-6">
        <div className="soft-panel p-5 md:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge className="rounded-full bg-primary/10 px-4 py-1.5 text-primary shadow-none">
                Filtro rapido
              </Badge>
              <h2 className="mt-4 font-heading text-3xl font-semibold text-foreground">Busca y elige quien ya va de camino</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Solo necesitas salida, destino, fecha, hora y espacio. Cuando veas un perfil claro, lo seleccionas y
                pasas al contacto.
              </p>
            </div>

            <Badge className="rounded-full bg-white px-4 py-2 text-foreground shadow-card">
              {filteredTrips.length} transportistas
            </Badge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_0.9fr_0.9fr_0.9fr]">
            <label className="rounded-xl border border-border bg-secondary p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Salida</p>
              <select
                value={origin}
                onChange={(event) => updateFilters({ origin: event.target.value })}
                className="mt-3 w-full bg-transparent text-sm font-medium text-foreground outline-none"
              >
                {originOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "Cualquier salida" : option}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-xl border border-border bg-secondary p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Destino</p>
              <select
                value={destination}
                onChange={(event) => updateFilters({ destination: event.target.value })}
                className="mt-3 w-full bg-transparent text-sm font-medium text-foreground outline-none"
              >
                {destinationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "Cualquier destino" : option}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-xl border border-border bg-secondary p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Fecha</p>
              <select
                value={date}
                onChange={(event) => updateFilters({ date: event.target.value as typeof date })}
                className="mt-3 w-full bg-transparent text-sm font-medium text-foreground outline-none"
              >
                {Object.entries(marketplaceDateLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-xl border border-border bg-secondary p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Hora</p>
              <select
                value={time}
                onChange={(event) => updateFilters({ time: event.target.value as typeof time })}
                className="mt-3 w-full bg-transparent text-sm font-medium text-foreground outline-none"
              >
                {Object.entries(marketplaceTimeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-xl border border-border bg-secondary p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Espacio</p>
              <select
                value={space}
                onChange={(event) => updateFilters({ space: event.target.value as typeof space })}
                className="mt-3 w-full bg-transparent text-sm font-medium text-foreground outline-none"
              >
                {Object.entries(marketplaceSpaceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="hero" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <Search className="h-4 w-4" />
              Filtros listos
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                setSearchParams(createMarketplaceSearchParams({ origin: "all", destination: "all", date: "all", time: "all", space: "all" }), {
                  replace: true,
                })
              }
            >
              Limpiar filtros
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTrips.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="p-8 text-center">
                <p className="font-heading text-2xl font-semibold">No hay transportistas con esos filtros</p>
                <p className="mt-3 text-muted-foreground">Prueba con otra fecha o un espacio diferente.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredTrips.map((trip) => (
                <TravelerCard
                  key={trip.id}
                  trip={trip}
                  selected={trip.id === selectedTripId}
                  onSelect={() => openTripDetails(trip.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </PlatformLayout>
  );
};

export default Marketplace;
