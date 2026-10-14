import { GEAR_SLOTS, enemyDef, BASE_CRIT_CHANCE, CRIT_MULTIPLIER, BASE_ATTACK_SPEED, ARMOR_RESISTANCE, itemStats } from './data.js';
import { state } from './state.js';
import { skillBonus } from './skilltree.js';

export function scaledEnemy(type) {
  return { ...enemyDef(state.zone)[type] };
}

export function masteryBonus(stat) {
  let total = 0;
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (item?.mastery?.stat === stat) total += item.mastery.value;
  }
  return total;
}

export function statBonus(stat) {
  return skillBonus(stat) + masteryBonus(stat);
}

export function heroDamage() {
  let damage = state.damage;
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (item) damage += itemStats(item).damage;
  }
  return Math.round((damage + statBonus('damage')) * (1 + statBonus('damagePct') / 100));
}

export function heroMaxHp() {
  let maxHp = state.maxHp;
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (item) maxHp += itemStats(item).hp;
  }
  return Math.round((maxHp + statBonus('hp')) * (1 + statBonus('hpPct') / 100));
}

export function heroArmor() {
  let armor = state.armorBase;
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (item) armor += itemStats(item).armor;
  }
  return Math.round((armor + statBonus('armor')) * (1 + statBonus('armorPct') / 100));
}

export function heroCritChance() {
  let crit = BASE_CRIT_CHANCE + state.critBonus;
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (item) crit += itemStats(item).critChance;
  }
  return crit + statBonus('crit');
}

export function heroAttackSpeed() {
  return BASE_ATTACK_SPEED + statBonus('speed') / 100;
}

export function critMultiplier() {
  return CRIT_MULTIPLIER + statBonus('critDmg') / 100;
}
