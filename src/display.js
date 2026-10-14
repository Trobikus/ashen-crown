// Vollbild-Steuerung: Desktop über die Tauri-Window-API, Web-Build über die
// Browser-Fullscreen-API. Fehler werden still verschluckt — ohne
// Nutzer-Geste verweigert der Browser das Vollbild zum Beispiel.

import { settings } from './state.js';

const tauriWindow = () => window.__TAURI__?.window?.getCurrentWindow?.() ?? null;

export async function setFullscreen(enabled) {
  const win = tauriWindow();
  try {
    if (win) {
      await win.setFullscreen(enabled);
    } else if (enabled) {
      await document.documentElement.requestFullscreen?.();
    } else if (document.fullscreenElement) {
      await document.exitFullscreen?.();
    }
  } catch {
    // Vollbild nicht verfügbar (z. B. ohne Nutzer-Geste im Web) — still.
  }
}

export function applyFullscreenSetting() {
  return setFullscreen(settings.displayFullscreen);
}
