import { CONTINENTS, MAIN_ZONE_COUNT, LAST_ZONE_INDEX, zoneDef, enemyLevelOf } from './data.js';
import { state } from './state.js';
import { t, lname } from './i18n.js';
import { el } from './dom.js';

// Levelrange eines Gebiets: von der Normal-Kreatur bis zum Boss.
const zoneLevelRange = (index) => `Lv ${enemyLevelOf(index, 'normal')}–${enemyLevelOf(index, 'boss')}`;

let viewIndex = null;

const PANEL_COUNT = CONTINENTS.length + 1;

const depthGroup = () => document.getElementById('depth-group');

function continentOfZone(zoneIndex) {
  if (zoneIndex >= MAIN_ZONE_COUNT) return CONTINENTS.length;
  let acc = 0;
  for (const [index, continent] of CONTINENTS.entries()) {
    acc += continent.zones.length;
    if (zoneIndex < acc) return index;
  }
  return CONTINENTS.length - 1;
}

const activeView = () => viewIndex ?? continentOfZone(state.zone);

export function resetZoneView() {
  viewIndex = null;
}

export function switchZoneView(delta) {
  const current = activeView();
  const next = Math.max(0, Math.min(current + delta, PANEL_COUNT - 1));
  if (next === current) return;
  viewIndex = next;
  renderZones();
}

// Sichtbare Tiefen-Zeilen: nächste offene Tiefe + eine versiegelte als
// Vorschau, solange das Hauptspiel läuft.
const visibleDepthCount = () => Math.max(1, state.cleared + 1 - MAIN_ZONE_COUNT + 1);

// Kopf einer Gebiete-Seite: Pager links, Name mit Fortschritt darunter
// (Minimum links, Balken, Maximum rechts), Pager rechts. Der Fortschritt
// füllt sich erst in renderZones.
function buildHead(nameText) {
  const head = document.createElement('div');
  head.className = 'zone-continent-head';
  const prev = document.createElement('button');
  prev.className = 'zone-pager';
  prev.dataset.dir = '-1';
  prev.setAttribute('aria-label', t('Vorheriger Kontinent'));
  prev.textContent = '‹';
  const nameCol = document.createElement('div');
  nameCol.className = 'zone-name-col';
  const name = document.createElement('div');
  name.className = 'zone-continent';
  name.textContent = nameText;
  const progress = document.createElement('span');
  progress.className = 'zone-continent-progress';
  progress.innerHTML = '<span class="zone-progress-min"></span><span class="zone-progress-bar"><span class="zone-progress-fill"></span></span><span class="zone-progress-max"></span><span class="zone-progress-text"></span>';
  nameCol.append(name, progress);
  const next = document.createElement('button');
  next.className = 'zone-pager';
  next.dataset.dir = '1';
  next.setAttribute('aria-label', t('Nächster Kontinent'));
  next.textContent = '›';
  const right = document.createElement('div');
  right.className = 'zone-head-right';
  right.append(next);
  head.append(prev, nameCol, right);
  return { head, progress };
}

function buildDepthPanel() {
  const panel = document.createElement('div');
  panel.className = 'zone-continent-panel';
  panel.dataset.continent = CONTINENTS.length;
  const { head } = buildHead(lname('Die Tiefen'));
  panel.appendChild(head);
  const group = document.createElement('div');
  group.className = 'zone-group';
  group.id = 'depth-group';
  panel.appendChild(group);
  el.zoneList.appendChild(panel);
}

function syncDepthRows() {
  const group = depthGroup();
  const wanted = visibleDepthCount();
  while (group.childElementCount < wanted) {
    const index = MAIN_ZONE_COUNT + group.childElementCount;
    const row = document.createElement('button');
    row.className = 'zone-row';
    row.dataset.zone = index;
    row.title = lname(zoneDef(index).name);
    row.innerHTML = `<span class="zone-level">${zoneLevelRange(index)}</span><span class="zone-name">${lname(zoneDef(index).name)}</span><span class="zone-status"></span>`;
    group.appendChild(row);
  }
}

