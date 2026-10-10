import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router, BASE } from "@/router";
import "./index.css";

// GH Pages 404 兜底：404.html 把原始地址存进 sessionStorage 再跳回根
const redirected = sessionStorage.getItem("tuvis-redirect");
if (redirected) {
  sessionStorage.removeItem("tuvis-redirect");
  const u = new URL(redirected);
  const route = u.pathname.startsWith(BASE) ? u.pathname.slice(BASE.length) || "/" : u.pathname;
  history.replaceState(null, "", route + u.search + u.hash);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
