// Internationalisierung: Deutsch ist die Quellsprache — alle Texte stehen auf
// Deutsch im Code und im HTML, Englisch liegt als Wörterbuch daneben
// (locales/en-ui.js für UI-Texte, locales/en-content.js für Inhaltsnamen).
//
//   t(text, vars)     übersetzt UI-Texte; der deutsche Text ist der Schlüssel,
//                     Platzhalter {name} werden aus vars eingesetzt.
//   lname(name)       übersetzt Inhaltsnamen (Gegner, Gebiete, Basen, Runen …);
//                     Unbekanntes (Spielernamen, alte Spielstände) fällt durch.
//   decimalSep()      Dezimaltrennzeichen der Sprache (formatNum, Tempo).
//
// Die Sprache: Einstellung 'auto' | 'de' | 'en' (data.settings.lang) —
// 'auto' folgt der Betriebssystem-Sprache über navigator.language, was in der
// Tauri-WebView wie im Browser am System hängt. Modul-startet auf Deutsch,
// damit Node-Importe (tools/smoke.mjs) ohne DOM klarkommen.
import { EN_UI } from './locales/en-ui.js';
import { EN_NAMES } from './locales/en-content.js';

let preference = 'auto';

let lang = 'de';

const listeners = new Set();

function systemLang() {
  const code = (typeof navigator !== 'undefined' && navigator.language) || 'en';
  return code.toLowerCase().startsWith('de') ? 'de' : 'en';
}

function normalize(value) {
  return value === 'de' || value === 'en' ? value : 'auto';
}

function applyLang(next) {
  const changed = next !== lang;
  lang = next;
  if (typeof document !== 'undefined') document.documentElement.lang = next;
  if (changed) {
    for (const listener of listeners) listener();
  }
}

// Sprachwunsch umsetzen ('auto' | 'de' | 'en') — meldet einen echten Wechsel
// an die angemeldeten Listener (settings.js ruft dies beim Laden und bei
// Änderung der Sprachwahl).
export function setLangPreference(value) {
  preference = normalize(value);
  applyLang(preference === 'auto' ? systemLang() : preference);
}

export function getLang() {
  return lang;
}

// UI-Text übersetzen; in Deutsch kehrt der Schlüssel unverändert zurück.
// Fällt von en-ui.js auf en-content.js durch — Sätze und Namen sind in einem
// der beiden Wörterbücher zu finden, die Trennung ist rein der Pflege halber.
export function t(key, vars) {
  let text = lang === 'en' ? (EN_UI[key] ?? EN_NAMES[key] ?? key) : key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

// Inhaltsname übersetzen; in Deutsch und für Unbekanntes der Ursprung.
export function lname(name) {
  if (!name) return name;
  return lang === 'en' ? (EN_NAMES[name] ?? EN_UI[name] ?? name) : name;
}

export function decimalSep() {
  return lang === 'en' ? '.' : ',';
}

// Dezimalzahl mit Sprach-Trennzeichen („1,5" / „1.5") — ersetzt die ver-
// streuten toFixed().replace('.', ',')-Aufrufe.
export function fmtDec(value, digits = 1) {
  return value.toFixed(digits).replace('.', decimalSep());
}

// Bei Sprachwechsel anmelden ( neu bauen, neu rendern).
export function onLangChange(listener) {
  listeners.add(listener);
}

// Statische HTML-Texte: Elemente mit data-i18n tragen ihren deutschen Text
// als Inhalt — der erste Lauf merkt ihn sich (data-i18n-text), jede Übersetzung
// schreibt ihn neu, auch zurück auf Deutsch. data-i18n-aria übersetzt
// aria-Label (Attributinhalt = Schlüssel).
export function applyStaticI18n(root = document) {
  for (const node of root.querySelectorAll('[data-i18n]')) {
    node.dataset.i18nText ??= node.textContent.trim();
    const key = node.dataset.i18nText;
    node.textContent = lang === 'en' ? (EN_UI[key] ?? EN_NAMES[key] ?? key) : key;
  }
  for (const node of root.querySelectorAll('[data-i18n-aria]')) {
    const key = node.getAttribute('data-i18n-aria');
    node.setAttribute('aria-label', lang === 'en' ? (EN_UI[key] ?? EN_NAMES[key] ?? key) : key);
  }
}
