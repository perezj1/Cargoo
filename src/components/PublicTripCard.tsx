import { Calendar, CarFront, Package, Star } from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import RouteInline from "@/components/RouteInline";
import { useLocale } from "@/contexts/LocaleContext";
import type { PublicTripListing } from "@/lib/cargoo-store";

const PublicTripCard = ({ trip }: { trip: PublicTripListing }) => {
  const { intlLocale, messages } = useLocale();
  const initials = trip.carrierName
    .split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .slice(0, 2);

  const formattedDate = new Date(trip.date).toLocaleDateString(intlLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const ratingLabel =
    trip.averageRating !== null
      ? new Intl.NumberFormat(intlLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(trip.averageRating)
      : messages.common.newLabel;
  const ratingCaption =
    trip.reviewsCount > 0 ? messages.publicTripCard.reviews(trip.reviewsCount) : messages.publicTripCard.noReviews;

  return (
    <Link
      to={`/transportistas/${trip.userId}?trip=${encodeURIComponent(trip.id)}`}
      className="block rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="mb-4 flex items-start gap-4">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={trip.carrierAvatarUrl} alt={trip.carrierName} />
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate font-semibold text-card-foreground">{trip.carrierName}</h3>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {messages.publicTripCard.public}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{messages.publicTripCard.tripsPublished(trip.tripsCount)}</p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="font-medium text-foreground">{ratingLabel}</span>
            <span>{ratingCaption}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex justify-start">
          <RouteInline origin={trip.origin} destination={trip.destination} className="text-sm" labelClassName="text-card-foreground" />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div className="flex min-w-0 items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span className="break-words [overflow-wrap:anywhere]">{formattedDate}</span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <Package className="h-4 w-4" />
            <span className="break-words [overflow-wrap:anywhere]">{messages.publicTripCard.availableKg(trip.availableKg)}</span>
          </div>
        </div>
        {trip.vehicleType ? (
          <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <CarFront className="h-4 w-4" />
            <span className="break-words [overflow-wrap:anywhere]">
              {messages.common.vehicle}: {trip.vehicleType}
            </span>
          </div>
        ) : null}
        <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span className="break-words [overflow-wrap:anywhere]">{messages.publicTripCard.totalCapacity(trip.capacityKg)}</span>
        </div>
        {trip.notes ? <p className="line-clamp-2 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{trip.notes}</p> : null}
      </div>
    </Link>
  );
};

export default PublicTripCard;
