import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { BadgeCheck, CarFront, Clock3, MapPinned, MessageCircle, PhoneCall, Route, Search, UserRound } from "lucide-react";

import { PlatformLayout } from "@/components/cargoo/PlatformLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackingItems, travelLanes, trips } from "@/lib/cargoo-data";
import {
  createMarketplaceSearchParams,
  marketplaceDateLabels,
  marketplaceSpaceLabels,
  marketplaceTimeLabels,
  readMarketplaceFiltersFromSearchParams,
} from "@/lib/marketplace-filters";

const statusClasses = {
  Reservado: "bg-[#fff1e6] text-[#b45d35]",
  Recogido: "bg-[#eef7ec] text-[#4f7854]",
  "En ruta": "bg-[#e8eef7] text-[#486589]",
  Entregado: "bg-[#111111] text-white",
} as const;

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id ?? "");
  const { origin, destination, date, time, space } = readMarketplaceFiltersFromSearchParams(searchParams);

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

  const filteredTrips = trips.filter((trip) => {
    const matchesOrigin = origin === "all" || trip.originCity === origin;
    const matchesDestination = destination === "all" || trip.destinationCity === destination;
    const matchesDate = date === "all" || trip.dateBucket === date;
    const matchesTime = time === "all" || trip.timeBucket === time;
    const matchesSpace = space === "all" || trip.spaceCategory === space;

    return matchesOrigin && matchesDestination && matchesDate && matchesTime && matchesSpace;
  });

  const selectedTrip = filteredTrips.find((trip) => trip.id === selectedTripId) ?? filteredTrips[0] ?? null;
  const liveTracking = trackingItems[0];

  return (
    <PlatformLayout
      title="Buscar transportistas"
      subtitle="Filtra por salida, destino, fecha, hora y espacio disponible. Elige un perfil y contacta. Cargoo no necesita nada mas."
    >
      <section className="space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Badge className="rounded-full border-black/5 bg-white px-4 py-1.5 text-foreground shadow-sm">
                  No publicas solicitudes. Solo buscas y eliges.
                </Badge>
                <h2 className="mt-4 font-heading text-3xl font-semibold">Filtros directos para encontrar quien ya va de camino</h2>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Todos los transportistas publican salida, destino, fecha, hora, espacio disponible y forma de
                  contacto. El resto se habla entre las dos partes.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-black/5 bg-[#111111] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/10">
                <Search className="h-4 w-4 text-primary" />
                {filteredTrips.length} transportistas visibles
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <label className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
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

              <label className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
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

              <label className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
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

              <label className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
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

              <label className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
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
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            {filteredTrips.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="font-heading text-2xl font-semibold">No hay transportistas con esos filtros</p>
                  <p className="mt-3 text-muted-foreground">Prueba otra fecha, otra hora o un espacio mas amplio.</p>
                </CardContent>
              </Card>
            ) : (
              filteredTrips.map((trip, index) => (
                <Card
                  key={trip.id}
                  className={index % 3 === 0 ? "peach-card" : index % 3 === 1 ? "mint-card" : "sky-card"}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedTripId(trip.id)}
                            className="flex min-w-0 items-center gap-3 text-left"
                          >
                            <div className="flex h-14 w-14 items-center justify-center rounded-[1.3rem] bg-white text-[#111111] shadow-sm">
                              <CarFront className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-muted-foreground">{trip.role}</p>
                              <h3 className="truncate font-heading text-2xl font-semibold">{trip.travelerName}</h3>
                              <p className="mt-1 text-sm text-foreground">
                                {trip.originCity} {"->"} {trip.destinationCity}
                              </p>
                            </div>
                          </button>

                          <Badge className="rounded-full border-black/5 bg-white px-3 py-1 text-foreground">
                            {trip.status}
                          </Badge>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-2xl bg-white/80 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Salida</p>
                            <p className="mt-1 text-sm font-medium text-foreground">
                              {trip.departureDay} - {trip.departureTime}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white/80 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Espacio</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{trip.availableSpace}</p>
                          </div>
                          <div className="rounded-2xl bg-white/80 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Contacto</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{trip.contactPreference}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {trip.highlights.map((highlight) => (
                            <Badge key={highlight} variant="outline" className="rounded-full bg-white/70">
                              {highlight}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="w-full max-w-xs rounded-[1.8rem] border border-black/5 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <BadgeCheck className="h-4 w-4 text-primary" />
                          Perfil listo para contactar
                        </div>
                        <p className="mt-3 font-heading text-4xl font-bold">{trip.trustScore.toFixed(1)}</p>
                        <p className="text-sm text-muted-foreground">valoracion media visible en la app</p>

                        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-primary" />
                            Respuesta media {trip.responseTime}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPinned className="h-4 w-4 text-primary" />
                            Recogida: {trip.meetingPoint}
                          </div>
                          <div className="flex items-center gap-2">
                            <Route className="h-4 w-4 text-primary" />
                            Ultimo checkpoint: {trip.lastCheckpoint}
                          </div>
                        </div>

                        <div className="mt-5 flex gap-2">
                          <Button className="flex-1">Contactar</Button>
                          <Button variant="outline" className="flex-1">
                            Ver perfil
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-6 xl:sticky xl:top-28 self-start">
            {selectedTrip ? (
              <Card className="ink-card text-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-white/65">Transportista seleccionado</p>
                      <h2 className="mt-2 font-heading text-3xl font-semibold">{selectedTrip.travelerName}</h2>
                    </div>
                    <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white">
                      {selectedTrip.status}
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.8rem] bg-white/10 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-white/60">Ruta</p>
                        <p className="mt-1 font-medium text-white">
                          {selectedTrip.originCity} {"->"} {selectedTrip.destinationCity}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-white/60">Vehiculo</p>
                        <p className="mt-1 font-medium text-white">{selectedTrip.vehicle}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/60">Salida</p>
                        <p className="mt-1 font-medium text-white">
                          {selectedTrip.departureDay} - {selectedTrip.departureTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-white/60">Espacio</p>
                        <p className="mt-1 font-medium text-white">{selectedTrip.availableSpace}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/60">Contacto</p>
                        <p className="mt-1 font-medium text-white">{selectedTrip.contactPreference}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/60">Punto de recogida</p>
                        <p className="mt-1 font-medium text-white">{selectedTrip.meetingPoint}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Button className="flex-1 bg-white text-slate-950 hover:bg-white/90">
                      <MessageCircle className="h-4 w-4" />
                      Escribir
                    </Button>
                    <Button variant="outline" className="flex-1 border-white/15 bg-white/10 text-white hover:bg-white/15">
                      <PhoneCall className="h-4 w-4" />
                      Llamar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div className="phone-frame mx-auto w-full max-w-[410px] p-3">
              <div className="phone-screen px-4 pb-4 pt-12">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Seguimiento simple</span>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
                    dentro de la app
                  </div>
                </div>

                <div className="route-map relative mt-4 h-60 rounded-[1.9rem] border border-black/5">
                  <div className="route-line route-line-main" />
                  <div className="route-line route-line-alt" />
                  <div className="route-stop route-stop-start" />
                  <div className="route-stop route-stop-mid" />
                  <div className="route-stop route-stop-end" />
                  <div className="route-tag left-[10%] top-[16%]">Recogido</div>
                  <div className="route-tag left-[46%] top-[40%]">En ruta</div>
                  <div className="route-tag left-[63%] top-[72%]">Entrega</div>
                </div>

                <div className="-mt-8 rounded-[1.9rem] bg-[#111111] p-5 text-white shadow-[0_24px_50px_rgba(15,23,42,0.18)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-white/65">Envio en seguimiento</p>
                      <h3 className="mt-2 font-heading text-3xl font-semibold">{liveTracking.status}</h3>
                    </div>
                    <Badge className={`rounded-full border-white/10 px-3 py-1 ${statusClasses[liveTracking.status]}`}>
                      {liveTracking.updatedAt}
                    </Badge>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/60">Ruta</p>
                      <p className="mt-1 font-medium text-white">{liveTracking.route}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Transportista</p>
                      <p className="mt-1 font-medium text-white">{liveTracking.travelerName}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] bg-white/10 p-4 text-sm text-white/80">
                    <p>{liveTracking.statusDetail}</p>
                    <p className="mt-2">{liveTracking.checkpoint}</p>
                    <p className="mt-2">{liveTracking.contactLabel}</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="mint-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-primary" />
                  <h3 className="font-heading text-2xl font-semibold">Corredores activos</h3>
                </div>
                <div className="mt-5 space-y-4">
                  {travelLanes.slice(0, 3).map((lane) => (
                    <div key={lane.id} className="rounded-[1.6rem] border border-black/5 bg-white p-4 shadow-sm">
                      <p className="font-medium text-foreground">
                        {lane.originCity} {"->"} {lane.destinationCity}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {lane.weeklyTrips} salidas semanales - {lane.typicalSpace}
                      </p>
                    </div>
                  ))}
                </div>
                <Button asChild variant="outline" className="mt-6 w-full">
                  <Link to={`/tracking/${liveTracking.trackingCode}`}>Abrir seguimiento</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PlatformLayout>
  );
};

export default Marketplace;
