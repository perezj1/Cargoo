import { useEffect, useState } from "react";
import { CarFront, EyeOff, Globe, Lock, Mail, User } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import BrandLogo from "@/components/BrandLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
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
  const { locale, messages } = useLocale();
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
      toast.error(messages.register.mustAcceptLegal);
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
        locale,
      });

      if (result.needsEmailConfirmation) {
        toast.success(messages.register.confirmEmail);
        navigate("/login");
        return;
      }

      toast.success(messages.register.success);
      navigate(nextPath, { replace: true });
    } catch (error) {
      const message = getFriendlyErrorMessage(error);
      if (/User already registered/i.test(message)) {
        toast.error(messages.register.userExists);
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
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher compact />
        </div>
        <div className="mb-8 text-center">
          <Link to="/" className="mb-6 inline-flex items-center gap-2">
            <BrandLogo />
          </Link>
          <h1 className="text-2xl font-display font-bold">{messages.register.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{messages.register.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-card p-8 shadow-card">
          <div className="space-y-2">
            <Label htmlFor="name">{messages.register.name}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                placeholder={messages.register.namePlaceholder}
                className="pl-10"
                value={formData.name}
                onChange={(event) => update("name", event.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">{messages.register.email}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="reg-email"
                type="email"
                placeholder={messages.register.emailPlaceholder}
                className="pl-10"
                value={formData.email}
                onChange={(event) => update("email", event.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">{messages.register.password}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="reg-password"
                type="password"
                placeholder={messages.register.passwordPlaceholder}
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
                <p className="text-sm font-medium">{messages.register.travelerTitle}</p>
                <p className="text-xs text-muted-foreground">{messages.register.travelerDescription}</p>
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
                  <p className="text-sm font-medium">{formData.isPublic ? messages.register.publicTitle : messages.register.privateTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {formData.isPublic ? messages.register.publicDescription : messages.register.privateDescription}
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
                {messages.register.legalAcceptance}{" "}
                <Link to={LEGAL_LINKS.terms} className="font-medium text-primary hover:underline">
                  {messages.footer.terms}
                </Link>
                {messages.register.legalMiddle1}{" "}
                <Link to={LEGAL_LINKS.privacy} className="font-medium text-primary hover:underline">
                  {messages.footer.privacy}
                </Link>
                {messages.register.legalMiddle2}{" "}
                <Link to={LEGAL_LINKS.disclaimer} className="font-medium text-primary hover:underline">
                  {messages.footer.disclaimer}
                </Link>{" "}
                {messages.register.legalMiddle3}{" "}
                <Link to={LEGAL_LINKS.imprint} className="font-medium text-primary hover:underline">
                  {messages.footer.imprint}
                </Link>
                {messages.register.legalEnd}
              </Label>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{messages.register.legalNotice}</p>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading || !formData.acceptedLegal}>
            {loading ? messages.register.submitting : messages.register.submit}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {messages.register.hasAccount}{" "}
            <Link to={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ""}`} className="font-medium text-primary hover:underline">
              {messages.register.login}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
