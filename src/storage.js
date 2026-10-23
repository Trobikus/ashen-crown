// Der einzige Weg zum localStorage: Lesen, Schreiben, Löschen — jeder
// Zugriff ist abgefangen. Ein blockierter Speicher (Privatmodus, volle
// Quota, verweigerte Freigabe) darf das Spiel nie umwerfen: Die Wrapper
// liefern sichere Ersatzwerte (null/false), melden den Fehlschlag ge-
// drosselt als Warnung, und das Spiel bleibt weiterspielbar.
import { t } from './i18n.js';
import { toast } from './feedback.js';

const WARN_GAP_MS = 30000;

let lastWarnedAt = 0;

function warnBlocked() {
  const now = Date.now();
  if (now - lastWarnedAt < WARN_GAP_MS) return;
  lastWarnedAt = now;
  toast(t('Der Speicher blockiert Zugriffe — Spielstand und Einstellungen werden nicht gesichert.'), '#c1663a');
}

export function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    warnBlocked();
    return null;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    warnBlocked();
    return false;
  }
}

export function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    warnBlocked();
  }
}
