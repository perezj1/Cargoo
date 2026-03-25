import { useEffect, useState } from "react";
import { Download, Smartphone, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("serviceWorker", error);
      });
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const updateConnectivity = () => setIsOffline(!navigator.onLine);

    updateConnectivity();
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("online", updateConnectivity);
    window.addEventListener("offline", updateConnectivity);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("online", updateConnectivity);
      window.removeEventListener("offline", updateConnectivity);
    };
  }, []);

  if ((!installEvent && !isOffline) || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    if (!installEvent) {
      setDismissed(true);
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstallEvent(null);
    }
    setDismissed(true);
  };

  return (
    <Card className="fixed bottom-24 left-4 right-4 z-40 border-white/60 bg-white/95 p-4 shadow-2xl backdrop-blur md:bottom-6 md:left-auto md:right-6 md:w-[360px]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {isOffline ? <WifiOff className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-semibold text-foreground">
            {isOffline ? "Estas sin conexion, la shell sigue disponible" : "Instala Cargoo como app"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isOffline
              ? "La PWA mantiene acceso al interfaz principal y a tus rutas recientes."
              : "Abre rutas, mensajes y estados desde el movil como si fuera una app nativa."}
          </p>
          <div className="mt-3 flex gap-2">
            {!isOffline && (
              <Button size="sm" onClick={handleInstall}>
                <Download className="h-4 w-4" />
                Instalar
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setDismissed(true)}>
              Ahora no
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
