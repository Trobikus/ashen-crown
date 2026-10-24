import waffeIcon from './assets/icons/waffe.svg';
import brustIcon from './assets/icons/brust.svg';
import helmIcon from './assets/icons/helm.svg';
import hoseIcon from './assets/icons/hose.svg';
import schuheIcon from './assets/icons/schuhe.svg';
import handIcon from './assets/icons/hand.svg';
import { GEAR_SLOTS, RARITIES, DROP_CHANCES, LIFELEECH_PCT_BY_RARITY, zoneDef, gearSlotOf, rarityOf, rollRarity, pickBase, baseOf, rollItemValues, itemStats, itemStatRanges, itemIlvl, itemScore, rollMastery, memoryTier, ARCHETYPE_LABELS, rollRangesVisible, setRollRanges, SKILL_EFFECT_LABELS, formatNum, pairedSlotsOf, itemNameOf } from './data.js';

import { state, settings, inventoryCap } from './state.js';

import { t } from './i18n.js';

import { LEGACY_TITLES, legacyLevel } from './prestige.js';

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

// Sprachwechsel: Getragenes und Inventar zeigen übersetzte Namen und Werte in
// ihrem Markup — der Dirty-Marker zwingt das nächste renderGearIfDirty() zum
// Neuaufbau.
function markGearDirty() {
  gearDirty = true;
}

// ——— Drag & Drop: Inventar-Stück direkt in einen Ausrüstungsslot ziehen ———
// Die gezogene ID lebt in einem Modul-Flag, nicht in dataTransfer: Der
// Browser stellt dragTransfer-Daten während dragover aus Schutzgründen nicht
// bereit, der Glow (grün = passt, rot = fremder Slot) entscheidet aber genau
// dort. Ein Blickwechsel: left/rechts-Handschuhe teilen einen Pool — beide
// Slots nehmen beide Handschuhe (anders als der Klick-Pfad kein
// schwächere-Hand-Auto, hier zählt der gewählte Slot).

let dragItemId = null;

function slotAcceptsItem(slotKey, item) {
  const slot = gearSlotOf(slotKey);
  if (!slot || !item) return false;
  if (item.slot === slotKey) return true;
  return pairedSlotsOf(item.slot).length > 1 && pairedSlotsOf(item.slot).includes(slotKey);
}

function clearDrag() {
  dragItemId = null;
  for (const slotEl of el.gearSlots) slotEl.classList.remove('drop-ok', 'drop-bad');
  for (const cell of el.inventoryGrid.querySelectorAll('.inv-cell.dragging')) cell.classList.remove('dragging');
}

// Gerichtetes Anlegen: Das Stück landet im gewählten Slot, der bisherige
// Bewohner wandert ins Inventar (Tausch hält die Belegung konstant — kein
// Platz-Problem). Handschuh-Paare legen exakt dorthin, wohin gezogen wurde.
function equipItemToSlot(id, slotKey) {
  const index = state.inventory.findIndex((it) => it.id === id);
  if (index === -1) return;
  const item = state.inventory[index];
  if (!slotAcceptsItem(slotKey, item)) return;
  const previous = state.equipment[slotKey] ?? null;
  state.inventory.splice(index, 1);
  if (previous) state.inventory.push(previous);
  state.equipment[slotKey] = item;
  gearDirty = true;
  hooks.clampHp();
  hooks.save();
  hooks.render();
}

