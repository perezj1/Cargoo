import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Globe, Package, Search, Shield, Users } from "lucide-react";

import { LandingFooter } from "@/components/cargoo/LandingFooter";
import { LandingNavbar } from "@/components/cargoo/LandingNavbar";
import { TravelerCard } from "@/components/cargoo/TravelerCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { trips } from "@/lib/cargoo-data";
import { getAppHomePath, getStoredAppRole } from "@/lib/app-role";
import {
  defaultMarketplaceFilters,
  getTripDetailsUrl,
  marketplaceDateLabels,
  marketplaceSpaceLabels,
  marketplaceTimeLabels,
  type MarketplaceDateFilter,
  type MarketplaceFilters,
  type MarketplaceSpaceFilter,
  type MarketplaceTimeFilter,
} from "@/lib/marketplace-filters";

const quickRoutes = [
  { origin: "Zurich", destination: "Barcelona" },
  { origin: "Ginebra", destination: "Lisboa" },
  { origin: "Basel", destination: "Belgrado" },
  { origin: "Zurich", destination: "Tirana" },
];

const stats = [
  { icon: Users, label: "Transportistas activos", value: "140+" },
  { icon: Globe, label: "Rutas activas", value: "12" },
  { icon: Package, label: "Seguimientos compartidos", value: "980+" },
  { icon: Shield, label: "Perfiles claros", value: "100%" },
];

