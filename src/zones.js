import { ZONES } from './data.js';
import { state } from './state.js';
import { el } from './dom.js';

export function buildZoneList() {
  for (const [index, zone] of ZONES.entries()) {
    const row = document.createElement('button');
    row.className = 'zone-row';
    row.dataset.zone = index;
    row.innerHTML = `<span class="zone-name">${zone.name}</span><span class="zone-status"></span>`;
    el.zoneList.appendChild(row);
  }
}

export function renderZones() {
  for (const row of el.zoneList.querySelectorAll('.zone-row')) {
    const index = Number(row.dataset.zone);
    const open = index <= Math.min(state.cleared, ZONES.length - 1);
    row.disabled = !open;
    row.classList.toggle('current', index === state.zone);
    row.classList.toggle('locked', !open);
    row.querySelector('.zone-status').textContent = index === state.zone ? 'Aufenthalt' : open ? 'Eröffnet' : 'Versiegelt';
  }
}