function bindDragAndDrop() {
  // Datei-Drops aus dem Betriebssystem dürfen das Fenster nie navigieren —
  // global abfangen; unsere Slot-Handler entscheiden selbst, was sie nehmen.
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => e.preventDefault());

  el.inventoryGrid.addEventListener('dragstart', (e) => {
    const cell = e.target.closest?.('.inv-cell');
    if (!cell || sellMode) {
      e.preventDefault();
      return;
    }
    dragItemId = Number(cell.dataset.id);
    cell.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cell.dataset.id);
  });
  el.inventoryGrid.addEventListener('dragend', clearDrag);

  for (const slotEl of el.gearSlots) {
    slotEl.addEventListener('dragover', (e) => {
      if (dragItemId === null) return; // fremde Drags (z. B. Dateien) ignorieren
      const item = state.inventory.find((it) => it.id === dragItemId);
      const ok = slotAcceptsItem(slotEl.dataset.slot, item);
      if (!ok) {
        // Ohne preventDefault verwirft der Browser den Drop selbst — der
        // rote Glow sagt additionally, warum.
        slotEl.classList.remove('drop-ok');
        slotEl.classList.add('drop-bad');
        return;
      }
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      slotEl.classList.add('drop-ok');
      slotEl.classList.remove('drop-bad');
    });
    slotEl.addEventListener('dragleave', (e) => {
      // Über Kind-Elemente (Tooltip) ziehen ist kein Verlassen des Slots.
      if (slotEl.contains(e.relatedTarget)) return;
      slotEl.classList.remove('drop-ok', 'drop-bad');
    });
    slotEl.addEventListener('drop', (e) => {
      const id = dragItemId;
      clearDrag();
      if (id === null) return;
      e.preventDefault();
      equipItemToSlot(id, slotEl.dataset.slot);
    });
  }
}



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

  // Sofort rendern — sonst warten Markierungen und Button-Label auf den
  // nächsten 3-Sekunden-Tick und der Knopf wirkt tot.
  hooks.render();

}

export function handleInventoryClick(e) {

  const cell = e.target.closest('.inv-cell');

  if (!cell) return;

  const id = Number(cell.dataset.id);

  if (sellMode) {

    if (selectedForSale.has(id)) selectedForSale.delete(id);

    else selectedForSale.add(id);

    gearDirty = true;

    hooks.render();

  } else {

    equipItem(id);

  }

}

export function sellButtonAction() {

  if (sellMode) sellSelected();

  else toggleSellMode();

}

// Das Erwachen leert Inventar und Ausrüstung im Spielstand — das Panel darf
// nicht vom alten Stand zehren: Verkaufsmodus und Selektion verfallen mit dem
// Lauf, der Dirty-Marker zwingt das nächste renderGearIfDirty() zum Neuaufbau
// (sonst bliebe das getragene Gear bis zum nächsten Drop im DOM stehen).
export function resetGearForPrestige() {
  sellMode = false;
  selectedForSale.clear();
  gearDirty = true;
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

      ? t('{n} verkaufen · {n2} Asche', { n: selectedForSale.size, n2: formatNum(saleAsh) })

      : t('Abbrechen')

    : t('Verkaufen');

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

// guaranteed: Safedrop (erster Elite-Kill eines Gebiets) — umgeht die Chance.
  // „Tiefenwissen" (Vermächtnis) erhöht Elite-/Boss-Chancen um absolute Punkte.
  function rollDrop(enemyType, guaranteed = false) {
    const base = DROP_CHANCES[enemyType] ?? 0;
    const bonus = enemyType === 'normal' ? 0 : LEGACY_TITLES.tiefenwissen.perLevel * legacyLevel(state, 'tiefenwissen');
  if (Math.random() >= (guaranteed ? 1 : Math.min(1, base + bonus))) return;
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
        toast(t('Auto-Verkauf: {name} — +{n} Asche.', { name: itemNameOf(item), n: formatNum(ash) }));
      }
    } else if (Date.now() - lastFullNotice > 30000) {
      lastFullNotice = Date.now();
      toast(t('Inventar voll — Beute sofort verkauft: +{n} Asche.', { n: formatNum(ash) }));
    }
    return;
  }
  state.inventory.push(item);
  gearDirty = true;
  spawnLootPulse(rarityOf(item.rarity).color);
  if (item.rarity === 'legendär') {
    sfx.legendary();
    toast(t('Legendär: {name}', { name: itemNameOf(item) }), rarityOf('legendär').color);
  } else if (item.rarity === 'episch') {
    sfx.epic();
    toast(t('Episch: {name}', { name: itemNameOf(item) }), rarityOf('episch').color);
  } else if (item.rarity === 'selten') {
    sfx.rare();
    toast(t('Selten: {name}', { name: itemNameOf(item) }), rarityOf('selten').color);
  }
}

