import { useEffect, useMemo, useState } from "react";
import { Calendar, MessageSquare, Package, Star, Trash2, Truck } from "lucide-react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import RouteInline from "@/components/RouteInline";
import ShipmentReviewDialog from "@/components/ShipmentReviewDialog";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteDeliveredShipment,
  getFriendlyErrorMessage,
  getMyShipments,
  markConversationPackageLoaded,
  submitShipmentReview,
  type ShipmentSummary,
} from "@/lib/cargoo-store";

const normalizeTab = (value: string | null) => {
  if (value === "active" || value === "delivered") {
    return value;
  }

  return "active";
};

const ShipmentsPage = () => {
  const { loading: authLoading, profile, profileLoading } = useAuth();
  const { intlLocale, messages } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shipments, setShipments] = useState<ShipmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(() => normalizeTab(searchParams.get("tab")));
  const [reviewingShipment, setReviewingShipment] = useState<ShipmentSummary | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);
  const [shipmentToDelete, setShipmentToDelete] = useState<ShipmentSummary | null>(null);
  const [deletingShipmentId, setDeletingShipmentId] = useState<string | null>(null);
  const statusConfig = {
    pending: { label: messages.shipmentStatus.pending, className: "border-warning/20 bg-warning/10 text-warning" },
    accepted: { label: messages.shipmentStatus.accepted, className: "border-primary/20 bg-primary/10 text-primary" },
    delivered: { label: messages.shipmentStatus.delivered, className: "border-success/20 bg-success/10 text-success" },
  } as const;

  const loadShipments = async () => {
    try {
      setShipments(await getMyShipments());
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadShipments();
  }, []);

  useEffect(() => {
    setTab(normalizeTab(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    const channel = supabase
      .channel("shipments-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_shipments" }, () => void loadShipments())
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_trip_stops" }, () => void loadShipments())
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_trips" }, () => void loadShipments())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      if (tab === "active") {
        return shipment.status === "pending" || shipment.status === "accepted";
      }

      return shipment.status === "delivered";
    });
  }, [shipments, tab]);

  const counts = useMemo(
    () => ({
      active: shipments.filter((shipment) => shipment.status === "pending" || shipment.status === "accepted").length,
      delivered: shipments.filter((shipment) => shipment.status === "delivered").length,
    }),
    [shipments],
  );

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!reviewingShipment) {
      return;
    }

    setSavingReview(true);

    try {
      await submitShipmentReview({
        shipmentId: reviewingShipment.id,
        rating,
        comment,
      });
      toast.success(messages.shipmentsPage.reviewSaved);
      setReviewingShipment(null);
      await loadShipments();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSavingReview(false);
    }
  };

  const handleMarkPackageLoaded = async (conversationId: string) => {
    setLoadingConversationId(conversationId);

    try {
      await markConversationPackageLoaded(conversationId);
      toast.success(messages.shipmentsPage.packageLoadedSuccess);
      await loadShipments();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoadingConversationId(null);
    }
  };

  const handleDeleteDeliveredShipment = async () => {
    if (!shipmentToDelete) {
      return;
    }

    setDeletingShipmentId(shipmentToDelete.id);

    try {
      await deleteDeliveredShipment(shipmentToDelete.id);
      setShipmentToDelete(null);
      toast.success(messages.shipmentsPage.deletedSuccess);
      await loadShipments();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setDeletingShipmentId(null);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (profile?.isTraveler) {
    return <Navigate to="/app" replace />;
  }

  const handleTabChange = (nextTab: string) => {
    const normalizedTab = normalizeTab(nextTab);
    setTab(normalizedTab);
    setSearchParams(normalizedTab === "active" ? {} : { tab: normalizedTab });
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">{messages.shipmentsPage.title}</h1>
        <Badge variant="outline" className="bg-card">
          {messages.shipmentsPage.total(shipments.length)}
        </Badge>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">{messages.shipmentsPage.subtitle}</p>

      <Tabs value={tab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">{messages.shipmentsPage.activeTab(counts.active)}</TabsTrigger>
          <TabsTrigger value="delivered">{messages.shipmentsPage.completedTab(counts.delivered)}</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : filteredShipments.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Package className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">{messages.shipmentsPage.empty}</p>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {filteredShipments.map((shipment) => {
            const status = statusConfig[shipment.status];
            const formattedTripDate = shipment.tripDate
              ? new Date(`${shipment.tripDate}T00:00:00`).toLocaleDateString(intlLocale, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : messages.shipmentsPage.pendingDate;

            return (
              <div key={shipment.id} className="rounded-xl bg-card p-4 shadow-card">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 pr-3">
                    <RouteInline
                      origin={shipment.routeOrigin}
                      destination={shipment.routeDestination}
                      className="text-sm font-medium"
                      labelClassName="text-foreground"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{messages.shipmentsPage.travelerLabel(shipment.travelerName)}</p>
                  </div>
                  <Badge variant="outline" className={status.className}>
                    {status.label}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-background px-3 py-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{messages.shipmentsPage.departure}</span>
                    </div>
                    <p className="mt-2 font-medium text-foreground">{formattedTripDate}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background px-3 py-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Truck className="h-4 w-4" />
                      <span>{messages.shipmentsPage.currentCheckpoint}</span>
                    </div>
                    <p className="mt-2 font-medium text-foreground">{shipment.currentCheckpointCity}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {shipment.nextCheckpointCity
                        ? messages.shipmentsPage.nextCheckpoint(shipment.nextCheckpointCity)
                        : messages.shipmentsPage.noNextCheckpoint}
                    </p>
                  </div>
                </div>

                {shipment.status !== "pending" ? (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{messages.shipmentsPage.tracking}</span>
                      <span>{shipment.trackingProgressPercent}%</span>
                    </div>
                    <Progress value={shipment.trackingProgressPercent} />
                  </div>
                ) : null}

                {shipment.status === "pending" ? (
                  <div className="mt-4 rounded-xl border border-warning/20 bg-warning/10 px-3 py-3 text-sm text-warning">
                    {messages.shipmentsPage.pendingBanner}
                  </div>
                ) : null}

                {shipment.status === "delivered" ? (
                  <div className="mt-4 rounded-xl border border-success/20 bg-success/10 px-3 py-3 text-sm text-success">
                    {messages.shipmentsPage.deliveredBanner(shipment.reviewRating)}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-col gap-2">
                  <Button asChild variant="outline">
                    <Link to={`/app/messages/${shipment.conversationId}`}>
                      <MessageSquare className="h-4 w-4" />
                      {messages.shipmentsPage.openChat}
                    </Link>
                  </Button>

                  {shipment.status === "pending" ? (
                    <Button
                      type="button"
                      onClick={() => void handleMarkPackageLoaded(shipment.conversationId)}
                      disabled={loadingConversationId === shipment.conversationId}
                    >
                      <Package className="h-4 w-4" />
                      {loadingConversationId === shipment.conversationId ? messages.shipmentsPage.activating : messages.shipmentsPage.packageLoaded}
                    </Button>
                  ) : null}

                  {shipment.status === "delivered" && !shipment.reviewRating ? (
                    <Button type="button" onClick={() => setReviewingShipment(shipment)}>
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      {messages.shipmentsPage.rateTraveler}
                    </Button>
                  ) : null}

                  {shipment.status === "delivered" ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setShipmentToDelete(shipment)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {messages.shipmentsPage.deleteShipment}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ShipmentReviewDialog
        open={Boolean(reviewingShipment)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewingShipment(null);
          }
        }}
        travelerName={reviewingShipment?.travelerName ?? messages.shipmentsPage.genericTraveler}
        saving={savingReview}
        onSubmit={handleSubmitReview}
      />

      <AlertDialog
        open={Boolean(shipmentToDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingShipmentId) {
            setShipmentToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{messages.shipmentsPage.deleteDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{messages.shipmentsPage.deleteDialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingShipmentId)}>{messages.common.cancel}</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDeleteDeliveredShipment()}
              disabled={Boolean(deletingShipmentId)}
            >
              {deletingShipmentId ? messages.shipmentsPage.deleting : messages.shipmentsPage.deleteDialogButton}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ShipmentsPage;
