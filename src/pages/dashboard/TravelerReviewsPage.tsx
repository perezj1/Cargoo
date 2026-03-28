import { ArrowLeft, Calendar, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import RouteInline from "@/components/RouteInline";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { getFriendlyErrorMessage, getTravelerReviews, type TravelerReviewsResult } from "@/lib/cargoo-store";

const TravelerReviewsPage = () => {
  const { profile } = useAuth();
  const { intlLocale, messages } = useLocale();
  const [loading, setLoading] = useState(true);
  const [reviewsData, setReviewsData] = useState<TravelerReviewsResult>({
    averageRating: null,
    reviewsCount: 0,
    reviews: [],
  });

  useEffect(() => {
    const loadReviews = async () => {
      if (!profile?.isTraveler) {
        setLoading(false);
        return;
      }

      try {
        setReviewsData(await getTravelerReviews(profile.userId));
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadReviews();
  }, [profile]);

  const averageLabel = useMemo(() => {
    if (reviewsData.averageRating === null) {
      return messages.common.newLabel;
    }

    return new Intl.NumberFormat(intlLocale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(reviewsData.averageRating);
  }, [intlLocale, messages.common.newLabel, reviewsData.averageRating]);

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

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <Link to="/app/profile" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {messages.common.back}
      </Link>

      <div className="mb-4 rounded-xl bg-card p-5 shadow-card">
        <h1 className="text-2xl font-display font-bold">{messages.profileReviewsPage.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{messages.profileReviewsPage.subtitle}</p>

        <div className="mt-5 flex items-end gap-3">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-display font-bold">{averageLabel}</span>
            <Star className="h-5 w-5 fill-warning text-warning" />
          </div>
          <p className="pb-1 text-sm text-muted-foreground">{messages.appProfile.reviewsCount(reviewsData.reviewsCount)}</p>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">{messages.profileReviewsPage.averageLabel}</p>
      </div>

      {reviewsData.reviews.length ? (
        <div className="space-y-3 pb-6">
          {reviewsData.reviews.map((review) => (
            <div key={review.id} className="rounded-xl bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{review.senderName}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                    {review.reviewedAt ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
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
        <div className="rounded-xl bg-card p-5 text-sm text-muted-foreground shadow-card">{messages.profileReviewsPage.noReviews}</div>
      )}
    </div>
  );
};

export default TravelerReviewsPage;
