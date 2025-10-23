import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializePWA } from "./pwa-register";

// Initialize PWA features (service worker, install prompt)
if (import.meta.env.PROD) {
  initializePWA();
}

createRoot(document.getElementById("root")!).render(<App />);
