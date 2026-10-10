import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zh from "./zh.json";
import en from "./en.json";

export const LANGS = ["zh", "en"] as const;
export type Lang = (typeof LANGS)[number];

i18n.use(initReactI18next).init({
  resources: { zh: { translation: zh }, en: { translation: en } },
  lng: "zh",
  fallbackLng: "zh",
  interpolation: { escapeValue: false },
});

export function applyLang(l: Lang): void {
  i18n.changeLanguage(l);
  document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
}
