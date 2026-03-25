import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, CarFront, Clock3, MapPin, Package2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getAppHomePath, getStoredAppRole, setStoredAppRole } from "@/lib/app-role";
import { faqItems, trackingItems, trips } from "@/lib/cargoo-data";
import {
  defaultMarketplaceFilters,
  getMarketplaceUrl,
  marketplaceDateLabels,
  marketplaceSpaceLabels,
  marketplaceTimeLabels,
  type MarketplaceFilters,
  storePendingMarketplaceFilters,
} from "@/lib/marketplace-filters";

const landingExamples = [
  {
    title: "Ejemplo para emisor",
    text: "Zurich -> Barcelona, salida esta semana, manana, espacio medio. Aparecen transportistas listos para contactar.",
    tone: "peach-card",
    icon: Search,
  },
  {
    title: "Ejemplo para transportista",
    text: "Entras y ves solicitudes nuevas, recogidas pendientes y codigos de seguimiento para compartir.",
    tone: "mint-card",
    icon: CarFront,
  },
  {
    title: "Ejemplo de seguimiento",
    text: "El envio pasa por reservado, recogido, en ruta y entregado con la ultima actualizacion siempre visible.",
    tone: "sky-card",
    icon: Package2,
  },
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const appEntry = user ? getAppHomePath(getStoredAppRole()) : "/auth";
  const liveTrip = trips[0];
  const liveTracking = trackingItems[0];
  const originOptions = useMemo(() => [...new Set(trips.map((trip) => trip.originCity))], []);
  const destinationOptions = useMemo(() => [...new Set(trips.map((trip) => trip.destinationCity))], []);
  const [landingFilters, setLandingFilters] = useState<MarketplaceFilters>({
    ...defaultMarketplaceFilters,
    origin: liveTrip.originCity,
    destination: liveTrip.destinationCity,
    date: "this-week",
    time: "morning",
    space: "medium",
  });

  const handleLandingSearch = (event: FormEvent) => {
    event.preventDefault();
    setStoredAppRole("emitter");

    if (user) {
      navigate(getMarketplaceUrl(landingFilters));
      return;
    }

    storePendingMarketplaceFilters(landingFilters);
    navigate("/auth?role=emitter");
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 hero-mesh opacity-90" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top,rgba(255,122,48,0.12),transparent_58%)]" />

      <header className="relative z-10 border-b border-black/5 bg-background/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-6">
          <Link to="/home" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.45rem] bg-[#111111] text-white shadow-lg shadow-black/15">
              <CarFront className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold tracking-tight text-foreground">Cargoo</p>
              <p className="text-xs text-muted-foreground">buscar, contactar y seguir</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#como-funciona" className="transition-colors hover:text-foreground">
              Como funciona
            </a>
            <a href="#ejemplos" className="transition-colors hover:text-foreground">
              Ejemplos
            </a>
            <a href="#acceso" className="transition-colors hover:text-foreground">
              Acceso
            </a>
          </nav>

          <Button asChild size="sm">
            <Link to={appEntry}>{user ? "Abrir app" : "Entrar"}</Link>
          </Button>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-6 md:px-6">
          <form
            onSubmit={handleLandingSearch}
            className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#1a1a1a] p-2.5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
          >
            <div className="grid gap-2 xl:grid-cols-[1fr_1.15fr_1fr_1.15fr_auto]">
              <label className="rounded-[1.25rem] border border-white/5 bg-[#222222] px-4 py-3 text-white/85">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Salida</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <select
                    value={landingFilters.origin}
                    onChange={(event) => setLandingFilters((current) => ({ ...current, origin: event.target.value }))}
                    className="w-full bg-transparent text-sm font-medium text-white outline-none"
                  >
                    {originOptions.map((option) => (
                      <option key={option} value={option} className="text-foreground">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="rounded-[1.25rem] border border-white/5 bg-[#222222] px-4 py-3 text-white/85">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Destino</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <select
                    value={landingFilters.destination}
                    onChange={(event) => setLandingFilters((current) => ({ ...current, destination: event.target.value }))}
                    className="w-full bg-transparent text-sm font-medium text-white outline-none"
                  >
                    {destinationOptions.map((option) => (
                      <option key={option} value={option} className="text-foreground">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="rounded-[1.25rem] border border-white/5 bg-[#222222] px-4 py-3 text-white/85">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Fecha</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-primary">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <select
                    value={landingFilters.date}
                    onChange={(event) => setLandingFilters((current) => ({ ...current, date: event.target.value as MarketplaceFilters["date"] }))}
                    className="w-full bg-transparent text-sm font-medium text-white outline-none"
                  >
                    {Object.entries(marketplaceDateLabels).map(([value, label]) => (
                      <option key={value} value={value} className="text-foreground">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <div className="rounded-[1.25rem] border border-white/5 bg-[#222222] px-4 py-3 text-white/85">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Hora / Espacio</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="rounded-[0.95rem] border border-white/5 bg-black/10 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-primary" />
                      <select
                        value={landingFilters.time}
                        onChange={(event) => setLandingFilters((current) => ({ ...current, time: event.target.value as MarketplaceFilters["time"] }))}
                        className="w-full bg-transparent text-sm font-medium text-white outline-none"
                      >
                        {Object.entries(marketplaceTimeLabels).map(([value, label]) => (
                          <option key={value} value={value} className="text-foreground">
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>

                  <label className="rounded-[0.95rem] border border-white/5 bg-black/10 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Package2 className="h-4 w-4 text-primary" />
                      <select
                        value={landingFilters.space}
                        onChange={(event) => setLandingFilters((current) => ({ ...current, space: event.target.value as MarketplaceFilters["space"] }))}
                        className="w-full bg-transparent text-sm font-medium text-white outline-none"
                      >
                        {Object.entries(marketplaceSpaceLabels).map(([value, label]) => (
                          <option key={value} value={value} className="text-foreground">
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                </div>
              </div>

              <Button type="submit" size="lg" className="h-auto rounded-[1.25rem] px-6 py-4 xl:min-w-[220px]">
                <Search className="h-4 w-4" />
                Buscar transportistas
              </Button>
            </div>
          </form>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:px-6 xl:grid-cols-[1fr_0.92fr] xl:py-14">
          <div className="soft-panel relative overflow-hidden p-7 md:p-10">
            <div className="absolute -left-10 top-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative">
              <Badge className="rounded-full border-black/5 bg-white px-4 py-1.5 text-foreground shadow-sm">
                PWA clara, explicativa y directa
              </Badge>

              <h1 className="mt-6 max-w-3xl font-heading text-4xl font-bold tracking-tight text-balance md:text-6xl">
                Una app para encontrar transportistas y seguir el envio sin procesos innecesarios.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                Cargoo separa muy bien dos momentos: primero una landing que explica como funciona y, despues, la app
                real para cada perfil: emisor o transportista.
              </p>

              <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Salida", value: "Suiza" },
                  { label: "Destino", value: "Espana, Portugal, Serbia, Albania" },
                  { label: "Filtros", value: "Fecha, hora y espacio" },
                  { label: "Seguimiento", value: "Reservado, recogido, en ruta, entregado" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                    <p className="mt-3 text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <a href="#como-funciona">
                    Ver como funciona
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="dark">
                  <Link to={appEntry}>{user ? "Entrar a la app" : "Acceder a Cargoo"}</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="phone-frame mx-auto w-full max-w-[420px] p-3">
            <div className="phone-screen px-4 pb-4 pt-12">
              <div className="rounded-[1.7rem] bg-white p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Busqueda para un emisor</p>
                <p className="mt-2 font-heading text-2xl font-semibold">
                  {liveTrip.originCity} {"->"} {liveTrip.destinationCity}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className="rounded-full border-black/5 bg-[#faf7f2] px-3 py-1 text-foreground">Esta semana</Badge>
                  <Badge className="rounded-full border-black/5 bg-[#faf7f2] px-3 py-1 text-foreground">Manana</Badge>
                  <Badge className="rounded-full border-black/5 bg-[#faf7f2] px-3 py-1 text-foreground">Espacio medio</Badge>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {trips.slice(0, 2).map((trip, index) => (
                  <div key={trip.id} className={index === 0 ? "app-mini-card bg-[#fff9f3]" : "app-mini-card"}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111111] text-white">
                          <CarFront className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{trip.travelerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {trip.departureDay} - {trip.departureTime}
                          </p>
                        </div>
                      </div>
                      <Badge className="rounded-full border-black/5 bg-white px-3 py-1 text-foreground">{trip.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[1.75rem] bg-[#111111] p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                <p className="text-sm text-white/65">Seguimiento dentro de la app</p>
                <p className="mt-2 font-heading text-2xl font-semibold">{liveTracking.status}</p>
                <p className="mt-2 text-sm text-white/80">{liveTracking.statusDetail}</p>
                <div className="mt-4 rounded-[1.4rem] bg-white/10 p-4 text-sm text-white/80">
                  <p>{liveTracking.checkpoint}</p>
                  <p className="mt-2">{liveTracking.contactLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <CardContent className="p-6 md:p-8">
                <Badge className="rounded-full border-black/5 bg-white px-4 py-1 text-foreground">Como funciona</Badge>
                <h2 className="mt-4 font-heading text-3xl font-semibold">La PWA explica primero y deja entrar despues</h2>

                <div className="mt-6 space-y-4">
                  {[
                    {
                      title: "1. Landing explicativa",
                      text: "La portada explica Cargoo con ejemplos reales para que se entienda antes de entrar.",
                    },
                    {
                      title: "2. Login o crear cuenta",
                      text: "El acceso queda abajo en la landing y tambien en el boton Entrar de la cabecera.",
                    },
                    {
                      title: "3. App segun la cuenta",
                      text: "Al entrar, un emisor aterriza en su busqueda y seguimiento, y un transportista en solicitudes, recogidas y codigos.",
                    },
                  ].map((item, index) => (
                    <div key={item.title} className={index === 1 ? "rounded-[1.75rem] border border-black/5 bg-[#faf7f2] p-5" : "rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm"}>
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div id="ejemplos" className="grid gap-4 md:grid-cols-3">
              {landingExamples.map((item) => {
                const Icon = item.icon;

                return (
                  <Card key={item.title} className={item.tone}>
                    <CardContent className="p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-white shadow-sm">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="mt-4 font-heading text-2xl font-semibold">{item.title}</h3>
                      <p className="mt-3 text-sm text-muted-foreground">{item.text}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="peach-card">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-heading text-3xl font-semibold">Para un emisor</h2>
                <p className="mt-3 text-muted-foreground">
                  Entras, filtras transportistas, comparas horario, ruta, espacio y tiempo de respuesta, y abres el
                  contacto.
                </p>

                <div className="mt-5 space-y-3">
                  {[
                    "Busca por salida, destino, fecha y hora.",
                    "Elige el perfil que mejor encaja.",
                    "Sigue el estado del envio dentro de la app.",
                  ].map((item) => (
                    <div key={item} className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
                      <p className="text-sm text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mint-card">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-heading text-3xl font-semibold">Para un transportista</h2>
                <p className="mt-3 text-muted-foreground">
                  Entras y ves a quien responder, que recogidas tienes hoy y que codigos de seguimiento debes compartir
                  durante el viaje.
                </p>

                <div className="mt-5 space-y-3">
                  {[
                    "Revisas solicitudes nuevas y respondes solo a las que te encajan.",
                    "Confirmas recogida, sales de viaje y marcas cada etapa real.",
                    "Compartes una pagina de seguimiento con codigo cuando cierras el acuerdo.",
                  ].map((item) => (
                    <div key={item} className="rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-sm">
                      <p className="text-sm text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="acceso" className="mx-auto max-w-7xl px-4 pb-12 pt-4 md:px-6">
          <Card className="ink-card text-white">
            <CardContent className="p-6 md:p-10">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <Badge className="rounded-full border-white/10 bg-white/10 px-4 py-1 text-white">Acceso a la app</Badge>
                  <h2 className="mt-4 font-heading text-3xl font-semibold md:text-5xl">
                    Cuando ya entiendes Cargoo, entras a la app y sigues con tu flujo.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm text-white/75 md:text-base">
                    Arriba tienes el boton Entrar y aqui abajo el acceso final. El login abre la app y el panel cambia
                    segun si la cuenta es de emisor o de transportista.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {faqItems.slice(0, 2).map((item) => (
                      <div key={item.question} className="rounded-[1.6rem] bg-white/10 p-4">
                        <p className="font-medium text-white">{item.question}</p>
                        <p className="mt-2 text-sm text-white/75">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button asChild size="lg" className="bg-white text-slate-950 hover:bg-white/90">
                    <Link to={appEntry}>Entrar a Cargoo</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/15">
                    <Link to={appEntry}>Crear cuenta o login</Link>
                  </Button>
                  <div className="rounded-[1.5rem] bg-white/10 p-4 text-sm text-white/75">
                    La PWA funciona bien en movil para revisar seguimiento, mensajes y estado del envio.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Home;
