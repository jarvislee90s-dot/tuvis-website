import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadWorldContent } from "@/world/assets/loadWorldData";
import { WorldLanding } from "@/world/landing/WorldLanding";
import type { WorldContentBundle } from "@/world/types";
import "@/world/world.css";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; bundle: WorldContentBundle };

export default function WorldPage() {
  const { t } = useTranslation();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    loadWorldContent()
      .then((bundle) => {
        if (cancelled) return;
        setState({ status: "ready", bundle });
        document.title = `${bundle.content.title} · Tuvis`;
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (state.status === "loading") {
    return (
      <main className="world-page world-status-page" aria-busy="true">
        <p>{t("world.loading")}</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="world-page world-status-page" role="alert">
        <h1>{t("world.loadError")}</h1>
        <p className="world-error-detail">{state.message}</p>
        <button type="button" className="world-btn world-btn-primary" onClick={retry}>
          {t("world.retry")}
        </button>
      </main>
    );
  }

  return <WorldLanding bundle={state.bundle} />;
}
