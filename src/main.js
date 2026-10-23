import { startGame, openOptions } from './game.js';
import { initUpdater, suppressUpdate } from './updater.js';
import { initAudio } from './audio.js';
import { loadSettings } from './settings.js';
import { applyFullscreenSetting } from './display.js';
import { initPatchNotes } from './patchnotes.js';
import { settings } from './state.js';
import { t, setLangPreference, applyStaticI18n } from './i18n.js';
import { version as appVersion } from '../package.json';

// Vollbild-Wunsch aus den Settings früh anwenden, damit nicht erst der
// Start-Klick den Modus wechselt. Die Sprache ebenso — das Hauptmenü steht
// vor ensureInit und lokalisiert sich hier (Betriebssystem-Sprache bei 'auto').
loadSettings();
setLangPreference(settings.lang ?? 'auto');
applyStaticI18n();
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
    showNotice(t('Beenden ist nur in der Desktop-App möglich.'));
    return;
  }
  tauriWindow.close().catch(() => showNotice(t('Beenden fehlgeschlagen.')));
});

initUpdater();
initPatchNotes();

// Glutfunken im Hauptmenü: Ein Dutzend aufsteigender Embers, Bewegung und
// Flackern macht ausschließlich CSS (gleiche Keyframes wie die Arena).
function spawnMenuEmbers() {
  const holder = document.getElementById('menu-embers');
  if (!holder) return;
  for (let i = 0; i < 14; i += 1) {
    const p = document.createElement('span');
    p.className = 'arena-particle';
    const size = 2 + Math.random() * 3;
    p.style.left = `${(Math.random() * 100).toFixed(1)}%`;
    p.style.top = `${(35 + Math.random() * 65).toFixed(1)}%`;
    p.style.width = `${size.toFixed(1)}px`;
    p.style.height = `${(size * (0.6 + Math.random() * 0.8)).toFixed(1)}px`;
    p.style.setProperty('--p-color', Math.random() < 0.8 ? '#d98f4a' : '#d9a03f');
    p.style.setProperty('--p-anim', 'particle-rise');
    p.style.setProperty('--p-dur', `${(7 + Math.random() * 8).toFixed(1)}s`);
    p.style.setProperty('--p-delay', `${(-Math.random() * 14).toFixed(1)}s`);
    p.style.setProperty('--p-drift', `${(Math.random() * 8 - 4).toFixed(1)}vw`);
    p.style.setProperty('--p-alpha', 0.65);
    holder.appendChild(p);
  }
}

spawnMenuEmbers();

async function showVersion() {
  const el = document.getElementById('version-tag');
  let version = null;
  const tauri = window.__TAURI__;
  if (tauri?.app?.getVersion) {
    try {
      version = await tauri.app.getVersion();
    } catch {
      // statischer Fallback unten (Web-Build)
    }
  }
  el.textContent = t('Version {v}', { v: version ?? appVersion });
  el.hidden = false;
}

showVersion();
