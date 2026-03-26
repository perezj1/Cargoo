import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, Package, Send, Star, Truck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import ShipmentReviewDialog from "@/components/ShipmentReviewDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const formatMessageTime = (value: string) =>
  new Date(value).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

const shipmentStatusConfig = {
  pending: {
    label: "Por cargar",
    className: "border-warning/20 bg-warning/10 text-warning",
  },
  accepted: {
    label: "En ruta",
    className: "border-primary/20 bg-primary/10 text-primary",
  },
  delivered: {
    label: "Entregado",
    className: "border-success/20 bg-success/10 text-success",
  },
} as const;

const ConversationPage = () => {
  const navigate = useNavigate();
  const { conversationId = "" } = useParams();
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
      toast.success("Transporte elegido. Cuando cargueis el paquete, podras confirmarlo aqui.");
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
      toast.success("Paquete cargado. El seguimiento ya esta activo.");
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
      toast.success("Valoracion guardada.");
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
      toast.success(`Checkpoint guardado en ${travelerTrip.nextStop.city}.`);
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
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
        <div className="rounded-xl bg-card p-6 text-center shadow-card">
          <h1 className="text-xl font-display font-bold">Conversacion no disponible</h1>
          <p className="mt-2 text-sm text-muted-foreground">No encontramos este chat o ya no tienes acceso a el.</p>
          <Button asChild className="mt-4">
            <Link to="/app/messages">Volver a mensajes</Link>
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
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="mb-4 rounded-xl bg-card p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-11 w-11">
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
              <p className="truncate text-xs text-muted-foreground">
                {conversation.routeOrigin && conversation.routeDestination
                  ? `${conversation.routeOrigin} -> ${conversation.routeDestination}`
                  : "Chat directo"}
              </p>
            </div>
          </div>

          {infoLink ? (
            <Button asChild type="button" size="sm" variant="outline" className="shrink-0">
              <Link to={infoLink}>Ver info</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {conversation.tripId ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {shipment ? (
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${shipmentStatus?.className ?? ""}`}
            >
              {shipment.status === "pending" ? <Clock3 className="mr-1 h-3.5 w-3.5" /> : null}
              {shipment.status === "accepted" ? <Truck className="mr-1 h-3.5 w-3.5" /> : null}
              {shipment.status === "delivered" ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : null}
              {shipmentStatus?.label}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Package className="mr-1 h-3.5 w-3.5" />
              Sin seguimiento activo
            </span>
          )}

          {canChooseTransport ? (
            <Button type="button" size="sm" onClick={() => void handleChooseTransport()} disabled={acting !== null}>
              {acting === "choose" ? "Guardando..." : "Elegir este transporte"}
            </Button>
          ) : null}

          {canMarkPackageLoaded ? (
            <Button type="button" size="sm" onClick={() => void handleMarkPackageLoaded()} disabled={acting !== null}>
              {acting === "loaded" ? "Activando..." : "Paquete cargado"}
            </Button>
          ) : null}

          {canAdvanceTrip ? (
            <Button type="button" size="sm" onClick={() => void handleAdvanceTrip()} disabled={acting !== null}>
              {acting === "checkpoint" ? "Guardando..." : `Estoy en ${travelerTrip?.nextStop?.city}`}
            </Button>
          ) : null}

          {canReviewShipment ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setReviewDialogOpen(true)}>
              <Star className="h-4 w-4" />
              Valorar
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
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 ? (
          <div className="flex min-h-[120px] items-center justify-center text-center text-sm text-muted-foreground">
            Todavia no hay mensajes en esta conversacion.
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <div className="rounded-2xl bg-card p-3 shadow-card">
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escribe tu mensaje..."
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
            aria-label="Enviar mensaje"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ShipmentReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        travelerName={conversation.otherUserIsTraveler ? conversation.otherUserName : "transportista"}
        saving={savingReview}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
};

export default ConversationPage;
