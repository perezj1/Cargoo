import { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { CarFront, LogOut, Package2, Search, UserRound } from "lucide-react";

import { PwaInstallPrompt } from "@/components/cargoo/PwaInstallPrompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getAppHomePath, getStoredAppRole } from "@/lib/app-role";
import { cn } from "@/lib/utils";

type PlatformLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
};

export function PlatformLayout({ children, title, subtitle, action }: PlatformLayoutProps) {
  const { user, signOut } = useAuth();
  const role = getStoredAppRole();
  const appHomePath = getAppHomePath(role);
  const navItems =
    role === "traveler"
      ? [
          { to: appHomePath, label: "Panel", icon: CarFront },
          { to: "/tracking", label: "Codigos", icon: Package2 },
        ]
      : [
          { to: appHomePath, label: "Buscar", icon: Search },
          { to: "/sender", label: "Mis envios", icon: Package2 },
        ];

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-28 md:pb-0">
      <div className="pointer-events-none absolute inset-0 hero-mesh opacity-90" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top,rgba(255,122,48,0.12),transparent_58%)]" />

      <header className="sticky top-0 z-40 border-b border-black/5 bg-background/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link to={user ? appHomePath : "/home"} className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.45rem] bg-[#111111] text-white shadow-lg shadow-black/15">
                <CarFront className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading text-lg font-bold tracking-tight text-foreground">Cargoo</p>
                <p className="text-xs text-muted-foreground">buscar, contactar y seguir</p>
              </div>
            </Link>
            <Badge className="hidden rounded-full border-black/5 bg-white px-3 py-1 text-foreground lg:inline-flex">
              PWA + seguimiento simple
            </Badge>
          </div>

          <nav className="hidden items-center gap-1 rounded-full bg-[#111111] p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.12)] md:flex">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white",
                    isActive && "cargoo-gradient text-white shadow-sm",
                  )
                }
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {action}
            {user ? (
              <>
                <div className="hidden items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-2 shadow-sm md:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div className="max-w-[180px] truncate text-sm font-medium text-foreground">{user.email}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => void signOut()}>
                  <LogOut className="h-4 w-4" />
                  Salir
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">Entrar</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {(title || subtitle) && (
        <section className="mx-auto max-w-7xl px-4 pb-2 pt-8 md:px-6">
          <div className="soft-panel relative overflow-hidden p-6 md:p-8">
            <div className="absolute -right-6 top-0 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Badge className="rounded-full border-black/5 bg-white px-4 py-1 text-foreground">Producto simple y directo</Badge>
                {title && <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight md:text-5xl">{title}</h1>}
                {subtitle && <p className="mt-3 max-w-3xl text-base text-muted-foreground md:text-lg">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-black/5 bg-[#111111] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/10">
                <Package2 className="h-4 w-4 text-primary" />
                Movil y escritorio
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-6 md:pb-16">{children}</main>

      <footer className="border-t border-black/5 bg-white/72 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="font-medium text-foreground">Cargoo conecta emisores con transportistas que ya van a ese destino.</p>
            <p className="mt-1">La app se centra en buscar perfiles, contactar y ver el estado del envio.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-full border-black/5 bg-white px-3 py-1 text-foreground">Suiza {"->"} Espana</Badge>
            <Badge className="rounded-full border-black/5 bg-white px-3 py-1 text-foreground">Suiza {"->"} Portugal</Badge>
            <Badge className="rounded-full border-black/5 bg-white px-3 py-1 text-foreground">Suiza {"->"} Serbia</Badge>
            <Badge className="rounded-full border-black/5 bg-white px-3 py-1 text-foreground">Suiza {"->"} Albania</Badge>
          </div>
        </div>
      </footer>

      <nav className="fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-[2rem] bg-[#111111] p-2.5 shadow-[0_22px_55px_rgba(15,23,42,0.28)] md:hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[1.25rem] px-2 py-2 text-[11px] font-medium text-white/70 transition-all",
                isActive && "bg-white text-[#111111] shadow-sm",
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-white",
                    isActive ? "bg-primary" : "bg-white/10",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <PwaInstallPrompt />
    </div>
  );
}
