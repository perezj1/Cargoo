import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to={user ? "/app" : "/"} className="flex items-center gap-2">
          <BrandLogo iconClassName="h-9 w-9 rounded-lg" />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link
            to="/search"
            className={`text-sm font-medium transition-colors ${isActive("/search") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Buscar conductores
          </Link>
          <Link
            to="/how-it-works"
            className={`text-sm font-medium transition-colors ${isActive("/how-it-works") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Como funciona
          </Link>
          {user ? (
            <Button size="sm" asChild>
              <Link to="/app">Abrir app</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Iniciar sesion</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Registrarse</Link>
              </Button>
            </div>
          )}
        </div>

        <button
          className="p-2 text-foreground md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Cerrar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="animate-fade-in border-b border-border bg-background px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/search" className="py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
              Buscar conductores
            </Link>
            <Link to="/how-it-works" className="py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
              Como funciona
            </Link>
            {user ? (
              <Button size="sm" asChild>
                <Link to="/app" onClick={() => setMobileOpen(false)}>
                  Abrir app
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    Iniciar sesion
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register" onClick={() => setMobileOpen(false)}>
                    Registrarse
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;
