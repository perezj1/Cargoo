import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CarFront, CheckCircle2, MapPin, MessageSquare, Package, Plus, Route, Search, Star, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  advanceTripToNextStop,
  getConversations,
  getFriendlyErrorMessage,
  getMyShipments,
  getTravelerRatingSummary,
  getTripById,
  getTrips,
  getTripStats,
  markConversationPackageLoaded,
  type CargooTripDetails,
  type CargooTrip,
  type ConversationSummary,
  type ShipmentSummary,
  type TravelerRatingSummary,
} from "@/lib/cargoo-store";

const shipmentStatusConfig = {
  pending: { label: "Por cargar", className: "border-warning/20 bg-warning/10 text-warning" },
  accepted: { label: "En ruta", className: "border-primary/20 bg-primary/10 text-primary" },
  delivered: { label: "Entregado", className: "border-success/20 bg-success/10 text-success" },
} as const;

const DashboardHome = () => {
  const { loading: authLoading, profile, profileLoading } = useAuth();
  const [trips, setTrips] = useState<CargooTrip[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [shipments, setShipments] = useState<ShipmentSummary[]>([]);
  const [activeTripDetails, setActiveTripDetails] = useState<CargooTripDetails | null>(null);
  const [ratingSummary, setRatingSummary] = useState<TravelerRatingSummary>({
    averageRating: null,
    reviewsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [advancingTrip, setAdvancingTrip] = useState(false);
  const [loadingShipmentConversationId, setLoadingShipmentConversationId] = useState<string | null>(null);
  const [searchOrigin, setSearchOrigin] = useState("");
  const [searchDestination, setSearchDestination] = useState("");

  const loadDashboardData = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    try {
      if (profile.isTraveler) {
        const [nextTrips, nextConversations, nextRatingSummary] = await Promise.all([
          getTrips(),
          getConversations(),
          getTravelerRatingSummary(profile.userId),
        ]);
        const nextActiveTrip = nextTrips.find((trip) => trip.status === "active");
        const nextActiveTripDetails = nextActiveTrip ? await getTripById(nextActiveTrip.id) : null;

        setTrips(nextTrips);
        setConversations(nextConversations);
        setShipments([]);
        setActiveTripDetails(nextActiveTripDetails);
        setRatingSummary(nextRatingSummary);
        return;
      }

      const [nextConversations, nextShipments] = await Promise.all([getConversations(), getMyShipments()]);
      setTrips([]);
      setConversations(nextConversations);
      setShipments(nextShipments);
      setActiveTripDetails(null);
      setRatingSummary({
        averageRating: null,
        reviewsCount: 0,
      });
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, [profile]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const reloadDashboard = () => {
      void loadDashboardData();
    };

    const channel = supabase
      .channel(`dashboard-home-${profile.userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_conversations" }, reloadDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_messages" }, reloadDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_shipments" }, reloadDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_trip_stops" }, reloadDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_trips" }, reloadDashboard)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile]);

  const unreadMessages = useMemo(
    () => conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    [conversations],
  );
  const shipmentCounts = useMemo(
    () => ({
      accepted: shipments.filter((shipment) => shipment.status === "accepted").length,
      delivered: shipments.filter((shipment) => shipment.status === "delivered").length,
      reviewPending: shipments.filter((shipment) => shipment.status === "delivered" && !shipment.reviewRating).length,
    }),
    [shipments],
  );

  if (authLoading || profileLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const stats = getTripStats(trips);
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  const ratingValue =
    ratingSummary.averageRating !== null ? String(ratingSummary.averageRating.toFixed(1)).replace(".", ",") : "Nueva";

  const cards = profile.isTraveler
    ? [
        { label: "Viajes activos", value: String(stats.activeTrips), icon: CarFront, color: "text-primary", to: "/app/trips" },
        { label: "Capacidad", value: `${stats.totalCapacityKg} kg`, icon: Package, color: "text-accent", to: "/app/trips" },
        { label: "Solicitudes", value: String(stats.pendingRequests), icon: MessageSquare, color: "text-primary", to: "/app/messages" },
        { label: "Valoracion", value: ratingValue, icon: Star, color: "text-warning", to: "/app/profile" },
      ]
    : [
        { label: "En ruta", value: String(shipmentCounts.accepted), icon: Truck, color: "text-primary", to: "/app/shipments?tab=active" },
        { label: "Entregados", value: String(shipmentCounts.delivered), icon: CheckCircle2, color: "text-success", to: "/app/shipments?tab=delivered" },
        { label: "Por valorar", value: String(shipmentCounts.reviewPending), icon: Star, color: "text-warning", to: "/app/shipments?tab=delivered" },
        { label: "Mensajes", value: String(unreadMessages), icon: MessageSquare, color: "text-accent", to: "/app/messages" },
      ];

  const primaryAction = profile.isTraveler
    ? { to: "/app/trips/new", label: "Publicar nuevo viaje", icon: Plus }
    : { to: "/app/search", label: "Buscar transportistas", icon: Search };
  const PrimaryActionIcon = primaryAction.icon;
  const sectionTitle = profile.isTraveler ? "Contactos recientes" : "Mis envios recientes";
  const sectionLink = profile.isTraveler ? "/app/messages" : "/app/shipments";
  const activeRouteSummary = activeTripDetails?.stops.map((stop) => stop.city).join(" -> ") ?? "";
  const shouldOpenPendingPackages = profile.isTraveler && activeTripDetails && !activeTripDetails.nextStop && activeTripDetails.status === "active";
  const searchPageParams = new URLSearchParams();

  if (searchOrigin.trim()) {
    searchPageParams.set("origin", searchOrigin.trim());
  }

  if (searchDestination.trim()) {
    searchPageParams.set("destination", searchDestination.trim());
  }

  const emitterSearchLink = searchPageParams.toString() ? `/app/search?${searchPageParams.toString()}` : "/app/search";

  const handleAdvanceActiveTrip = async () => {
    if (!activeTripDetails?.nextStop) {
      return;
    }

    setAdvancingTrip(true);

    try {
      const updatedTrip = await advanceTripToNextStop(activeTripDetails.id);
      const refreshedTrips = await getTrips();
      const nextActiveTrip = refreshedTrips.find((trip) => trip.status === "active");
      const nextActiveTripDetails = nextActiveTrip ? await getTripById(nextActiveTrip.id) : null;

      setTrips(refreshedTrips);
      setActiveTripDetails(nextActiveTripDetails);
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
      setAdvancingTrip(false);
    }
  };

  const handleMarkPackageLoaded = async (conversationId: string) => {
    setLoadingShipmentConversationId(conversationId);

    try {
      await markConversationPackageLoaded(conversationId);
      toast.success("Paquete cargado. El seguimiento ya esta activo.");
      await loadDashboardData();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoadingShipmentConversationId(null);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hola,</p>
          <h1 className="text-2xl font-display font-bold">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">{profile.location}</p>
        </div>
        <Link to="/app/profile">
          <Avatar className="h-11 w-11 border-2 border-primary">
            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>

      {!profile.isTraveler ? (
        <div className="mb-6 space-y-3">
          <h2 className="text-xl font-display font-semibold">Buscar transportistas</h2>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <Input
              placeholder="Origen"
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              value={searchOrigin}
              onChange={(event) => setSearchOrigin(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
            <MapPin className="h-4 w-4 shrink-0 text-accent" />
            <Input
              placeholder="Destino"
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              value={searchDestination}
              onChange={(event) => setSearchDestination(event.target.value)}
            />
          </div>
          <Button asChild className="w-full gap-2" size="lg">
            <Link to={emitterSearchLink}>
              <Search className="h-4 w-4" />
              Buscar
            </Link>
          </Button>
        </div>
      ) : (
        <Button asChild className="mb-6 w-full gap-2" size="lg">
          <Link to={primaryAction.to}>
            <PrimaryActionIcon className="h-4 w-4" />
            {primaryAction.label}
          </Link>
        </Button>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <Link key={card.label} to={card.to} className="block rounded-xl bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover">
            <div className="mb-2 flex items-center gap-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </Link>
        ))}
      </div>

      {profile.isTraveler && activeTripDetails ? (
        <div className="mb-6 rounded-xl border border-primary/15 bg-primary/5 p-5 shadow-card">
          <div className="flex items-center gap-2 text-foreground">
            <Route className="h-4 w-4 text-primary" />
            <span className="font-medium">Ruta publicada</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{activeRouteSummary}</p>
          {shouldOpenPendingPackages ? (
            <Button asChild className="mt-4 w-full" size="lg">
              <Link to={`/app/trips/${activeTripDetails.id}#paquetes-pendientes`}>Entrega los paquetes pendientes</Link>
            </Button>
          ) : (
            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={() => void handleAdvanceActiveTrip()}
              disabled={advancingTrip || !activeTripDetails.nextStop || !activeTripDetails.trackingAvailable}
            >
              {advancingTrip
                ? "Guardando checkpoint..."
                : activeTripDetails.nextStop
                  ? `Llegue a ${activeTripDetails.nextStop.city}`
                  : "No quedan ciudades pendientes"}
            </Button>
          )}
          {!activeTripDetails.trackingAvailable ? (
            <p className="mt-3 text-xs text-muted-foreground">
              El seguimiento por ciudades necesita la migracion nueva de Supabase para activarse.
            </p>
          ) : !activeTripDetails.nextStop && activeTripDetails.status === "active" ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Ya has llegado al destino. El viaje se cerrara cuando todos los paquetes esten marcados como entregados.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold">{sectionTitle}</h2>
          <Link to={sectionLink} className="flex items-center gap-1 text-xs font-medium text-primary">
            Ver todo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {profile.isTraveler
            ? conversations.slice(0, 4).map((conversation) => (
                <Link
                  key={conversation.id}
                  to={`/app/messages/${conversation.id}`}
                  className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.otherUserAvatarUrl} alt={conversation.otherUserName} />
                    <AvatarFallback className="bg-secondary text-sm font-medium text-foreground">
                      {conversation.otherUserName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{conversation.otherUserName}</p>
                    <p className="truncate text-xs text-muted-foreground">{conversation.lastMessageText}</p>
                    <p className="mt-0.5 text-[10px] text-primary/70">
                      {conversation.routeOrigin && conversation.routeDestination
                        ? `${conversation.routeOrigin} -> ${conversation.routeDestination}`
                        : "Chat directo"}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 ? (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </Link>
              ))
            : shipments.slice(0, 4).map((shipment) => {
                const status = shipmentStatusConfig[shipment.status];

                return (
                  <div key={shipment.id} className="rounded-xl bg-card p-4 shadow-card">
                    <Link to={`/app/messages/${shipment.conversationId}`} className="block">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {shipment.routeOrigin} {"->"} {shipment.routeDestination}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{shipment.travelerName}</p>
                        </div>
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {shipment.status === "pending"
                          ? "Transporte elegido. Falta confirmar cuando el paquete ya este cargado."
                          : shipment.nextCheckpointCity
                            ? `Ahora en ${shipment.currentCheckpointCity}. Siguiente: ${shipment.nextCheckpointCity}.`
                            : `Ultimo checkpoint: ${shipment.currentCheckpointCity}.`}
                      </p>
                    </Link>

                    {shipment.status === "pending" ? (
                      <Button
                        type="button"
                        className="mt-4 w-full"
                        onClick={() => void handleMarkPackageLoaded(shipment.conversationId)}
                        disabled={loadingShipmentConversationId === shipment.conversationId}
                      >
                        {loadingShipmentConversationId === shipment.conversationId ? "Activando..." : "Paquete cargado"}
                      </Button>
                    ) : null}
                  </div>
                );
              })}

          {(profile.isTraveler ? conversations.length === 0 : shipments.length === 0) ? (
            <div className="rounded-xl bg-card p-4 text-sm text-muted-foreground shadow-card">
              {profile.isTraveler
                ? "Todavia no tienes conversaciones activas. Cuando alguien te escriba desde una ficha publica aparecera aqui."
                : "Todavia no has elegido ningun transporte. Busca un transportista, habla con el y cuando te encaje pulsa en 'Elegir este transporte'."}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
