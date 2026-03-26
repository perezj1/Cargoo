import { Calendar, CarFront, MapPin, Package } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import type { PublicTripListing } from "@/lib/cargoo-store";

const PublicTripCard = ({ trip }: { trip: PublicTripListing }) => {
  const initials = trip.carrierName
    .split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .slice(0, 2);

  const formattedDate = new Date(trip.date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      to={`/transportistas/${trip.userId}?trip=${encodeURIComponent(trip.id)}`}
      className="block rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate font-semibold text-card-foreground">{trip.carrierName}</h3>
            <Badge variant="secondary" className="shrink-0 text-xs">
              Publico
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{trip.tripsCount} viaje(s) publicado(s)</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-card-foreground">{trip.origin}</span>
          <span className="text-muted-foreground">-&gt;</span>
          <span className="text-card-foreground">{trip.destination}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CarFront className="h-4 w-4" />
            <span>{trip.availableKg} kg libres</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>Capacidad total: {trip.capacityKg} kg</span>
        </div>
        {trip.notes ? <p className="line-clamp-2 text-sm text-muted-foreground">{trip.notes}</p> : null}
      </div>
    </Link>
  );
};

export default PublicTripCard;
