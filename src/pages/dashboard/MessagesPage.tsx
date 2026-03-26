import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getConversations, getFriendlyErrorMessage, type ConversationSummary } from "@/lib/cargoo-store";

const shipmentStatusConfig = {
  pending: { label: "Por cargar", className: "border-warning/20 bg-warning/10 text-warning" },
  accepted: { label: "En ruta", className: "border-primary/20 bg-primary/10 text-primary" },
  delivered: { label: "Entregado", className: "border-success/20 bg-success/10 text-success" },
} as const;

const formatConversationTime = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < oneDay) {
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }

  if (diff < oneDay * 7) {
    return date.toLocaleDateString("es-ES", { weekday: "short" });
  }

  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
};

const MessagesPage = () => {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

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
    const channel = supabase
      .channel("conversations-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_conversations" }, () => void loadConversations())
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_messages" }, () => void loadConversations())
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_shipments" }, () => void loadConversations())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(
    () => conversations.filter((conversation) => conversation.otherUserName.toLowerCase().includes(search.toLowerCase())),
    [conversations, search],
  );

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-2 text-2xl font-display font-bold">Mensajes</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {profile?.isTraveler
          ? "Habla con emisores sin salir de Cargoo."
          : "Abre una conversacion y coordina el envio dentro de la app."}
      </p>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar conversacion..."
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
          {filtered.map((conversation) => (
            <Link
              key={conversation.id}
              to={`/app/messages/${conversation.id}`}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-secondary"
            >
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
                    {formatConversationTime(conversation.lastMessageAt)}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{conversation.lastMessageText}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-[10px] text-primary/70">
                    {conversation.routeOrigin && conversation.routeDestination
                      ? `${conversation.routeOrigin} -> ${conversation.routeDestination}`
                      : "Chat directo"}
                  </p>
                  {conversation.shipmentStatus ? (
                    <Badge variant="outline" className={`text-[10px] ${shipmentStatusConfig[conversation.shipmentStatus].className}`}>
                      {shipmentStatusConfig[conversation.shipmentStatus].label}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm">No se encontraron conversaciones</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
