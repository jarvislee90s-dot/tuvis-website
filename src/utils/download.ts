export type OS = "macos" | "windows" | "other";

export function detectOS(ua: string = navigator.userAgent): OS {
  if (/Mac OS X/i.test(ua)) return "macos";
  if (/Windows/i.test(ua)) return "windows";
  return "other";
}

export function matchAsset(
  assets: { name: string; url: string }[],
  os: OS,
): string | null {
  const pat = os === "macos" ? /\.dmg$/i : os === "windows" ? /setup\.exe$/i : null;
  if (!pat) return null;
  return assets.find((a) => pat.test(a.name))?.url ?? null;
}
