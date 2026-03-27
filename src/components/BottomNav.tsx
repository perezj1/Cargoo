import { CarFront, Home, MessageSquare, Package, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getConversations } from "@/lib/cargoo-store";

const BottomNav = () => {
  const { pathname } = useLocation();
  const { profile, user } = useAuth();
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const items = profile?.isTraveler
    ? [
        { to: "/app", icon: Home, label: "Inicio" },
        { to: "/app/trips", icon: CarFront, label: "Viajes" },
        { to: "/app/messages", icon: MessageSquare, label: "Mensajes" },
        { to: "/app/profile", icon: User, label: "Perfil" },
      ]
    : [
        { to: "/app", icon: Home, label: "Inicio" },
        { to: "/app/shipments", icon: Package, label: "Envios" },
        { to: "/app/messages", icon: MessageSquare, label: "Mensajes" },
        { to: "/app/profile", icon: User, label: "Perfil" },
      ];

  const loadUnreadState = async () => {
    if (!user) {
      setHasUnreadMessages(false);
      return;
    }

    try {
      const conversations = await getConversations();
      setHasUnreadMessages(conversations.some((conversation) => conversation.unreadCount > 0));
    } catch {
      setHasUnreadMessages(false);
    }
  };

  useEffect(() => {
    void loadUnreadState();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const channel = supabase
      .channel("bottom-nav-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_conversations" }, () => void loadUnreadState())
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_messages" }, () => void loadUnreadState())
      .on("postgres_changes", { event: "*", schema: "public", table: "cargoo_conversation_hidden_states", filter: `user_id=eq.${user.id}` }, () => void loadUnreadState())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const itemsWithIndicators = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        showUnreadDot: item.to === "/app/messages" && hasUnreadMessages,
      })),
    [hasUnreadMessages, items],
  );

  return (
    <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {itemsWithIndicators.map((item) => {
          const active =
            item.to === "/app" ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <span className="relative">
                <item.icon className="h-5 w-5" />
                {item.showUnreadDot ? (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-card" />
                ) : null}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
