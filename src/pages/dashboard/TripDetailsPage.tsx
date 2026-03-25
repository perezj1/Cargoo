import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, CarFront, MapPin, Package, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFriendlyErrorMessage, getTripById, type CargooTrip } from "@/lib/cargoo-store";

const TripDetailsPage = () => {
  const navigate = useNavigate();
  const { tripId = "" } = useParams();
  const [trip, setTrip] = useState<CargooTrip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrip = async () => {
      try {
        setTrip(await getTripById(tripId));
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadTrip();
  }, [tripId]);

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
        <button onClick={() => navigate("/dashboard/trips")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>

        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            <h1 className="mb-2 text-2xl font-display font-bold">Viaje no encontrado</h1>
            <p className="mb-4 text-sm text-muted-foreground">El viaje que buscas no existe o ya no esta disponible.</p>
            <Button asChild>
              <Link to="/dashboard/trips">Ver mis viajes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedDate = new Date(trip.date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <button onClick={() => navigate("/dashboard/trips")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Detalle del viaje</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestiona tu ruta y revisa el espacio disponible.</p>
        </div>
        <Badge variant="outline" className={trip.status === "active" ? "border-success/20 bg-success/10 text-success" : ""}>
          {trip.status === "active" ? "Activo" : "Completado"}
        </Badge>
      </div>

      <Card className="mb-4 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            {trip.origin} → {trip.destination}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Salida prevista: {formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CarFront className="h-4 w-4" />
            <span>Capacidad total: {trip.capacityKg} kg</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>Espacio ocupado: {trip.usedKg} kg</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Solicitudes y notas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Tienes {trip.requests} solicitud(es) asociadas a este viaje.</p>
          <p>{trip.notes}</p>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
          <p>Este viaje se carga desde Supabase para que puedas revisar estado, capacidad y detalles en tiempo real.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TripDetailsPage;
