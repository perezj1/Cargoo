import { useState } from "react";
import { MessageSquare, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

const MOCK_CONVERSATIONS = [
  { id: "1", name: "Luis Rodriguez", lastMsg: "Perfecto, te lo llevo el martes", time: "14:30", unread: 2, route: "Madrid → Barcelona" },
  { id: "2", name: "Marta Sanchez", lastMsg: "Cuanto espacio tienes disponible?", time: "12:15", unread: 0, route: "Barcelona → Valencia" },
  { id: "3", name: "Pedro Gomez", lastMsg: "Gracias por la entrega", time: "Ayer", unread: 0, route: "Sevilla → Malaga" },
  { id: "4", name: "Ana Lopez", lastMsg: "Envio confirmado", time: "Lun", unread: 1, route: "Bilbao → San Sebastian" },
];

const MessagesPage = () => {
  const [search, setSearch] = useState("");

  const filtered = MOCK_CONVERSATIONS.filter((conversation) => conversation.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-4 text-2xl font-display font-bold">Mensajes</h1>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar conversacion..."
          className="pl-10"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="space-y-1">
        {filtered.map((conversation) => (
          <button
            key={conversation.id}
            className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-secondary"
          >
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 font-medium text-primary">
                  {conversation.name
                    .split(" ")
                    .map((namePart) => namePart[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {conversation.unread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {conversation.unread}
                </span>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-medium">{conversation.name}</p>
                <span className="ml-2 whitespace-nowrap text-[10px] text-muted-foreground">{conversation.time}</span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{conversation.lastMsg}</p>
              <p className="mt-0.5 text-[10px] text-primary/70">{conversation.route}</p>
            </div>
          </button>
        ))}
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm">No se encontraron conversaciones</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MessagesPage;
