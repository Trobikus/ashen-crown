import { GEAR_SLOTS, RARITIES, LAST_ZONE_INDEX, SKILL_EFFECT_LABELS, gearSlotOf, baseOf, rarityOf, zoneDef, rollItemValues, itemStatsText, itemIlvl, rollMastery, formatNum, itemNameOf } from './data.js';

import { state, craftCostFactor } from './state.js';

import { t } from './i18n.js';

import { ruhmAvailable, RUHM_RELIC_REROLL_COST } from './achievements.js';

import { el } from './dom.js';



// Die Werkstatt skaliert bewusst nur bis zum letzten Hauptspiel-Ziel:
// in den Tiefen wächst sie nicht mehr mit (Balance-Siehe tools/balance-sim.mjs).
const craftIlvl = () => zoneDef(Math.min(state.cleared, LAST_ZONE_INDEX)).ilvl;

// Umschmieden zieht das Ilvl auf die Werkstatt-Stufe — senkt es aber nie:
// Tiefen-Beute (höheres ilvl) verliert beim Umschmieden ihren Wert nicht.
const reforgeIlvlOf = (item) => Math.max(itemIlvl(item), craftIlvl());

let selectedCraftSlot = null;

// Meisterschaft neu schmieden ist die teuerste wiederholbare Handlung —
// Doppelklick-Bestätigung wie bei Respec/Reset, damit kein Fehlklick den
// Perfekt-Wurf wegwirft.
let masteryArmed = false;

let masteryArmTimer = null;

const disarmMastery = () => {
  masteryArmed = false;
  clearTimeout(masteryArmTimer);
  masteryArmTimer = null;
};

function buildCraftSlots() {
  if (el.craftSlots.children.length) return;
  for (const slot of GEAR_SLOTS) {
    const row = document.createElement('button');
    row.className = 'craft-slot';
    row.dataset.slot = slot.key;
    el.craftSlots.appendChild(row);
  }
}

function enhanceBonusValue(slotKey, enhanceLevel) {
  const scale = gearSlotOf(slotKey).stat === 'damage' ? 1 + 0.5 * craftIlvl() : 4 + 2.5 * craftIlvl();
  return Math.max(1, Math.round(scale * (1 + 0.4 * (enhanceLevel - 1))));
}

function enhanceCost(item) {
  return Math.round(30 * 1.6 ** (item.enhance + 1) * (1 + 0.25 * craftIlvl()) * craftCostFactor());
}

function reforgeCost(item) {
  // Pro Stufe in der Kette deutlich teurer; die Skala hängt an craftIlvl.
  const bases = [600, 3000, 12000, 50000];
  const index = RARITIES.findIndex((rarity) => rarity.key === item.rarity);
  return Math.round(bases[Math.max(0, index)] * (1 + 0.4 * craftIlvl()) * craftCostFactor());
}

// Die Endgame-Asche-Senke: Die goldene Meisterschaft lässt sich neu würfeln —
// deutlich billiger als ein Legendär-Umschmieden, aber wiederholbar teuer
// genug, dass die Jagd nach dem Perfekt-Wurf Tiefen-Asche schluckt.
function masteryRerollCost() {
  return Math.round(30000 * (1 + 0.4 * craftIlvl()) * craftCostFactor());
}

// Neu würfeln mit Wechsel-Garantie: Der Meisterschafts-Pool hat nur wenige
// Stats — ohne Schleife trifft der Wurf häufig denselben Wert und das
// Schmieden wirkt wie ein No-op.
function rollChangedMastery(slotStat, current) {
  let next = rollMastery(slotStat);
  for (let tries = 0; tries < 25 && current && next.stat === current.stat && next.value === current.value; tries += 1) {
    next = rollMastery(slotStat);
  }
  return next;
}

function craftRerollMastery(slotKey, hooks) {
  const item = state.equipment[slotKey];
  if (!item?.mastery) return;
  const cost = masteryRerollCost();
  if (state.ash < cost) {
    disarmMastery();
    renderCrafting();
    return;
  }
  state.ash -= cost;
  item.mastery = rollChangedMastery(gearSlotOf(slotKey).stat, item.mastery);
  disarmMastery();
  hooks.after();
}

// Tiefen-Meisterschaft neu schmieden: kostet Ruhm statt Asche — günstig und
// ohne Bestätigung, weil beliebig wiederholbar. Die Jagd nach dem perfekten
// zweiten Wurf ist das Endgame-Ziel der Ruhm-Währung.
function craftRerollRelicMastery(slotKey, hooks) {
  const item = state.equipment[slotKey];
  if (!item?.mastery2) return;
  if (ruhmAvailable(state) < RUHM_RELIC_REROLL_COST) {
    renderCrafting();
    return;
  }
  state.ruhmAusgegeben += RUHM_RELIC_REROLL_COST;
  item.mastery2 = rollChangedMastery(gearSlotOf(slotKey).stat, item.mastery2);
  hooks.after();
}