export function buildZoneList() {
  let index = 0;
  for (const [ci, continent] of CONTINENTS.entries()) {
    const panel = document.createElement('div');
    panel.className = 'zone-continent-panel';
    panel.dataset.continent = ci;
    const { head } = buildHead(lname(continent.name));
    panel.appendChild(head);
    const group = document.createElement('div');
    group.className = 'zone-group';
    for (const zone of continent.zones) {
      const row = document.createElement('button');
      row.className = 'zone-row';
      row.dataset.zone = index;
      row.title = lname(zone.name);
      row.innerHTML = `<span class="zone-level">${zoneLevelRange(index)}</span><span class="zone-name">${lname(zone.name)}</span><span class="zone-status"></span>`;
      group.appendChild(row);
      index += 1;
    }
    panel.appendChild(group);
    el.zoneList.appendChild(panel);
  }
  buildDepthPanel();
}

// Sprachwechsel: Die Zeilen tragen ihren Namen beim Bau — besser neu bauen
// als jede Zeile anzufassen. Der Zustand (aktiv/versiegelt) folgt im
// nächsten renderZones.
export function rebuildZoneList() {
  el.zoneList.replaceChildren();
  buildZoneList();
}

export function renderZones() {
  // Guard: Nur die Karte zeigt Zonen-Zeilen — sonst durchläuft render() die
  // ~66 Zeilen (Toggle + Status-Text) bei jedem Schlag für nichts. Das Öffnen
  // der Karte rendert explizit (tile-Map-Klick), der Pager ebenso.
  if (el.sceneMap.hidden) return;
  const view = activeView();
  for (const panel of el.zoneList.querySelectorAll('.zone-continent-panel')) {
    const ci = Number(panel.dataset.continent);
    panel.hidden = ci !== view;
    panel.querySelector('.zone-pager[data-dir="-1"]').disabled = ci === 0;
    panel.querySelector('.zone-pager[data-dir="1"]').disabled = ci === PANEL_COUNT - 1;
    const progressText = panel.querySelector('.zone-progress-text');
    const progressBar = panel.querySelector('.zone-progress-bar');
    const progressFill = panel.querySelector('.zone-progress-fill');
    const progressMin = panel.querySelector('.zone-progress-min');
    const progressMax = panel.querySelector('.zone-progress-max');
    if (ci === CONTINENTS.length) {
      // Kopf-Fortschritt der Tiefen: die erreichte Tiefe statt des Balkens.
      const depth = Math.max(0, state.cleared - MAIN_ZONE_COUNT);
      progressText.textContent = depth > 0 ? t('Tiefe {n}', { n: depth }) : '';
      progressMin.hidden = true;
      progressBar.hidden = true;
      progressMax.hidden = true;
      syncDepthRows();
      for (const row of panel.querySelectorAll('.zone-row')) {
        const index = Number(row.dataset.zone);
        const open = index <= state.cleared;
        row.disabled = !open;
        row.classList.toggle('current', index === state.zone);
        row.classList.toggle('locked', !open);
      row.querySelector('.zone-status').textContent = index === state.zone ? t('Aufenthalt') : open ? t('Eröffnet') : t('Versiegelt');
      markEchoZone(row, index);
    }
    continue;
  }
  // Kopf-Fortschritt eines Kontinents: offene Gebiete, geklemmt auf die
  // Zonen-Zahl des Kontinents (cleared zählt global weiter).
  const zoneCount = CONTINENTS[ci].zones.length;
  const openCount = Math.max(0, Math.min(state.cleared - ci * 10, zoneCount));
  progressText.textContent = '';
  progressMin.hidden = false;
  progressBar.hidden = false;
  progressMax.hidden = false;
  progressMin.textContent = openCount;
  progressMax.textContent = zoneCount;
  progressFill.style.width = `${(openCount / zoneCount) * 100}%`;
  for (const row of panel.querySelectorAll('.zone-row')) {
      const index = Number(row.dataset.zone);
      const open = index <= Math.min(state.cleared, LAST_ZONE_INDEX);
      row.disabled = !open;
      row.classList.toggle('current', index === state.zone);
      row.classList.toggle('locked', !open);
      row.querySelector('.zone-status').textContent = index === state.zone ? t('Aufenthalt') : open ? t('Eröffnet') : t('Versiegelt');
      markEchoZone(row, index);
    }
  }
}

// Der Nachhall des letzten Laufs wartet in seiner Zone: bleiche Markierung
// statt des Statusworts, solange er ungebrochen ist (siehe echo.js/game.js).
// Gebrochen ist er reine Chronik — die Karte schweigt dann wieder.
function markEchoZone(row, index) {
  const echoHere = Boolean(state.echo) && !state.echo.defeated && index === state.echo.zone;
  row.classList.toggle('zone-echo', echoHere);
  if (echoHere) row.querySelector('.zone-status').textContent = t('Nachhall');
}
