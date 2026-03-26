import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CarFront, MessageSquare, Package, Plus, Search, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getConversations, getFriendlyErrorMessage, getTrips, getTripStats, type CargooTrip, type ConversationSummary } from "@/lib/cargoo-store";

const DashboardHome = () => {
  const { loading: authLoading, profile, profileLoading } = useAuth();
  const [trips, setTrips] = useState<CargooTrip[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [nextTrips, nextConversations] = await Promise.all([
          profile.isTraveler ? getTrips() : Promise.resolve([]),
          getConversations(),
        ]);
        setTrips(nextTrips);
        setConversations(nextConversations);
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [profile]);

  const unreadMessages = useMemo(
    () => conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    [conversations],
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

  const cards = profile.isTraveler
    ? [
        { label: "Viajes activos", value: String(stats.activeTrips), icon: CarFront, color: "text-primary" },
        { label: "Capacidad", value: `${stats.totalCapacityKg} kg`, icon: Package, color: "text-accent" },
        { label: "Mensajes", value: String(unreadMessages), icon: MessageSquare, color: "text-primary" },
        { label: "Valoracion", value: "4.8", icon: Star, color: "text-warning" },
      ]
    : [
        { label: "Chats activos", value: String(conversations.length), icon: MessageSquare, color: "text-primary" },
        { label: "Sin leer", value: String(unreadMessages), icon: Package, color: "text-accent" },
        { label: "Buscador", value: "Listo", icon: Search, color: "text-primary" },
        { label: "Cuenta", value: profile.isPublic ? "Publica" : "Privada", icon: Star, color: "text-warning" },
      ];

  const primaryAction = profile.isTraveler
    ? { to: "/app/trips/new", label: "Publicar nuevo viaje", icon: Plus }
    : { to: "/app/search", label: "Buscar transportistas", icon: Search };
  const PrimaryActionIcon = primaryAction.icon;

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
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>

      <Button asChild className="mb-6 w-full gap-2" size="lg">
        <Link to={primaryAction.to}>
          <PrimaryActionIcon className="h-4 w-4" />
          {primaryAction.label}
        </Link>
      </Button>

      <div className="mb-8 grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl bg-card p-4 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold">{profile.isTraveler ? "Contactos recientes" : "Conversaciones recientes"}</h2>
          <Link to="/app/messages" className="flex items-center gap-1 text-xs font-medium text-primary">
            Ver todo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {conversations.slice(0, 4).map((conversation) => (
            <Link key={conversation.id} to={`/app/messages/${conversation.id}`} className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
              <Avatar className="h-10 w-10">
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
          ))}

          {conversations.length === 0 ? (
            <div className="rounded-xl bg-card p-4 text-sm text-muted-foreground shadow-card">
              {profile.isTraveler
                ? "Todavia no tienes conversaciones activas. Cuando alguien te escriba desde una ficha publica aparecera aqui."
                : "Todavia no tienes conversaciones. Abre un perfil de transportista y escribe desde la app."}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
