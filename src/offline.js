// Offline-Fortschritt: Während der Spieler fort ist, rechnet ein simulierter
// Kampf mit denselben Formeln wie das Live-Gefecht — Krit, Tempo, Gegner-
// profile, erlittener Schaden und Lifeleech. Stoppt am Boss (Bosse verlangen
// deine Anwesenheit) oder beim Tod. Rückgabe: 'time' | 'boss' | 'died'.
import { state, settings, offlineCapMs, ashGainFactor, deathReviveShare } from './state.js';
import { ATTACK_INTERVAL_MS, ENEMY_RESPAWN_S, OFFLINE_MIN_GAP_MS, ELITE_EVERY_KILLS, HERO_MISS_CHANCE, ENEMY_MISS_CHANCE, ARMOR_RESISTANCE, BOSS_AFTER_KILLS, enemyXpMultiplier, zoneDef, formatNum, formatDuration } from './data.js';
import { t, lname } from './i18n.js';
import { scaledEnemy, statBonus, heroDamage, heroMaxHp, heroArmor, heroCritChance, heroAttackSpeed, critMultiplier, heroLifeleech } from './stats.js';
import { rollDrop } from './items.js';
import { save } from './saveio.js';
import { use } from './bus.js';

let offlineSummary = null;

let offlineDiversion = null;

function simulateKills(seconds, heroHpService) {
  const speed = heroAttackSpeed();
  const critFactor = 1 + (Math.min(100, heroCritChance()) / 100) * (critMultiplier() - 1);
  const avgHit = heroDamage() * critFactor;
  const { pct, flat } = heroLifeleech();
  let remaining = seconds;
  let guard = 0;
  while (remaining > 0 && guard < 200000) {
    guard += 1;
    if (state.cleared <= state.zone && state.zoneKills >= BOSS_AFTER_KILLS) {
      // Boss-Wand offline: Bosse verlangen deine Anwesenheit — der simulierte
      // Held weicht aufs höchste errungene Gebiet aus und farmt dort weiter.
      // Erst ganz ohne errungenes Gebiet bleibt die Nacht ungenutzt.
      if (state.cleared <= 0) return 'boss';
      state.zone = state.cleared - 1;
      state.zoneKills = 0;
      offlineDiversion = lname(zoneDef(state.zone).name);
    }
    const isElite = state.zoneKills > 0 && state.zoneKills % ELITE_EVERY_KILLS === 0;
    const def = scaledEnemy(isElite ? 'elite' : 'normal');
    // Erwartete Treffer: HERO_MISS_CHANCE der eigenen Schläge geht daneben.
    const fightS = Math.max(1, Math.ceil(def.hp / avgHit)) * (ATTACK_INTERVAL_MS / 1000) / speed / (1 - HERO_MISS_CHANCE);
    const duration = fightS + ENEMY_RESPAWN_S;
    if (duration > remaining) return 'time';
    remaining -= duration;
    const swings = Math.max(0, Math.floor(fightS / (def.attackIntervalMs / 1000)) - 1);
    const reduction = Math.min(0.5, heroArmor() / (heroArmor() + ARMOR_RESISTANCE * def.damage));
    const taken = Math.max(1, Math.round(def.damage * (1 - reduction)));
    const heroHits = Math.ceil(def.hp / avgHit) / (1 - HERO_MISS_CHANCE);
    const healed = Math.round(def.hp * pct / 100) + flat * heroHits;
    // Erwartungswert: ENEMY_MISS_CHANCE der Gegner-Schläge geht daneben.
    const expectedTaken = swings * taken * (1 - ENEMY_MISS_CHANCE);
    if (expectedTaken - healed >= heroHpService.get()) return 'died';
    // Safedrop: Der erste Elite-Kill eines Gebiets garantiert auch offline.
    const eliteSafedrop = isElite && !state.safedropZones[state.zone];
    if (eliteSafedrop) state.safedropZones[state.zone] = 1;
    heroHpService.set(Math.min(heroMaxHp(), heroHpService.get() - expectedTaken + healed));
    state.kills += 1;
    state.zoneKills += 1;
    // Bestiarium: Offline-Erlegtes zählt wie im Feld unter dem Kreaturnamen.
    state.bestiary[def.name] = (state.bestiary[def.name] ?? 0) + 1;
    state.ash += Math.round(def.ash * (1 + statBonus('ash') / 100) * ashGainFactor());
    use('gainXp')(Math.round(def.xp * enemyXpMultiplier(def.level, state.level)));
    rollDrop(isElite ? 'elite' : 'normal', eliteSafedrop);
  }
  return 'time';
}

function applyOfflineProgress() {
  if (!state.inField) return;
  state.inField = false;
  offlineDiversion = null;
  if (!settings.offlineProgress) {
    save();
    return;
  }
  const elapsed = Date.now() - (state.lastSeen || Date.now());
  if (elapsed < OFFLINE_MIN_GAP_MS) {
    save();
    return;
  }
  const capped = Math.min(elapsed, offlineCapMs());
  const heroHpService = use('heroHp');
  const ashBefore = state.ash;
  const levelBefore = state.level;
  const killsBefore = state.kills;
  const dropsBefore = totalDropCount();
  const result = simulateKills(capped / 1000, heroHpService);
  const ash = state.ash - ashBefore;
  const levels = state.level - levelBefore;
  const kills = state.kills - killsBefore;
  const found = totalDropCount() - dropsBefore;
  const levelsPart = levels > 0 ? t(', +{n} {word}', { n: levels, word: levels === 1 ? t('Stufe') : t('Stufen') }) : '';
  const dropsPart = found > 0 ? t(', {n} {word}', { n: found, word: found === 1 ? t('Beutestück gefunden') : t('Beutestücke gefunden') }) : '';
  let summary = t('Während du fort warst ({dur}): {kills} Kämpfe, +{ash} Asche{levels}{drops}', {
    dur: formatDuration(capped),
    kills,
    ash: formatNum(ash),
    levels: levelsPart,
    drops: dropsPart,
  });
  if (result === 'died') {
    state.deaths += 1;
    const toll = use('takeDeathToll')();
    heroHpService.set(Math.round(heroMaxHp() * deathReviveShare()));
    summary += t(' — gefallen. Die Asche nahm {n} Asche.', { n: formatNum(toll) });
  } else if (result === 'boss') {
    summary += t('. Ein Boss versperrt den Weg.');
  } else if (offlineDiversion) {
    summary += t('. Ein Boss versperrte den Weg — ausgewichen auf {name} und weitergefarmt.', { name: offlineDiversion });
  } else {
    summary += '.';
  }
  // Abschluss immer persistieren (save() fängt blockierten Speicher selbst
  // ab): Auch ohne Kill oder Tod — die Zeit reichte für keinen Kampf, oder
  // eine Boss-Wand ohne Ausweichgebiet stoppte sofort — muss inField = false
  // und der neue lastSeen stehen, sonst zöge ein erneuter Start dieselbe
  // Zeitspanne nochmal zur Simulation heran.
  if (kills > 0 || result === 'died') offlineSummary = summary;
  save();
}

const totalDropCount = () => Object.values(state.drops ?? {}).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);

function consumeOfflineSummary() {
  const summary = offlineSummary;
  offlineSummary = null;
  return summary;
}

export { applyOfflineProgress, consumeOfflineSummary };
