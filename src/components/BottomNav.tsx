import { CarFront, Home, MessageSquare, Search, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const items = [
  { to: "/dashboard", icon: Home, label: "Inicio" },
  { to: "/dashboard/trips", icon: CarFront, label: "Viajes" },
  { to: "/search", icon: Search, label: "Buscar" },
  { to: "/dashboard/messages", icon: MessageSquare, label: "Mensajes" },
  { to: "/dashboard/profile", icon: User, label: "Perfil" },
];

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {items.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
