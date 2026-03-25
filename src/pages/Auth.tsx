import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CarFront, Lock, Mail, Package2, Search, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { getAppHomePath, getStoredAppRole, type AppRole, setStoredAppRole } from "@/lib/app-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearPendingMarketplaceFilters,
  clearPendingSelectedTripId,
  defaultMarketplaceFilters,
  getMarketplaceUrl,
  readPendingMarketplaceFilters,
  readPendingSelectedTripId,
  takePendingMarketplaceFilters,
  takePendingSelectedTripId,
} from "@/lib/marketplace-filters";

const authSlides = [
  {
    title: "Cargoo te explica primero",
    text: "La landing deja claro como funciona la app con ejemplos antes de pedirte entrar.",
    icon: Search,
    tone: "peach-card",
  },
  {
    title: "Un emisor busca y contacta",
    text: "Filtra por salida, destino, fecha, hora y espacio disponible, y habla con el transportista.",
    icon: Package2,
    tone: "mint-card",
  },
  {
    title: "Un transportista gestiona el viaje",
    text: "Entra, revisa solicitudes, cierra el acuerdo, comparte codigo y marca cada etapa del envio.",
    icon: CarFront,
    tone: "sky-card",
  },
  {
    title: "La app sigue el envio",
    text: "Una vez acordado, Cargoo deja visible si esta reservado, recogido, en ruta o entregado.",
    icon: Smartphone,
    tone: "peach-card",
  },
];

const getPostAuthPath = (role: AppRole, consumePending = false) => {
  if (role === "emitter") {
    const pendingFilters = consumePending ? takePendingMarketplaceFilters() : readPendingMarketplaceFilters();
    const pendingSelectedTripId = consumePending ? takePendingSelectedTripId() : readPendingSelectedTripId();

    if (pendingFilters || pendingSelectedTripId) {
      return getMarketplaceUrl(pendingFilters ?? defaultMarketplaceFilters, pendingSelectedTripId ?? undefined);
    }
  } else {
    clearPendingMarketplaceFilters();
    clearPendingSelectedTripId();
  }

  return getAppHomePath(role);
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [accountMode, setAccountMode] = useState<AppRole>(getStoredAppRole());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next");

  useEffect(() => {
    if (user) {
      navigate(nextPath ?? getPostAuthPath(getStoredAppRole(), true), { replace: true });
    }
  }, [navigate, nextPath, user]);

  useEffect(() => {
    const requestedRole = searchParams.get("role");
    if (requestedRole === "emitter" || requestedRole === "traveler") {
      setAccountMode(requestedRole);
      setStoredAppRole(requestedRole);
    }
  }, [searchParams]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentSlide((current) => (current + 1) % authSlides.length);
    }, 4500);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleRoleChange = (role: AppRole) => {
    setAccountMode(role);
    setStoredAppRole(role);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStoredAppRole(accountMode);

    try {
      const { error } = isLogin ? await signIn(email, password) : await signUp(email, password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Credenciales incorrectas. Revisa email y contrasena.");
        } else if (error.message.includes("User already registered")) {
          toast.error("Ese email ya existe. Puedes iniciar sesion.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (isLogin) {
        toast.success("Sesion iniciada. Bienvenido a Cargoo.");
      } else {
        toast.success("Cuenta creada. Ya puedes entrar a la app.");
      }

      navigate(nextPath ?? getPostAuthPath(accountMode), { replace: true });
    } catch (_error) {
      toast.error("No se pudo completar la autenticacion.");
    } finally {
      setLoading(false);
    }
  };

  const activeSlide = authSlides[currentSlide];
  const ActiveIcon = activeSlide.icon;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 hero-mesh opacity-90" />

      <div className="relative mx-auto flex min-h-screen max-w-3xl items-center px-4 py-8 md:px-6">
        <div className="soft-panel w-full p-5 md:p-8">
          <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm">
            <div className={`rounded-[1.8rem] border border-black/5 p-5 md:p-6 ${activeSlide.tone}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-white shadow-sm">
                  <ActiveIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex gap-2">
                  {authSlides.map((slide, index) => (
                    <button
                      key={slide.title}
                      type="button"
                      onClick={() => setCurrentSlide(index)}
                      className={index === currentSlide ? "h-2.5 w-8 rounded-full bg-primary" : "h-2.5 w-2.5 rounded-full bg-black/15"}
                      aria-label={`Ir a la diapositiva ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <p className="mt-5 text-sm uppercase tracking-[0.2em] text-primary">CARRUSEL</p>
              <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight md:text-4xl">{activeSlide.title}</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{activeSlide.text}</p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  "Landing explicativa",
                  accountMode === "traveler" ? "Modo transportista" : "Modo emisor",
                  "App con bottom nav",
                ].map((item) => (
                  <div key={item} className="rounded-[1.25rem] border border-black/5 bg-white/80 px-4 py-3 text-sm font-medium text-foreground shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Card className="mt-5 border-black/5 bg-white/92 backdrop-blur-xl">
            <CardContent className="p-6 md:p-8">
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.2em] text-primary">Acceso</p>
                <h2 className="mt-3 font-heading text-3xl font-bold">{isLogin ? "Entra a Cargoo" : "Crea tu cuenta"}</h2>
                <p className="mt-2 text-muted-foreground">
                  {isLogin ? "Accede a tu app, contactos y estados." : "Elige tu tipo de cuenta y entra al panel correcto."}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2 rounded-full border border-border bg-secondary/80 p-1">
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    accountMode === "emitter" ? "cargoo-gradient text-white" : "text-muted-foreground"
                  }`}
                  onClick={() => handleRoleChange("emitter")}
                >
                  Emisor
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    accountMode === "traveler" ? "cargoo-gradient text-white" : "text-muted-foreground"
                  }`}
                  onClick={() => handleRoleChange("traveler")}
                >
                  Transportista
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4" autoComplete="on">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="pl-11"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contrasena</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Minimo 6 caracteres"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-11"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Procesando..." : isLogin ? "Entrar" : "Crear cuenta"}
                </Button>
              </form>

              <div className="mt-6 rounded-[1.5rem] border border-black/5 bg-secondary/70 p-4 text-sm text-muted-foreground">
                {accountMode === "traveler"
                  ? "Entraras al panel del transportista para revisar solicitudes, compartir codigos y marcar el avance real del viaje."
                  : "Entraras directamente a la busqueda para filtrar transportistas y luego revisar tus envios."}
              </div>

              <div className="mt-6 text-center">
                <button type="button" onClick={() => setIsLogin((current) => !current)} className="text-sm font-medium text-primary">
                  {isLogin ? "No tienes cuenta? Registrate" : "Ya tienes cuenta? Inicia sesion"}
                </button>
              </div>

              <div className="mt-4 text-center">
                <Link to="/home" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Volver a la landing
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
