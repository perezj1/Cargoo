import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Calendar, CarFront, MapPin, MessageCircle, Package, Phone } from "lucide-react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  createShipmentRequest,
  getFriendlyErrorMessage,
  getOrCreateConversation,
  getPublicCarrierProfile,
  type PublicCarrierProfile,
} from "@/lib/cargoo-store";

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

  const handleStartChat = async (tripId?: string) => {
    if (!profile) {
      return;
    }

    const tripToUse = orderedTrips.find((trip) => trip.id === tripId) ?? activeTrip;

    if (isOwnProfile) {
      toast.error("No puedes abrir un chat contigo mismo.");
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
      toast.error("Selecciona primero una ruta visible.");
      return;
    }

    if (isOwnProfile) {
      toast.error("No puedes elegir tu propio transporte.");
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
      toast.success("Transporte elegido. Cuando cargueis el paquete, podras confirmarlo desde el chat.");
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
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>

            <Card className="shadow-card">
              <CardContent className="p-6 text-center">
                <h1 className="mb-2 text-2xl font-display font-bold">Ficha no disponible</h1>
                <p className="mb-4 text-sm text-muted-foreground">
                  Este perfil ya no es publico o no tiene viajes visibles en este momento.
                </p>
                <Button asChild>
                  <Link to="/search">Volver a buscar</Link>
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
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  {profile.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-display font-bold">{profile.name}</h1>
                    <Badge variant="secondary">Perfil publico</Badge>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </p>
                  <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{profile.bio}</p>
                </div>
              </div>

              <Card className="w-full max-w-md shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Contacto del transportista</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl bg-secondary p-4 text-sm">
                    <p className="font-medium text-foreground">Telefono o WhatsApp</p>
                    <p className="mt-2 text-muted-foreground">{profile.phone || "Todavia no ha indicado un contacto directo."}</p>
                  </div>

                  {profile.phone ? (
                    <div className="flex flex-col gap-3">
                      <Button size="lg" className="w-full gap-2" onClick={() => void handleStartChat()} disabled={startingChat || isOwnProfile}>
                        <MessageCircle className="h-4 w-4" />
                        {isOwnProfile ? "Es tu propia ficha" : startingChat ? "Abriendo chat..." : "Escribir por la app"}
                      </Button>
                      <Button asChild size="lg" className="w-full gap-2">
                        <a href={`tel:${digitsOnlyPhone}`}>
                          <Phone className="h-4 w-4" />
                          Llamar
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="w-full gap-2">
                        <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer">
                          <MessageCircle className="h-4 w-4" />
                          Abrir WhatsApp
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <Button size="lg" className="w-full gap-2" onClick={() => void handleStartChat()} disabled={startingChat || isOwnProfile}>
                      <MessageCircle className="h-4 w-4" />
                      {isOwnProfile ? "Es tu propia ficha" : startingChat ? "Abriendo chat..." : "Escribir por la app"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-bold">Viajes visibles</h2>
              <p className="text-sm text-muted-foreground">{orderedTrips.length} ruta(s) publicadas por este transportista</p>
            </div>
            <Badge variant="outline" className="bg-card">
              <CarFront className="mr-1 h-3.5 w-3.5" />
              {profile.isTraveler ? "Transportista" : "Perfil Cargoo"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {orderedTrips.map((trip) => {
              const formattedDate = new Date(trip.date).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const isSelected = trip.id === selectedTripId;

              return (
                <Card key={trip.id} className={`shadow-card ${isSelected ? "border-primary ring-1 ring-primary/30" : ""}`}>
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <MapPin className="h-4 w-4 shrink-0 text-primary" />
                        <span>{trip.origin}</span>
                        <span className="text-muted-foreground">-&gt;</span>
                        <span>{trip.destination}</span>
                      </div>
                      {isSelected ? (
                        <Badge className="shrink-0">Ruta seleccionada</Badge>
                      ) : null}
                    </div>

                    <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {formattedDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Package className="h-4 w-4" />
                        {trip.availableKg}/{trip.capacityKg} kg libres
                      </span>
                    </div>

                    {trip.stopCities.length > 0 ? (
                      <div className="mb-3 rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Paradas disponibles:</span> {trip.stopCities.join(", ")}
                      </div>
                    ) : null}

                    {trip.notes ? <p className="text-sm text-muted-foreground">{trip.notes}</p> : null}

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => void handleChooseTransport(trip.id)}
                        disabled={startingChat || Boolean(selectingTripId) || isOwnProfile}
                      >
                        {isOwnProfile
                          ? "Es tu ruta"
                          : selectingTripId === trip.id
                            ? "Guardando..."
                            : "Elegir este transporte"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() =>
                          isSelected
                            ? void handleStartChat(trip.id)
                            : navigate(`/transportistas/${profile.userId}?trip=${encodeURIComponent(trip.id)}`)
                        }
                      >
                        {isSelected ? "Escribir por la app" : "Ver esta ruta"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicCarrierProfilePage;
