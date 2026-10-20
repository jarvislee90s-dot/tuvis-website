import { useEffect } from "react";
import type { StoreApi } from "zustand/vanilla";
import type { SceneDefinition } from "../types";
import { advanceMotion } from "./navigation";
import type { RuntimeState } from "./runtimeStore";

/**
 * requestAnimationFrame loop. The store is read fresh on every frame so a
 * panel, a new destination, or a quest change never races a cached snapshot.
 * Window blur / hidden tabs cancel the current target.
 */
export function useSceneLoop(
  store: StoreApi<RuntimeState>,
  scene: SceneDefinition,
  active = true,
): void {
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let last: number | null = null;

    const tick = (now: number) => {
      if (last === null) last = now;
      const elapsed = now - last;
      last = now;
      const state = store.getState();
      if (state.motion.target && state.overlay === null) {
        const result = advanceMotion(state.motion, elapsed, scene);
        store.setState({ motion: result.motion });
        if (result.arrived) {
          store
            .getState()
            .arrive(result.arrived.token, result.arrived.hotspotId, result.arrived.pickup, result.arrived.tryFire);
        }
      }
      frame = requestAnimationFrame(tick);
    };

    const stop = () => store.getState().cancelMovement();
    const onVisibilityChange = () => {
      if (document.hidden) stop();
    };

    frame = requestAnimationFrame(tick);
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [store, scene, active]);
}
