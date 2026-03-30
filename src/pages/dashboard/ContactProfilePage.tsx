import { ArrowLeft, MapPin, Phone, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import RouteInline from "@/components/RouteInline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/contexts/LocaleContext";
import {
  getConversationContactProfile,
  getFriendlyErrorMessage,
  type ConversationContactProfile,
} from "@/lib/cargoo-store";

const ContactProfilePage = () => {
  const navigate = useNavigate();
  const { conversationId = "" } = useParams();
  const { intlLocale, messages } = useLocale();
  const [profile, setProfile] = useState<ConversationContactProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfile(await getConversationContactProfile(conversationId));
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [conversationId]);

  const ratingLabel = useMemo(() => {
    if (profile?.averageRating === null || profile?.averageRating === undefined) {
      return messages.common.newLabel;
    }

    return new Intl.NumberFormat(intlLocale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(profile.averageRating);
  }, [intlLocale, messages.common.newLabel, profile?.averageRating]);

  const ratingCaption = profile?.reviewsCount ? messages.publicProfile.reviewsCount(profile.reviewsCount) : messages.publicProfile.noReviewsYet;
  const roleLabel = profile?.isTraveler ? messages.common.travelerBadge : messages.common.senderBadge;

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, index) => (
      <Star
        key={`${rating}-${index}`}
        className={`h-4 w-4 ${index < rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
      />
    ));

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6">
        <button onClick={() => navigate(`/app/messages/${conversationId}`)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> {messages.common.back}
        </button>

        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            <h1 className="mb-2 text-2xl font-display font-bold">{messages.contactProfilePage.unavailableTitle}</h1>
            <p className="mb-4 text-sm text-muted-foreground">{messages.contactProfilePage.unavailableDescription}</p>
            <Button asChild>
              <Link to={`/app/messages/${conversationId}`}>{messages.common.back}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <button onClick={() => navigate(`/app/messages/${conversationId}`)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {messages.common.back}
      </button>

      <Card className="mb-4 shadow-card">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {profile.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-display font-bold">{profile.name}</h1>
                <Badge variant="secondary">{roleLabel}</Badge>
              </div>

              {profile.location.trim() ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </p>
              ) : null}

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>

              {profile.phone.trim() ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>
                    {messages.contactProfilePage.phoneLabel}: {profile.phone}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 fill-warning text-warning" />
            {messages.publicProfile.reviewsTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between gap-4 rounded-xl bg-secondary p-4">
            <div>
              <p className="text-3xl font-bold text-foreground">{ratingLabel}</p>
              <p className="text-sm text-muted-foreground">{ratingCaption}</p>
              <p className="mt-2 text-xs text-muted-foreground">{messages.profileReviewsPage.averageLabel}</p>
            </div>
            <div className="flex items-center gap-1 text-warning">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`h-4 w-4 ${
                    profile.averageRating !== null && index < Math.round(profile.averageRating) ? "fill-warning text-warning" : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {profile.reviews.length > 0 ? (
            <div className="space-y-3">
              {profile.reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-border/70 bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{review.reviewerName}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                        {review.reviewedAt ? (
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.reviewedAt).toLocaleDateString(intlLocale, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">{review.rating}/5</span>
                  </div>

                  <div className="mt-3">
                    <RouteInline origin={review.routeOrigin} destination={review.routeDestination} className="text-sm font-medium" />
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {review.comment.trim() || messages.profileReviewsPage.noComment}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-background px-4 py-5 text-sm text-muted-foreground">
              {messages.contactProfilePage.noComments}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactProfilePage;
