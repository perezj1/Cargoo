import { useEffect, useState } from "react";
import { CarFront, EyeOff, Globe, Lock, Mail, User } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getFriendlyErrorMessage, registerUser } from "@/lib/cargoo-store";
import { LEGAL_LINKS } from "@/lib/legal";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/app";
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    isPublic: true,
    isTraveler: false,
    acceptedLegal: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(nextPath, { replace: true });
    }
  }, [navigate, nextPath, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.acceptedLegal) {
      toast.error("Debes aceptar los terminos y documentos legales para crear una cuenta.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        isTraveler: formData.isTraveler,
        isPublic: formData.isPublic,
      });

      if (result.needsEmailConfirmation) {
        toast.success("Cuenta creada. Revisa tu email para confirmar y luego iniciar sesion.");
        navigate("/login");
        return;
      }

      toast.success("Cuenta creada. Bienvenido a Cargoo.");
      navigate(nextPath, { replace: true });
    } catch (error) {
      const message = getFriendlyErrorMessage(error);
      if (/User already registered/i.test(message)) {
        toast.error("Ese email ya existe. Puedes iniciar sesion.");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="mb-6 inline-flex items-center gap-2">
            <BrandLogo />
          </Link>
          <h1 className="text-2xl font-display font-bold">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Unete a la comunidad de Cargoo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-card p-8 shadow-card">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Tu nombre"
                className="pl-10"
                value={formData.name}
                onChange={(event) => update("name", event.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="reg-email"
                type="email"
                placeholder="tu@email.com"
                className="pl-10"
                value={formData.email}
                onChange={(event) => update("email", event.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Contrasena</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="reg-password"
                type="password"
                placeholder="Minimo 8 caracteres"
                className="pl-10"
                value={formData.password}
                onChange={(event) => update("password", event.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-secondary p-4">
            <div className="flex items-center gap-3">
              <CarFront className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Soy conductor</p>
                <p className="text-xs text-muted-foreground">Quiero transportar paquetes</p>
              </div>
            </div>
            <Switch checked={formData.isTraveler} onCheckedChange={(value) => update("isTraveler", value)} />
          </div>

          {formData.isTraveler ? (
            <div className="animate-fade-in flex items-center justify-between rounded-lg bg-secondary p-4">
              <div className="flex items-center gap-3">
                {formData.isPublic ? (
                  <Globe className="h-5 w-5 text-primary" />
                ) : (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">Perfil {formData.isPublic ? "publico" : "privado"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formData.isPublic ? "Cualquier persona puede ver tus viajes" : "Solo usuarios registrados pueden contactarte"}
                  </p>
                </div>
              </div>
              <Switch checked={formData.isPublic} onCheckedChange={(value) => update("isPublic", value)} />
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-secondary/60 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="accepted-legal"
                checked={formData.acceptedLegal}
                onCheckedChange={(checked) => update("acceptedLegal", checked === true)}
                className="mt-1"
              />
              <Label htmlFor="accepted-legal" className="text-sm font-normal leading-6 text-muted-foreground">
                Al crear una cuenta acepto los{" "}
                <Link to={LEGAL_LINKS.terms} className="font-medium text-primary hover:underline">
                  Terminos de uso (AGB)
                </Link>
                , confirmo haber leido la{" "}
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
                .
              </Label>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Cargoo solo facilita el contacto entre usuarios. Los acuerdos, envios y transportes son responsabilidad exclusiva de las personas que usan la plataforma.
            </p>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading || !formData.acceptedLegal}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Ya tienes cuenta?{" "}
            <Link to={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ""}`} className="font-medium text-primary hover:underline">
              Inicia sesion
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
