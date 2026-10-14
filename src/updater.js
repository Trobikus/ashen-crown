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
  const notes = (update.body || '').split('\n')[0].trim();
  text.textContent = notes
    ? `Update ${update.version}: ${truncate(notes, 110)}`
    : `Update auf Version ${update.version}`;

  document
    .getElementById('btn-update-skip')
    .addEventListener('click', suppressUpdate, { once: true });

  document.getElementById('update-banner').hidden = false;
  await delay(600);

  let downloaded = 0;
  let total = 0;
  await update.download(({ event, data }) => {
    if (event === 'Started') total = data.contentLength ?? 0;
    if (event === 'Progress') {
      downloaded += data.chunkLength;
      if (total > 0) bar.style.width = `${Math.round((downloaded / total) * 100)}%`;
    }
    if (event === 'Finished') {
      text.textContent = `Update ${update.version} wird installiert…`;
      document.getElementById('update-progress').hidden = true;
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

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
