import { useEffect, useState } from "react";
import { ArrowRight, CarFront, MessageSquare, Package, Plus, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getFriendlyErrorMessage, getTrips, getTripStats, type CargooTrip, type CargooUser } from "@/lib/cargoo-store";

const RECENT_REQUESTS = [
  { id: "1", sender: "Luis R.", route: "Madrid → Barcelona", item: "Ropa (3 kg)", time: "Hace 2 h" },
  { id: "2", sender: "Marta S.", route: "Barcelona → Valencia", item: "Documentos", time: "Hace 5 h" },
  { id: "3", sender: "Pedro G.", route: "Sevilla → Malaga", item: "Regalo (1 kg)", time: "Ayer" },
];

const DashboardHome = () => {
  const [user, setUser] = useState<CargooUser | null>(null);
  const [trips, setTrips] = useState<CargooTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profile, userTrips] = await Promise.all([getCurrentUser(), getTrips()]);
        setUser(profile);
        setTrips(userTrips);
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats = getTripStats(trips);
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  const cards = [
    { label: "Viajes activos", value: String(stats.activeTrips), icon: CarFront, color: "text-primary" },
    { label: "Solicitudes", value: String(stats.pendingRequests), icon: Package, color: "text-accent" },
    { label: "Mensajes", value: "12", icon: MessageSquare, color: "text-primary" },
    { label: "Valoracion", value: "4.8", icon: Star, color: "text-warning" },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hola,</p>
          <h1 className="text-2xl font-display font-bold">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.location}</p>
        </div>
        <Link to="/dashboard/profile">
          <Avatar className="h-11 w-11 border-2 border-primary">
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>

      <Button asChild className="mb-6 w-full gap-2" size="lg">
        <Link to="/dashboard/trips/new">
          <Plus className="h-4 w-4" />
          Publicar nuevo viaje
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
          <h2 className="text-lg font-display font-semibold">Solicitudes recientes</h2>
          <Link to="/dashboard/messages" className="flex items-center gap-1 text-xs font-medium text-primary">
            Ver todo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {RECENT_REQUESTS.map((request) => (
            <div key={request.id} className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-secondary text-sm font-medium text-foreground">
                  {request.sender.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {request.sender} - {request.item}
                </p>
                <p className="text-xs text-muted-foreground">{request.route}</p>
              </div>
              <span className="whitespace-nowrap text-[10px] text-muted-foreground">{request.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
