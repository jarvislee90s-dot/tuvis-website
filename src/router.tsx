import { createBrowserRouter, Navigate } from "react-router";
import { LangLayout } from "@/components/layout/LangLayout";
import Home from "@/pages/Home";
import DemoPage from "@/pages/DemoPage";
import DocsArticlePage from "@/pages/DocsArticlePage";
import ChangelogPage from "@/pages/ChangelogPage";

export const BASE = import.meta.env.BASE_URL.replace(/\/$/, ""); // "/tuvis-website"

export const router = createBrowserRouter(
  [
    { path: "/", element: <Navigate to="/zh" replace /> },
    {
      path: "/:lang",
      element: <LangLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: "demo", element: <DemoPage /> },
        /* P13：/docs 直达 01-overview（总体导航卡片落地页按用户裁决移除） */
        { path: "docs", element: <Navigate to="01-overview" replace /> },
        { path: "docs/:slug", element: <DocsArticlePage /> },
        { path: "changelog", element: <ChangelogPage /> },
      ],
    },
    { path: "*", element: <Navigate to="/zh" replace /> },
  ],
  { basename: BASE },
);
