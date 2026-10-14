import waffeIcon from './assets/icons/waffe.svg';
import brustIcon from './assets/icons/brust.svg';
import helmIcon from './assets/icons/helm.svg';
import hoseIcon from './assets/icons/hose.svg';
import schuheIcon from './assets/icons/schuhe.svg';
import handIcon from './assets/icons/hand.svg';
import { INVENTORY_CAP, GEAR_SLOTS, RARITIES, DROP_CHANCES, zoneDef, gearSlotOf, rarityOf, rollRarity, rollItemValues, itemStats, itemStatsText, itemScore, SKILL_EFFECT_LABELS, formatNum } from './data.js';

import { state } from './state.js';

import { el } from './dom.js';

import { sfx } from './audio.js';

import { toast } from './feedback.js';

const SLOT_ICONS = {
  waffe: waffeIcon,
  brust: brustIcon,
  helm: helmIcon,
  hose: hoseIcon,
  schuhe: schuheIcon,
  'hand-links': handIcon,
  'hand-rechts': handIcon,
};

const iconOf = (slotKey) => SLOT_ICONS[slotKey].replace(/'/g, '%27');



let gearDirty = true;
let sellMode = false;
const selectedForSale = new Set();

let hooks = { clampHp: () => {}, save: () => {}, render: () => {} };

export function initItems(deps) { hooks = deps; }

export function selectAllForSale() {

  for (const item of state.inventory) selectedForSale.add(item.id);

  gearDirty = true;

}

export function handleInventoryClick(e) {

  const cell = e.target.closest('.inv-cell');

  if (!cell) return;

  const id = Number(cell.dataset.id);

  if (sellMode) {

    if (selectedForSale.has(id)) selectedForSale.delete(id);

    else selectedForSale.add(id);

    gearDirty = true;

  } else {

    equipItem(id);

  }

}

export function sellButtonAction() {

  if (sellMode) sellSelected();

  else toggleSellMode();

}

export function renderGearIfDirty() {

  if (!gearDirty) return;

  renderGear();

  renderInventory();

  el.sellAllButton.hidden = !sellMode;

  let saleAsh = 0;

  for (const item of state.inventory) {

    if (selectedForSale.has(item.id)) saleAsh += itemSellValue(item);

  }

  el.sellButton.textContent = sellMode

    ? selectedForSale.size

      ? `${selectedForSale.size} verkaufen · ${formatNum(saleAsh)} Asche`

      : 'Abbrechen'

    : 'Verkaufen';

  gearDirty = false;

}

function generateItem() {
  const slot = GEAR_SLOTS[Math.floor(Math.random() * GEAR_SLOTS.length)];
  const rarity = rollRarity();
  return {
    id: ++state.itemSeq,
    slot: slot.key,
    name: `${slot.base} ${rarity.suffix}`,
    rarity: rarity.key,
    enhance: 0,
    mastery: rarity.key === 'episch' ? rollMastery(slot.stat) : null,
    ...rollItemValues(slot, rarity, zoneDef(state.zone).ilvl),
  };
}

let lastFullNotice = 0;

function rollDrop(enemyType) {
  if (Math.random() >= (DROP_CHANCES[enemyType] ?? 0)) return;
  if (state.inventory.length >= INVENTORY_CAP) {
    if (Date.now() - lastFullNotice > 30000) {
      lastFullNotice = Date.now();
      toast('Inventar voll — die Beute verfällt zu Asche.');
    }
    return;
  }
  const item = generateItem();
  state.inventory.push(item);
  gearDirty = true;
  if (item.rarity === 'episch') {
    sfx.epic();
    toast(`Episch: ${item.name}`, rarityOf('episch').color);
  } else if (item.rarity === 'selten') {
    sfx.rare();
    toast(`Selten: ${item.name}`, rarityOf('selten').color);
  }
}

function equipItem(id) {
  const index = state.inventory.findIndex((item) => item.id === id);
  if (index === -1) return;
  const item = state.inventory[index];
  const previous = state.equipment[item.slot];
  state.inventory.splice(index, 1);
  if (previous) state.inventory.push(previous);
  state.equipment[item.slot] = item;
  gearDirty = true;
  hooks.clampHp();
  hooks.save();
  hooks.render();
}

function unequipItem(slotKey) {
  const item = state.equipment[slotKey];
  if (!item || state.inventory.length >= INVENTORY_CAP) return;
  state.equipment[slotKey] = null;
  state.inventory.push(item);
  gearDirty = true;
  hooks.clampHp();
  hooks.save();
  hooks.render();
}

function itemSellValue(item) {
  return Math.round(rarityOf(item.rarity).mult * (4 + state.level));
}

function sortInventory() {
  state.inventory.sort((a, b) => {
    const rarityA = RARITIES.findIndex((rarity) => rarity.key === a.rarity);
    const rarityB = RARITIES.findIndex((rarity) => rarity.key === b.rarity);
    if (rarityB !== rarityA) return rarityB - rarityA;
    const slotA = GEAR_SLOTS.findIndex((slot) => slot.key === a.slot);
    const slotB = GEAR_SLOTS.findIndex((slot) => slot.key === b.slot);
    if (slotA !== slotB) return slotA - slotB;
    return itemScore(b) - itemScore(a);
  });
  gearDirty = true;
  hooks.save();
  hooks.render();
}

function equipBest() {
  let changed = false;
  for (const slot of GEAR_SLOTS) {
    const candidates = state.inventory.filter((item) => item.slot === slot.key);
    if (!candidates.length) continue;
    const best = candidates.reduce((a, b) => (itemScore(b) > itemScore(a) ? b : a));
    const equipped = state.equipment[slot.key];
    if (equipped && itemScore(equipped) >= itemScore(best)) continue;
    state.inventory.splice(state.inventory.indexOf(best), 1);
    if (equipped) state.inventory.push(equipped);
    state.equipment[slot.key] = best;
    changed = true;
  }
  if (!changed) return;
  gearDirty = true;
  hooks.clampHp();
  hooks.save();
  hooks.render();
}

function comparisonHtml(item) {
  const equipped = state.equipment[item.slot];
  if (!equipped || equipped.id === item.id) return '';
  const mastery = equipped.mastery ? ` · Meisterschaft: ${SKILL_EFFECT_LABELS[equipped.mastery.stat](equipped.mastery.value)}` : '';
  return `<div class="tt-compare">Getragen: ${equipped.name}${equipped.enhance ? ` +${equipped.enhance}` : ''} · ${itemStatsText(equipped)}${mastery}</div>`;
}

function tooltipHtml(item, action, showValue = false) {
  if (!item) return '<span class="tt-empty">Leer</span>';
  const rarity = rarityOf(item.rarity);
  const stats = itemStats(item);
  const rows = [
    stats.damage ? `<div class="tt-stat">+${formatNum(stats.damage)} Schaden</div>` : null,
    stats.hp ? `<div class="tt-stat">+${formatNum(stats.hp)} Lebenskraft</div>` : null,
    stats.armor ? `<div class="tt-stat">+${formatNum(stats.armor)} Rüstung</div>` : null,
    stats.critChance ? `<div class="tt-stat">+${stats.critChance} % Kritchance</div>` : null,
    item.enhance ? `<div class="tt-enhance">Verstärkt +${item.enhance}</div>` : null,
    item.mastery ? `<div class="tt-mastery">Meisterschaft: ${SKILL_EFFECT_LABELS[item.mastery.stat](item.mastery.value)}</div>` : null,
  ]
    .filter(Boolean)
    .join('');
  return `
    <div class="tt-name" style="color:${rarity.color}">${item.name}</div>
    <div class="tt-rarity" style="color:${rarity.color}">${rarity.label}</div>
    ${rows}
    ${showValue ? `<div class="tt-stat">Wert: ${formatNum(itemSellValue(item))} Asche</div>` : ''}
    ${comparisonHtml(item)}
    <div class="tt-hint">Klicken zum ${action}</div>`;
}

function renderGear() {
  for (const slotEl of el.gearSlots) {
    const item = state.equipment[slotEl.dataset.slot];
    const slotDef = gearSlotOf(slotEl.dataset.slot);
    const rarity = item ? rarityOf(item.rarity) : null;
    slotEl.querySelector('.slot-value').innerHTML =
      `<span class="slot-icon" style="--icon: url('${iconOf(slotDef.key)}'); color:${rarity ? rarity.color : '#4a443b'}"></span>`;
    slotEl.querySelector('.tooltip').innerHTML = tooltipHtml(item, 'Ablegen');
  }
}

function renderInventory() {
  el.inventoryGrid.replaceChildren();
  if (!state.inventory.length) {
    const note = document.createElement('div');
    note.className = 'inventory-empty';
    note.textContent = 'Die Asche hat noch nichts für dich.';
    el.inventoryGrid.appendChild(note);
    return;
  }
  for (const item of state.inventory) {
    const rarity = rarityOf(item.rarity);
    const cell = document.createElement('button');
    cell.className = 'inv-cell has-tooltip';
    if (sellMode) cell.classList.add('selectable');
    if (selectedForSale.has(item.id)) cell.classList.add('selected');
    cell.dataset.id = item.id;
    cell.style.borderColor = rarity.color;
    cell.innerHTML = `
      <span class="slot-icon inv-icon" style="--icon: url('${iconOf(item.slot)}'); color:${rarity.color}"></span>
      <div class="tooltip">${tooltipHtml(item, sellMode ? 'Auswählen' : 'Anlegen', true)}</div>`;
    el.inventoryGrid.appendChild(cell);
  }
}

function toggleSellMode() {
  sellMode = !sellMode;
  selectedForSale.clear();
  gearDirty = true;
  hooks.render();
}

function exitSellMode() {
  if (!sellMode) return;
  sellMode = false;
  selectedForSale.clear();
  gearDirty = true;
  hooks.render();
}

function sellSelected() {
  if (!selectedForSale.size) {
    toggleSellMode();
    return;
  }
  let ash = 0;
  state.inventory = state.inventory.filter((item) => {
    if (!selectedForSale.has(item.id)) return true;
    ash += itemSellValue(item);
    return false;
  });
  state.ash += ash;
  selectedForSale.clear();
  sellMode = false;
  gearDirty = true;
  hooks.save();
  hooks.render();
}

export { rollDrop, equipItem, unequipItem, sortInventory, equipBest, sellSelected, toggleSellMode, exitSellMode };
