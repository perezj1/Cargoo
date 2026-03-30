import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Search, Star, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import RouteInline from "@/components/RouteInline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { supabase } from "@/integrations/supabase/client";
import { getConversations, getFriendlyErrorMessage, hideConversationForMe, type ConversationSummary } from "@/lib/cargoo-store";

const formatConversationTime = (value: string, intlLocale: string) => {
  const date = new Date(value);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < oneDay) {
    return date.toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" });
  }

  if (diff < oneDay * 7) {
    return date.toLocaleDateString(intlLocale, { weekday: "short" });
  }

  return date.toLocaleDateString(intlLocale, { day: "2-digit", month: "2-digit" });
};

const MessagesPage = () => {
  const { profile, user } = useAuth();
  const { intlLocale, messages } = useLocale();
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationToDelete, setConversationToDelete] = useState<ConversationSummary | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const shipmentStatusConfig = {
    pending: { label: messages.shipmentStatus.pending, className: "border-warning/20 bg-warning/10 text-warning" },
    accepted: { label: messages.shipmentStatus.accepted, className: "border-primary/20 bg-primary/10 text-primary" },
    delivered: { label: messages.shipmentStatus.delivered, className: "border-success/20 bg-success/10 text-success" },
  } as const;

  const loadConversations = async () => {
    try {
      setConversations(await getConversations());
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const channel = supabase
      .channel("conversations-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_conversations" }, () => void loadConversations())
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_messages" }, () => void loadConversations())
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cargoo_conversation_hidden_states", filter: `user_id=eq.${user.id}` },
        () => void loadConversations(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_shipments" }, () => void loadConversations())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const filtered = useMemo(
    () => conversations.filter((conversation) => conversation.otherUserName.toLowerCase().includes(search.toLowerCase())),
    [conversations, search],
  );

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) {
      return;
    }

    setDeletingConversationId(conversationToDelete.id);

    try {
      await hideConversationForMe(conversationToDelete.id);
      setConversationToDelete(null);
      toast.success(messages.messagesPage.deletedSuccess);
      await loadConversations();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setDeletingConversationId(null);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-2 text-2xl font-display font-bold">{messages.messagesPage.title}</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {profile?.isTraveler ? messages.messagesPage.travelerSubtitle : messages.messagesPage.senderSubtitle}
      </p>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={messages.messagesPage.searchPlaceholder}
          className="pl-10"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-1 pb-4">
          {filtered.map((conversation) => {
            const ratingLabel =
              conversation.otherUserAverageRating !== null
                ? new Intl.NumberFormat(intlLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
                    conversation.otherUserAverageRating,
                  )
                : messages.common.newLabel;
            const ratingCaption =
              conversation.otherUserAverageRating !== null
                ? messages.publicProfile.reviewsCount(conversation.otherUserReviewsCount)
                : messages.common.noReviewsYet;

            return (
              <div key={conversation.id} className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-secondary">
                <Link to={`/app/messages/${conversation.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.otherUserAvatarUrl} alt={conversation.otherUserName} />
                      <AvatarFallback className="bg-primary/10 font-medium text-primary">
                        {conversation.otherUserName
                          .split(" ")
                          .map((namePart) => namePart[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.unreadCount > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{conversation.otherUserName}</p>
                      <span className="ml-2 whitespace-nowrap text-[10px] text-muted-foreground">
                        {formatConversationTime(conversation.lastMessageAt, intlLocale)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{conversation.lastMessageText}</p>
                    <div className="mt-1">
                      {conversation.routeOrigin && conversation.routeDestination ? (
                        <RouteInline
                          origin={conversation.routeOrigin}
                          destination={conversation.routeDestination}
                          className="max-w-full text-[10px]"
                          labelClassName="text-[10px] text-primary/70"
                          pinClassName="h-3 w-3 text-primary/70"
                          arrowClassName="mt-0.5 h-3 w-3 text-primary/60"
                        />
                      ) : (
                        <p className="text-[10px] text-primary/70">{messages.messagesPage.directChat}</p>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Star className="h-3 w-3 shrink-0 fill-warning text-warning" />
                        <span className="font-medium text-foreground">{ratingLabel}</span>
                        <span className="truncate">{ratingCaption}</span>
                      </div>
                      {conversation.shipmentStatus ? (
                        <Badge variant="outline" className={`shrink-0 text-[10px] ${shipmentStatusConfig[conversation.shipmentStatus].className}`}>
                          {shipmentStatusConfig[conversation.shipmentStatus].label}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </Link>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground"
                  onClick={() => setConversationToDelete(conversation)}
                  aria-label={messages.messagesPage.deleteAria(conversation.otherUserName)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm">{messages.messagesPage.noResults}</p>
            </div>
          ) : null}
        </div>
      )}

      <AlertDialog
        open={Boolean(conversationToDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingConversationId) {
            setConversationToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{messages.messagesPage.deleteDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{messages.messagesPage.deleteDialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingConversationId)}>{messages.common.cancel}</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={() => void handleDeleteConversation()} disabled={Boolean(deletingConversationId)}>
              {deletingConversationId ? messages.shipmentsPage.deleting : messages.messagesPage.deleteDialogButton}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MessagesPage;
