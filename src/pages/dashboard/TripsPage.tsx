import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronRight, MapPin, Package, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFriendlyErrorMessage, getTrips, type CargooTrip } from "@/lib/cargoo-store";

const statusConfig = {
  active: { label: "Activo", className: "border-success/20 bg-success/10 text-success" },
  completed: { label: "Completado", className: "border-border bg-muted text-muted-foreground" },
} as const;

const TripsPage = () => {
  const [tab, setTab] = useState("active");
  const [trips, setTrips] = useState<CargooTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        setTrips(await getTrips());
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadTrips();
  }, []);

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => (tab === "all" ? true : trip.status === tab));
  }, [tab, trips]);

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Mis viajes</h1>
        <Button size="sm" asChild className="gap-1">
          <Link to="/dashboard/trips/new">
            <Plus className="h-4 w-4" /> Nuevo
          </Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">
            Activos
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            Completados
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1">
            Todos
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrips.map((trip) => {
            const status = statusConfig[trip.status];
            const formattedDate = new Date(trip.date).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <Link
                key={trip.id}
                to={`/dashboard/trips/${trip.id}`}
                className="block rounded-xl bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm font-medium">
                      {trip.origin} → {trip.destination}
                    </span>
                  </div>
                  <Badge variant="outline" className={status.className}>
                    {status.label}
                  </Badge>
                </div>
                <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formattedDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {trip.usedKg}/{trip.capacityKg} kg
                  </span>
                </div>
                {trip.status === "active" && trip.requests > 0 ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-accent">{trip.requests} solicitud(es) pendientes</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ) : null}
              </Link>
            );
          })}
          {filteredTrips.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm">No tienes viajes en esta categoria</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default TripsPage;
