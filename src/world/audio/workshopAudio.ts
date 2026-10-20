/**
 * 工坊背景音乐（CC BY 3.0，见 public/world/audio/README.md）。
 * 懒创建 <audio>；静音状态持久化在 localStorage，切换只改 muted，
 * 因此浏览器自动播放策略放开后无需再次用户手势。
 */

const AUDIO_KEY = "tuvis-world-audio-muted";
const AUDIO_SRC = "world/audio/sappheiros-universe.mp3";

let element: HTMLAudioElement | null = null;

export function workshopAudioSrc(): string {
  return `${import.meta.env.BASE_URL}${AUDIO_SRC}`;
}

export function isMusicMuted(): boolean {
  try {
    return localStorage.getItem(AUDIO_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMusicMuted(muted: boolean): void {
  try {
    localStorage.setItem(AUDIO_KEY, muted ? "1" : "0");
  } catch {
    /* 存储不可用时静音态仅在当前会话生效 */
  }
  if (element) element.muted = muted;
}

export function ensureWorkshopAudio(): HTMLAudioElement {
  if (!element) {
    element = new Audio(workshopAudioSrc());
    element.loop = true;
    element.volume = 0.15;
    element.muted = isMusicMuted();
  }
  return element;
}

/** 进入工坊时调用：静音也保持播放流，静音开关即时生效；被自动播放策略拦截时挂一次性手势兜底。 */
export function startWorkshopMusic(): void {
  const audio = ensureWorkshopAudio();
  const played = audio.play();
  if (played && typeof played.catch === "function") {
    played.catch(() => {
      const resume = () => {
        void ensureWorkshopAudio().play().catch(() => undefined);
      };
      window.addEventListener("pointerdown", resume, { once: true });
      window.addEventListener("keydown", resume, { once: true });
    });
  }
}

export function stopWorkshopMusic(): void {
  element?.pause();
}
