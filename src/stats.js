import { GEAR_SLOTS, enemyDef, BASE_CRIT_CHANCE, CRIT_MULTIPLIER, BASE_ATTACK_SPEED, ARMOR_RESISTANCE, ATTACK_INTERVAL_MS, CRIT_CHANCE_CAP, itemStats, profileOf, enemyLevelOf } from './data.js';
import { state } from './state.js';
import { skillBonus } from './skilltree.js';

export function scaledEnemy(type) {
  const base = enemyDef(state.zone)[type];
  const profile = profileOf(state.zone, type);
  return {
    name: base.name,
    level: enemyLevelOf(state.zone, type),
    hp: Math.max(1, Math.round(base.hp * profile.hp)),
    damage: Math.max(1, Math.round(base.damage * profile.damage)),
    ash: base.ash,
    xp: base.xp,
    boss: !!base.boss,
    profileKey: profile.key,
    profileLabel: profile.label,
    attackIntervalMs: Math.round(ATTACK_INTERVAL_MS * profile.interval),
  };
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
  let pct = 0;
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (item) {
      const stats = itemStats(item);
      damage += stats.damage;
      pct += stats.damagePct;
    }
  }
  return Math.round((damage + statBonus('damage')) * (1 + (statBonus('damagePct') + pct) / 100));
}

export function heroMaxHp() {
  let maxHp = state.maxHp;
  let pct = 0;
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (item) {
      const stats = itemStats(item);
      maxHp += stats.hp;
      pct += stats.hpPct;
    }
  }
  return Math.round((maxHp + statBonus('hp')) * (1 + (statBonus('hpPct') + pct) / 100));
}

export function heroArmor() {
  let armor = state.armorBase;
  let pct = 0;
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (item) {
      const stats = itemStats(item);
      armor += stats.armor;
      pct += stats.armorPct;
    }
  }
  return Math.round((armor + statBonus('armor')) * (1 + (statBonus('armorPct') + pct) / 100));
}

export function heroCritChance() {
  let crit = BASE_CRIT_CHANCE + state.critBonus;
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (item) crit += itemStats(item).critChance;
  }
  return Math.min(CRIT_CHANCE_CAP, crit + statBonus('crit'));
}

export function heroAttackSpeed() {
  return BASE_ATTACK_SPEED + statBonus('speed') / 100;
}

export function critMultiplier() {
  let critDmg = statBonus('critDmg');
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (item) critDmg += itemStats(item).critDmg;
  }
  return CRIT_MULTIPLIER + critDmg / 100;
}

// Lifeleech existiert nur als Waffen-Affix ab Episch — Prozent des Schadens
// und/oder Flat pro Treffer (in der Praxis eine der beiden Varianten).
export function heroLifeleech() {
  let pct = 0;
  let flat = 0;
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if (!item) continue;
    pct += itemStats(item).lifeleech;
    flat += itemStats(item).lifeleechFlat;
  }
  return { pct, flat };
}
