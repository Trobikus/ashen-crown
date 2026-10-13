import { GEAR_SLOTS, RARITIES, ZONES, SKILL_EFFECT_LABELS, gearSlotOf, rarityOf, rollItemValues, itemStatsText, rollMastery } from './data.js';

import { state } from './state.js';

import { el } from './dom.js';



const craftIlvl = () => ZONES[Math.min(state.cleared, ZONES.length - 1)].ilvl;

let selectedCraftSlot = null;

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
  return Math.round(30 * 1.6 ** (item.enhance + 1) * (1 + 0.25 * craftIlvl()));
}

function reforgeCost(item) {
  const base = item.rarity === 'gewoehnlich' ? 600 : 3000;
  return Math.round(base * (1 + 0.4 * craftIlvl()));
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
  if (!item || item.rarity === 'episch') return;
  const cost = reforgeCost(item);
  if (state.ash < cost) return;
  state.ash -= cost;
  const next = item.rarity === 'gewoehnlich' ? RARITIES[1] : RARITIES[2];
  const slot = gearSlotOf(slotKey);
  item.rarity = next.key;
  item.name = `${slot.base} ${next.suffix}`;
  Object.assign(item, rollItemValues(slot, next, craftIlvl()));
  if (next.key === 'episch') item.mastery = rollMastery(slot.stat);
  hooks.after();
}

function renderCrafting() {
  if (el.sceneCrafting.hidden) return;
  el.craftAsh.textContent = state.ash;
  for (const row of el.craftSlots.querySelectorAll('.craft-slot')) {
    const slotKey = row.dataset.slot;
    const item = state.equipment[slotKey];
    const rarity = item ? rarityOf(item.rarity) : null;
    row.classList.toggle('selected', slotKey === selectedCraftSlot);
    row.classList.toggle('empty', !item);
    row.innerHTML = `<span class="craft-slot-name">${gearSlotOf(slotKey).label}</span>
      <span class="craft-slot-item" style="color:${rarity?.color ?? '#5f584e'}">${item ? `${item.name}${item.enhance ? ` +${item.enhance}` : ''}` : 'Leer'}</span>`;
  }
  renderCraftDetail();
}

function renderCraftDetail() {
  const item = state.equipment[selectedCraftSlot];
  if (!item) {
    el.craftDetail.innerHTML = '<p class="craft-hint">Wähle links einen besetzten Ausrüstungsslot, den du schmieden willst.</p>';
    return;
  }
  const rarity = rarityOf(item.rarity);
  const slot = gearSlotOf(selectedCraftSlot);
  const eCost = enhanceCost(item);
  const curBonus = enhanceBonusValue(selectedCraftSlot, item.enhance);
  const nextBonus = enhanceBonusValue(selectedCraftSlot, item.enhance + 1);
  const enhancePreview = slot.stat === 'damage'
    ? `+${nextBonus - curBonus} Schaden`
    : `+${nextBonus - curBonus} Lebenskraft · +${Math.max(1, Math.round((nextBonus - curBonus) * 0.4))} Rüstung`;
  const nextRarity = item.rarity === 'gewoehnlich' ? RARITIES[1] : item.rarity === 'selten' ? RARITIES[2] : null;
  const rCost = nextRarity ? reforgeCost(item) : 0;
  const masteryHint = nextRarity?.key === 'episch' ? 'Rollt eine Meisterschaft' : 'Werte werden neu gewürfelt';
  el.craftDetail.innerHTML = `
    <div class="craft-item">
      <div class="tt-name" style="color:${rarity.color}">${item.name}${item.enhance ? ` +${item.enhance}` : ''}</div>
      <div class="tt-rarity" style="color:${rarity.color}">${rarity.label}</div>
      <div class="tt-stat">${itemStatsText(item)}</div>
      ${item.enhanceBonus ? '<div class="tt-enhance">Verstärkt durch die Werkstatt</div>' : ''}
      ${item.mastery ? `<div class="tt-mastery">Meisterschaft: ${SKILL_EFFECT_LABELS[item.mastery.stat](item.mastery.value)}</div>` : ''}
    </div>
    <div class="craft-action">
      <div class="craft-action-head">Verstärken auf +${item.enhance + 1}<span>${enhancePreview}</span></div>
      <button class="btn-small" data-craft="enhance" ${state.ash < eCost ? 'disabled' : ''}>Schmieden · ${eCost} Asche</button>
    </div>
    <div class="craft-action">
      <div class="craft-action-head">Umschmieden auf ${nextRarity ? nextRarity.label : '—'}<span>${nextRarity ? masteryHint : ''}</span></div>
      ${nextRarity
        ? `<button class="btn-small" data-craft="reforge" ${state.ash < rCost ? 'disabled' : ''}>Umschmieden · ${rCost} Asche</button>`
        : '<span class="craft-hint">Maximale Seltenheit erreicht.</span>'}
    </div>`;
}

export function bindCraftEvents(hooks) {

  el.craftSlots.addEventListener('click', (e) => {

    const row = e.target.closest('.craft-slot');

    if (!row) return;

    selectedCraftSlot = row.dataset.slot;

    renderCrafting();

  });

  el.craftDetail.addEventListener('click', (e) => {

    const btn = e.target.closest('[data-craft]');

    if (!btn || btn.disabled) return;

    if (btn.dataset.craft === 'enhance') craftEnhance(selectedCraftSlot, hooks);

    else craftReforge(selectedCraftSlot, hooks);

  });

}



export { buildCraftSlots, renderCrafting };
