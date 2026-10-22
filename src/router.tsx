import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { LangLayout } from "@/components/layout/LangLayout";
import Home from "@/pages/Home";
import DemoPage from "@/pages/DemoPage";
import DocsArticlePage from "@/pages/DocsArticlePage";
import ChangelogPage from "@/pages/ChangelogPage";

const WorldPage = lazy(() => import("@/pages/WorldPage"));
const WorkshopPage = lazy(() => import("@/pages/WorkshopPage"));

export const BASE = import.meta.env.BASE_URL.replace(/\/$/, ""); // "/" → ""（根路径部署）

const worldFallback = (
  <main className="mx-auto max-w-5xl px-5 py-24 text-center text-inkdim" aria-busy="true">
    兔维斯世界加载中…
  </main>
);

/** 路由表提为命名导出：boot 集成测试/未来门禁需复用同一份 routes 建 router（单例在模块求值时即创建，测试无法复用） */
export const routes = [
  { path: "/", element: <Navigate to="/zh" replace /> },
  {
    path: "/:lang",
    element: <LangLayout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: "world",
        element: <Suspense fallback={worldFallback}><WorldPage /></Suspense>,
      },
      {
        path: "world/workshop",
        element: <Suspense fallback={worldFallback}><WorkshopPage /></Suspense>,
      },
      { path: "demo", element: <DemoPage /> },
      /* P13：/docs 直达 01-overview（总体导航卡片落地页按用户裁决移除） */
      { path: "docs", element: <Navigate to="01-overview" replace /> },
      { path: "docs/:slug", element: <DocsArticlePage /> },
      { path: "changelog", element: <ChangelogPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/zh" replace /> },
];

export const router = createBrowserRouter(routes, { basename: BASE });
