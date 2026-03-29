import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerPushServiceWorker } from "@/lib/push-notifications";
import { initializeAppInstallPrompt } from "@/hooks/use-app-install-prompt";

createRoot(document.getElementById("root")!).render(<App />);

if (typeof window !== "undefined") {
  initializeAppInstallPrompt();

  const bootServiceWorker = () => {
    void registerPushServiceWorker().catch(() => {
      // The app can work normally without push support.
    });
  };

  if (document.readyState === "complete") {
    window.setTimeout(bootServiceWorker, 0);
  } else {
    window.addEventListener("load", bootServiceWorker, { once: true });
  }
}
