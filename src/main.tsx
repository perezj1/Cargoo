import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerPushServiceWorker } from "@/lib/push-notifications";

if (typeof window !== "undefined") {
  const hadActiveServiceWorker = "serviceWorker" in navigator && Boolean(navigator.serviceWorker.controller);
  let refreshingForServiceWorkerUpdate = false;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadActiveServiceWorker || refreshingForServiceWorkerUpdate) {
        return;
      }

      refreshingForServiceWorkerUpdate = true;
      window.location.reload();
    });
  }

  void registerPushServiceWorker().catch(() => {
    // The app can work normally without push support.
  });
}

createRoot(document.getElementById("root")!).render(<App />);
