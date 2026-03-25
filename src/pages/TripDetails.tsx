import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  Clock3,
  MapPinned,
  MessageCircle,
  Package2,
  PhoneCall,
  Route,
  ShieldCheck,
  Star,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAppHomePath, getStoredAppRole, setStoredAppRole } from "@/lib/app-role";
import { getTripById } from "@/lib/cargoo-data";
import {
  defaultMarketplaceFilters,
  getTripDetailsUrl,
  getMarketplaceUrl,
  readMarketplaceFiltersFromSearchParams,
  storePendingMarketplaceFilters,
  storePendingSelectedTripId,
} from "@/lib/marketplace-filters";

const TripDetails = () => {
  const { tripId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const trip = getTripById(tripId);
  const filters = useMemo(() => readMarketplaceFiltersFromSearchParams(searchParams), [searchParams]);
  const appEntryPath = user ? getAppHomePath(getStoredAppRole()) : "/auth";
  const backToResultsUrl = user ? getMarketplaceUrl(filters, tripId) : "/home";
  const detailsUrl = trip ? getTripDetailsUrl(trip.id, filters) : "/home";
  const canViewContact = trip ? trip.contactVisibility === "public" || Boolean(user) : false;
  const contactVisibilityLabel = trip?.contactVisibility === "public" ? "Visible para todos" : "Solo usuarios con cuenta";
  const isPhoneContact = trip?.contactPreference.toLowerCase().includes("telefono") || trip?.contactPreference.toLowerCase().includes("llamada");
  const isWhatsappContact = trip?.contactPreference.toLowerCase().includes("whatsapp");
  const contactHref =
    trip && canViewContact
      ? isWhatsappContact
        ? `https://wa.me/${trip.contactValue.replace(/[^\d]/g, "")}`
        : isPhoneContact
          ? `tel:${trip.contactValue.replace(/\s+/g, "")}`
          : null
      : null;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [tripId]);

  const handleContact = () => {
    if (!trip) return;

    setStoredAppRole("emitter");

    if (canViewContact && user) {
      navigate(getMarketplaceUrl(filters, trip.id));
      return;
    }

    storePendingMarketplaceFilters(filters ?? defaultMarketplaceFilters);
    storePendingSelectedTripId(trip.id);
    navigate(`/auth?role=emitter&next=${encodeURIComponent(detailsUrl)}`);
  };

  if (!trip) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 hero-mesh opacity-100" />

        <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/90 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-6">
            <Link to="/home" className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-primary text-white shadow-[0_16px_36px_rgba(255,122,48,0.22)]">
                <CarFront className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-xl font-bold tracking-tight text-foreground">Cargoo</p>
                <p className="truncate text-xs text-muted-foreground">busca y contacta</p>
              </div>
            </Link>

            <Button asChild size="sm">
              <Link to={appEntryPath}>{user ? "Abrir app" : "Entrar"}</Link>
            </Button>
          </div>
        </header>

        <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
          <Card className="border-primary/10 bg-white">
            <CardContent className="p-8 text-center">
              <p className="font-heading text-3xl font-semibold">No encontramos esa ficha</p>
              <p className="mt-3 text-muted-foreground">Puede que el transportista ya no tenga esa salida publicada.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild>
                  <Link to="/home">Volver a la landing</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/marketplace">Ver transportistas</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 hero-mesh opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[20rem] bg-[radial-gradient(circle_at_top,rgba(255,122,48,0.18),transparent_60%)]" />

      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-6">
          <Link to="/home" className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-primary text-white shadow-[0_16px_36px_rgba(255,122,48,0.22)]">
              <CarFront className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-xl font-bold tracking-tight text-foreground">Cargoo</p>
              <p className="truncate text-xs text-muted-foreground">ficha del transportista</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to={backToResultsUrl}>Resultados</Link>
            </Button>
            <Button asChild size="sm">
              <Link to={appEntryPath}>{user ? "Abrir app" : "Entrar"}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-16 pt-6 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Badge className="rounded-full border-primary/10 bg-primary/5 px-4 py-1.5 text-primary shadow-none">
            Ficha completa
          </Badge>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <Card className="border-primary/10 bg-white">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.45rem] bg-primary/10 text-primary">
                    <CarFront className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-heading text-4xl font-semibold text-foreground">{trip.travelerName}</h1>
                      <Badge className="rounded-full border-primary/10 bg-primary/5 px-3 py-1 text-primary shadow-none">
                        {trip.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-base text-muted-foreground">{trip.role}</p>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/80">{trip.bio}</p>
                  </div>
                </div>

                <div className="rounded-[1.35rem] border border-primary/10 bg-[#fffaf6] px-4 py-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    {trip.trustScore.toFixed(1)} de valoracion
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Respuesta media {trip.responseTime}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full bg-white px-4 py-2">
                  {trip.originCity} {"->"} {trip.destinationCity}
                </Badge>
                <Badge variant="outline" className="rounded-full bg-white px-4 py-2">
                  {trip.departureDay} / {trip.departureTime}
                </Badge>
                <Badge variant="outline" className="rounded-full bg-white px-4 py-2">
                  {trip.availableSpace}
                </Badge>
                <Badge variant="outline" className="rounded-full bg-white px-4 py-2">
                  {trip.contactPreference}
                </Badge>
              </div>

              <div className="mt-8 rounded-[2rem] border border-primary/10 bg-[#fffaf6] p-5 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-white text-primary shadow-sm">
                    <Route className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ruta detallada</p>
                    <h2 className="font-heading text-2xl font-semibold text-foreground">{trip.routeSummary}</h2>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {trip.routeStops.map((stop, index) => (
                    <div key={stop} className="flex items-center gap-3">
                      <div className="rounded-full border border-primary/10 bg-white px-4 py-2 text-sm font-semibold text-foreground">
                        {stop}
                      </div>
                      {index < trip.routeStops.length - 1 ? <ArrowRight className="h-4 w-4 text-primary" /> : null}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-primary/10 bg-white">
              <CardContent className="p-6">
                <h2 className="font-heading text-2xl font-semibold text-foreground">Informacion util</h2>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3 rounded-[1.35rem] bg-primary/5 px-4 py-3 text-sm">
                    <Clock3 className="h-4 w-4 text-primary" />
                    <span className="text-foreground">
                      Sale {trip.departureDay} a las {trip.departureTime} y llega {trip.arrivalDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 rounded-[1.35rem] bg-primary/5 px-4 py-3 text-sm">
                    <CarFront className="h-4 w-4 text-primary" />
                    <span className="text-foreground">Vehiculo: {trip.vehicle}</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-[1.35rem] bg-primary/5 px-4 py-3 text-sm">
                    <Package2 className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{trip.availableSpace}</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-[1.35rem] bg-primary/5 px-4 py-3 text-sm">
                    <MapPinned className="h-4 w-4 text-primary" />
                    <span className="text-foreground">Recogida en {trip.meetingPoint}</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-[1.35rem] bg-primary/5 px-4 py-3 text-sm">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-foreground">Ultimo checkpoint: {trip.lastCheckpoint}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10 bg-white">
              <CardContent className="p-6">
                <h2 className="font-heading text-2xl font-semibold text-foreground">Que suele transportar</h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  {trip.acceptedItems.map((item) => (
                    <Badge key={item} variant="outline" className="rounded-full bg-white px-4 py-2">
                      {item}
                    </Badge>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {trip.highlights.map((highlight) => (
                    <Badge key={highlight} className="rounded-full border-primary/10 bg-primary/5 px-4 py-2 text-primary shadow-none">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/15 bg-white">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Contacto</p>
                <h2 className="mt-2 font-heading text-2xl font-semibold text-foreground">
                  {canViewContact ? "Contacto disponible en la ficha" : "Este contacto requiere cuenta"}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {canViewContact
                    ? "El transportista ha dejado visible su forma de contacto segun la configuracion de su ficha."
                    : "El transportista ha elegido mostrar su contacto solo a usuarios registrados de Cargoo."}
                </p>

                <div className="mt-5 rounded-[1.6rem] border border-primary/10 bg-[#fffaf6] p-4">
                  <p className="text-sm font-medium text-foreground">Visibilidad del contacto</p>
                  <p className="mt-2 text-sm text-muted-foreground">{contactVisibilityLabel}</p>

                  {canViewContact ? (
                    <div className="mt-4 space-y-2 text-sm">
                      <p>
                        <span className="font-medium text-foreground">Canal:</span> <span className="text-muted-foreground">{trip.contactPreference}</span>
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Dato:</span> <span className="text-muted-foreground">{trip.contactValue}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">Entra con una cuenta de Cargoo para desbloquear el contacto de esta ficha.</p>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  {canViewContact && contactHref ? (
                    <Button asChild size="lg">
                      <a href={contactHref} target="_blank" rel="noreferrer">
                        <MessageCircle className="h-4 w-4" />
                        Contactar a {trip.travelerName}
                      </a>
                    </Button>
                  ) : canViewContact && user ? (
                    <Button type="button" size="lg" onClick={() => navigate(getMarketplaceUrl(filters, trip.id))}>
                      <MessageCircle className="h-4 w-4" />
                      Abrir app para contactar
                    </Button>
                  ) : (
                    <Button type="button" size="lg" onClick={handleContact}>
                      <MessageCircle className="h-4 w-4" />
                      Entrar para ver el contacto
                    </Button>
                  )}
                  <Button asChild variant="outline" size="lg">
                    <Link to={backToResultsUrl}>
                      Ver resultados
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="sm:hidden">
                    <Link to="/tracking">
                      <PhoneCall className="h-4 w-4" />
                      Seguimiento
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TripDetails;
