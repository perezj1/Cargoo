import { useEffect, useState } from "react";
import { Download, Plus, Share, Smartphone } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useAppInstallPrompt } from "@/hooks/use-app-install-prompt";
import { Button } from "@/components/ui/button";

const AppInstallPrompt = ({ enabled }: { enabled: boolean }) => {
  const { profile } = useAuth();
  const { messages } = useLocale();
  const { canShowInstallEntry, closePrompt, deferredPrompt, handleInstall, installing, isAndroid, isIos, isStandalone, open, setOpen } =
    useAppInstallPrompt({ enabled });
  const description = profile?.isTraveler ? messages.installPrompt.travelerDescription : messages.installPrompt.senderDescription;
  const showAndroidManualState = isAndroid && !deferredPrompt;
  const [autoOpenOnPrompt, setAutoOpenOnPrompt] = useState(false);

  useEffect(() => {
    if (!canShowInstallEntry || isStandalone || (!isIos && !isAndroid)) {
      setAutoOpenOnPrompt(false);
      return;
    }

    if (isIos) {
      setOpen(true);
      return;
    }

    if (deferredPrompt) {
      setOpen(true);
      return;
    }

    setAutoOpenOnPrompt(true);
  }, [canShowInstallEntry, deferredPrompt, isAndroid, isIos, isStandalone, setOpen]);

  useEffect(() => {
    if (!autoOpenOnPrompt || !canShowInstallEntry || !deferredPrompt || isStandalone) {
      return;
    }

    setOpen(true);
    setAutoOpenOnPrompt(false);
  }, [autoOpenOnPrompt, canShowInstallEntry, deferredPrompt, isStandalone, setOpen]);

  if (!enabled || (!isIos && !isAndroid && !isStandalone)) {
    return null;
  }

  if (!open || isStandalone) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-[calc(1rem+78px+env(safe-area-inset-bottom))] left-4 right-4 z-50 flex justify-center">
      <div className="pointer-events-auto relative w-full max-w-sm rounded-2xl bg-card px-4 py-3 shadow-2xl ring-1 ring-border/70">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Smartphone className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1 pr-8 text-sm">
            <p className="font-semibold text-foreground">{messages.installPrompt.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>

            {isIos ? (
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <p>{messages.installPrompt.iosIntro}</p>
                <div className="rounded-xl border border-border bg-background px-3 py-2">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Share className="h-3.5 w-3.5 text-primary" />
                    {messages.installPrompt.iosStep1Title}
                  </div>
                  <p className="mt-1 leading-relaxed">{messages.installPrompt.iosStep1Text}</p>
                </div>
                <div className="rounded-xl border border-border bg-background px-3 py-2">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Plus className="h-3.5 w-3.5 text-primary" />
                    {messages.installPrompt.iosStep2Title}
                  </div>
                  <p className="mt-1 leading-relaxed">{messages.installPrompt.iosStep2Text}</p>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Download className="h-3.5 w-3.5 text-primary" />
                  {showAndroidManualState ? messages.installPrompt.androidManualTitle : messages.installPrompt.androidDirectTitle}
                </div>
                <p className="mt-1 leading-relaxed">
                  {showAndroidManualState ? messages.installPrompt.androidManualText : messages.installPrompt.androidDirectText}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-full px-4" onClick={closePrompt}>
            {messages.installPrompt.later}
          </Button>
          {isAndroid && !showAndroidManualState ? (
            <Button size="sm" className="gap-2 rounded-full px-4" onClick={() => void handleInstall()} disabled={installing}>
              <Download className="h-3.5 w-3.5" />
              {installing ? messages.installPrompt.installing : messages.installPrompt.install}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AppInstallPrompt;
