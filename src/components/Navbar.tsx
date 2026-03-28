import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import BrandLogo from "@/components/BrandLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { messages } = useLocale();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container flex min-h-16 items-center justify-between gap-4 py-2">
        <Link to={user ? "/app" : "/"} className="flex shrink-0 items-center gap-2">
          <BrandLogo iconClassName="h-9 w-9 rounded-lg" />
        </Link>

        <div className="hidden min-w-0 items-center gap-4 lg:ml-auto lg:flex xl:gap-6">
          <Link
            to="/search"
            className={`whitespace-nowrap text-sm font-medium transition-colors ${isActive("/search") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {messages.navbar.searchDrivers}
          </Link>
          <Link
            to="/how-it-works"
            className={`whitespace-nowrap text-sm font-medium transition-colors ${isActive("/how-it-works") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {messages.navbar.howItWorks}
          </Link>
          <LanguageSwitcher compact className="shrink-0" />
          {user ? (
            <Button size="sm" asChild className="shrink-0">
              <Link to="/app">{messages.navbar.openApp}</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2 xl:gap-3">
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link to="/login">{messages.navbar.login}</Link>
              </Button>
              <Button size="sm" asChild className="shrink-0">
                <Link to="/register">{messages.navbar.register}</Link>
              </Button>
            </div>
          )}
        </div>

        <button
          className="p-2 text-foreground lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? messages.navbar.closeMenu : messages.navbar.openMenu}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="animate-fade-in overflow-x-hidden border-b border-border bg-background px-4 pb-4 lg:hidden">
          <div className="flex flex-col gap-3">
            <LanguageSwitcher compact className="w-full" />
            <Link to="/search" className="break-words py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
              {messages.navbar.searchDrivers}
            </Link>
            <Link to="/how-it-works" className="break-words py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
              {messages.navbar.howItWorks}
            </Link>
            {user ? (
              <Button size="sm" asChild>
                <Link to="/app" onClick={() => setMobileOpen(false)}>
                  {messages.navbar.openApp}
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    {messages.navbar.login}
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register" onClick={() => setMobileOpen(false)}>
                    {messages.navbar.register}
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
