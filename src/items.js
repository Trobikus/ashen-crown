import waffeIcon from './assets/icons/waffe.svg';
import brustIcon from './assets/icons/brust.svg';
import helmIcon from './assets/icons/helm.svg';
import hoseIcon from './assets/icons/hose.svg';
import schuheIcon from './assets/icons/schuhe.svg';
import handIcon from './assets/icons/hand.svg';
import { GEAR_SLOTS, RARITIES, DROP_CHANCES, LIFELEECH_PCT_BY_RARITY, zoneDef, gearSlotOf, rarityOf, rollRarity, pickBase, rollItemValues, itemStats, itemStatsText, itemStatRanges, itemIlvl, itemScore, rollMastery, rollRangesVisible, setRollRanges, SKILL_EFFECT_LABELS, formatNum } from './data.js';

import { state, settings, inventoryCap } from './state.js';

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

export function initItems(deps) {
  hooks = deps;
  // Alt gedrückt: Tooltips zeigen die Roll-Spannen der Werte (Diablo-Lese).
  // Ein Tastendruck rendert neu — losgelassen wieder nur die Würfe.
  const setAlt = (on) => {
    if (rollRangesVisible === on) return;
    setRollRanges(on);
    gearDirty = true;
    hooks.render();
  };
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Alt') {
      e.preventDefault();
      setAlt(true);
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'Alt') setAlt(false);
  });
  window.addEventListener('blur', () => setAlt(false));
}

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
  const ilvl = zoneDef(state.zone).ilvl;
  const rarity = rollRarity();
  const baseItem = pickBase(slot, ilvl);
  return {
    id: ++state.itemSeq,
    slot: slot.key,
    base: baseItem.name,
    name: `${baseItem.name} ${rarity.suffix}`,
    rarity: rarity.key,
    ilvl,
    enhance: 0,
    // Meisterschaft ist das „Legendary Power" — nur dort, nie auf Episch.
    mastery: rarity.key === 'legendär' ? rollMastery(slot.stat) : null,
    ...rollItemValues(slot, rarity, ilvl, baseItem),
  };
}

let lastFullNotice = 0;

let lastAutoSellNotice = 0;

// Auto-Verkauf: Beute unter der gewählten Seltenheit wird beim Fund sofort
// zum Verkaufspreis in Asche umgetauscht — das Inventar bleibt für Funde.
// Die Schwelle ist der Index, UNTER dem verkauft wird; „aus" heißt 0,
// denn kein Seltenheits-Index liegt unter 0. (RARITIES.length wäre der
// Inverse: jeder Index läge darunter und ALLES würde verkauft.)
const autoSellThreshold = () => {
  if (settings.autoSell === 'unter-selten') return 2;
  if (settings.autoSell === 'unter-episch') return 3;
  return 0;
};

function rollDrop(enemyType) {
  if (Math.random() >= (DROP_CHANCES[enemyType] ?? 0)) return;
  const item = generateItem();
  state.drops[item.rarity] = (state.drops[item.rarity] ?? 0) + 1;
  const autoSold = RARITIES.findIndex((rarity) => rarity.key === item.rarity) < autoSellThreshold();
  if (autoSold || state.inventory.length >= inventoryCap()) {
    // Volles Inventar ist kein Verlust: Die Beute wird sofort zum
    // Verkaufspreis in Asche umgetauscht — statt sich zu verflüchtigen.
    const ash = itemSellValue(item);
    state.ash += ash;
    if (autoSold) {
      if (Date.now() - lastAutoSellNotice > 30000) {
        lastAutoSellNotice = Date.now();
        toast(`Auto-Verkauf: ${item.name} — +${formatNum(ash)} Asche.`);
      }
    } else if (Date.now() - lastFullNotice > 30000) {
      lastFullNotice = Date.now();
      toast(`Inventar voll — Beute sofort verkauft: +${formatNum(ash)} Asche.`);
    }
    return;
  }
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
  if (!item) return;
  if (state.inventory.length >= inventoryCap()) {
    toast('Inventar voll — erst Platz schaffen.');
    return;
  }
  state.equipment[slotKey] = null;
  state.inventory.push(item);
  gearDirty = true;
  hooks.clampHp();
  hooks.save();
  hooks.render();
}

