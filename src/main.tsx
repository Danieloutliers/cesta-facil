import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// `delivery.html` is a dedicated build entry (its own manifest). Normalize the
// URL so the SPA router loads the delivery area instead of the 404 page.
if (window.location.pathname.endsWith('/delivery.html')) {
  window.history.replaceState(null, '', '/delivery');
}

createRoot(document.getElementById("root")!).render(<App />);
