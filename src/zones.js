import { CONTINENTS, MAIN_ZONE_COUNT, LAST_ZONE_INDEX, zoneDef } from './data.js';
import { state } from './state.js';
import { el } from './dom.js';

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

function buildDepthPanel() {
  const panel = document.createElement('div');
  panel.className = 'zone-continent-panel';
  panel.dataset.continent = CONTINENTS.length;
  const head = document.createElement('div');
  head.className = 'zone-continent-head';
  const prev = document.createElement('button');
  prev.className = 'zone-pager';
  prev.dataset.dir = '-1';
  prev.textContent = '‹';
  const name = document.createElement('div');
  name.className = 'zone-continent';
  name.textContent = 'Die Tiefen';
  const next = document.createElement('button');
  next.className = 'zone-pager';
  next.dataset.dir = '1';
  next.textContent = '›';
  head.append(prev, name, next);
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
    row.title = zoneDef(index).name;
    row.innerHTML = `<span class="zone-name">${zoneDef(index).name}</span><span class="zone-status"></span>`;
    group.appendChild(row);
  }
}

export function buildZoneList() {
  let index = 0;
  for (const [ci, continent] of CONTINENTS.entries()) {
    const panel = document.createElement('div');
    panel.className = 'zone-continent-panel';
    panel.dataset.continent = ci;
    const head = document.createElement('div');
    head.className = 'zone-continent-head';
    const prev = document.createElement('button');
    prev.className = 'zone-pager';
    prev.dataset.dir = '-1';
    prev.textContent = '‹';
    const name = document.createElement('div');
    name.className = 'zone-continent';
    name.textContent = continent.name;
    const next = document.createElement('button');
    next.className = 'zone-pager';
    next.dataset.dir = '1';
    next.textContent = '›';
    head.append(prev, name, next);
    panel.appendChild(head);
    const group = document.createElement('div');
    group.className = 'zone-group';
    for (const zone of continent.zones) {
      const row = document.createElement('button');
      row.className = 'zone-row';
      row.dataset.zone = index;
      row.title = zone.name;
      row.innerHTML = `<span class="zone-name">${zone.name}</span><span class="zone-status"></span>`;
      group.appendChild(row);
      index += 1;
    }
    panel.appendChild(group);
    el.zoneList.appendChild(panel);
  }
  buildDepthPanel();
}

export function renderZones() {
  const view = activeView();
  for (const panel of el.zoneList.querySelectorAll('.zone-continent-panel')) {
    const ci = Number(panel.dataset.continent);
    panel.hidden = ci !== view;
    panel.querySelector('.zone-pager[data-dir="-1"]').disabled = ci === 0;
    panel.querySelector('.zone-pager[data-dir="1"]').disabled = ci === PANEL_COUNT - 1;
    if (ci === CONTINENTS.length) {
      syncDepthRows();
      for (const row of panel.querySelectorAll('.zone-row')) {
        const index = Number(row.dataset.zone);
        const open = index <= state.cleared;
        row.disabled = !open;
        row.classList.toggle('current', index === state.zone);
        row.classList.toggle('locked', !open);
        row.querySelector('.zone-status').textContent = index === state.zone ? 'Aufenthalt' : open ? 'Eröffnet' : 'Versiegelt';
      }
      continue;
    }
    for (const row of panel.querySelectorAll('.zone-row')) {
      const index = Number(row.dataset.zone);
      const open = index <= Math.min(state.cleared, LAST_ZONE_INDEX);
      row.disabled = !open;
      row.classList.toggle('current', index === state.zone);
      row.classList.toggle('locked', !open);
      row.querySelector('.zone-status').textContent = index === state.zone ? 'Aufenthalt' : open ? 'Eröffnet' : 'Versiegelt';
    }
  }
}
