import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useStore, type StoreApi } from "zustand";
import { loadWorldData, preloadCoreAssets } from "@/world/assets/loadWorldData";
import { INITIAL_QUEST } from "@/world/quest/quest";
import { readQuest, writeQuest } from "@/world/quest/persistence";
import { createRuntimeStore, RuntimeStoreContext, type RuntimeState } from "@/world/scene/runtimeStore";
import { SceneView } from "@/world/scene/SceneView";
import type { WorldBundle } from "@/world/types";
import "@/world/world.css";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; bundle: WorldBundle };

type WorkshopStorage = Pick<Storage, "getItem" | "setItem">;

function safeLocalStorage(): WorkshopStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function WorkshopRuntime({
  bundle,
  lang,
  storage,
  storeRef,
}: {
  bundle: WorldBundle;
  lang: string;
  storage?: WorkshopStorage | null;
  /** Test hook: exposes the mounted runtime store for integration tests. */
  storeRef?: { current: StoreApi<RuntimeState> | null };
}) {
  const { t } = useTranslation();
  const storageRef = useRef<WorkshopStorage | null | undefined>(storage);
  if (storageRef.current === undefined) storageRef.current = safeLocalStorage();

  const initialQuest = useMemo(() => {
    const store = storageRef.current;
    if (!store) return INITIAL_QUEST;
    try {
      return readQuest(store);
    } catch {
      return INITIAL_QUEST;
    }
  }, []);

  const store = useMemo(
    () => createRuntimeStore(bundle.scene, initialQuest),
    [bundle.scene, initialQuest],
  );
  const helpSeen = useStore(store, (state) => state.quest.helpSeen);
  const [confirmReset, setConfirmReset] = useState(false);
  const resetCancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirmReset) return;
    const previous = document.activeElement as HTMLElement | null;
    resetCancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmReset(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [confirmReset]);

  useEffect(() => {
    if (storeRef) storeRef.current = store;
    return () => {
      if (storeRef) storeRef.current = null;
    };
  }, [store, storeRef]);

  useEffect(() => {
    const unsubscribe = store.subscribe((state, previous) => {
      // Only quest changes touch storage; movement frames never write.
      if (state.quest !== previous.quest && storageRef.current) {
        writeQuest(storageRef.current, state.quest);
      }
    });
    return unsubscribe;
  }, [store]);

  const resetQuest = () => {
    const current = store.getState();
    current.cancelMovement();
    current.setOverlay(null);
    current.setPose("se");
    current.setNotice(null);
    current.dispatchQuest({ type: "RESET" });
    setConfirmReset(false);
  };

  return (
    <RuntimeStoreContext.Provider value={store}>
      <main className="world-page world-workshop-page">
        <div className="world-shell">
        <div className="world-workshop-head">
          <Link className="world-back-link" to={`/${lang}/world`}>← {t("world.back")}</Link>
          <div>
            <p className="world-kicker">TUVIS WORKSHOP</p>
            <h1 className="world-h1">{bundle.content.quest.title}</h1>
          </div>
          <div className="world-workshop-tools">
            <button
              type="button"
              className="world-btn world-btn-small"
              onClick={() => store.getState().setOverlay({ kind: "help" })}
            >
              {t("world.help")}
            </button>
            <button
              type="button"
              className="world-btn world-btn-small"
              onClick={() => setConfirmReset(true)}
            >
              {t("world.reset")}
            </button>
          </div>
        </div>
        {lang === "en" ? (
          <p className="world-lang-note">{t("world.contentLanguageNote")}</p>
        ) : null}
        {!helpSeen ? (
          <div className="world-help-banner">
            <ul>
              <li>{t("world.workshopHint1")}</li>
              <li>{t("world.workshopHint2")}</li>
            </ul>
            <button
              type="button"
              className="world-btn world-btn-small"
              onClick={() => store.getState().dispatchQuest({ type: "HELP_SEEN" })}
            >
              {t("world.gotIt")}
            </button>
          </div>
        ) : null}
        <SceneView bundle={bundle} />
        </div>
      </main>

      {confirmReset ? (
        <div
          className="world-modal"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmReset(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="world-reset-title"
            aria-describedby="world-reset-desc"
            className="world-modal-card"
          >
            <h2 id="world-reset-title" className="world-modal-title">{t("world.reset")}</h2>
            <p id="world-reset-desc" className="world-modal-body">{t("world.resetConfirm")}</p>
            <div className="world-assembly-actions">
              <button ref={resetCancelRef} type="button" className="world-btn world-btn-small" onClick={() => setConfirmReset(false)}>
                {t("world.replayCancel")}
              </button>
              <button type="button" className="world-btn world-btn-primary" onClick={resetQuest}>
                {t("world.replayConfirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </RuntimeStoreContext.Provider>
  );
}

export default function WorkshopPage() {
  const { t } = useTranslation();
  const { lang } = useParams();
  const zh = lang === "en" ? "en" : "zh";
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    loadWorldData()
      .then(async (bundle) => {
        await preloadCoreAssets(bundle);
        if (cancelled) return;
        document.title = `${bundle.content.quest.title} · Tuvis Workshop`;
        setState({ status: "ready", bundle });
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
        <p>{t("world.workshopLoading")}</p>
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

  return <WorkshopRuntime bundle={state.bundle} lang={zh} />;
}
