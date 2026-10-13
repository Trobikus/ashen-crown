import { startGame, openOptions } from './game.js';

const notice = document.getElementById('notice');

function showNotice(text) {
  notice.textContent = text;
  notice.hidden = false;
}

document.getElementById('btn-start').addEventListener('click', () => {
  startGame();
});

document.getElementById('btn-options').addEventListener('click', () => {
  openOptions('menu');
});

document.getElementById('btn-quit').addEventListener('click', () => {
  const tauriWindow = window.__TAURI__?.window?.getCurrentWindow?.();
  if (tauriWindow) {
    tauriWindow.close();
  } else {
    showNotice('Beenden ist nur in der Desktop-App möglich.');
  }
});
