import base from "./strings/base";
import shell from "./strings/shell";
import forms from "./strings/forms";
import dashboard from "./strings/dashboard";
import modals from "./strings/modals";
import settings from "./strings/settings";
import auth from "./strings/auth";

export type Language = "en" | "hi" | "te";

/** A partial translation bundle: each language maps keys → translated strings. */
export type Dict = Record<Language, Record<string, string>>;

const parts: Dict[] = [base, shell, forms, dashboard, modals, settings, auth];

/** Merge all namespace bundles into a single per-language dictionary. */
function merge(bundles: Dict[]): Dict {
  const out: Dict = { en: {}, hi: {}, te: {} };
  for (const bundle of bundles) {
    (Object.keys(out) as Language[]).forEach((lang) => {
      Object.assign(out[lang], bundle[lang] ?? {});
    });
  }
  return out;
}

export const translations: Dict = merge(parts);