const steps = [
  {
    icon: Search,
    title: "Busca un transportista",
    description: "Filtra por salida, destino, fecha, hora y espacio disponible desde la landing.",
  },
  {
    icon: Package,
    title: "Habla y cierra el acuerdo",
    description: "Eliges una ficha clara, entras en contacto y acordais el envío fuera de la app.",
  },
  {
    icon: Shield,
    title: "Sigue el viaje",
    description: "Cuando el transportista activa el codigo, puedes ver recogido, en ruta o entregado.",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [landingFilters, setLandingFilters] = useState<MarketplaceFilters>(defaultMarketplaceFilters);

  const originOptions = useMemo(() => ["all", ...new Set(trips.map((trip) => trip.originCity))], []);
  const destinationOptions = useMemo(() => ["all", ...new Set(trips.map((trip) => trip.destinationCity))], []);
  const appEntryPath = user ? getAppHomePath(getStoredAppRole()) : "/auth";

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const matchesOrigin = landingFilters.origin === "all" || trip.originCity === landingFilters.origin;
      const matchesDestination = landingFilters.destination === "all" || trip.destinationCity === landingFilters.destination;
      const matchesDate = landingFilters.date === "all" || trip.dateBucket === landingFilters.date;
      const matchesTime = landingFilters.time === "all" || trip.timeBucket === landingFilters.time;
      const matchesSpace = landingFilters.space === "all" || trip.spaceCategory === landingFilters.space;

      return matchesOrigin && matchesDestination && matchesDate && matchesTime && matchesSpace;
    });
  }, [landingFilters]);

  const updateFilter = <K extends keyof MarketplaceFilters>(key: K, value: MarketplaceFilters[K]) => {
    setLandingFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const applyQuickRoute = (origin: string, destination: string) => {
    setLandingFilters((current) => ({
      ...current,
      origin,
      destination,
    }));
  };

  const resetFilters = () => {
    setLandingFilters(defaultMarketplaceFilters);
  };

  const scrollToResults = () => {
    document.getElementById("resultados")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLandingSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    scrollToResults();
  };

  const openTripDetails = (tripId: string) => {
    navigate(getTripDetailsUrl(tripId, landingFilters));
  };

  return (
    <div className="min-h-screen">
      <LandingNavbar />

      <main className="pt-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 hero-mesh opacity-100" />
          <div className="container relative py-16 md:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="max-w-2xl">
                <Badge className="bg-primary/10 px-4 py-1.5 text-primary shadow-none">Landing clara para envíos reales</Badge>
                <h1 className="mt-6 text-4xl font-bold leading-tight text-foreground md:text-6xl">
                  Encuentra a quien <span className="text-gradient-hero">ya va de viaje</span> y contactalo.
                </h1>
                <p className="mt-5 text-lg leading-8 text-muted-foreground">
                  Cargoo conecta emisores con transportistas que ya salen hacia Espana, Portugal, Serbia o Albania. Sin pagos dentro de la app, sin pasos innecesarios.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button variant="hero" size="lg" onClick={scrollToResults}>
                    <Search className="h-4 w-4" />
                    Buscar transportistas
                  </Button>
                  <Button variant="hero-outline" size="lg" asChild>
                    <Link to={appEntryPath}>{user ? "Abrir mi cuenta" : "Entrar a la app"}</Link>
                  </Button>
                </div>
              </div>

              <div className="phone-frame mx-auto w-full max-w-[420px]">
                <div className="phone-screen p-6 pt-12">
                  <div className="rounded-[1.5rem] bg-white p-4 shadow-card">
                    <p className="text-sm text-muted-foreground">Ruta activa</p>
                    <h2 className="mt-2 text-2xl font-semibold text-foreground">Basel {"->"} Belgrado</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">Dom 30 Mar</Badge>
                      <Badge variant="outline">21:00</Badge>
                      <Badge variant="outline">3 bultos fragiles</Badge>
                    </div>
                  </div>

                  <div className="route-map relative mt-5 h-48 rounded-[1.7rem] border border-border bg-white">
                    <div className="route-line route-line-main" />
                    <div className="route-line route-line-alt" />
                    <div className="route-stop route-stop-start" />
                    <div className="route-stop route-stop-mid" />
                    <div className="route-stop route-stop-end" />
                    <div className="route-tag left-[12%] top-[13%]">Basel</div>
                    <div className="route-tag left-[43%] top-[39%]">Ljubljana</div>
                    <div className="route-tag left-[68%] top-[64%]">Belgrado</div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="app-mini-card">
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <p className="mt-2 font-semibold text-foreground">En ruta</p>
                      <p className="mt-1 text-sm text-muted-foreground">Ultimo checkpoint en Zagreb</p>
                    </div>
                    <div className="app-mini-card">
                      <p className="text-sm text-muted-foreground">Contacto</p>
                      <p className="mt-2 font-semibold text-foreground">WhatsApp</p>
                      <p className="mt-1 text-sm text-muted-foreground">Visible para usuarios con cuenta</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleLandingSearch} className="mt-12 rounded-[1.6rem] border border-border bg-card p-3 shadow-card-hover">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_0.95fr_0.95fr_0.95fr_auto]">
                <label className="rounded-xl border border-border bg-secondary px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Salida</p>
                  <select
                    value={landingFilters.origin}
                    onChange={(event) => updateFilter("origin", event.target.value)}
                    className="mt-2 w-full bg-transparent text-sm font-semibold text-foreground outline-none"
                  >
                    {originOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === "all" ? "Cualquier salida" : option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-xl border border-border bg-secondary px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Destino</p>
                  <select
                    value={landingFilters.destination}
                    onChange={(event) => updateFilter("destination", event.target.value)}
                    className="mt-2 w-full bg-transparent text-sm font-semibold text-foreground outline-none"
                  >
                    {destinationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === "all" ? "Cualquier destino" : option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-xl border border-border bg-secondary px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Fecha</p>
                  <select
                    value={landingFilters.date}
                    onChange={(event) => updateFilter("date", event.target.value as MarketplaceDateFilter)}
                    className="mt-2 w-full bg-transparent text-sm font-semibold text-foreground outline-none"
                  >
                    {Object.entries(marketplaceDateLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-xl border border-border bg-secondary px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Hora</p>
                  <select
                    value={landingFilters.time}
                    onChange={(event) => updateFilter("time", event.target.value as MarketplaceTimeFilter)}
                    className="mt-2 w-full bg-transparent text-sm font-semibold text-foreground outline-none"
                  >
                    {Object.entries(marketplaceTimeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-xl border border-border bg-secondary px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Espacio</p>
                  <select
                    value={landingFilters.space}
                    onChange={(event) => updateFilter("space", event.target.value as MarketplaceSpaceFilter)}
                    className="mt-2 w-full bg-transparent text-sm font-semibold text-foreground outline-none"
                  >
                    {Object.entries(marketplaceSpaceLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <Button type="submit" variant="hero" size="lg" className="h-auto min-h-[72px]">
                  <Search className="h-5 w-5" />
                  Buscar
                </Button>
              </div>

              <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-secondary px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {quickRoutes.map((route) => (
                    <button
                      key={`${route.origin}-${route.destination}`}
                      type="button"
                      onClick={() => applyQuickRoute(route.origin, route.destination)}
                      className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary/5"
                    >
                      {route.origin} {"->"} {route.destination}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-left text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  Limpiar filtros
                </button>
              </div>
            </form>
          </div>
        </section>

        <section id="resultados" className="py-20">
          <div className="container">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <Badge className="bg-primary/10 px-4 py-1.5 text-primary shadow-none">Resultados en la landing</Badge>
                <h2 className="mt-4 text-3xl font-bold text-foreground md:text-4xl">Transportistas disponibles</h2>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Buscas desde arriba y los perfiles aparecen aqui. Entras en la ficha y pasas al contacto.
                </p>
              </div>
              <Badge className="bg-white px-4 py-2 text-foreground shadow-card">{filteredTrips.length} visibles</Badge>
            </div>

            {filteredTrips.length === 0 ? (
              <div className="rounded-[1.4rem] border border-border bg-card p-8 text-center shadow-card">
                <p className="text-2xl font-semibold text-foreground">No hay resultados con esos filtros</p>
                <p className="mt-3 text-muted-foreground">Prueba otra fecha, otra hora o un espacio distinto.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredTrips.map((trip) => (
                  <TravelerCard key={trip.id} trip={trip} onSelect={() => openTripDetails(trip.id)} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="como-funciona" className="bg-secondary py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <Badge className="bg-white px-4 py-1.5 text-primary shadow-none">Cómo funciona</Badge>
              <h2 className="mt-4 text-3xl font-bold text-foreground md:text-4xl">Tres pasos y nada mas</h2>
              <p className="mt-3 text-muted-foreground">
                Cargoo no intenta hacer de todo. Solo te ayuda a encontrar, contactar y seguir.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.title} className="rounded-[1.4rem] border border-border bg-card p-8 text-center shadow-card">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-primary py-16 text-primary-foreground">
          <div className="container">
            <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <stat.icon className="mx-auto mb-3 h-8 w-8 opacity-80" />
                  <div className="text-2xl font-bold md:text-3xl">{stat.value}</div>
                  <div className="text-sm opacity-80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">Viajas pronto y te sobra espacio?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Entra como transportista, publica tu ficha y decide si quieres que tu contacto sea público o solo visible para usuarios con cuenta.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth">Crear cuenta</Link>
              </Button>
              <Button variant="hero-outline" size="lg" asChild>
                <Link to="/auth?role=traveler">
                  Ver app de transportista
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Home;
