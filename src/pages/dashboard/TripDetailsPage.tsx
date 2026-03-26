import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, CheckCircle2, Clock3, MapPin, MessageSquare, Package, Route, ShieldCheck, Truck, Users } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  advanceTripToNextStop,
  getConversations,
  getFriendlyErrorMessage,
  getTripById,
  getTripShipments,
  markShipmentDelivered,
  type CargooTripDetails,
  type ConversationSummary,
  type ShipmentSummary,
} from "@/lib/cargoo-store";

const statusConfig = {
  active: { label: "Activo", className: "border-success/20 bg-success/10 text-success" },
  completed: { label: "Completado", className: "border-border bg-muted text-muted-foreground" },
} as const;

const shipmentStatusConfig = {
  pending: { label: "Por cargar", className: "border-warning/20 bg-warning/10 text-warning" },
  accepted: { label: "En ruta", className: "border-primary/20 bg-primary/10 text-primary" },
  delivered: { label: "Entregado", className: "border-success/20 bg-success/10 text-success" },
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
  const [shipments, setShipments] = useState<ShipmentSummary[]>([]);
  const [tripConversations, setTripConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [updatingShipmentId, setUpdatingShipmentId] = useState<string | null>(null);

  const loadTripData = async () => {
    const [nextTrip, nextShipments, conversations] = await Promise.all([getTripById(tripId), getTripShipments(tripId), getConversations()]);
    setTrip(nextTrip);
    setShipments(nextShipments);
    setTripConversations(conversations.filter((conversation) => conversation.tripId === tripId));
  };

  useEffect(() => {
    const loadInitialTrip = async () => {
      try {
        setLoading(true);
        await loadTripData();
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadInitialTrip();
  }, [tripId]);

  useEffect(() => {
    const channel = supabase
      .channel(`trip-details-${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_shipments", filter: `trip_id=eq.${tripId}` }, () => void loadTripData())
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_trip_stops", filter: `trip_id=eq.${tripId}` }, () => void loadTripData())
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_trips", filter: `id=eq.${tripId}` }, () => void loadTripData())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
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
      await loadTripData();
      toast.success(
        updatedTrip.nextStop
          ? `Checkpoint guardado. Proxima ciudad: ${updatedTrip.nextStop.city}.`
          : updatedTrip.status === "completed"
            ? `Viaje completado. Has llegado a ${updatedTrip.destination}.`
            : `Has llegado a ${updatedTrip.destination}. Falta marcar los paquetes entregados.`,
      );
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setAdvancing(false);
    }
  };

  const handleMarkShipmentDelivered = async (shipmentId: string) => {
    setUpdatingShipmentId(shipmentId);

    try {
      await markShipmentDelivered(shipmentId);
      await loadTripData();
      toast.success("Paquete marcado como entregado.");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setUpdatingShipmentId(null);
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
  const shipmentByConversationId = new Map(shipments.map((shipment) => [shipment.conversationId, shipment] as const));
  const shipmentCounts = {
    pending: tripConversations.filter((conversation) => {
      const shipment = shipmentByConversationId.get(conversation.id);
      return !shipment || shipment.status === "pending";
    }).length,
    accepted: shipments.filter((shipment) => shipment.status === "accepted").length,
    delivered: shipments.filter((shipment) => shipment.status === "delivered").length,
  };

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
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className={status.className}>
            {status.label}
          </Badge>
          {trip.status === "completed" ? (
            <Button asChild variant="outline" size="sm">
              <Link to={`/app/trips/new?reuseTrip=${encodeURIComponent(trip.id)}`}>Reutilizar trayecto</Link>
            </Button>
          ) : null}
        </div>
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
              <p className="mt-2 font-medium text-foreground">
                {trip.nextStop?.city ?? (trip.status === "completed" ? "Ruta completada" : "Destino final alcanzado")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {trip.nextStop
                  ? "Marca esta ciudad cuando realmente hayas llegado."
                  : trip.status === "completed"
                    ? "Ya no quedan checkpoints pendientes."
                    : "Ahora solo falta marcar los paquetes entregados para cerrar el viaje."}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-4">
            <div className="flex items-center gap-2 text-foreground">
              <Route className="h-4 w-4 text-primary" />
              <span className="font-medium">Ruta publicada</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{routeSummary}</p>
            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={handleAdvance}
              disabled={advancing || !trip.nextStop || !trip.trackingAvailable}
            >
              {advancing
                ? "Guardando checkpoint..."
                : trip.nextStop
                  ? `Llegue a ${trip.nextStop.city}`
                  : trip.status === "completed"
                    ? "No quedan ciudades pendientes"
                    : "Entrega los paquetes pendientes"}
            </Button>
            {!trip.trackingAvailable ? (
              <p className="mt-3 text-xs text-muted-foreground">
                El viaje existe, pero el seguimiento por ciudades necesita la migracion nueva de Supabase para activarse.
              </p>
            ) : !trip.nextStop && trip.status === "active" ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Ya has llegado al destino. El viaje se cerrara cuando todos los paquetes esten marcados como entregados.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Personas que envian contigo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3 text-center">
              <p className="text-2xl font-bold text-warning">{shipmentCounts.pending}</p>
              <p className="text-xs text-muted-foreground">Por confirmar</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3 text-center">
              <p className="text-2xl font-bold text-primary">{shipmentCounts.accepted}</p>
              <p className="text-xs text-muted-foreground">En ruta</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3 text-center">
              <p className="text-2xl font-bold text-success">{shipmentCounts.delivered}</p>
              <p className="text-xs text-muted-foreground">Entregados</p>
            </div>
          </div>

          {tripConversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background px-4 py-5 text-sm text-muted-foreground">
              Todavia no hay emisores vinculados a este viaje. Cuando alguien te escriba desde este trayecto, aparecera aqui.
            </div>
          ) : (
            <div className="space-y-3">
              {tripConversations.map((conversation) => {
                const shipment = shipmentByConversationId.get(conversation.id) ?? null;
                const shipmentStatus = shipment ? shipmentStatusConfig[shipment.status] : null;

                return (
                  <div key={conversation.id} className="rounded-xl border border-border/70 bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{conversation.otherUserName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {conversation.routeOrigin} {"->"} {conversation.routeDestination}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={shipmentStatus ? shipmentStatus.className : "border-border bg-muted text-muted-foreground"}
                      >
                        {shipmentStatus?.label ?? "En conversacion"}
                      </Badge>
                    </div>

                    {!shipment ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Todavia estais hablando. Si finalmente os encaja, el emisor elegira este transporte desde la app.
                      </p>
                    ) : shipment.status === "pending" ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Transporte elegido. El emisor confirmara cuando el paquete ya este cargado.
                      </p>
                    ) : shipment.status === "delivered" ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {shipment.reviewRating
                          ? `Valorado con ${shipment.reviewRating} estrella(s).`
                          : "Entrega completada. Pendiente de valoracion por el emisor."}
                      </p>
                    ) : null}

                    <div className={`mt-4 grid gap-2 ${shipment ? "grid-cols-2" : "grid-cols-1"}`}>
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link to={`/app/messages/${conversation.id}`}>
                          <MessageSquare className="h-4 w-4" />
                          Chat
                        </Link>
                      </Button>

                      {shipment?.status === "pending" ? (
                        <Button type="button" size="sm" variant="outline" disabled>
                          Por cargar
                        </Button>
                      ) : null}

                      {shipment?.status === "accepted" ? (
                        <Button
                          type="button"
                          size="sm"
                          className="gap-2"
                          onClick={() => void handleMarkShipmentDelivered(shipment.id)}
                          disabled={updatingShipmentId === shipment.id}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {updatingShipmentId === shipment.id ? "Guardando..." : "Entregado"}
                        </Button>
                      ) : null}

                      {shipment?.status === "delivered" ? (
                        <Button type="button" size="sm" variant="outline" className="gap-2" disabled>
                          <CheckCircle2 className="h-4 w-4" />
                          Entregado
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
