import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import commonKo from "../locales/ko/common.json";
import enumsKo from "../locales/ko/enums.json";
import yarnKo from "../locales/ko/yarn.json";
import patternKo from "../locales/ko/pattern.json";
import projectKo from "../locales/ko/project.json";
import dashboardKo from "../locales/ko/dashboard.json";
import authKo from "../locales/ko/auth.json";

import commonEn from "../locales/en/common.json";
import enumsEn from "../locales/en/enums.json";
import yarnEn from "../locales/en/yarn.json";
import patternEn from "../locales/en/pattern.json";
import projectEn from "../locales/en/project.json";
import dashboardEn from "../locales/en/dashboard.json";
import authEn from "../locales/en/auth.json";

export const LANG_STORAGE_KEY = "yarnStash.lang";

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: {
        common: commonKo,
        enums: enumsKo,
        yarn: yarnKo,
        pattern: patternKo,
        project: projectKo,
        dashboard: dashboardKo,
        auth: authKo,
      },
      en: {
        common: commonEn,
        enums: enumsEn,
        yarn: yarnEn,
        pattern: patternEn,
        project: projectEn,
        dashboard: dashboardEn,
        auth: authEn,
      },
    },
    fallbackLng: "ko",
    supportedLngs: ["ko", "en"],
    load: "languageOnly",
    defaultNS: "common",
    ns: ["common", "enums", "yarn", "pattern", "project", "dashboard", "auth"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ["localStorage"],
    },
  });

export function setLanguage(lang: "ko" | "en") {
  i18next.changeLanguage(lang);
}

export default i18next;