// Loot-Puls: Das Fund leuchtet am sterbenden Gegner in seiner
// Seltenheitsfarbe auf — der Beute-Moment passiert in der Arena, nicht nur
// als Toast. Gleiche Funken-/Ring-Bausteine wie die Treffer-Effekte,
// gekoppelt an dieselbe Option (hitFlash) und die Bewegungsreduktion.
function spawnLootPulse(color) {
  if (!settings.hitFlash) return;
  const fighter = el.enemyFighter;
  if (!fighter) return;
  const pulse = document.createElement('span');
  pulse.className = 'loot-pulse';
  pulse.style.setProperty('--loot-color', color);
  for (let i = 0; i < 9; i += 1) {
    const spark = document.createElement('i');
    const angle = Math.random() * Math.PI * 2;
    const dist = 18 + Math.random() * 30;
    spark.style.setProperty('--spark-dx', `${Math.cos(angle) * dist}px`);
    spark.style.setProperty('--spark-dy', `${Math.sin(angle) * dist - 14}px`);
    spark.style.setProperty('--spark-delay', `${(Math.random() * 80).toFixed(0)}ms`);
    pulse.appendChild(spark);
  }
  fighter.appendChild(pulse);
  setTimeout(() => pulse.remove(), 750);
}

// Ziel-Slot beim Anlegen: Symmetrische Paare (derzeit die beiden Handschuh-
// Slots) legen in den schwächeren bzw. leeren der beiden — leer zählt als am
// schwächsten. Alle anderen Slots sind ihr eigenes Ziel.
function equipTargetOf(item) {
  const pair = pairedSlotsOf(item.slot);
  if (pair.length < 2) return item.slot;
  const scoreOf = (key) => (state.equipment[key] ? itemScore(state.equipment[key]) : -1);
  return scoreOf(pair[0]) <= scoreOf(pair[1]) ? pair[0] : pair[1];
}

function equipItem(id) {
  const index = state.inventory.findIndex((item) => item.id === id);
  if (index === -1) return;
  const item = state.inventory[index];
  const target = equipTargetOf(item);
  const previous = state.equipment[target];
  state.inventory.splice(index, 1);
  if (previous) state.inventory.push(previous);
  state.equipment[target] = item;
  gearDirty = true;
  hooks.clampHp();
  hooks.save();
  hooks.render();
}

