import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerPushServiceWorker } from "@/lib/push-notifications";

if (typeof window !== "undefined") {
  void registerPushServiceWorker().catch(() => {
    // The app can work normally without push support.
  });
}

createRoot(document.getElementById("root")!).render(<App />);
