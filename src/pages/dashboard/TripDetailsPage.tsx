import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, CarFront, CheckCircle2, ChevronDown, Clock3, MessageSquare, Package, Route, ShieldCheck, Truck, Users } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import RouteInline from "@/components/RouteInline";
import ShipmentReviewDialog from "@/components/ShipmentReviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { supabase } from "@/integrations/supabase/client";
import { getTripRouteLabels, localizeLocationText } from "@/lib/location-catalog";
import {
  advanceTripToNextStop,
  getConversations,
  getFriendlyErrorMessage,
  getTripById,
  getTripShipments,
  markShipmentDelivered,
  submitShipmentReview,
  type CargooTripDetails,
  type ConversationSummary,
  type ShipmentSummary,
} from "@/lib/cargoo-store";
import { formatTripScheduleLabel } from "@/lib/trip-schedule";

const formatCheckpointDate = (value: string | null, intlLocale: string, emptyLabel: string) => {
  if (!value) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const TripDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading: authLoading, profile, profileLoading } = useAuth();
  const { intlLocale, locale, messages } = useLocale();
  const { tripId = "" } = useParams();
  const [trip, setTrip] = useState<CargooTripDetails | null>(null);
  const [shipments, setShipments] = useState<ShipmentSummary[]>([]);
  const [tripConversations, setTripConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [updatingShipmentId, setUpdatingShipmentId] = useState<string | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [reviewingShipment, setReviewingShipment] = useState<ShipmentSummary | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const statusConfig = {
    active: { label: messages.tripStatus.active, className: "border-success/20 bg-success/10 text-success" },
    completed: { label: messages.tripStatus.completed, className: "border-border bg-muted text-muted-foreground" },
  } as const;
  const shipmentStatusConfig = {
    pending: { label: messages.shipmentStatus.pending, className: "border-warning/20 bg-warning/10 text-warning" },
    accepted: { label: messages.shipmentStatus.accepted, className: "border-primary/20 bg-primary/10 text-primary" },
    delivered: { label: messages.shipmentStatus.delivered, className: "border-success/20 bg-success/10 text-success" },
  } as const;

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
    if (!profile?.userId) {
      return;
    }

    const channel = supabase
      .channel(`trip-details-${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_shipments", filter: `trip_id=eq.${tripId}` }, () => void loadTripData())
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_trip_stops", filter: `trip_id=eq.${tripId}` }, () => void loadTripData())
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_trips", filter: `id=eq.${tripId}` }, () => void loadTripData())
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cargoo_conversation_hidden_states", filter: `user_id=eq.${profile.userId}` },
        () => void loadTripData(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile?.userId, tripId]);

  useEffect(() => {
    if (loading || location.hash !== "#paquetes-pendientes") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      document.getElementById("paquetes-pendientes")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [loading, location.hash, shipments.length, tripConversations.length]);

  const handleAdvance = async () => {
    if (!trip?.nextStop) {
      return;
    }

    setAdvancing(true);

    try {
      const updatedTrip = await advanceTripToNextStop(trip.id);
      if (!updatedTrip) {
        throw new Error(messages.tripDetailsPage.checkpointUpdateError);
      }

      setTrip(updatedTrip);
      await loadTripData();
      toast.success(
        updatedTrip.nextStop
          ? messages.tripDetailsPage.checkpointSaved(localizeLocationText(updatedTrip.nextStop.city, locale))
          : updatedTrip.status === "completed"
            ? messages.tripDetailsPage.tripCompleted(localizeLocationText(updatedTrip.destination, locale))
            : messages.tripDetailsPage.destinationReached(localizeLocationText(updatedTrip.destination, locale)),
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
      toast.success(messages.tripDetailsPage.shipmentDeliveredSuccess);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setUpdatingShipmentId(null);
    }
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!reviewingShipment) {
      return;
    }

    setSavingReview(true);

    try {
      await submitShipmentReview({
        shipmentId: reviewingShipment.id,
        rating,
        comment,
      });
      setReviewingShipment(null);
      await loadTripData();
      toast.success(messages.conversationPage.reviewSaved);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSavingReview(false);
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
          <ArrowLeft className="h-4 w-4" /> {messages.common.back}
        </button>

        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            <h1 className="mb-2 text-2xl font-display font-bold">{messages.tripDetailsPage.notFoundTitle}</h1>
            <p className="mb-4 text-sm text-muted-foreground">{messages.tripDetailsPage.notFoundDescription}</p>
            <Button asChild>
              <Link to="/app/trips">{messages.tripDetailsPage.viewMyTrips}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[trip.status];
  const departureLabel = formatTripScheduleLabel({
    date: trip.date,
    recurrence: trip.recurrence,
    intlLocale,
    weeklyLabel: messages.common.weeklyRoute,
    monthlyLabel: messages.common.monthlyRoute,
    format: "long",
  });
  const routeLabels = getTripRouteLabels(trip, locale, {
    anyCityInCountry: messages.common.anyCityInCountry,
  });
  const routeSummary =
    trip.coverageMode === "country_flexible"
      ? `${routeLabels.originLabel} -> ${routeLabels.destinationLabel}`
      : trip.stops.map((stop) => localizeLocationText(stop.city, locale)).join(" -> ");
  const shipmentByConversationId = new Map(shipments.map((shipment) => [shipment.conversationId, shipment] as const));
  const shipmentCounts = {
    pending: tripConversations.filter((conversation) => {
      const shipment = shipmentByConversationId.get(conversation.id);
      return !shipment || shipment.status === "pending";
    }).length,
    accepted: shipments.filter((shipment) => shipment.status === "accepted").length,
    delivered: shipments.filter((shipment) => shipment.status === "delivered").length,
  };
  const shouldOpenPendingPackages = !trip.nextStop && trip.status === "active";

  const openPendingPackagesSection = () => {
    document.getElementById("paquetes-pendientes")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <button onClick={() => navigate("/app/trips")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {messages.common.back}
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">{messages.tripDetailsPage.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{messages.tripDetailsPage.subtitle}</p>
        </div>
        <Badge variant="outline" className={status.className}>
          {status.label}
        </Badge>
      </div>

      {trip.status === "completed" ? (
        <div className="mb-6 mt-3 flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link to={`/app/trips/new?reuseTrip=${encodeURIComponent(trip.id)}`}>{messages.tripDetailsPage.reuseTrip}</Link>
          </Button>
        </div>
      ) : (
        <div className="mb-6" />
      )}

      <Card className="mb-4 shadow-card">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="min-w-0 pr-2 text-lg">
              <RouteInline
                origin={routeLabels.originLabel}
                destination={routeLabels.destinationLabel}
                className="w-full text-lg"
                labelClassName="font-semibold text-foreground"
                pinClassName="h-5 w-5"
                arrowClassName="mt-1 h-5 w-5"
              />
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-[-0.25rem] h-10 w-10 shrink-0 rounded-full bg-accent text-accent-foreground shadow-sm hover:bg-accent/90 hover:text-accent-foreground"
              onClick={() => setDetailsExpanded((currentValue) => !currentValue)}
              aria-expanded={detailsExpanded}
              aria-label={detailsExpanded ? messages.tripDetailsPage.collapseDetails : messages.tripDetailsPage.expandDetails}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${detailsExpanded ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{messages.tripDetailsPage.routeProgress}</span>
              <span>{trip.progressPercent}%</span>
            </div>
            <Progress value={trip.progressPercent} />
          </div>

          {detailsExpanded ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{messages.tripDetailsPage.departure}</span>
                  </div>
                  <p className="mt-2 font-medium text-foreground">{departureLabel}</p>
                </div>

                <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>{messages.tripDetailsPage.availableCapacity}</span>
                  </div>
                  <p className="mt-2 font-medium text-foreground">
                    {Math.max(trip.capacityKg - trip.usedKg, 0)} de {trip.capacityKg} kg
                  </p>
                  {trip.vehicleType ? (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CarFront className="h-3.5 w-3.5" />
                      <span>
                        {messages.common.vehicle}: {trip.vehicleType}
                      </span>
                    </p>
                  ) : null}
                </div>

                <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{messages.tripDetailsPage.lastCheckpoint}</span>
                  </div>
                  <p className="mt-2 font-medium text-foreground">{localizeLocationText(trip.lastCheckpointCity, locale)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatCheckpointDate(trip.lastCheckpointAt, intlLocale, messages.tripDetailsPage.noUpdatesYet)}
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    <span>{messages.tripDetailsPage.nextCity}</span>
                  </div>
                  <p className="mt-2 font-medium text-foreground">
                    {trip.nextStop?.city
                      ? localizeLocationText(trip.nextStop.city, locale)
                      :
                      (trip.status === "completed" ? messages.tripDetailsPage.routeCompleted : messages.tripDetailsPage.destinationReachedLabel)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {trip.nextStop
                      ? messages.tripDetailsPage.markWhenArrived
                      : trip.status === "completed"
                        ? messages.tripDetailsPage.noPendingCheckpoints
                        : messages.tripDetailsPage.pendingDeliveryHint}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Route className="h-4 w-4 text-primary" />
                  <span className="font-medium">{messages.tripDetailsPage.routePublished}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{routeSummary}</p>
                {shouldOpenPendingPackages ? (
                  <Button className="mt-4 w-full" size="lg" onClick={openPendingPackagesSection}>
                    {messages.tripDetailsPage.deliverPendingShipments}
                  </Button>
                ) : (
                  <Button
                    className="mt-4 w-full"
                    size="lg"
                    onClick={handleAdvance}
                    disabled={advancing || !trip.nextStop || !trip.trackingAvailable}
                  >
                    {advancing
                      ? messages.tripDetailsPage.savingCheckpoint
                      : trip.nextStop
                        ? messages.tripDetailsPage.arrivedAt(localizeLocationText(trip.nextStop.city, locale))
                        : messages.tripDetailsPage.noPendingCities}
                  </Button>
                )}
                {!trip.trackingAvailable ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {messages.tripDetailsPage.trackingNeedsMigration}
                  </p>
                ) : !trip.nextStop && trip.status === "active" ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {messages.tripDetailsPage.destinationReachedPendingShipments}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card id="paquetes-pendientes" className="mb-4 scroll-mt-24 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            {messages.tripDetailsPage.peopleShipping}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3 text-center">
              <p className="text-2xl font-bold text-warning">{shipmentCounts.pending}</p>
              <p className="text-xs text-muted-foreground">{messages.tripDetailsPage.pendingConfirm}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3 text-center">
              <p className="text-2xl font-bold text-primary">{shipmentCounts.accepted}</p>
              <p className="text-xs text-muted-foreground">{messages.tripDetailsPage.accepted}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3 text-center">
              <p className="text-2xl font-bold text-success">{shipmentCounts.delivered}</p>
              <p className="text-xs text-muted-foreground">{messages.tripDetailsPage.deliveredPlural}</p>
            </div>
          </div>

          {tripConversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background px-4 py-5 text-sm text-muted-foreground">
              {messages.tripDetailsPage.noSendersYet}
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
                        <div className="mt-1">
                          <RouteInline
                            origin={conversation.routeOrigin}
                            destination={conversation.routeDestination}
                            className="w-full text-xs"
                            labelClassName="text-xs text-muted-foreground"
                            pinClassName="h-3 w-3 text-primary/70"
                            arrowClassName="mt-0.5 h-3 w-3 text-muted-foreground"
                          />
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={shipmentStatus ? shipmentStatus.className : "border-border bg-muted text-muted-foreground"}
                      >
                        {shipmentStatus?.label ?? messages.tripDetailsPage.inConversation}
                      </Badge>
                    </div>

                    {!shipment ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {messages.tripDetailsPage.talkingOnlyHint}
                      </p>
                    ) : shipment.status === "pending" ? (
                      <p className="mt-3 text-xs text-muted-foreground">{messages.tripDetailsPage.transportSelectedHint}</p>
                    ) : shipment.status === "delivered" ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {shipment.senderReviewRating
                          ? messages.tripDetailsPage.deliveredWithRating(shipment.senderReviewRating)
                          : messages.tripDetailsPage.deliveredPendingReview}
                      </p>
                    ) : null}

                    <div className={`mt-4 grid gap-2 ${shipment ? "grid-cols-2" : "grid-cols-1"}`}>
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link to={`/app/messages/${conversation.id}`}>
                          <MessageSquare className="h-4 w-4" />
                          {messages.tripDetailsPage.chat}
                        </Link>
                      </Button>

                      {shipment?.status === "pending" ? (
                        <Button type="button" size="sm" variant="outline" disabled>
                          {messages.shipmentStatus.pending}
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
                          {updatingShipmentId === shipment.id ? messages.tripDetailsPage.saving : messages.shipmentStatus.delivered}
                        </Button>
                      ) : null}

                      {shipment?.status === "delivered" ? (
                        shipment.senderReviewRating ? (
                          <Button type="button" size="sm" variant="outline" className="gap-2" disabled>
                            <CheckCircle2 className="h-4 w-4" />
                            {messages.shipmentStatus.delivered}
                          </Button>
                        ) : (
                          <Button type="button" size="sm" className="gap-2" onClick={() => setReviewingShipment(shipment)}>
                            <Star className="h-4 w-4 fill-warning text-warning" />
                            {messages.tripDetailsPage.rateSender}
                          </Button>
                        )
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
          <CardTitle className="text-lg">{messages.tripDetailsPage.stepByStepRoute}</CardTitle>
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
                    <p className="font-medium text-foreground">{localizeLocationText(stop.city, locale)}</p>
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
                      {isReached ? messages.tripDetailsPage.confirmed : isNext ? messages.tripDetailsPage.next : messages.tripDetailsPage.pending}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {stop.reachedAt
                      ? messages.tripDetailsPage.markedOn(
                          formatCheckpointDate(stop.reachedAt, intlLocale, messages.tripDetailsPage.noUpdatesYet),
                        )
                      : messages.tripDetailsPage.cityNotConfirmed}
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
          <p>{messages.tripDetailsPage.safeTrackingHint}</p>
        </CardContent>
      </Card>

      <ShipmentReviewDialog
        open={Boolean(reviewingShipment)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewingShipment(null);
          }
        }}
        recipientName={reviewingShipment?.senderName ?? messages.common.senderBadge}
        saving={savingReview}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
};

export default TripDetailsPage;
