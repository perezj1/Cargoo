import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, Package, Send, Star, Truck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import RouteInline from "@/components/RouteInline";
import ShipmentReviewDialog from "@/components/ShipmentReviewDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/contexts/LocaleContext";
import { supabase } from "@/integrations/supabase/client";
import {
  advanceTripToNextStop,
  createShipmentRequest,
  getConversationMessages,
  getFriendlyErrorMessage,
  getTripById,
  markConversationPackageLoaded,
  markConversationAsRead,
  sendConversationMessage,
  submitShipmentReview,
  type ChatMessage,
  type CargooTripDetails,
  type ConversationSummary,
  type ShipmentSummary,
} from "@/lib/cargoo-store";

const formatMessageTime = (value: string, intlLocale: string) =>
  new Date(value).toLocaleTimeString(intlLocale, {
    hour: "2-digit",
    minute: "2-digit",
  });

const ConversationPage = () => {
  const navigate = useNavigate();
  const { conversationId = "" } = useParams();
  const { intlLocale, messages: localeMessages } = useLocale();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [shipment, setShipment] = useState<ShipmentSummary | null>(null);
  const [travelerTrip, setTravelerTrip] = useState<CargooTripDetails | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState<"choose" | "loaded" | "checkpoint" | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const shipmentStatusConfig = {
    pending: {
      label: localeMessages.shipmentStatus.pending,
      className: "border-warning/20 bg-warning/10 text-warning",
    },
    accepted: {
      label: localeMessages.shipmentStatus.accepted,
      className: "border-primary/20 bg-primary/10 text-primary",
    },
    delivered: {
      label: localeMessages.shipmentStatus.delivered,
      className: "border-success/20 bg-success/10 text-success",
    },
  } as const;

  const loadConversation = async () => {
    const data = await getConversationMessages(conversationId);

    if (!data) {
      setConversation(null);
      setMessages([]);
      setShipment(null);
      setTravelerTrip(null);
      return;
    }

    setConversation(data.conversation);
    setMessages(data.messages);
    setShipment(data.shipment);
    if (data.conversation.tripId && !data.conversation.otherUserIsTraveler) {
      setTravelerTrip(await getTripById(data.conversation.tripId));
    } else {
      setTravelerTrip(null);
    }
    await markConversationAsRead(conversationId);
  };

  useEffect(() => {
    const loadInitialConversation = async () => {
      try {
        setLoading(true);
        await loadConversation();
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadInitialConversation();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cargoo_messages", filter: `conversation_id=eq.${conversationId}` },
        async () => {
          await loadConversation();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cargoo_shipments", filter: `conversation_id=eq.${conversationId}` },
        async () => {
          await loadConversation();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversation?.tripId) {
      return;
    }

    const channel = supabase
      .channel(`conversation-trip-${conversation.tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cargoo_trip_stops", filter: `trip_id=eq.${conversation.tripId}` },
        async () => {
          await loadConversation();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cargoo_trips", filter: `id=eq.${conversation.tripId}` },
        async () => {
          await loadConversation();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversation?.tripId]);

  const handleSend = async () => {
    if (!draft.trim()) {
      return;
    }

    setSending(true);
    try {
      await sendConversationMessage(conversationId, draft);
      setDraft("");
      await loadConversation();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const handleChooseTransport = async () => {
    setActing("choose");

    try {
      await createShipmentRequest(conversationId);
      await loadConversation();
      toast.success(localeMessages.conversationPage.chooseTransportSuccess);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setActing(null);
    }
  };

  const handleMarkPackageLoaded = async () => {
    setActing("loaded");

    try {
      await markConversationPackageLoaded(conversationId);
      await loadConversation();
      toast.success(localeMessages.conversationPage.packageLoadedSuccess);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setActing(null);
    }
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!shipment) {
      return;
    }

    setSavingReview(true);

    try {
      await submitShipmentReview({
        shipmentId: shipment.id,
        rating,
        comment,
      });
      setReviewDialogOpen(false);
      await loadConversation();
      toast.success(localeMessages.conversationPage.reviewSaved);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSavingReview(false);
    }
  };

  const handleAdvanceTrip = async () => {
    if (!travelerTrip?.nextStop) {
      return;
    }

    setActing("checkpoint");

    try {
      await advanceTripToNextStop(travelerTrip.id);
      await loadConversation();
      toast.success(localeMessages.conversationPage.checkpointSaved(travelerTrip.nextStop.city));
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6">
        <button onClick={() => navigate("/app/messages")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> {localeMessages.common.back}
        </button>
        <div className="rounded-xl bg-card p-6 text-center shadow-card">
          <h1 className="text-xl font-display font-bold">{localeMessages.conversationPage.unavailableTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{localeMessages.conversationPage.unavailableDescription}</p>
          <Button asChild className="mt-4">
            <Link to="/app/messages">{localeMessages.conversationPage.backToMessages}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentUserIsTraveler = !conversation.otherUserIsTraveler;
  const shipmentStatus = shipment ? shipmentStatusConfig[shipment.status] : null;
  const canChooseTransport = Boolean(conversation.tripId) && !currentUserIsTraveler && !shipment;
  const canMarkPackageLoaded = Boolean(conversation.tripId) && !currentUserIsTraveler && shipment?.status === "pending";
  const canReviewShipment = !currentUserIsTraveler && shipment?.status === "delivered" && !shipment.reviewRating;
  const canAdvanceTrip =
    currentUserIsTraveler &&
    travelerTrip?.status === "active" &&
    travelerTrip?.trackingAvailable &&
    Boolean(travelerTrip?.nextStop);
  const infoLink = conversation.tripId ? (currentUserIsTraveler ? `/app/trips/${conversation.tripId}` : "/app/shipments") : null;

  return (
    <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-lg flex-col px-4 pb-4 pt-6">
      <button onClick={() => navigate("/app/messages")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {localeMessages.common.back}
      </button>

      <div className="mb-4 rounded-xl bg-card p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarImage src={conversation.otherUserAvatarUrl} alt={conversation.otherUserName} />
              <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                {conversation.otherUserName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-display font-bold">{conversation.otherUserName}</h1>
              {conversation.routeOrigin && conversation.routeDestination ? (
                <div className="mt-1">
                  <RouteInline
                    origin={conversation.routeOrigin}
                    destination={conversation.routeDestination}
                    className="w-full text-xs"
                    labelClassName="text-xs text-muted-foreground"
                    pinClassName="h-3 w-3 text-primary/70"
                    arrowClassName="mt-0.5 h-3 w-3 text-muted-foreground"
                  />
                </div>
              ) : (
                <p className="truncate text-xs text-muted-foreground">{localeMessages.conversationPage.directChat}</p>
              )}
            </div>
          </div>

          {infoLink ? (
            <Button asChild type="button" size="sm" variant="outline" className="shrink-0">
              <Link to={infoLink}>{localeMessages.conversationPage.viewInfo}</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {conversation.tripId ? (
        <div className="mb-4 flex items-center justify-between gap-2">
          {shipment ? (
            <span
              className={`inline-flex min-w-0 items-center rounded-full border px-3 py-1 text-xs font-medium ${shipmentStatus?.className ?? ""}`}
            >
              {shipment.status === "pending" ? <Clock3 className="mr-1 h-3.5 w-3.5" /> : null}
              {shipment.status === "accepted" ? <Truck className="mr-1 h-3.5 w-3.5" /> : null}
              {shipment.status === "delivered" ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : null}
              {shipmentStatus?.label}
            </span>
          ) : (
            <span className="inline-flex min-w-0 items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Package className="mr-1 h-3.5 w-3.5" />
              {localeMessages.conversationPage.inactive}
            </span>
          )}

          {canChooseTransport ? (
            <Button type="button" size="sm" className="shrink-0" onClick={() => void handleChooseTransport()} disabled={acting !== null}>
              {acting === "choose" ? localeMessages.conversationPage.saving : localeMessages.conversationPage.chooseTransport}
            </Button>
          ) : null}

          {canMarkPackageLoaded ? (
            <Button type="button" size="sm" className="shrink-0" onClick={() => void handleMarkPackageLoaded()} disabled={acting !== null}>
              {acting === "loaded" ? localeMessages.conversationPage.activating : localeMessages.conversationPage.packageLoaded}
            </Button>
          ) : null}

          {canAdvanceTrip ? (
            <Button type="button" size="sm" className="shrink-0" onClick={() => void handleAdvanceTrip()} disabled={acting !== null}>
              {acting === "checkpoint"
                ? localeMessages.conversationPage.saving
                : localeMessages.conversationPage.advanceToCity(travelerTrip?.nextStop?.city ?? "")}
            </Button>
          ) : null}

          {canReviewShipment ? (
            <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => setReviewDialogOpen(true)}>
              <Star className="h-4 w-4 fill-warning text-warning" />
              {localeMessages.conversationPage.rate}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="mb-4 flex-1 space-y-3 overflow-y-auto rounded-xl bg-card p-4 shadow-card">
        {messages.map((message) => {
          const isMine = message.senderId !== conversation.otherUserId;

          return (
            <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  isMine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <p className={`mt-2 text-[10px] ${isMine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {formatMessageTime(message.createdAt, intlLocale)}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 ? (
          <div className="flex min-h-[120px] items-center justify-center text-center text-sm text-muted-foreground">
            {localeMessages.conversationPage.noMessages}
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <div className="rounded-2xl bg-card p-3 shadow-card">
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={localeMessages.conversationPage.inputPlaceholder}
            className="h-11 rounded-full border-0 bg-secondary/80 shadow-none focus-visible:ring-1"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSend();
              }
            }}
          />
          <Button
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full"
            onClick={() => void handleSend()}
            disabled={sending || !draft.trim()}
            aria-label={localeMessages.conversationPage.sendMessage}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ShipmentReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        travelerName={conversation.otherUserIsTraveler ? conversation.otherUserName : localeMessages.conversationPage.genericTraveler}
        saving={savingReview}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
};

export default ConversationPage;
