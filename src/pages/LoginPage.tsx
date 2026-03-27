import { useEffect, useState } from "react";
import { Mail, Lock } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFriendlyErrorMessage, loginUser } from "@/lib/cargoo-store";
import { LEGAL_LINKS } from "@/lib/legal";

const LoginPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(nextPath, { replace: true });
    }
  }, [navigate, nextPath, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await loginUser(email, password);
      toast.success("Sesion iniciada en Cargoo.");
      navigate(nextPath, { replace: true });
    } catch (error) {
      const message = getFriendlyErrorMessage(error);
      if (/Invalid login credentials/i.test(message)) {
        toast.error("Credenciales incorrectas. Revisa email y contrasena.");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="mb-6 inline-flex items-center gap-2">
            <BrandLogo />
          </Link>
          <h1 className="text-2xl font-display font-bold">Bienvenido de vuelta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Inicia sesion en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-card p-8 shadow-card">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="pl-10"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contrasena</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Minimo 8 caracteres"
                className="pl-10"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Entrando..." : "Iniciar sesion"}
          </Button>
          <div className="rounded-xl border border-border bg-secondary/60 p-4 text-xs leading-6 text-muted-foreground">
            Al iniciar sesion y continuar usando Cargoo confirmas que conoces los{" "}
            <Link to={LEGAL_LINKS.terms} className="font-medium text-primary hover:underline">
              Terminos de uso (AGB)
            </Link>
            , la{" "}
            <Link to={LEGAL_LINKS.privacy} className="font-medium text-primary hover:underline">
              Politica de privacidad
            </Link>
            , el{" "}
            <Link to={LEGAL_LINKS.disclaimer} className="font-medium text-primary hover:underline">
              Descargo de responsabilidad
            </Link>{" "}
            y el{" "}
            <Link to={LEGAL_LINKS.imprint} className="font-medium text-primary hover:underline">
              Impressum
            </Link>
            . Cargoo solo facilita el contacto entre usuarios; las operaciones entre ellos son responsabilidad propia.
          </div>
          <p className="text-center text-sm text-muted-foreground">
            No tienes cuenta?{" "}
            <Link to={`/register${searchParams.toString() ? `?${searchParams.toString()}` : ""}`} className="font-medium text-primary hover:underline">
              Registrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
