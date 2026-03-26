import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  getConversationMessages,
  getFriendlyErrorMessage,
  markConversationAsRead,
  sendConversationMessage,
  type ChatMessage,
  type ConversationSummary,
} from "@/lib/cargoo-store";

const formatMessageTime = (value: string) =>
  new Date(value).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

const ConversationPage = () => {
  const navigate = useNavigate();
  const { conversationId = "" } = useParams();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadConversation = async () => {
      try {
        const data = await getConversationMessages(conversationId);

        if (!data) {
          setConversation(null);
          setMessages([]);
          return;
        }

        setConversation(data.conversation);
        setMessages(data.messages);
        await markConversationAsRead(conversationId);
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadConversation();
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
          const data = await getConversationMessages(conversationId);
          if (data) {
            setConversation(data.conversation);
            setMessages(data.messages);
            await markConversationAsRead(conversationId);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const handleSend = async () => {
    if (!draft.trim()) {
      return;
    }

    setSending(true);
    try {
      await sendConversationMessage(conversationId, draft);
      setDraft("");
      const data = await getConversationMessages(conversationId);
      if (data) {
        setConversation(data.conversation);
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSending(false);
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

  return (
    <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-lg flex-col px-4 pt-6">
      <button onClick={() => navigate("/app/messages")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="mb-4 flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
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

      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-card p-4 shadow-card">
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
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 pb-4">
        <div className="rounded-xl bg-card p-3 shadow-card">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="Escribe tu mensaje..."
            className="mb-3 min-h-[88px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
          />
          <Button className="w-full gap-2" onClick={() => void handleSend()} disabled={sending || !draft.trim()}>
            <Send className="h-4 w-4" />
            {sending ? "Enviando..." : "Enviar mensaje"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;
