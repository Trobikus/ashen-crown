import { startGame, openOptions } from './game.js';
import { initUpdater, suppressUpdate } from './updater.js';
import { initAudio } from './audio.js';
import { loadSettings } from './settings.js';
import { applyFullscreenSetting } from './display.js';

// Vollbild-Wunsch aus den Settings früh anwenden, damit nicht erst der
// Start-Klick den Modus wechselt.
loadSettings();
applyFullscreenSetting();

const notice = document.getElementById('notice');

function showNotice(text) {
  notice.textContent = text;
  notice.hidden = false;
}

document.getElementById('btn-start').addEventListener('click', () => {
  suppressUpdate();
  initAudio();
  startGame();
});

document.getElementById('btn-options').addEventListener('click', () => {
  openOptions('menu');
});

document.getElementById('btn-quit').addEventListener('click', () => {
  const tauriWindow = window.__TAURI__?.window?.getCurrentWindow?.();
  if (!tauriWindow) {
    showNotice('Beenden ist nur in der Desktop-App möglich.');
    return;
  }
  tauriWindow.close().catch(() => showNotice('Beenden fehlgeschlagen.'));
});

initUpdater();

async function showVersion() {
  const el = document.getElementById('version-tag');
  const tauri = window.__TAURI__;
  if (!tauri?.app?.getVersion) return;
  try {
    el.textContent = `Version ${await tauri.app.getVersion()}`;
    el.hidden = false;
  } catch {
    // Version bleibt unsichtbar, wenn die Abfrage fehlschlägt.
  }
}

showVersion();
