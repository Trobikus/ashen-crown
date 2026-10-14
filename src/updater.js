// Prüft beim Öffnen auf neue Versionen (GitHub Releases) und installiert
// sie automatisch — nur in der Desktop-App; im Web passiert nichts.

let suppressed = false;

export function suppressUpdate() {
  suppressed = true;
  document.getElementById('update-banner').hidden = true;
}

export function initUpdater() {
  const tauri = window.__TAURI__;
  if (!tauri?.updater || !tauri?.process) return;
  runUpdate(tauri).catch((error) => {
    console.warn('Update-Prüfung übersprungen:', error);
    document.getElementById('update-banner').hidden = true;
  });
}

async function runUpdate(tauri) {
  const update = await tauri.updater.check();
  if (!update) return;

  const text = document.getElementById('update-text');
  const bar = document.getElementById('update-bar');

  document
    .getElementById('btn-update-skip')
    .addEventListener('click', suppressUpdate, { once: true });

  document.getElementById('update-banner').hidden = false;
  text.textContent = 'Updating 0 %';
  await delay(600);

  let downloaded = 0;
  let total = 0;
  await update.download(({ event, data }) => {
    if (event === 'Started') total = data.contentLength ?? 0;
    if (event === 'Progress') {
      downloaded += data.chunkLength;
      if (total > 0) {
        const pct = Math.min(100, Math.floor((downloaded / total) * 100));
        text.textContent = `Updating ${pct} %`;
        bar.style.width = `${pct}%`;
      } else {
        text.textContent = 'Updating …';
      }
    }
    if (event === 'Finished') {
      text.textContent = 'Updating 100 %';
      bar.style.width = '100%';
    }
  });
  if (suppressed) {
    update.close();
    return;
  }

  await update.install();
  update.close();
  await tauri.process.relaunch();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
