import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronRight, MapPin, Package, Plus, Trash2 } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { deleteCompletedTrip, getFriendlyErrorMessage, getTrips, type CargooTrip } from "@/lib/cargoo-store";

const statusConfig = {
  active: { label: "Activo", className: "border-success/20 bg-success/10 text-success" },
  completed: { label: "Completado", className: "border-border bg-muted text-muted-foreground" },
} as const;

const TripsPage = () => {
  const navigate = useNavigate();
  const { loading: authLoading, profile, profileLoading } = useAuth();
  const [tab, setTab] = useState("active");
  const [trips, setTrips] = useState<CargooTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripToDelete, setTripToDelete] = useState<CargooTrip | null>(null);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);

  const loadTrips = async () => {
    try {
      setTrips(await getTrips());
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTrips();
  }, []);

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => trip.status === tab);
  }, [tab, trips]);

  const counts = useMemo(
    () => ({
      active: trips.filter((trip) => trip.status === "active").length,
      completed: trips.filter((trip) => trip.status === "completed").length,
    }),
    [trips],
  );

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

  const handleDeleteCompletedTrip = async () => {
    if (!tripToDelete) {
      return;
    }

    setDeletingTripId(tripToDelete.id);

    try {
      await deleteCompletedTrip(tripToDelete.id);
      setTripToDelete(null);
      toast.success("Viaje completado eliminado.");
      await loadTrips();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setDeletingTripId(null);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Mis viajes</h1>
        <Button size="sm" asChild className="gap-1">
          <Link to="/app/trips/new">
            <Plus className="h-4 w-4" /> Nuevo
          </Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="flex-1">
            Activos {counts.active}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            Completados {counts.completed}
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
              <div key={trip.id} className="rounded-xl bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover">
                <Link to={`/app/trips/${trip.id}`} className="block">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm font-medium">
                        {trip.origin} {"->"} {trip.destination}
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
                  ) : trip.status === "completed" ? (
                    <p className="text-xs text-muted-foreground">Este trayecto ya termino, pero puedes reutilizarlo con otra fecha.</p>
                  ) : null}
                </Link>

                {trip.status === "completed" ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/app/trips/new?reuseTrip=${encodeURIComponent(trip.id)}`)}
                    >
                      Reutilizar trayecto
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setTripToDelete(trip)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                ) : null}
              </div>
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

      <AlertDialog
        open={Boolean(tripToDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingTripId) {
            setTripToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar viaje completado</AlertDialogTitle>
            <AlertDialogDescription>
              Este viaje se borrara del historial. Si tiene envios vinculados, tambien desapareceran junto con el viaje.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingTripId)}>Cancelar</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={() => void handleDeleteCompletedTrip()} disabled={Boolean(deletingTripId)}>
              {deletingTripId ? "Eliminando..." : "Eliminar viaje"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TripsPage;