function itemSellValue(item) {
  // Wert wächst mit dem Stück: Seltenheit × (Stufen-Fundament + ilvl-Anteil) —
  // sonst verpuffen Spätspiel-Verkäufe als numeric noise (ein Tiefenstück
  // brachte denselben Betrag wie ein Anfangsstück).
  return Math.round(rarityOf(item.rarity).mult * (4 + state.level) * (1 + 0.25 * itemIlvl(item)));
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
  const ranges = rollRangesVisible ? itemStatRanges(item) : null;
  const rangeTag = (field) => {
    const range = ranges?.[field];
    return range ? ` <span class="tt-range">[${range[0]} – ${range[1]}]</span>` : '';
  };
  const rows = [
    stats.damage ? `<div class="tt-stat">+${formatNum(stats.damage)} Schaden${rangeTag('damage')}</div>` : null,
    stats.damagePct ? `<div class="tt-stat">+${stats.damagePct} % Schaden${rangeTag('damagePct')}</div>` : null,
    stats.hp ? `<div class="tt-stat">+${formatNum(stats.hp)} Lebenskraft${rangeTag('hp')}</div>` : null,
    stats.hpPct ? `<div class="tt-stat">+${stats.hpPct} % Lebenskraft${rangeTag('hpPct')}</div>` : null,
    stats.armor ? `<div class="tt-stat">+${formatNum(stats.armor)} Rüstung${rangeTag('armor')}</div>` : null,
    stats.armorPct ? `<div class="tt-stat">+${stats.armorPct} % Rüstung${rangeTag('armorPct')}</div>` : null,
    stats.critChance ? `<div class="tt-stat">+${stats.critChance} % Kritchance${rangeTag('critChance')}</div>` : null,
    stats.critDmg ? `<div class="tt-stat">+${stats.critDmg} % Kritschaden${rangeTag('critDmg')}</div>` : null,
    stats.lifeleech ? `<div class="tt-leech">+${stats.lifeleech} % Lifeleech${rangeTag('lifeleech')}</div>` : null,
    stats.lifeleechFlat ? `<div class="tt-leech">+${formatNum(stats.lifeleechFlat)} Lifeleech pro Treffer${rangeTag('lifeleechFlat')}</div>` : null,
    item.enhance ? `<div class="tt-enhance">Verstärkt +${item.enhance}</div>` : null,
    item.mastery ? `<div class="tt-mastery">Meisterschaft: ${SKILL_EFFECT_LABELS[item.mastery.stat](item.mastery.value)}</div>` : null,
    item.mastery2 ? `<div class="tt-mastery">Tiefen-Meisterschaft: ${SKILL_EFFECT_LABELS[item.mastery2.stat](item.mastery2.value)}</div>` : null,
  ]
    .filter(Boolean)
    .join('');
  return `
    <div class="tt-name" style="color:${rarity.color}">${item.name}</div>
    <div class="tt-rarity" style="color:${rarity.color}">${rarity.label} · Ilvl ${formatNum(itemIlvl(item))}</div>
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

// Tiefenrelikt: Die Belohnung für den ersten Boss einer Aschentiefe — ein
// garantiertes Legendärstück auf Tiefen-ilvl mit gesicherter Lifeleech und
// ZWEI Meisterschaften. Das Jagdziel des Endgames.
function buildDepthRelic(ilvl) {
  const slot = GEAR_SLOTS[Math.floor(Math.random() * GEAR_SLOTS.length)];
  const rarity = rarityOf('legendär');
  const baseItem = pickBase(slot, ilvl);
  const values = rollItemValues(slot, rarity, ilvl, baseItem);
  if (!values.lifeleech && !values.lifeleechFlat) {
    const [min, max] = LIFELEECH_PCT_BY_RARITY.legendär;
    values.lifeleech = min + Math.floor(Math.random() * (max - min + 1));
  }
  return {
    id: ++state.itemSeq,
    slot: slot.key,
    base: baseItem.name,
    name: `Tiefenrelikt: ${baseItem.name} ${rarity.suffix}`,
    rarity: rarity.key,
    ilvl,
    enhance: 0,
    mastery: rollMastery(slot.stat),
    mastery2: rollMastery(slot.stat),
    ...values,
  };
}

// Legt ein gebautes Stück direkt ins Inventar (Tiefenrelikt) und markiert
// das Gear-Rendering dirty — der normale Drop-Pfad läuft über rollDrop.
function grantItem(item) {
  state.inventory.push(item);
  gearDirty = true;
}

export { rollDrop, equipItem, unequipItem, sortInventory, equipBest, sellSelected, toggleSellMode, exitSellMode, buildDepthRelic, grantItem, itemSellValue };
