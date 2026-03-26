import { Download, Plus, Share, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

const IOS_SEEN_KEY = "cargoo-install-prompt-ios-seen";
const ANDROID_SEEN_KEY = "cargoo-install-prompt-android-seen";

const AppInstallPrompt = ({ enabled }: { enabled: boolean }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  const platform = useMemo(() => {
    if (typeof window === "undefined") {
      return { isIos: false, isAndroid: false, isStandalone: false };
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

    return {
      isIos: /iphone|ipad|ipod/.test(userAgent),
      isAndroid: /android/.test(userAgent),
      isStandalone: window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true,
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (!enabled || platform.isStandalone) {
      setOpen(false);
      return;
    }

    const hasSeenIosPrompt = sessionStorage.getItem(IOS_SEEN_KEY) === "1";
    const hasSeenAndroidPrompt = sessionStorage.getItem(ANDROID_SEEN_KEY) === "1";

    if (platform.isIos && !hasSeenIosPrompt) {
      setOpen(true);
      return;
    }

    if (platform.isAndroid && deferredPrompt && !hasSeenAndroidPrompt) {
      setOpen(true);
      return;
    }

    setOpen(false);
  }, [deferredPrompt, enabled, platform.isAndroid, platform.isIos, platform.isStandalone]);

  const closePrompt = () => {
    if (platform.isIos) {
      sessionStorage.setItem(IOS_SEEN_KEY, "1");
    }

    if (platform.isAndroid) {
      sessionStorage.setItem(ANDROID_SEEN_KEY, "1");
    }

    setOpen(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      closePrompt();
      return;
    }

    setInstalling(true);

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      closePrompt();
    } finally {
      setInstalling(false);
    }
  };

  if (!enabled || platform.isStandalone || (!platform.isIos && !platform.isAndroid)) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : closePrompt())}>
      <DialogContent className="max-w-md rounded-2xl p-0">
        <div className="rounded-t-2xl bg-primary/6 px-6 py-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Smartphone className="h-6 w-6" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl">Instala Cargoo en tu movil</DialogTitle>
            <DialogDescription>
              Ten la app siempre a mano para seguir envios, hablar con transportistas y recibir actualizaciones mas rapido.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 pb-6 pt-2">
          {platform.isIos ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">En iPhone o iPad se instala desde Safari en dos pasos:</p>
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Share className="h-4 w-4 text-primary" />
                  1. Pulsa Compartir
                </div>
                <p className="mt-1">Toca el simbolo de compartir en la barra de Safari.</p>
              </div>
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Plus className="h-4 w-4 text-primary" />
                  2. Agregar a la pantalla de inicio
                </div>
                <p className="mt-1">Despues confirma para tener Cargoo como app en tu pantalla de inicio.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Instala Cargoo en Android para abrirla como app y entrar mas rapido.</p>
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Download className="h-4 w-4 text-primary" />
                  Instalacion directa
                </div>
                <p className="mt-1">Pulsa el boton de abajo y Android te ofrecera instalar Cargoo.</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            {platform.isAndroid ? (
              <Button className="w-full gap-2" size="lg" onClick={() => void handleInstall()} disabled={installing}>
                <Download className="h-4 w-4" />
                {installing ? "Instalando..." : "Instalar"}
              </Button>
            ) : null}
            <Button variant="outline" className="w-full" onClick={closePrompt}>
              Ahora no
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppInstallPrompt;
