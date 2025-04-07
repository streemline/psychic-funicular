import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import Remix Icons
const remixIconsLink = document.createElement("link");
remixIconsLink.rel = "stylesheet";
remixIconsLink.href = "https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css";
document.head.appendChild(remixIconsLink);

// Import Google Fonts
const googleFontsLink = document.createElement("link");
googleFontsLink.rel = "stylesheet";
googleFontsLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@500;600;700&display=swap";
document.head.appendChild(googleFontsLink);

createRoot(document.getElementById("root")!).render(<App />);
