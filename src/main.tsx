import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "@/router";
import { restoreBootLocation } from "@/utils/bootPath";
import "./index.css";

// 静态托管 404 兜底（GH Pages / CF Pages 同机制）：未知路径由 404.html 把原始地址存进
// sessionStorage 再跳回站点根。
// 必须在 render 前 restoreBootLocation 经 router.navigate 恢复深链——router 在模块求值时即创建
// 并初始化，此后再 history.replaceState 它不感知（不触发重导航），深链会坍缩到 /zh。
restoreBootLocation(router, { base: import.meta.env.BASE_URL, origin: window.location.origin });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
