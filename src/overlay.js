// Das Overlay: Einzige Vollbild-Botschaft (Intro, Tod, Boss-Gate, Annalen,
// Hinweise) samt ihrer Szenen-Zeit. Der Szenen-Timer lebt hier — wer eine
// Botschaft nach ms abräumen oder den Ablauf vorzeitig beenden will, meldet
// das hier, statt eigene Timer im Kampfkern zu streuen.
//
// Der Auto-Tür-Lauf (Boss-Gate geht von allein weiter) gehört zum Kampf und
// meldet sich am Bus als Gate-Schranke: Ein Klick aufs sichtbare Gate führt
// den Lauf sofort aus, statt das Overlay nur wegzuklicken.
import { el } from './dom.js';
import { use } from './bus.js';

let sceneTimer = null;

let overlayDismissible = false;

let overlayDone = null;

function showOverlay(text, html = false) {
  const target = document.getElementById('overlay-text');
  if (html) target.innerHTML = text;
  else target.textContent = text;
  document.getElementById('overlay').classList.add('show');
  overlayDismissible = false;
}

function hideOverlay() {
  document.getElementById('overlay').classList.remove('show');
}

// Nur die Uhr stoppen — das Overlay bleibt stehen (Auto-Tür-Zweig: die
// Botschaft liest sich, während das Gate seinen eigenen Timer stellt).
function clearSceneTimer() {
  if (sceneTimer) {
    clearTimeout(sceneTimer);
    sceneTimer = null;
  }
}

// Botschaft nach ms abräumen; die Uhr gehört dem Overlay, damit überholende
// Meldungen sie übernehmen können (showDismissibleOverlay räumt selbst auf).
function scheduleScene(fn, ms) {
  clearSceneTimer();
  sceneTimer = setTimeout(() => {
    sceneTimer = null;
    fn();
  }, ms);
}

// Overlay schließen und die Szene zurücksetzen — Rückkehr in den Hub und
// der Auto-Tür-Lauf beenden ihre Botschaften so.
function cancelScene() {
  clearSceneTimer();
  hideOverlay();
  overlayDismissible = false;
}

function finishDismissible() {
  hideOverlay();
  overlayDismissible = false;
  const done = overlayDone;
  overlayDone = null;
  if (done) done();
}

function showDismissibleOverlay(text, duration, html = false, onDone = null) {
  // Überholt ein laufendes Overlay (z. B. Boss-Gate → Kontinent-Annale):
  // dessen Timer stoppen, sonst blättert es das neue vorzeitig weg.
  clearSceneTimer();
  overlayDone = null;
  showOverlay(text, html);
  overlayDismissible = true;
  overlayDone = onDone;
  scheduleScene(finishDismissible, duration);
}

function dismissOverlay() {
  if (!overlayDismissible) return;
  // Klick aufs Boss-Gate heißt bei aktiver Auto-Tür: sofort weiter — nicht
  // abbrechen, sonst bliebe die Arena leer und der Lauf verfallen.
  const gate = use('overlayGate');
  if (gate && gate()) return;
  clearSceneTimer();
  finishDismissible();
}

export { showOverlay, hideOverlay, showDismissibleOverlay, dismissOverlay, cancelScene, clearSceneTimer, scheduleScene };