function craftEnhance(slotKey, hooks) {
  const item = state.equipment[slotKey];
  if (!item) return;
  const cost = enhanceCost(item);
  if (state.ash < cost) return;
  state.ash -= cost;
  item.enhance += 1;
  const bonus = enhanceBonusValue(slotKey, item.enhance);
  if (gearSlotOf(slotKey).stat === 'damage') {
    item.enhanceBonus = { damage: bonus };
  } else {
    item.enhanceBonus = { hp: bonus, armor: Math.max(1, Math.round(bonus * 0.4)) };
  }
  hooks.after();
}

function craftReforge(slotKey, hooks) {
  const item = state.equipment[slotKey];
  if (!item) return;
  const currentIndex = RARITIES.findIndex((rarity) => rarity.key === item.rarity);
  const next = RARITIES[currentIndex + 1];
  if (!next) return;
  const cost = reforgeCost(item);
  if (state.ash < cost) return;
  state.ash -= cost;
  const slot = gearSlotOf(slotKey);
  const baseItem = baseOf(slot, item.base);
  const reforgeIlvl = reforgeIlvlOf(item);
  item.rarity = next.key;
  // Die gewürfelte Basis bleibt dem Stück erhalten — Name und Prägung wandern
  // mit; die Werte rollen neu auf der Ilvl-Sockel-Höhe (Werkstatt-Stufe oder
  // aktuelles Ilvl, je nachdem welches höher liegt).
  item.ilvl = reforgeIlvl;
  item.name = `${baseItem.name} ${next.suffix}`;
  Object.assign(item, rollItemValues(slot, next, reforgeIlvl, baseItem));
  if (next.key === 'legendär') item.mastery = rollMastery(slot.stat);
  hooks.after();
}

function renderCrafting() {
  if (el.sceneCrafting.hidden) return;
  el.craftAsh.textContent = formatNum(state.ash);
  for (const row of el.craftSlots.querySelectorAll('.craft-slot')) {
    const slotKey = row.dataset.slot;
    const item = state.equipment[slotKey];
    const rarity = item ? rarityOf(item.rarity) : null;
    row.classList.toggle('selected', slotKey === selectedCraftSlot);
    row.classList.toggle('empty', !item);
    row.innerHTML = `<span class="craft-slot-name">${t(gearSlotOf(slotKey).label)}</span>
      <span class="craft-slot-item" style="color:${rarity?.color ?? '#5f584e'}">${item ? `${itemNameOf(item)}${item.enhance ? ` +${item.enhance}` : ''}` : t('Leer')}</span>`;
  }
  renderCraftDetail();
}

