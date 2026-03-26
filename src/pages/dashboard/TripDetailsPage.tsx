import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, CheckCircle2, Clock3, MapPin, Package, Route, ShieldCheck } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { advanceTripToNextStop, getFriendlyErrorMessage, getTripById, type CargooTripDetails } from "@/lib/cargoo-store";

const statusConfig = {
  active: { label: "Activo", className: "border-success/20 bg-success/10 text-success" },
  completed: { label: "Completado", className: "border-border bg-muted text-muted-foreground" },
} as const;

const formatTripDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatCheckpointDate = (value: string | null) => {
  if (!value) {
    return "Sin actualizaciones todavia";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const TripDetailsPage = () => {
  const navigate = useNavigate();
  const { loading: authLoading, profile, profileLoading } = useAuth();
  const { tripId = "" } = useParams();
  const [trip, setTrip] = useState<CargooTripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    const loadTrip = async () => {
      try {
        setTrip(await getTripById(tripId));
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadTrip();
  }, [tripId]);

  const handleAdvance = async () => {
    if (!trip?.nextStop) {
      return;
    }

    setAdvancing(true);

    try {
      const updatedTrip = await advanceTripToNextStop(trip.id);
      if (!updatedTrip) {
        throw new Error("No se pudo actualizar el checkpoint.");
      }

      setTrip(updatedTrip);
      toast.success(
        updatedTrip.nextStop
          ? `Checkpoint guardado. Proxima ciudad: ${updatedTrip.nextStop.city}.`
          : `Ruta completada. Has llegado a ${updatedTrip.destination}.`,
      );
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setAdvancing(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (profile && !profile.isTraveler) {
    return <Navigate to="/app/search" replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6">
        <button onClick={() => navigate("/app/trips")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>

        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            <h1 className="mb-2 text-2xl font-display font-bold">Viaje no encontrado</h1>
            <p className="mb-4 text-sm text-muted-foreground">El viaje que buscas no existe o ya no esta disponible.</p>
            <Button asChild>
              <Link to="/app/trips">Ver mis viajes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[trip.status];
  const routeSummary = trip.stops.map((stop) => stop.city).join(" -> ");

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <button onClick={() => navigate("/app/trips")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Detalle del viaje</h1>
          <p className="mt-1 text-sm text-muted-foreground">Un solo boton para confirmar la siguiente ciudad de la ruta.</p>
        </div>
        <Badge variant="outline" className={status.className}>
          {status.label}
        </Badge>
      </div>

      <Card className="mb-4 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            {trip.origin} {"->"} {trip.destination}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progreso de ruta</span>
              <span>{trip.progressPercent}%</span>
            </div>
            <Progress value={trip.progressPercent} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Salida prevista</span>
              </div>
              <p className="mt-2 font-medium text-foreground">{formatTripDate(trip.date)}</p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>Capacidad disponible</span>
              </div>
              <p className="mt-2 font-medium text-foreground">
                {Math.max(trip.capacityKg - trip.usedKg, 0)} de {trip.capacityKg} kg
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span>Ultimo checkpoint</span>
              </div>
              <p className="mt-2 font-medium text-foreground">{trip.lastCheckpointCity}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatCheckpointDate(trip.lastCheckpointAt)}</p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                <span>Proxima ciudad</span>
              </div>
              <p className="mt-2 font-medium text-foreground">{trip.nextStop?.city ?? "Ruta completada"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {trip.nextStop
                  ? "Marca esta ciudad cuando realmente hayas llegado."
                  : "Ya no quedan checkpoints pendientes."}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-4">
            <div className="flex items-center gap-2 text-foreground">
              <Route className="h-4 w-4 text-primary" />
              <span className="font-medium">Ruta publicada</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{routeSummary}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4 shadow-card">
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="text-sm text-muted-foreground">Seguimiento manual</p>
            <h2 className="mt-1 text-xl font-display font-semibold">
              {trip.nextStop ? `Llegue a ${trip.nextStop.city}` : "Ruta completada"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              El conductor solo tiene que tocar este boton cuando ya este dentro de la siguiente ciudad de la ruta.
            </p>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleAdvance}
            disabled={advancing || !trip.nextStop || !trip.trackingAvailable}
          >
            {advancing
              ? "Guardando checkpoint..."
              : trip.nextStop
                ? `Llegue a ${trip.nextStop.city}`
                : "No quedan ciudades pendientes"}
          </Button>

          {!trip.trackingAvailable ? (
            <p className="text-xs text-muted-foreground">
              El viaje existe, pero el seguimiento por ciudades necesita la migracion nueva de Supabase para activarse.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mb-4 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Ruta paso a paso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {trip.stops.map((stop, index) => {
            const isReached = index <= trip.currentStopIndex;
            const isNext = trip.nextStop?.id === stop.id;

            return (
              <div key={stop.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={
                      isReached
                        ? "mt-0.5 h-4 w-4 rounded-full bg-primary"
                        : isNext
                          ? "mt-0.5 h-4 w-4 rounded-full border-2 border-primary bg-background"
                          : "mt-0.5 h-4 w-4 rounded-full border border-border bg-background"
                    }
                  />
                  {index < trip.stops.length - 1 ? <div className="mt-1 h-full min-h-8 w-px bg-border" /> : null}
                </div>

                <div className="min-w-0 flex-1 rounded-xl border border-border/70 bg-background px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{stop.city}</p>
                    <Badge
                      variant="outline"
                      className={
                        isReached
                          ? "border-success/20 bg-success/10 text-success"
                          : isNext
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-border bg-muted text-muted-foreground"
                      }
                    >
                      {isReached ? "Confirmada" : isNext ? "Siguiente" : "Pendiente"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {stop.reachedAt ? `Marcada el ${formatCheckpointDate(stop.reachedAt)}` : "Aun no se ha confirmado esta ciudad."}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
          <p>
            Este seguimiento esta pensado para ser facil y seguro: una sola accion por parada, sin mapas en vivo y sin
            obligar al conductor a escribir mientras viaja.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TripDetailsPage;
