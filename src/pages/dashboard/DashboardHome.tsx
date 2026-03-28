import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CarFront, CheckCircle2, MapPin, MessageSquare, Package, Phone, Plus, Route, Search, Star, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import RouteInline from "@/components/RouteInline";
import ShipmentReviewDialog from "@/components/ShipmentReviewDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
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
  submitShipmentReview,
  type CargooTripDetails,
  type CargooTrip,
  type ConversationSummary,
  type ShipmentSummary,
  type TravelerRatingSummary,
} from "@/lib/cargoo-store";

const DashboardHome = () => {
  const { loading: authLoading, profile, profileLoading } = useAuth();
  const { intlLocale, messages } = useLocale();
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
  const [reviewingShipment, setReviewingShipment] = useState<ShipmentSummary | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [searchOrigin, setSearchOrigin] = useState("");
  const [searchDestination, setSearchDestination] = useState("");
  const shipmentStatusConfig = {
    pending: { label: messages.shipmentStatus.pending, className: "border-warning/20 bg-warning/10 text-warning" },
    accepted: { label: messages.shipmentStatus.accepted, className: "border-primary/20 bg-primary/10 text-primary" },
    delivered: { label: messages.shipmentStatus.delivered, className: "border-success/20 bg-success/10 text-success" },
  } as const;

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cargoo_conversation_hidden_states", filter: `user_id=eq.${profile.userId}` },
        reloadDashboard,
      )
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
    ratingSummary.averageRating !== null
      ? new Intl.NumberFormat(intlLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(ratingSummary.averageRating)
      : messages.common.newLabel;

  const cards = profile.isTraveler
    ? [
        { label: messages.dashboardHome.travelerCards.activeTrips, value: String(stats.activeTrips), icon: CarFront, color: "text-primary", to: "/app/trips" },
        { label: messages.dashboardHome.travelerCards.capacity, value: `${stats.totalCapacityKg} kg`, icon: Package, color: "text-accent", to: "/app/trips" },
        { label: messages.dashboardHome.travelerCards.requests, value: String(stats.pendingRequests), icon: MessageSquare, color: "text-primary", to: "/app/messages" },
        { label: messages.dashboardHome.travelerCards.rating, value: ratingValue, icon: Star, color: "text-warning", to: "/app/profile" },
      ]
    : [
        { label: messages.dashboardHome.senderCards.accepted, value: String(shipmentCounts.accepted), icon: Truck, color: "text-primary", to: "/app/shipments?tab=active" },
        { label: messages.dashboardHome.senderCards.delivered, value: String(shipmentCounts.delivered), icon: CheckCircle2, color: "text-success", to: "/app/shipments?tab=delivered" },
        { label: messages.dashboardHome.senderCards.reviewPending, value: String(shipmentCounts.reviewPending), icon: Star, color: "text-warning", to: "/app/shipments?tab=delivered" },
        { label: messages.dashboardHome.senderCards.messages, value: String(unreadMessages), icon: MessageSquare, color: "text-accent", to: "/app/messages" },
      ];

  const primaryAction = profile.isTraveler
    ? { to: "/app/trips/new", label: messages.dashboardHome.publishTrip, icon: Plus }
    : { to: "/app/search", label: messages.dashboardHome.findCarriers, icon: Search };
  const PrimaryActionIcon = primaryAction.icon;
  const sectionTitle = profile.isTraveler ? messages.dashboardHome.recentContacts : messages.dashboardHome.recentShipments;
  const sectionLink = profile.isTraveler ? "/app/messages" : "/app/shipments";
  const activeRouteSummary = activeTripDetails?.stops.map((stop) => stop.city).join(" -> ") ?? "";
  const shouldOpenPendingPackages = profile.isTraveler && activeTripDetails && !activeTripDetails.nextStop && activeTripDetails.status === "active";
  const featuredShipment = !profile.isTraveler ? shipments.find((shipment) => shipment.status === "accepted") ?? null : null;
  const recentSenderShipments = !profile.isTraveler
    ? shipments.filter((shipment) => shipment.id !== featuredShipment?.id).slice(0, 4)
    : [];
  const searchPageParams = new URLSearchParams();

  if (searchOrigin.trim()) {
    searchPageParams.set("origin", searchOrigin.trim());
  }

  if (searchDestination.trim()) {
    searchPageParams.set("destination", searchDestination.trim());
  }

  const emitterSearchLink = searchPageParams.toString() ? `/app/search?${searchPageParams.toString()}` : "/app/search";
  const featuredShipmentPhone = featuredShipment?.travelerPhone.replace(/[^\d+]/g, "") ?? "";

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
          ? messages.dashboardHome.checkpointSaved(updatedTrip.nextStop.city)
          : updatedTrip.status === "completed"
            ? messages.dashboardHome.tripCompleted(updatedTrip.destination)
            : messages.dashboardHome.destinationReached(updatedTrip.destination),
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
      toast.success(messages.dashboardHome.packageLoadedSuccess);
      await loadDashboardData();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoadingShipmentConversationId(null);
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
      toast.success(messages.shipmentsPage.reviewSaved);
      setReviewingShipment(null);
      await loadDashboardData();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{messages.dashboardHome.greeting}</p>
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
          <h2 className="text-xl font-display font-semibold">{messages.dashboardHome.searchCarriersTitle}</h2>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <Input
              placeholder={messages.dashboardHome.originPlaceholder}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              value={searchOrigin}
              onChange={(event) => setSearchOrigin(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
            <MapPin className="h-4 w-4 shrink-0 text-accent" />
            <Input
              placeholder={messages.dashboardHome.destinationPlaceholder}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              value={searchDestination}
              onChange={(event) => setSearchDestination(event.target.value)}
            />
          </div>
          <Button asChild className="w-full gap-2" size="lg">
            <Link to={emitterSearchLink}>
              <Search className="h-4 w-4" />
              {messages.dashboardHome.searchButton}
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
            <span className="font-medium">{messages.dashboardHome.routePublished}</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{activeRouteSummary}</p>
          {shouldOpenPendingPackages ? (
            <Button asChild className="mt-4 w-full" size="lg">
              <Link to={`/app/trips/${activeTripDetails.id}#paquetes-pendientes`}>{messages.dashboardHome.deliverPendingShipments}</Link>
            </Button>
          ) : (
            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={() => void handleAdvanceActiveTrip()}
              disabled={advancingTrip || !activeTripDetails.nextStop || !activeTripDetails.trackingAvailable}
            >
              {advancingTrip
                ? messages.dashboardHome.savingCheckpoint
                : activeTripDetails.nextStop
                  ? messages.dashboardHome.arrivedAt(activeTripDetails.nextStop.city)
                  : messages.dashboardHome.noPendingCities}
            </Button>
          )}
          {!activeTripDetails.trackingAvailable ? (
            <p className="mt-3 text-xs text-muted-foreground">{messages.dashboardHome.trackingNeedsMigration}</p>
          ) : !activeTripDetails.nextStop && activeTripDetails.status === "active" ? (
            <p className="mt-3 text-xs text-muted-foreground">{messages.dashboardHome.destinationReachedPendingShipments}</p>
          ) : null}
        </div>
      ) : null}

      {!profile.isTraveler && featuredShipment ? (
        <div className="mb-6 rounded-xl border border-primary/15 bg-primary/5 p-5 shadow-card">
          <div className="mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 text-foreground">
                <Truck className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium">{messages.dashboardHome.activeShipmentTitle}</span>
              </div>
              <Badge variant="outline" className="shrink-0 border-primary/20 bg-primary/10 text-primary">
                {messages.shipmentStatus.accepted}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{messages.dashboardHome.activeShipmentSubtitle}</p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-4">
            <RouteInline
              origin={featuredShipment.routeOrigin}
              destination={featuredShipment.routeDestination}
              className="text-sm font-medium"
              labelClassName="text-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">{featuredShipment.travelerName}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background px-3 py-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{messages.shipmentsPage.currentCheckpoint}</span>
                </div>
                <p className="mt-2 font-medium text-foreground">{featuredShipment.currentCheckpointCity}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background px-3 py-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Route className="h-4 w-4" />
                  <span>{messages.tripDetailsPage.nextCity}</span>
                </div>
                <p className="mt-2 font-medium text-foreground">
                  {featuredShipment.nextCheckpointCity ?? messages.shipmentsPage.noNextCheckpoint}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{messages.shipmentsPage.tracking}</span>
                <span>{featuredShipment.trackingProgressPercent}%</span>
              </div>
              <Progress value={featuredShipment.trackingProgressPercent} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button asChild variant="outline">
                <Link to={`/app/messages/${featuredShipment.conversationId}`}>
                  <MessageSquare className="h-4 w-4" />
                  {messages.shipmentsPage.openChat}
                </Link>
              </Button>

              {featuredShipmentPhone ? (
                <Button asChild>
                  <a href={`tel:${featuredShipmentPhone}`}>
                    <Phone className="h-4 w-4" />
                    {messages.publicProfile.call}
                  </a>
                </Button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold">{sectionTitle}</h2>
          <Link to={sectionLink} className="flex items-center gap-1 text-xs font-medium text-primary">
            {messages.dashboardHome.viewAll} <ArrowRight className="h-3 w-3" />
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
                    {conversation.routeOrigin && conversation.routeDestination ? (
                      <div className="mt-0.5">
                        <RouteInline
                          origin={conversation.routeOrigin}
                          destination={conversation.routeDestination}
                          className="max-w-full text-[10px]"
                          labelClassName="text-[10px] text-primary/70"
                          pinClassName="h-3 w-3 text-primary/70"
                          arrowClassName="mt-0.5 h-3 w-3 text-primary/60"
                        />
                      </div>
                    ) : (
                      <p className="mt-0.5 text-[10px] text-primary/70">{messages.dashboardHome.directChat}</p>
                    )}
                  </div>
                  {conversation.unreadCount > 0 ? (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </Link>
              ))
            : recentSenderShipments.map((shipment) => {
                const status = shipmentStatusConfig[shipment.status];

                return (
                  <div key={shipment.id} className="rounded-xl bg-card p-4 shadow-card">
                    <Link to={`/app/messages/${shipment.conversationId}`} className="block">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 pr-3">
                          <RouteInline
                            origin={shipment.routeOrigin}
                            destination={shipment.routeDestination}
                            className="text-sm font-medium"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">{shipment.travelerName}</p>
                        </div>
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {shipment.status === "pending"
                          ? messages.dashboardHome.selectedTransportPending
                          : shipment.nextCheckpointCity
                            ? messages.dashboardHome.nowInCheckpoint(shipment.currentCheckpointCity, shipment.nextCheckpointCity)
                            : messages.dashboardHome.lastCheckpoint(shipment.currentCheckpointCity)}
                      </p>
                    </Link>

                    {shipment.status === "pending" ? (
                      <Button
                        type="button"
                        className="mt-4 w-full"
                        onClick={() => void handleMarkPackageLoaded(shipment.conversationId)}
                        disabled={loadingShipmentConversationId === shipment.conversationId}
                      >
                        {loadingShipmentConversationId === shipment.conversationId ? messages.shipmentsPage.activating : messages.shipmentsPage.packageLoaded}
                      </Button>
                    ) : null}

                    {shipment.status === "delivered" && !shipment.reviewRating ? (
                      <Button type="button" className="mt-4 w-full" onClick={() => setReviewingShipment(shipment)}>
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        {messages.shipmentsPage.rateTraveler}
                      </Button>
                    ) : null}
                  </div>
                );
              })}

          {(profile.isTraveler ? conversations.length === 0 : recentSenderShipments.length === 0) ? (
            <div className="rounded-xl bg-card p-4 text-sm text-muted-foreground shadow-card">
              {profile.isTraveler
                ? messages.dashboardHome.noTravelerConversations
                : featuredShipment
                  ? messages.dashboardHome.noOtherRecentShipments
                  : messages.dashboardHome.noSenderShipments}
            </div>
          ) : null}
        </div>
      </div>

      <ShipmentReviewDialog
        open={Boolean(reviewingShipment)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewingShipment(null);
          }
        }}
        onSubmit={handleSubmitReview}
        saving={savingReview}
        travelerName={reviewingShipment?.travelerName ?? ""}
      />
    </div>
  );
};

export default DashboardHome;
