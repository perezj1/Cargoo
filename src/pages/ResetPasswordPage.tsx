import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import BrandLogo from "@/components/BrandLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { supabase } from "@/integrations/supabase/client";
import { getFriendlyErrorMessage } from "@/lib/cargoo-store";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { loading, session } = useAuth();
  const { messages } = useLocale();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    if (!loading) {
      setHasRecoverySession(Boolean(session?.user));
    }
  }, [loading, session]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 8) {
      toast.error(messages.resetPassword.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      toast.error(messages.resetPassword.passwordMismatch);
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      toast.success(messages.resetPassword.success);
      navigate("/app", { replace: true });
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSaving(false);
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
          <h1 className="text-2xl font-display font-bold">{messages.resetPassword.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{messages.resetPassword.subtitle}</p>
        </div>

        <div className="rounded-xl bg-card p-8 shadow-card">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : hasRecoverySession ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password">{messages.resetPassword.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    className="pl-10"
                    placeholder={messages.login.passwordPlaceholder}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">{messages.resetPassword.confirmPassword}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    className="pl-10"
                    placeholder={messages.login.passwordPlaceholder}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={saving}>
                {saving ? messages.resetPassword.submitting : messages.resetPassword.submit}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">{messages.resetPassword.invalidLink}</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">{messages.common.back}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
