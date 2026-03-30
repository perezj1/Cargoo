import { useEffect, useState } from "react";
import { Mail, Lock } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import BrandLogo from "@/components/BrandLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { markInstallPromptPendingAfterLogin } from "@/hooks/use-app-install-prompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getFriendlyErrorMessage, loginUser } from "@/lib/cargoo-store";

const LoginPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const { messages } = useLocale();

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
      markInstallPromptPendingAfterLogin();
      toast.success(messages.login.success);
      navigate(nextPath, { replace: true });
    } catch (error) {
      const message = getFriendlyErrorMessage(error);
      if (/Invalid login credentials/i.test(message)) {
        toast.error(messages.login.invalidCredentials);
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSendingReset(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast.success(messages.login.forgotPasswordSent);
      setForgotOpen(false);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher compact />
        </div>
        <div className="mb-8 text-center">
          <Link to="/" className="mb-6 inline-flex items-center gap-2">
            <BrandLogo />
          </Link>
          <h1 className="text-2xl font-display font-bold">{messages.login.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{messages.login.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-card p-8 shadow-card">
          <div className="space-y-2">
            <Label htmlFor="email">{messages.login.email}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={messages.login.emailPlaceholder}
                className="pl-10"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{messages.login.password}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder={messages.login.passwordPlaceholder}
                className="pl-10"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm font-medium text-primary transition-colors hover:underline"
                onClick={() => {
                  setForgotEmail(email.trim().toLowerCase());
                  setForgotOpen(true);
                }}
              >
                {messages.login.forgotPassword}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? messages.login.submitting : messages.login.submit}
          </Button>
          <div className="rounded-xl border border-border bg-secondary/60 p-4 text-xs leading-5 text-muted-foreground">
            {messages.login.legalNotice}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {messages.login.noAccount}{" "}
            <Link to={`/register${searchParams.toString() ? `?${searchParams.toString()}` : ""}`} className="font-medium text-primary hover:underline">
              {messages.login.register}
            </Link>
          </p>
        </form>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.login.forgotPasswordTitle}</DialogTitle>
            <DialogDescription>{messages.login.forgotPasswordDescription}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">{messages.login.email}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder={messages.login.emailPlaceholder}
                  className="pl-10"
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full sm:w-auto" disabled={sendingReset}>
                {sendingReset ? messages.login.forgotPasswordSubmitting : messages.login.forgotPasswordSubmit}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginPage;
