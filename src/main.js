import { startGame, openOptions } from './game.js';
import { initUpdater, suppressUpdate } from './updater.js';

const notice = document.getElementById('notice');

function showNotice(text) {
  notice.textContent = text;
  notice.hidden = false;
}

document.getElementById('btn-start').addEventListener('click', () => {
  suppressUpdate();
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
