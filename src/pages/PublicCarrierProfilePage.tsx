import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Calendar, CarFront, MapPin, MessageCircle, Package, Phone, Star } from "lucide-react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import RouteInline from "@/components/RouteInline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import {
  createShipmentRequest,
  getFriendlyErrorMessage,
  getOrCreateConversation,
  getPublicCarrierProfile,
  type PublicCarrierProfile,
} from "@/lib/cargoo-store";
import { formatTripScheduleLabel } from "@/lib/trip-schedule";

const PublicCarrierProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { userId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const selectedTripId = searchParams.get("trip") ?? "";
  const shouldAutoOpenChat = searchParams.get("openChat") === "1";
  const shouldAutoChooseTransport = searchParams.get("chooseTransport") === "1";
  const autoOpenRef = useRef(false);
  const [profile, setProfile] = useState<PublicCarrierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);
  const [selectingTripId, setSelectingTripId] = useState("");
  const { intlLocale, messages } = useLocale();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfile(await getPublicCarrierProfile(userId));
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [userId]);

  const orderedTrips = useMemo(() => {
    if (!profile) {
      return [];
    }

    if (!selectedTripId) {
      return profile.trips;
    }

    return [...profile.trips].sort((left, right) => {
      if (left.id === selectedTripId) return -1;
      if (right.id === selectedTripId) return 1;
      return new Date(left.date).getTime() - new Date(right.date).getTime();
    });
  }, [profile, selectedTripId]);

  const activeTrip = useMemo(() => {
    if (!orderedTrips.length) {
      return null;
    }

    return orderedTrips.find((trip) => trip.id === selectedTripId) ?? orderedTrips[0];
  }, [orderedTrips, selectedTripId]);
  const isOwnProfile = user?.id === profile?.userId;

  const digitsOnlyPhone = profile?.phone.replace(/[^\d+]/g, "") ?? "";
  const whatsappPhone = profile?.phone.replace(/[^\d]/g, "") ?? "";
  const ratingLabel =
    profile?.averageRating !== null && profile?.averageRating !== undefined
      ? new Intl.NumberFormat(intlLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(profile.averageRating)
      : messages.common.newLabel;
  const ratingCaption = profile?.reviewsCount
    ? messages.publicProfile.reviewsCount(profile.reviewsCount)
    : messages.publicProfile.noReviewsYet;

  const handleStartChat = async (tripId?: string) => {
    if (!profile) {
      return;
    }

    const tripToUse = orderedTrips.find((trip) => trip.id === tripId) ?? activeTrip;

    if (isOwnProfile) {
      toast.error(messages.publicProfile.ownChatError);
      return;
    }

    if (!user) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("openChat", "1");

      if (tripToUse?.id) {
        nextParams.set("trip", tripToUse.id);
      }

      navigate(`/login?next=${encodeURIComponent(`${location.pathname}?${nextParams.toString()}`)}`);
      return;
    }

    setStartingChat(true);
    try {
      const conversation = await getOrCreateConversation({
        otherUserId: profile.userId,
        otherUserName: profile.name,
        otherUserIsTraveler: profile.isTraveler,
        tripId: tripToUse?.id ?? null,
        routeOrigin: tripToUse?.origin ?? null,
        routeDestination: tripToUse?.destination ?? null,
      });

      navigate(`/app/messages/${conversation.id}`);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setStartingChat(false);
    }
  };

  const handleChooseTransport = async (tripId?: string) => {
    if (!profile) {
      return;
    }

    const tripToUse = orderedTrips.find((trip) => trip.id === tripId) ?? activeTrip;
    if (!tripToUse) {
      toast.error(messages.publicProfile.selectVisibleRoute);
      return;
    }

    if (isOwnProfile) {
      toast.error(messages.publicProfile.ownTransportError);
      return;
    }

    if (!user) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("chooseTransport", "1");
      nextParams.set("trip", tripToUse.id);
      navigate(`/login?next=${encodeURIComponent(`${location.pathname}?${nextParams.toString()}`)}`);
      return;
    }

    setSelectingTripId(tripToUse.id);
    try {
      const conversation = await getOrCreateConversation({
        otherUserId: profile.userId,
        otherUserName: profile.name,
        otherUserIsTraveler: profile.isTraveler,
        tripId: tripToUse.id,
        routeOrigin: tripToUse.origin,
        routeDestination: tripToUse.destination,
      });

      await createShipmentRequest(conversation.id);
      toast.success(messages.publicProfile.chooseTransportSuccess);
      navigate(`/app/messages/${conversation.id}`);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSelectingTripId("");
    }
  };

  useEffect(() => {
    if (autoOpenRef.current || !user || !profile) {
      return;
    }

    if (shouldAutoChooseTransport) {
      autoOpenRef.current = true;
      void handleChooseTransport(selectedTripId || activeTrip?.id);
      return;
    }

    if (shouldAutoOpenChat) {
      autoOpenRef.current = true;
      void handleStartChat();
    }
  }, [activeTrip?.id, isOwnProfile, profile, selectedTripId, shouldAutoChooseTransport, shouldAutoOpenChat, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
          <div className="container py-8">
            <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowLeft className="h-4 w-4" /> {messages.common.back}
            </button>

            <Card className="shadow-card">
              <CardContent className="p-6 text-center">
                <h1 className="mb-2 text-2xl font-display font-bold">{messages.publicProfile.unavailableTitle}</h1>
                <p className="mb-4 text-sm text-muted-foreground">{messages.publicProfile.unavailableDescription}</p>
                <Button asChild>
                  <Link to="/search">{messages.publicProfile.backToSearch}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="bg-secondary py-8">
          <div className="container">
            <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowLeft className="h-4 w-4" /> {messages.common.back}
            </button>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <Avatar className="h-16 w-16 shrink-0">
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                    {profile.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-display font-bold">{profile.name}</h1>
                    <Badge variant="secondary">{messages.publicProfile.publicProfileBadge}</Badge>
                  </div>
                  {profile.location.trim() ? (
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </p>
                  ) : null}
                  <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{profile.bio}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-foreground shadow-card">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="font-semibold">{ratingLabel}</span>
                    </div>
                    <span className="text-muted-foreground">{ratingCaption}</span>
                  </div>
                </div>
              </div>

              <Card className="w-full max-w-md shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{messages.publicProfile.contactTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.phone ? (
                    <div className="flex flex-col gap-3">
                      <Button size="lg" className="w-full gap-2" onClick={() => void handleStartChat()} disabled={startingChat || isOwnProfile}>
                        <MessageCircle className="h-4 w-4" />
                        {isOwnProfile ? messages.publicProfile.ownProfile : startingChat ? messages.publicProfile.openingChat : messages.publicProfile.openChat}
                      </Button>
                      <Button asChild size="lg" className="w-full gap-2">
                        <a href={`tel:${digitsOnlyPhone}`}>
                          <Phone className="h-4 w-4" />
                          {messages.publicProfile.call}
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="w-full gap-2">
                        <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer">
                          <MessageCircle className="h-4 w-4" />
                          {messages.publicProfile.openWhatsApp}
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-xl bg-secondary p-4 text-sm">
                        <p className="font-medium text-foreground">{messages.publicProfile.phoneLabel}</p>
                        <p className="mt-2 text-muted-foreground">{messages.publicProfile.noDirectContact}</p>
                      </div>
                      <Button size="lg" className="w-full gap-2" onClick={() => void handleStartChat()} disabled={startingChat || isOwnProfile}>
                        <MessageCircle className="h-4 w-4" />
                        {isOwnProfile ? messages.publicProfile.ownProfile : startingChat ? messages.publicProfile.openingChat : messages.publicProfile.openChat}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold">{messages.publicProfile.visibleTripsTitle}</h2>
              <p className="text-sm text-muted-foreground">{messages.publicProfile.visibleTripsCount(orderedTrips.length)}</p>
            </div>
            <Badge variant="outline" className="max-w-full bg-card whitespace-normal text-left leading-tight">
              <CarFront className="mr-1 h-3.5 w-3.5" />
              {profile.isTraveler ? messages.common.travelerBadge : "Cargoo"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {orderedTrips.map((trip) => {
              const formattedDate = formatTripScheduleLabel({
                date: trip.date,
                recurrence: trip.recurrence,
                intlLocale,
                weeklyLabel: messages.common.weeklyRoute,
                monthlyLabel: messages.common.monthlyRoute,
                format: "short",
              });
              const isSelected = trip.id === selectedTripId;

              return (
                <Card key={trip.id} className={`shadow-card ${isSelected ? "border-primary ring-1 ring-primary/30" : ""}`}>
                  <CardContent className="p-5">
                    <div className="mb-3 flex justify-start">
                      <RouteInline origin={trip.origin} destination={trip.destination} className="text-sm font-medium" />
                    </div>

                    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {formattedDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Package className="h-4 w-4" />
                        {messages.publicTripCard.totalCapacity(trip.capacityKg)}
                      </span>
                    </div>
                    {trip.vehicleType ? (
                      <div className="mb-3 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                        <CarFront className="h-4 w-4" />
                        <span className="break-words [overflow-wrap:anywhere]">
                          {messages.common.vehicle}: {trip.vehicleType}
                        </span>
                      </div>
                    ) : null}

                    {trip.stopCities.length > 0 ? (
                      <div className="mb-3 break-words rounded-xl bg-secondary p-3 text-sm text-muted-foreground [overflow-wrap:anywhere]">
                        <span className="font-medium text-foreground">{messages.publicProfile.availableStops}</span> {trip.stopCities.join(", ")}
                      </div>
                    ) : null}

                    {trip.notes ? <p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{trip.notes}</p> : null}

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className="flex-1 whitespace-normal text-center leading-tight"
                        onClick={() => void handleChooseTransport(trip.id)}
                        disabled={startingChat || Boolean(selectingTripId) || isOwnProfile}
                      >
                        {isOwnProfile ? messages.publicProfile.ownRoute : selectingTripId === trip.id ? messages.publicProfile.saving : messages.publicProfile.chooseTransport}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 whitespace-normal text-center leading-tight"
                        onClick={() =>
                          isSelected
                            ? void handleStartChat(trip.id)
                            : navigate(`/transportistas/${profile.userId}?trip=${encodeURIComponent(trip.id)}`)
                        }
                      >
                        {isSelected ? messages.publicProfile.openChat : messages.publicProfile.viewThisRoute}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-6 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 fill-warning text-warning" />
                {messages.publicProfile.reviewsTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between gap-4 rounded-xl bg-secondary p-4">
                <div>
                  <p className="text-3xl font-bold text-foreground">{ratingLabel}</p>
                  <p className="text-sm text-muted-foreground">{ratingCaption}</p>
                </div>
                <div className="flex items-center gap-1 text-warning">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${profile.averageRating !== null && index < Math.round(profile.averageRating) ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
              </div>

              {profile.reviews.length > 0 ? (
                <div className="space-y-3">
                  {profile.reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-border/70 bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{review.senderName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {review.routeOrigin} {"->"} {review.routeDestination}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Star className="h-4 w-4 fill-warning text-warning" />
                            <span className="text-sm font-semibold text-foreground">{review.rating}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {review.reviewedAt
                              ? new Intl.DateTimeFormat(intlLocale, {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }).format(new Date(review.reviewedAt))
                              : ""}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background px-4 py-5 text-sm text-muted-foreground">
                  {messages.publicProfile.noPublicComments}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicCarrierProfilePage;