function renderCraftDetail() {
  const item = state.equipment[selectedCraftSlot];
  if (!item) {
    el.craftDetail.innerHTML = `<p class="craft-hint">${t('Wähle links einen besetzten Ausrüstungsslot, den du schmieden willst.')}</p>`;
    return;
  }
  const rarity = rarityOf(item.rarity);
  const slot = gearSlotOf(selectedCraftSlot);
  const eCost = enhanceCost(item);
  const curBonus = enhanceBonusValue(selectedCraftSlot, item.enhance);
  const nextBonus = enhanceBonusValue(selectedCraftSlot, item.enhance + 1);
  const enhancePreview = slot.stat === 'damage'
    ? t('+{n} Schaden', { n: formatNum(nextBonus - curBonus) })
    : `${t('+{n} Lebenskraft', { n: formatNum(nextBonus - curBonus) })} · ${t('+{n} Rüstung', { n: formatNum(Math.max(1, Math.round((nextBonus - curBonus) * 0.4))) })}`;
  const nextRarity = RARITIES[RARITIES.findIndex((rarity) => rarity.key === item.rarity) + 1] ?? null;
  const rCost = nextRarity ? reforgeCost(item) : 0;
  const masteryHint = nextRarity?.key === 'legendär' ? t('Rollt eine Meisterschaft') : nextRarity ? t('Werte werden neu gewürfelt') : '';
  const mCost = masteryRerollCost();
  const masteryAction = item.mastery
    ? `
    <div class="craft-action">
      <div class="craft-action-head">${t('Meisterschaft neu schmieden')}<span>${t('Würfelt den goldenen Bonus neu — der alte Wurf verfällt')}</span></div>
      <button class="btn-small ${masteryArmed ? 'armed' : ''}" data-craft="mastery" ${state.ash < mCost ? 'disabled' : ''}>${masteryArmed ? t('Wirklich? Neu würfeln.') : state.ash < mCost ? t('Zu wenig Asche — du hast {n}', { n: formatNum(state.ash) }) : t('Neu schmieden · {n} Asche', { n: formatNum(mCost) })}</button>
    </div>`
    : '';
  const relicMasteryAction = item.mastery2
    ? `
    <div class="craft-action">
      <div class="craft-action-head">${t('Tiefen-Meisterschaft neu schmieden')}<span>${t('Würfelt die zweite Meisterschaft neu · kostet Ruhm statt Asche')}</span></div>
      <button class="btn-small" data-craft="relicmastery" ${ruhmAvailable(state) < RUHM_RELIC_REROLL_COST ? 'disabled' : ''}>${ruhmAvailable(state) < RUHM_RELIC_REROLL_COST ? t('Zu wenig Ruhm — du hast {n}', { n: ruhmAvailable(state) }) : t('Neu schmieden · {n} Ruhm', { n: RUHM_RELIC_REROLL_COST })}</button>
    </div>`
    : '';
  el.craftDetail.innerHTML = `
    <div class="craft-item">
      <div class="tt-name" style="color:${rarity.color}">${itemNameOf(item)}${item.enhance ? ` +${item.enhance}` : ''}</div>
      <div class="tt-rarity" style="color:${rarity.color}">${t(rarity.label)} · Ilvl ${formatNum(itemIlvl(item))}</div>
      <div class="tt-stat">${itemStatsText(item)}</div>
      ${item.enhanceBonus ? `<div class="tt-enhance">${t('Verstärkt durch die Werkstatt')}</div>` : ''}
      ${item.mastery ? `<div class="tt-mastery">${t('Meisterschaft: {m}', { m: SKILL_EFFECT_LABELS[item.mastery.stat](item.mastery.value) })}</div>` : ''}
      ${item.mastery2 ? `<div class="tt-mastery">${t('Tiefen-Meisterschaft: {m}', { m: SKILL_EFFECT_LABELS[item.mastery2.stat](item.mastery2.value) })}</div>` : ''}
    </div>
    <div class="craft-action">
      <div class="craft-action-head">${t('Verstärken auf +{n}', { n: item.enhance + 1 })}<span>${enhancePreview}</span></div>
      <button class="btn-small" data-craft="enhance" ${state.ash < eCost ? 'disabled' : ''}>${t('Schmieden · {n} Asche', { n: formatNum(eCost) })}</button>
    </div>
    <div class="craft-action">
      <div class="craft-action-head">${t('Umschmieden auf {r}', { r: nextRarity ? t(nextRarity.label) : '—' })}<span>${nextRarity ? masteryHint : ''}</span></div>
      ${nextRarity
        ? `<button class="btn-small" data-craft="reforge" ${state.ash < rCost ? 'disabled' : ''}>${t('Umschmieden · {n} Asche', { n: formatNum(rCost) })}</button>`
        : `<span class="craft-hint">${t('Maximale Seltenheit erreicht.')}</span>`}
    </div>
    ${masteryAction}
    ${relicMasteryAction}`;
}

export function bindCraftEvents(hooks) {

  el.craftSlots.addEventListener('click', (e) => {

    const row = e.target.closest('.craft-slot');

    if (!row) return;

    if (selectedCraftSlot !== row.dataset.slot) disarmMastery();

    selectedCraftSlot = row.dataset.slot;

    renderCrafting();

  });

  el.craftDetail.addEventListener('click', (e) => {

    const btn = e.target.closest('[data-craft]');

    if (!btn || btn.disabled) return;

    if (btn.dataset.craft === 'enhance') craftEnhance(selectedCraftSlot, hooks);

    else if (btn.dataset.craft === 'reforge') craftReforge(selectedCraftSlot, hooks);

    else if (btn.dataset.craft === 'relicmastery') craftRerollRelicMastery(selectedCraftSlot, hooks);

    else if (btn.dataset.craft === 'mastery') {
      // Doppelklick-Bestätigung: Erster Klick bewaffnet, vier Sekunden später
      // entschärft sich der Knopf von selbst.
      if (!masteryArmed) {
        masteryArmed = true;
        clearTimeout(masteryArmTimer);
        masteryArmTimer = setTimeout(() => {
          masteryArmed = false;
          masteryArmTimer = null;
          renderCrafting();
        }, 4000);
        renderCrafting();
        return;
      }
      craftRerollMastery(selectedCraftSlot, hooks);
    }

  });

}



export { buildCraftSlots, renderCrafting };
