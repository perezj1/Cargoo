import { Calendar, CarFront, Star } from "lucide-react";
import { Link } from "react-router-dom";

import RouteInline from "@/components/RouteInline";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/contexts/LocaleContext";
import type { Traveler } from "@/lib/mock-travelers";

const TravelerCard = ({ traveler }: { traveler: Traveler }) => {
  const { intlLocale, messages } = useLocale();
  const initials = traveler.name
    .split(" ")
    .map((namePart) => namePart[0])
    .join("");

  const formattedDate = new Date(traveler.date).toLocaleDateString(intlLocale, {
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
                {messages.travelerCard.public}
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            <span>{traveler.rating}</span>
            <span className="mx-1">&middot;</span>
            <span>{messages.travelerCard.trips(traveler.trips)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex justify-start">
          <RouteInline
            origin={traveler.origin}
            destination={traveler.destination}
            className="text-sm"
            labelClassName="text-card-foreground"
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div className="flex min-w-0 items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span className="break-words [overflow-wrap:anywhere]">{formattedDate}</span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <CarFront className="h-4 w-4" />
            <span className="break-words [overflow-wrap:anywhere]">{messages.travelerCard.available(traveler.capacity)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TravelerCard;