function unequipItem(slotKey) {
  const item = state.equipment[slotKey];
  if (!item) return;
  if (state.inventory.length >= inventoryCap()) {
    toast(t('Inventar voll — erst Platz schaffen.'));
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
  // Gruppen: normale Slots einzeln, symmetrische Paare als eine — ein Paar
  // wird nur einmal betrachtet.
  const groups = [];
  for (const slot of GEAR_SLOTS) {
    const pair = pairedSlotsOf(slot.key);
    if (pair.length > 1) {
      if (pair[0] === slot.key) groups.push(pair);
      continue;
    }
    groups.push([slot.key]);
  }
  for (const slots of groups) {
    const worn = slots.map((key) => state.equipment[key]).filter(Boolean);
    const candidates = state.inventory.filter((item) => slots.includes(item.slot));
    if (!candidates.length) continue;
    // Bei Punkte-Gleichstand bleibt das Getragene im Slot — kein geister-
    // hafter Tausch gleichwertiger Stücke.
    const wornIds = new Set(worn.map((item) => item.id));
    const pool = [...candidates, ...worn].sort((a, b) =>
      itemScore(b) - itemScore(a) || (wornIds.has(a) ? -1 : wornIds.has(b) ? 1 : 0));
    const best = pool.slice(0, slots.length);
    const same = best.length === worn.length && best.every((item) => wornIds.has(item.id));
    if (same) continue;
    const keepIds = new Set(best.map((item) => item.id));
    for (const item of candidates) {
      if (keepIds.has(item.id)) state.inventory.splice(state.inventory.indexOf(item), 1);
    }
    slots.forEach((key, i) => { state.equipment[key] = best[i] ?? null; });
    // Verdrängte Getragene und nicht gewählte Kandidaten zurück ins Inventar.
    for (const item of pool.slice(slots.length)) state.inventory.push(item);
    changed = true;
  }
  if (!changed) return;
  gearDirty = true;
  hooks.clampHp();
  hooks.save();
  hooks.render();
}

// Delta-Vergleich: Nur die Unterschiede zum getragenen Stück, grün/rot je
// Zeile — der Spieler rechnet nicht mehr im Kopf, was +8 Schaden gegen
// −12 Lebenskraft bedeutet.
const DELTA_STATS = [
  ['damage', 'Schaden'],
  ['damagePct', '% Schaden'],
  ['hp', 'Lebenskraft'],
  ['hpPct', '% Lebenskraft'],
  ['armor', 'Rüstung'],
  ['armorPct', '% Rüstung'],
  ['critChance', '% Kritchance'],
  ['critDmg', '% Kritschaden'],
  ['lifeleech', '% Lifeleech'],
  ['lifeleechFlat', 'Lifeleech pro Treffer'],
];

function comparisonHtml(item) {
  // Verglichen wird gegen das Stück, das beim Anlegen ersetzt würde — bei
  // symmetrischen Paaren also gegen den schwächeren der beiden getragenen.
  const equipped = state.equipment[equipTargetOf(item)];
  if (!equipped || equipped.id === item.id) return '';
  const now = itemStats(item);
  const worn = itemStats(equipped);
  const rows = [];
  for (const [key, label] of DELTA_STATS) {
    const diff = (now[key] ?? 0) - (worn[key] ?? 0);
    if (diff === 0) continue;
    const cls = diff > 0 ? 'delta-up' : 'delta-down';
    rows.push(`<div class="${cls}">${diff > 0 ? '+' : '−'}${formatNum(Math.abs(diff))} ${t(label)}</div>`);
  }
  // Meisterschaft: nur andeuten, wenn sie sich unterscheidet — Werte sind
  // im Tooltip des Stücks selbst zu lesen.
  const mNow = item.mastery ? SKILL_EFFECT_LABELS[item.mastery.stat](item.mastery.value) : null;
  const mWorn = equipped.mastery ? SKILL_EFFECT_LABELS[equipped.mastery.stat](equipped.mastery.value) : null;
  let mastery = '';
  if (mNow !== mWorn) {
    if (mNow && mWorn) mastery = `<div class="delta-up">${t('Meisterschaft: {a} → {b}', { a: mWorn, b: mNow })}</div>`;
    else if (mNow) mastery = `<div class="delta-up">${t('Neue Meisterschaft: {m}', { m: mNow })}</div>`;
    else mastery = `<div class="delta-down">${t('Meisterschaft entfällt: {m}', { m: mWorn })}</div>`;
  }
  const body = rows.length || mastery
    ? rows.join('') + mastery
    : `<div class="delta-equal">${t('Gleiche Werte wie getragen.')}</div>`;
  return `<div class="tt-compare"><div class="tt-compare-head">${t('Getragen: {name}', { name: itemNameOf(equipped) })}${equipped.enhance ? ` +${equipped.enhance}` : ''}</div>${body}</div>`;
}

// Gedächtnis-Block für Tooltips: die Biografie des Stücks — Kopfzeile mit
// der Gesamtzahl der Beutezüge, je Familie mit aktivem Bonus eine Zeile.
// Familien ohne Bonus zählen nur in die Summe (die Jugend des Stücks).
function memoryHtml(item) {
  if (!item.memory) return '';
  const families = Object.keys(ARCHETYPE_LABELS)
    .filter((family) => (item.memory[family] ?? 0) > 0)
    .sort((a, b) => item.memory[b] - item.memory[a]);
  if (!families.length) return '';
  const total = families.reduce((sum, family) => sum + item.memory[family], 0);
  const lines = families
    .filter((family) => memoryTier(item.memory[family]) > 0)
    .map((family) => `<div class="tt-memory">${t('{fam}: +{p} % Schaden · {n} erlegt', { fam: t(ARCHETYPE_LABELS[family]), p: memoryTier(item.memory[family]), n: formatNum(item.memory[family]) })}</div>`);
  return `<div class="tt-memory-head">${t('Gedächtnis · {n} erlegt', { n: formatNum(total) })}</div>${lines.join('')}`;
}

function tooltipHtml(item, action, showValue = false) {
  if (!item) return `<span class="tt-empty">${t('Leer')}</span>`;
  const rarity = rarityOf(item.rarity);
  const stats = itemStats(item);
  const ranges = rollRangesVisible ? itemStatRanges(item) : null;
  const rangeTag = (field) => {
    const range = ranges?.[field];
    return range ? ` <span class="tt-range">[${range[0]} – ${range[1]}]</span>` : '';
  };
  const rows = [
    stats.damage ? `<div class="tt-stat">${t('+{n} Schaden', { n: formatNum(stats.damage) })}${rangeTag('damage')}</div>` : null,
    stats.damagePct ? `<div class="tt-stat">${t('+{n} % Schaden', { n: stats.damagePct })}${rangeTag('damagePct')}</div>` : null,
    stats.hp ? `<div class="tt-stat">${t('+{n} Lebenskraft', { n: formatNum(stats.hp) })}${rangeTag('hp')}</div>` : null,
    stats.hpPct ? `<div class="tt-stat">${t('+{n} % Lebenskraft', { n: stats.hpPct })}${rangeTag('hpPct')}</div>` : null,
    stats.armor ? `<div class="tt-stat">${t('+{n} Rüstung', { n: formatNum(stats.armor) })}${rangeTag('armor')}</div>` : null,
    stats.armorPct ? `<div class="tt-stat">${t('+{n} % Rüstung', { n: stats.armorPct })}${rangeTag('armorPct')}</div>` : null,
    stats.critChance ? `<div class="tt-stat">${t('+{n} % Kritchance', { n: stats.critChance })}${rangeTag('critChance')}</div>` : null,
    stats.critDmg ? `<div class="tt-stat">${t('+{n} % Kritschaden', { n: stats.critDmg })}${rangeTag('critDmg')}</div>` : null,
    stats.lifeleech ? `<div class="tt-leech">${t('+{n} % Lifeleech', { n: stats.lifeleech })}${rangeTag('lifeleech')}</div>` : null,
    stats.lifeleechFlat ? `<div class="tt-leech">${t('+{n} Lifeleech pro Treffer', { n: formatNum(stats.lifeleechFlat) })}${rangeTag('lifeleechFlat')}</div>` : null,
    item.enhance ? `<div class="tt-enhance">${t('Verstärkt +{n}', { n: item.enhance })}</div>` : null,
    item.mastery ? `<div class="tt-mastery">${t('Meisterschaft: {m}', { m: SKILL_EFFECT_LABELS[item.mastery.stat](item.mastery.value) })}</div>` : null,
    item.mastery2 ? `<div class="tt-mastery">${t('Tiefen-Meisterschaft: {m}', { m: SKILL_EFFECT_LABELS[item.mastery2.stat](item.mastery2.value) })}</div>` : null,
    item.memory ? memoryHtml(item) : null,
  ]
    .filter(Boolean)
    .join('');
  return `
    <div class="tt-name rarity-${rarity.key}">${itemNameOf(item)}</div>
    <div class="tt-rarity rarity-${rarity.key}">${t(rarity.label)} · Ilvl ${formatNum(itemIlvl(item))}</div>
    ${rows}
    ${showValue ? `<div class="tt-stat">${t('Wert: {n} Asche', { n: formatNum(itemSellValue(item)) })}</div>` : ''}
    ${comparisonHtml(item)}
    <div class="tt-hint">${t('Klicken zum {action}', { action: t(action) })}</div>`;
}

function renderGear() {
  for (const slotEl of el.gearSlots) {
    const item = state.equipment[slotEl.dataset.slot];
    const slotDef = gearSlotOf(slotEl.dataset.slot);
    const rarity = item ? rarityOf(item.rarity) : null;
    slotEl.querySelector('.slot-value').innerHTML =
      `<span class="slot-icon${rarity ? ` rarity-${rarity.key}` : ''}"></span>`;
    // Icon-URL per CSSOM — Inline-Style-Attribute aus HTML-Strings verwirft
    // die CSP (siehe tools/csp-check.mjs).
    slotEl.querySelector('.slot-value .slot-icon').style.setProperty('--icon', `url('${iconOf(slotDef.key)}')`);
    slotEl.querySelector('.tooltip').innerHTML = tooltipHtml(item, 'Ablegen');
  }
}

function renderInventory() {
  el.inventoryGrid.replaceChildren();
  if (!state.inventory.length) {
    const note = document.createElement('div');
    note.className = 'inventory-empty';
    note.textContent = t('Die Asche hat noch nichts für dich.');
    el.inventoryGrid.appendChild(note);
    return;
  }
  for (const item of state.inventory) {
    const rarity = rarityOf(item.rarity);
    const cell = document.createElement('button');
    cell.className = 'inv-cell has-tooltip';
    if (sellMode) cell.classList.add('selectable');
    cell.draggable = !sellMode;
    if (selectedForSale.has(item.id)) cell.classList.add('selected');
    cell.dataset.id = item.id;
    cell.style.borderColor = rarity.color;
    cell.setAttribute('aria-label', `${itemNameOf(item)} — ${t(rarity.label)}`);
    cell.innerHTML = `
      <span class="slot-icon inv-icon rarity-${rarity.key}"></span>
      <div class="tooltip">${tooltipHtml(item, sellMode ? 'Auswählen' : 'Anlegen', true)}</div>`;
    cell.querySelector('.slot-icon').style.setProperty('--icon', `url('${iconOf(item.slot)}')`);
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

// Nachhallrelikt: Der Lohn des gebrochenen Nachhalls — die Klinge des
// früheren Ichs, neu geschmieden auf der Stufe seines Endes (Zonen-ilvl der
// Grenzzone), mit gesicherter Lifeleech, EINER Meisterschaft und dem
// Gedächtnis all ihrer Beutezüge. Die Werte würfeln neu — die Erinnerung
// wandert mit dem Stahl.
function buildEchoRelic(echo) {
  const slot = gearSlotOf('waffe');
  const rarity = rarityOf('legendär');
  const ilvl = zoneDef(echo.zone).ilvl;
  const baseItem = baseOf(slot, echo.weaponBase ?? slot.bases[0].name);
  const values = rollItemValues(slot, rarity, ilvl, baseItem);
  if (!values.lifeleech && !values.lifeleechFlat) {
    const [min, max] = LIFELEECH_PCT_BY_RARITY.legendär;
    values.lifeleech = min + Math.floor(Math.random() * (max - min + 1));
  }
  return {
    id: ++state.itemSeq,
    slot: slot.key,
    base: baseItem.name,
    name: `Nachhallrelikt: ${baseItem.name} ${rarity.suffix}`,
    rarity: rarity.key,
    ilvl,
    enhance: 0,
    mastery: rollMastery(slot.stat),
    memory: echo.weaponMemory ? { ...echo.weaponMemory } : null,
    ...values,
  };
}

// Legt ein gebautes Stück direkt ins Inventar (Tiefenrelikt) und markiert
// das Gear-Rendering dirty — der normale Drop-Pfad läuft über rollDrop.
function grantItem(item) {
  state.inventory.push(item);
  gearDirty = true;
}

export { rollDrop, equipItem, unequipItem, sortInventory, equipBest, sellSelected, toggleSellMode, exitSellMode, buildDepthRelic, buildEchoRelic, grantItem, itemSellValue, itemNameOf, memoryHtml, markGearDirty, bindDragAndDrop, slotAcceptsItem, equipItemToSlot };
