import { Calendar, CarFront, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import type { Traveler } from "@/lib/mock-travelers";

const TravelerCard = ({ traveler }: { traveler: Traveler }) => {
  const initials = traveler.name
    .split(" ")
    .map((namePart) => namePart[0])
    .join("");

  const formattedDate = new Date(traveler.date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      to={`/search?origin=${encodeURIComponent(traveler.origin)}&destination=${encodeURIComponent(traveler.destination)}`}
      className="group block rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate font-semibold text-card-foreground">{traveler.name}</h3>
            {traveler.isPublic ? (
              <Badge variant="secondary" className="shrink-0 text-xs">
                Publico
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            <span>{traveler.rating}</span>
            <span className="mx-1">·</span>
            <span>{traveler.trips} viajes</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-card-foreground">{traveler.origin}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-card-foreground">{traveler.destination}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CarFront className="h-4 w-4" />
            <span>{traveler.capacity} disponibles</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TravelerCard;
