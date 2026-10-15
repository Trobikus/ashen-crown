import { el, cacheDom } from './dom.js';

import { state, settings, SAVE_KEY, SAVE_VERSION, inventoryCap, deathPenalty, ashGainFactor, xpGainFactor, offlineCapMs } from './state.js';

import { loadSettings, saveSettings, applySettings } from './settings.js';

import { TICK_MS, ATTACK_INTERVAL_MS, STATS_SYNC_INTERVAL_MS, ENEMY_RESPAWN_S, BOSS_AFTER_KILLS, ELITE_EVERY_KILLS, OFFLINE_MIN_GAP_MS, MAIN_ZONE_COUNT, LAST_ZONE_INDEX, MAX_ZONE, GEAR_SLOTS, RARITIES, SKILL_NODES_BY_ID, ARMOR_RESISTANCE, DEATH_ASH_PENALTY, DEATH_REVIVE_SHARE, ENRAGE_THRESHOLD, ENRAGE_INTERVAL_MULT, HUB_REGEN_PER_SECOND, ENEMY_MISS_CHANCE, HERO_MISS_CHANCE, DAMAGE_VARIANCE, SKILL_TREE_UNLOCK_LEVEL, STAT_POINTS_PER_LEVEL, enemyXpMultiplier, continentKeyOf, xpNeeded, zoneDef, sanitizeItem, asCount, formatNum, ZONE_ENEMIES, ZONES, DEPTH_ENEMY_NAMES, CONTINENTS } from './data.js';

import { scaledEnemy, statBonus, heroDamage, heroMaxHp, heroArmor, heroCritChance, heroAttackSpeed, critMultiplier, heroLifeleech } from './stats.js';

import { buildSkillTree, renderSkillTree, bindSkillTreeEvents, applySkillView } from './skilltree.js';

import { buildZoneList, renderZones, resetZoneView, switchZoneView } from './zones.js';

import { sfx, setLowHp, setBossFight } from './audio.js';

import { toast, levelUpFloat } from './feedback.js';

import { buildCraftSlots, renderCrafting, bindCraftEvents } from './crafting.js';

import { INTRO_PAGES, COMBAT_INTRO_PAGES, CONTINENT_LORE, epitaphOf, continentLoreKeyOf, renderChronicle } from './lore.js';

import { initItems, rollDrop, equipItem, unequipItem, sortInventory, equipBest, sellSelected, toggleSellMode, exitSellMode, sellButtonAction, selectAllForSale, handleInventoryClick, renderGearIfDirty, buildDepthRelic, grantItem, itemSellValue } from './items.js';

import { ACHIEVEMENTS, evaluateAchievements, ruhmAvailable, ruhmEarned, RUHM_SHOP, RUHM_RELIC_REROLL_COST } from './achievements.js';

import { LEGACY_TITLES, kronenascheAvailable, kronenascheEarnedOf, kronenascheReward, legacyLevel } from './prestige.js';

import { spriteSvgFor } from './sprites.js';



let heroHp = state.maxHp;

let enemy = null;

let paused = true;

let tickTimer = null;

let heroAttackProgress = 0;

let enemyAttackProgress = 0;

let sceneTimer = null;

let autoDoorTimer = null;

let overlayDismissible = false;

let hasSave = false;

let visited = false;

let offlineSummary = null;

let offlineDiversion = null;

let statSpendAmount = 1;

let optionsReturnScreen = null;

let resetArmed = false;

let resetTimer = null;

// True zwischen „Spielstand zurücksetzen" und dem Reload: in diesem Fenster
// darf kein save() den alten Zustand zurück ins localStorage schreiben.
let saveSuppressed = false;

let lastPlayTick = null;

let importArmed = false;

let importTimer = null;

let saveNotice = null;

let hooks = { after: () => {}, clampHp: () => {}, save: () => {}, render: () => {} };

const BACKUP_KEYS = ['ashen-crown-save.bak1', 'ashen-crown-save.bak2', 'ashen-crown-save.bak3'];

const BACKUP_MIN_GAP_MS = 10 * 60 * 1000;

function flash(figure) {
  if (!settings.hitFlash) return;
  figure.classList.add('hit');
  setTimeout(() => figure.classList.remove('hit'), 150);
}

// Kurzlebige Animations-Klasse: entfernen, Reflow erzwingen (startet die
// Keyframes neu), wieder anheften, nach ms abräumen.
function pulseClass(element, cls, ms = 260) {
  element.classList.remove(cls);
  void element.offsetWidth;
  element.classList.add(cls);
  clearTimeout(element.__pulseTimer);
  element.__pulseTimer = setTimeout(() => element.classList.remove(cls), ms);
}

// Treibende Partikel pro Kontinent — nur DOM-Aufbau, Bewegung macht CSS.
const ARENA_PARTICLES = {
  aschenlande: { anim: 'particle-rise', color: '#d98f4a', count: 18, alpha: 0.75 },
  frostreich: { anim: 'particle-fall', color: '#cfe3ef', count: 26, alpha: 0.8 },
  faulmoor: { anim: 'particle-drift', color: '#8fae6d', count: 20, alpha: 0.5 },
  blutmark: { anim: 'particle-fall', color: '#a03a3a', count: 18, alpha: 0.6 },
  sternenleere: { anim: 'particle-rise', color: '#9fb4e8', count: 24, alpha: 0.7 },
  tiefen: { anim: 'particle-fall', color: '#6f6862', count: 22, alpha: 0.5 },
};

let particleContinent = null;

function refreshArenaParticles() {
  const key = continentKeyOf(state.zone);
  if (key === particleContinent) return;
  particleContinent = key;
  // Dieselbe Kontinent-Klasse färbt Bühne (Wand, Boden, Glühen) und Partikel.
  el.arena.classList.remove(...CONTINENT_FIGURE_CLASSES);
  el.arena.classList.add(`cont-${key}`);
  const cfg = ARENA_PARTICLES[key] ?? ARENA_PARTICLES.aschenlande;
  el.arenaParticles.replaceChildren();
  for (let i = 0; i < cfg.count; i += 1) {
    const p = document.createElement('span');
    p.className = 'arena-particle';
    const size = 2 + Math.random() * 4;
    p.style.left = `${(Math.random() * 100).toFixed(1)}%`;
    p.style.top = `${(Math.random() * 100).toFixed(1)}%`;
    p.style.width = `${size.toFixed(1)}px`;
    p.style.height = `${(size * (0.6 + Math.random() * 0.8)).toFixed(1)}px`;
    p.style.setProperty('--p-color', cfg.color);
    p.style.setProperty('--p-anim', cfg.anim);
    p.style.setProperty('--p-dur', `${(6 + Math.random() * 9).toFixed(1)}s`);
    p.style.setProperty('--p-delay', `${(-Math.random() * 12).toFixed(1)}s`);
    p.style.setProperty('--p-drift', `${(Math.random() * 10 - 5).toFixed(1)}vw`);
    p.style.setProperty('--p-alpha', cfg.alpha);
    el.arenaParticles.appendChild(p);
  }
}

function spawnDamageFloat(fighter, amount, isCrit = false) {
  if (!settings.damageNumbers) return;
  const span = document.createElement('span');
  span.className = isCrit ? 'dmg-float crit' : 'dmg-float';
  span.textContent = formatNum(amount);
  span.style.left = `${35 + Math.random() * 30}%`;
  fighter.appendChild(span);
  setTimeout(() => span.remove(), 900);
}

function spawnHealFloat(fighter, amount) {
  if (!settings.damageNumbers) return;
  const span = document.createElement('span');
  span.className = 'dmg-float heal';
  span.textContent = `+${formatNum(amount)}`;
  span.style.left = `${35 + Math.random() * 30}%`;
  fighter.appendChild(span);
  setTimeout(() => span.remove(), 900);
}

function spawnMissFloat(fighter) {
  if (!settings.damageNumbers) return;
  const span = document.createElement('span');
  span.className = 'dmg-float miss';
  span.textContent = 'Verfehlt';
  span.style.left = `${30 + Math.random() * 40}%`;
  fighter.appendChild(span);
  setTimeout(() => span.remove(), 900);
}

// Hieb-Bogen: Ein heller Bogen schwingt in Angriffsrichtung — der Schlag
// bekommt eine sichtbare Bahn, nicht nur den Lunge-Schwung des Körpers.
function spawnSlash(fighter, direction) {
  if (!settings.hitFlash) return;
  const span = document.createElement('span');
  span.className = 'slash';
  span.style.setProperty('--slash-rot', `${direction * 38}deg`);
  span.style.setProperty('--slash-sweep', `${direction * 64}deg`);
  fighter.appendChild(span);
  setTimeout(() => span.remove(), 240);
}

// Funken-Burst am Trefferpunkt: kurze Partikel-Explosion aus Asche und
// Glut; der Krit setzt einen goldenen Ring darüber. Gekoppelt an die
// bestehende Treffer-Effekt-Option (Aufblitzen), kein neuer Schalter.
function spawnImpact(fighter, kind = 'hit') {
  if (!settings.hitFlash) return;
  const burst = document.createElement('span');
  burst.className = `impact impact-${kind}`;
  burst.style.left = `${36 + Math.random() * 26}%`;
  burst.style.top = `${30 + Math.random() * 22}%`;
  const count = kind === 'crit' ? 12 : 7;
  for (let i = 0; i < count; i += 1) {
    const spark = document.createElement('i');
    const angle = Math.random() * Math.PI * 2;
    const dist = 16 + Math.random() * (kind === 'crit' ? 40 : 26);
    spark.style.setProperty('--spark-dx', `${Math.cos(angle) * dist}px`);
    spark.style.setProperty('--spark-dy', `${Math.sin(angle) * dist - 8}px`);
    spark.style.setProperty('--spark-delay', `${(Math.random() * 60).toFixed(0)}ms`);
    burst.appendChild(spark);
  }
  fighter.appendChild(burst);
  if (kind === 'crit') {
    const ring = document.createElement('span');
    ring.className = 'crit-ring';
    ring.style.left = burst.style.left;
    ring.style.top = burst.style.top;
    fighter.appendChild(ring);
    setTimeout(() => ring.remove(), 450);
  }
  setTimeout(() => burst.remove(), 560);
}

function showOverlay(text, html = false) {
  const target = document.getElementById('overlay-text');
  if (html) target.innerHTML = text;
  else target.textContent = text;
  document.getElementById('overlay').classList.add('show');
  overlayDismissible = false;
}

let overlayDone = null;

function finishDismissible() {
  hideOverlay();
  overlayDismissible = false;
  const done = overlayDone;
  overlayDone = null;
  if (done) done();
}

function showDismissibleOverlay(text, duration, html = false, onDone = null) {
  // Überholt ein laufendes Overlay (z. B. Boss-Gate → Kontinent-Annale):
  // dessen Timer stoppen, sonst blättert es das neue vorzeitig weg.
  if (sceneTimer) {
    clearTimeout(sceneTimer);
    sceneTimer = null;
  }
  overlayDone = null;
  showOverlay(text, html);
  overlayDismissible = true;
  overlayDone = onDone;
  sceneTimer = setTimeout(() => {
    sceneTimer = null;
    finishDismissible();
  }, duration);
}

function dismissOverlay() {
  if (!overlayDismissible) return;
  if (autoDoorTimer) {
    // Klick aufs Boss-Gate heißt bei aktiver Auto-Tür: sofort weiter — nicht
    // abbrechen, sonst bliebe die Arena leer und der Lauf verfallen.
    autoDoorAdvance();
    return;
  }
  if (sceneTimer) {
    clearTimeout(sceneTimer);
    sceneTimer = null;
  }
  finishDismissible();
}

function hideOverlay() {
  document.getElementById('overlay').classList.remove('show');
}

// Der Auto-Tür-Lauf hängt an einem eigenen Timer-Register statt an sceneTimer:
// dismissOverlay räumt sceneTimer ab, ein Klick aufs Gate würde den Lauf sonst
// canceln und die Arena leer zurücklassen. Klick aufs Gate führt den Lauf
// sofort aus — Tür auf, voll heilen, Kampf an.
function autoDoorAdvance() {
  clearTimeout(autoDoorTimer);
  autoDoorTimer = null;
  if (sceneTimer) {
    clearTimeout(sceneTimer);
    sceneTimer = null;
  }
  hideOverlay();
  overlayDismissible = false;
  enterZone(state.zone + 1);
  heroAttackProgress = 0;
  enemyAttackProgress = 0;
  heroHp = heroMaxHp();
  spawnEnemy();
}

function showScreen(target) {
  if (target !== el.sceneHero) exitSellMode();
  for (const screen of [el.menu, el.hub, el.sceneHero, el.sceneSkills, el.sceneOptions, el.sceneMap, el.sceneCrafting, el.sceneStats, el.sceneBestiary, el.sceneAchievements, el.sceneThrone, el.sceneChronik, el.sceneVictory, el.game]) {
    screen.hidden = screen !== target;
  }
  // Sanfter Einstieg statt harter Schaltung — ein kurzes Aufblenden pro
  // Szenenwechsel (pulseClass erzwingt per Reflow den Neustart der Animation).
  pulseClass(target, 'scene-enter', 450);
}

const CONTINENT_FIGURE_CLASSES = ['cont-aschenlande', 'cont-frostreich', 'cont-faulmoor', 'cont-blutmark', 'cont-sternenleere', 'cont-tiefen'];

function setEnemyFigure(zoneIndex, name, enemyType) {
  for (const cls of CONTINENT_FIGURE_CLASSES) el.enemyFigure.classList.remove(cls);
  el.enemyFigure.classList.remove('enraged');
  el.enemyFigure.classList.add(`cont-${continentKeyOf(zoneIndex)}`);
  el.enemyFigure.classList.toggle('boss', enemyType === 'boss');
  el.enemyFigure.classList.toggle('elite', enemyType === 'elite');
  // Der Sprite folgt dem Namen (Bestiarium-Konsistenz) und der Type gibt
  // Bossen die Krone — dieselbe Kreatur sieht überall gleich aus.
  el.enemyFigure.innerHTML = spriteSvgFor(name, enemyType === 'boss');
}

function spawnEnemy() {
  let type = 'normal';
  const zoneCleared = state.cleared > state.zone;
  if (!zoneCleared && state.zoneKills >= BOSS_AFTER_KILLS) {
    type = 'boss';
  } else if (state.zoneKills > 0 && state.zoneKills % ELITE_EVERY_KILLS === 0) {
    type = 'elite';
  }
  const def = scaledEnemy(type);
  enemy = { type, name: def.name, level: def.level, hp: def.hp, maxHp: def.hp, damage: def.damage, attackIntervalMs: def.attackIntervalMs, enraged: false, profileLabel: def.profileLabel, hitsOnHero: 0, damageToHero: 0 };
  setEnemyFigure(state.zone, def.name, type);
  el.enemyFigure.classList.remove('dying');
  pulseClass(el.enemyFigure, 'spawn', 600);
  refreshArenaParticles();
  el.enemyName.textContent = def.name;
  const typeLabel = type === 'boss' ? 'Boss' : type === 'elite' ? 'Elite' : 'Normal';
  el.enemyLevel.textContent = `Lv ${def.level} · ${typeLabel}`;
  // Beim Boss zeigt die Level-Zeile den Typ; die Profil-Zeile bleibt der Wut
  // vorbehalten, damit nicht zweimal „Boss" steht.
  el.enemyProfile.textContent = def.boss ? '' : def.profileLabel;
  el.enemyProfile.classList.remove('enraged-label');
  enemyAttackProgress = 0;
  if (def.boss) {
    sfx.boss();
    hintOnce('hint-boss', 'Ein Boss hütet den Ausgang — zäh und unerbittlich. Kehr notfalls zum Schrein zurück, heile, und stelle ihn vorbereitet.', { pauseCombat: true });
  }
  render();
}

function gainXp(amount) {
  state.xp += Math.round(amount * (1 + statBonus('xp') / 100) * xpGainFactor());
  while (state.xp >= xpNeeded(state.level)) {
    state.xp -= xpNeeded(state.level);
    state.level += 1;
    state.statPoints += STAT_POINTS_PER_LEVEL;
    // Runenpunkte gibt es erst, sobald der Fertigkeitenbaum offen ist.
    if (state.level >= SKILL_TREE_UNLOCK_LEVEL) state.skillPoints += 1;
    heroHp = heroMaxHp();
    sfx.levelUp();
    levelUpFloat(state.level);
    pulseClass(el.heroFigure, 'level-flash', 750);
  }
}

function allocateStat(stat) {
  const amount = Math.min(statSpendAmount, state.statPoints);
  if (amount <= 0) return;
  state.statPoints -= amount;
  if (stat === 'damage') state.damage += amount;
  else if (stat === 'hp') {
    state.maxHp += 5 * amount;
    heroHp = Math.min(heroHp + 5 * amount, heroMaxHp());
  } else if (stat === 'armor') state.armorBase += amount;
  else if (stat === 'crit') state.critBonus += amount;
  save();
  render();
}

// Verteilte Statpunkte: Schaden und Lebenskraft (5 je Punkt) sind aus den
// Basen rekonstruierbar, Rüstung und Kritchance liegen direkt vor.
function allocatedStatPoints() {
  return Math.max(0, state.damage - 2)
    + Math.max(0, Math.round((state.maxHp - 35) / 5))
    + state.armorBase + state.critBonus;
}

// Statpunkte neu verteilen: gleiche Kostenschule wie der Runen-Respec
// (Ilvl bis zum Hauptspiel-Ende, Preis je verteiltem Punkt), kleinerer
// Grundpreis — und dieselbe Doppelklick-Bestätigung.
function statRespecCost() {
  const ilvl = zoneDef(Math.min(state.cleared, LAST_ZONE_INDEX)).ilvl;
  return Math.round(100 * (1 + 0.1 * ilvl) * (1 + 0.15 * allocatedStatPoints()));
}

let statRespecArmed = false;

let statRespecArmTimer = null;

function attemptStatRespec() {
  const spent = allocatedStatPoints();
  if (spent <= 0) return;
  if (!statRespecArmed) {
    statRespecArmed = true;
    el.statRespecButton.classList.add('armed');
    clearTimeout(statRespecArmTimer);
    statRespecArmTimer = setTimeout(() => {
      statRespecArmed = false;
      statRespecArmTimer = null;
      render();
    }, 4000);
    render();
    return;
  }
  clearTimeout(statRespecArmTimer);
  statRespecArmTimer = null;
  statRespecArmed = false;
  const cost = statRespecCost();
  if (state.ash < cost) {
    render();
    return;
  }
  state.ash -= cost;
  state.statPoints += spent;
  state.damage = 2;
  state.maxHp = 35;
  state.armorBase = 0;
  state.critBonus = 0;
  heroHp = Math.min(heroHp, heroMaxHp());
  save();
  render();
}

function bindHoldToRepeat(button, action) {
  let delayTimer = null;
  let repeatTimer = null;
  const stop = () => {
    clearTimeout(delayTimer);
    clearInterval(repeatTimer);
    delayTimer = null;
    repeatTimer = null;
  };
  button.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    action();
    delayTimer = setTimeout(() => {
      repeatTimer = setInterval(action, 110);
    }, 400);
  });
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointerleave', stop);
  button.addEventListener('pointercancel', stop);
}

// Lifeleech heilt beim Treffer: fester Anteil pro Schlag plus Prozent des
// ausgeteilten Schadens. Die einzige Heilung im Feld — Rasten am Schrein
// füllt komplett auf.
function applyLifeleech(damage) {
  const { pct, flat } = heroLifeleech();
  const heal = flat + Math.round(damage * pct / 100);
  if (heal <= 0 || heroHp >= heroMaxHp()) return;
  const before = heroHp;
  heroHp = Math.min(heroMaxHp(), heroHp + heal);
  spawnHealFloat(el.heroFighter, heroHp - before);
}

function killEnemy() {
  const def = scaledEnemy(enemy.type);
  pulseClass(el.enemyFigure, 'dying', 500);
  state.kills += 1;
  state.zoneKills += 1;
  // Bestiarium: Jede erlegte Kreatur zählt unter ihrem Namen.
  state.bestiary[def.name] = (state.bestiary[def.name] ?? 0) + 1;
  // Safedrop: Der erste Elite-Kill eines Gebiets garantiert ein Stück.
  const eliteSafedrop = enemy.type === 'elite' && !state.safedropZones[state.zone];
  if (eliteSafedrop) state.safedropZones[state.zone] = 1;
  state.ash += Math.round(def.ash * (1 + statBonus('ash') / 100) * ashGainFactor());
  // Gegner unter dem Helden-Niveau tragen weniger bis keine Erfahrung bei.
  gainXp(Math.round(def.xp * enemyXpMultiplier(enemy.level, state.level)));
  rollDrop(enemy.type, eliteSafedrop);
  sfx.kill();
  if (def.boss) {
    const firstClear = state.cleared <= state.zone;
    state.cleared = Math.max(state.cleared, state.zone + 1);
    if (!state.crownWon && state.zone === LAST_ZONE_INDEX) {
      state.crownWon = true;
      enemy = null;
      save();
      showVictory();
      render();
      return;
    }
    const next = zoneDef(state.zone + 1);
    const continentGate = next.continent !== zoneDef(state.zone).continent
      ? `Neuer Kontinent: ${next.continent}. `
      : '';
    const epitaph = epitaphOf(state.zone);
    // Tiefenrelikt: Der erste Boss einer Aschentiefe hinterlässt garantiert
    // ein Legendärstück mit zwei Meisterschaften und gesicherter Lifeleech.
    let relicLine = '';
    if (state.zone >= MAIN_ZONE_COUNT && firstClear) {
      const relic = buildDepthRelic(zoneDef(state.zone).ilvl);
      if (state.inventory.length < inventoryCap()) {
        grantItem(relic);
        toast(`Tiefenrelikt erbeutet: ${relic.name}`, '#c1663a');
        relicLine = `<br><br>Tiefenrelikt erbeutet: <strong>${relic.name}</strong> — Legendär mit zwei Meisterschaften und gesicherter Lifeleech.`;
      } else {
        const ash = itemSellValue(relic);
        state.ash += ash;
        toast(`Tiefenrelikt — Inventar voll: +${formatNum(ash)} Asche`, '#c1663a');
        relicLine = `<br><br>Tiefenrelikt erbeutet — das Inventar war voll: +${formatNum(ash)} Asche.`;
      }
    }
    showDismissibleOverlay(
      `${epitaph}<br><br>${def.name} bezwungen — ${continentGate}${next.name} ist jetzt offen.${relicLine}`,
      5000,
      true,
    );
    sfx.unlock();
    // Auto-Tür: Das Gate geht von allein weiter — Epitaph kurz lesen lassen,
    // dann heilt der Eintritt ins nächste Gebiet und der Kampf läuft an.
    if (settings.autoDoor) {
      if (sceneTimer) {
        clearTimeout(sceneTimer);
        sceneTimer = null;
      }
      autoDoorTimer = setTimeout(autoDoorAdvance, 2200);
      enemy = null;
      save();
      render();
      return;
    }
  }
  enemy = null;
  save();
  setTimeout(spawnEnemy, 600);
  render();
}

function heroAttack() {
  // Der Schwung passiert immer — auch ein Fehlschlag war ein Angriff.
  pulseClass(el.heroFigure, 'lunge');
  spawnSlash(el.heroFighter, 1);
  // Auch der Held verfehlt manchmal — harte Gegner bleiben harte Gegner.
  if (Math.random() < HERO_MISS_CHANCE) {
    spawnMissFloat(el.enemyFighter);
    return;
  }
  // Der Schaden rollt in einer Spanne — kein Schlag trifft gleich hart.
  let damage = Math.round(heroDamage() * (1 - DAMAGE_VARIANCE + Math.random() * DAMAGE_VARIANCE * 2));
  const isCrit = Math.random() * 100 < heroCritChance();
  if (isCrit) {
    damage = Math.round(damage * critMultiplier());
    sfx.crit();
    if (settings.screenshake) pulseClass(el.arena, 'shake');
  } else {
    sfx.hit();
  }
  pulseClass(el.enemyFigure, 'recoil');
  enemy.hp -= damage;
  applyLifeleech(damage);
  flash(el.heroFigure);
  spawnImpact(el.enemyFighter, isCrit ? 'crit' : 'hit');
  spawnDamageFloat(el.enemyFighter, damage, isCrit);
  if (enemy.hp <= 0) {
    killEnemy();
  } else {
    render();
  }
}

function enemyAttack() {
  // Der Schwung passiert immer — auch ein Fehlschlag war ein Angriff.
  pulseClass(el.enemyFigure, 'lunge');
  spawnSlash(el.enemyFighter, -1);
  if (enemy.type === 'boss' && settings.screenshake) pulseClass(el.arena, 'shake-strong');
  // Nicht jeder Gegner-Schlag trifft — Fehlschläge entlasten den Helden.
  if (Math.random() < ENEMY_MISS_CHANCE) {
    spawnMissFloat(el.heroFighter);
    return;
  }
  const armor = heroArmor();
  // Rüstung mindert höchstens die Hälfte — mindestens 50 % treffen immer.
  const reduction = Math.min(0.5, armor / (armor + ARMOR_RESISTANCE * enemy.damage));
  const taken = Math.max(1, Math.round(enemy.damage * (1 - reduction)));
  heroHp -= taken;
  enemy.hitsOnHero += 1;
  enemy.damageToHero += taken;
  flash(el.enemyFigure);
  pulseClass(el.heroFigure, 'recoil');
  spawnImpact(el.heroFighter, 'wound');
  spawnDamageFloat(el.heroFighter, taken);
  if (heroHp <= 0) {
    die();
  } else {
    render();
  }
}

// Der Todeszoll: Die Asche einbehält einen Anteil der getragenen Asche —
// der Zollerlass aus dem Ruhm-Laden senkt den Anteil (Boden 3 %).
function takeDeathToll() {
  const toll = Math.min(state.ash, Math.round(state.ash * deathPenalty()));
  state.ash -= toll;
  return toll;
}

function die() {
  // Aufwachen mit einem Viertel statt 0 — der sofortige Rückkehr-Versuch ist
  // angeschlagen, aber nicht tot; das Warten am Schrein behält seinen Wert.
  heroHp = Math.round(heroMaxHp() * DEATH_REVIVE_SHARE);
  paused = true;
  state.inField = false;
  setLowHp(false);
  setBossFight(false);
  const toll = takeDeathToll();
  state.deaths += 1;
  sfx.death();
  // An einer unüberwundenen Boss-Wand erklärt der Tod den Weg zurück:
  // Dieses Gebiet spawnt bis zur Befreiung nur noch den Boss — Farmen
  // läuft über die Gebiete-Reise (erneutes Betreten setzt das Zählwerk).
  const wallHint = enemy?.type === 'boss' && state.cleared <= state.zone
    ? '<br><br>Wand erreicht: In diesem Gebiet wartet jetzt nur noch der Boss. Reise über die Gebiete zurück — erneutes Betreten setzt das Zählwerk zurück und stellt sichere Gegner zum Farmen. Komm stärker zurück.'
    : '';
  // Todesrückblick: Wer nicht versteht, warum er starb, kann nicht dazulernen —
  // das Overlay nennt den Bezwinger und die eingesteckte Summe.
  const recap = enemy
    ? `<br><br>Gefallen gegen <strong>${enemy.name}</strong> (Lv ${enemy.level}): ${enemy.hitsOnHero} Treffer, ${formatNum(enemy.damageToHero)} Schaden insgesamt.`
    : '';
  showOverlay((toll > 0
    ? `Die Asche nimmt dich zurück — und ihren Zoll: ${formatNum(toll)} Asche.`
    : 'Die Asche nimmt dich zurück.') + ' Am Schrein erwachst du mit einem Viertel deiner Lebenskraft.' + recap + wallHint, true);
  render();
  save();
  sceneTimer = setTimeout(() => {
    sceneTimer = null;
    hideOverlay();
    returnToHub();
  }, 2000);
}

function enemyAttackInterval() {
  return enemy.attackIntervalMs * (enemy.enraged ? ENRAGE_INTERVAL_MULT : 1);
}

function updateEnrage() {
  if (!enemy || enemy.type !== 'boss') return;
  const enraged = enemy.hp / enemy.maxHp <= ENRAGE_THRESHOLD;
  if (enraged === enemy.enraged) return;
  enemy.enraged = enraged;
  el.enemyFigure.classList.toggle('enraged', enraged);
  el.enemyProfile.textContent = enraged ? 'Wütend' : '';
  el.enemyProfile.classList.toggle('enraged-label', enraged);
  if (enraged) sfx.enrage();
}

function tick() {
  if (paused || !enemy) return;
  updateEnrage();
  setBossFight(enemy.type === 'boss');
  setLowHp(heroHp / heroMaxHp() <= 0.25);
  heroAttackProgress += TICK_MS * heroAttackSpeed();
  enemyAttackProgress += TICK_MS;
  if (heroAttackProgress >= ATTACK_INTERVAL_MS) {
    heroAttackProgress = 0;
    heroAttack();
  }
  if (enemy && enemyAttackProgress >= enemyAttackInterval()) {
    enemyAttackProgress = 0;
    enemyAttack();
  }
}

// Der Schrein atmet: Außerhalb des Felds kehrt die Lebenskraft zurück —
// 2 % des Maximums pro Sekunde, ganz ohne Zutun.
function hubTick() {
  if (state.inField) return;
  const max = heroMaxHp();
  if (heroHp >= max) return;
  heroHp = Math.min(max, heroHp + max * HUB_REGEN_PER_SECOND * (TICK_MS / 1000));
  renderHubHero();
}

// HP-Leiste mit Geist-Nachlauf: Die helle Schicht hält kurz die alte Höhe,
// während die Füllung schon fällt — jeder Treffer ist ablesbar, statt in
// der Breite zu verschwinden. Bei Heilung springt der Geist ohne Verzögerung.
function setHpBar(fill, ghost, pct) {
  const clamped = Math.max(0, Math.min(100, pct));
  if (ghost) {
    const previous = parseFloat(fill.style.width);
    ghost.classList.toggle('healing', !(previous <= clamped));
    ghost.style.width = `${clamped}%`;
  }
  fill.style.width = `${clamped}%`;
}

function renderHubHero() {
  const max = heroMaxHp();
  el.hubHeroLevel.textContent = state.level;
  setHpBar(el.hubHeroHp, el.hubHeroHpGhost, (heroHp / max) * 100);
  el.hubHeroHpText.textContent = `${formatNum(Math.ceil(Math.max(0, heroHp)))} / ${formatNum(max)}`;
}

// Die Statistik-Seite: Spielzeit, Tode, Beute je Seltenheit — die Zähler
// aus dem Spielstand bekommen ihr Gesicht. Rendert nur, wenn sie offen ist.
function renderStats() {
  if (el.sceneStats.hidden) return;
  el.statsPlaytime.textContent = formatDuration(state.playtimeMs);
  el.statsKills.textContent = formatNum(state.kills);
  el.statsDeaths.textContent = formatNum(state.deaths);
  el.statsCleared.textContent = `${Math.min(state.cleared, MAIN_ZONE_COUNT)} von ${MAIN_ZONE_COUNT}`;
  el.statsDepth.textContent = state.cleared > 0 ? zoneDef(state.cleared - 1).name : '—';
  el.statsAsh.textContent = formatNum(state.ash);
  el.statsDrops.replaceChildren();
  for (const rarity of RARITIES) {
    const row = document.createElement('div');
    const label = document.createElement('dt');
    label.textContent = rarity.label;
    label.style.color = rarity.color;
    const value = document.createElement('dd');
    value.textContent = formatNum(state.drops[rarity.key] ?? 0);
    row.append(label, value);
    el.statsDrops.appendChild(row);
  }
}

// Der Ruhm-Laden: Beutelschein und Zollerlass, gestaffelt, permanent.
function renderRuhmShop() {
  el.ruhmShop.replaceChildren();
  const head = document.createElement('h3');
  head.textContent = 'Ruhm-Laden';
  el.ruhmShop.appendChild(head);
  const available = ruhmAvailable(state);
  for (const [kind, def] of Object.entries(RUHM_SHOP)) {
    const level = state.shopPurchases[kind] ?? 0;
    const maxed = level >= def.levels.length;
    const cost = maxed ? 0 : def.levels[level];
    const row = document.createElement('div');
    row.className = 'chronicle-entry';
    const who = document.createElement('div');
    who.className = 'chronicle-who';
    who.textContent = `${def.name}${maxed ? ' — vollständig' : ` · Stufe ${level + 1}/${def.levels.length}`}`;
    const text = document.createElement('div');
    text.className = 'chronicle-text';
    text.textContent = def.desc + (level > 0 ? ` (Aktuell: Stufe ${level})` : '');
    const buy = document.createElement('button');
    buy.className = 'btn-small';
    buy.dataset.buy = kind;
    if (maxed) {
      buy.textContent = 'Ausgeschöpft';
      buy.disabled = true;
    } else {
      buy.textContent = `Kaufen · ${cost} Ruhm`;
      buy.disabled = available < cost;
    }
    row.append(who, text, buy);
    el.ruhmShop.appendChild(row);
  }
}

function buyRuhmUpgrade(kind) {
  const def = RUHM_SHOP[kind];
  const level = state.shopPurchases[kind] ?? 0;
  if (!def || level >= def.levels.length) return;
  const cost = def.levels[level];
  if (ruhmAvailable(state) < cost) return;
  state.ruhmAusgegeben += cost;
  state.shopPurchases[kind] = level + 1;
  toast(`${def.name} erworben — Stufe ${level + 1}.`, '#c1663a');
  sfx.unlock();
  save();
  renderAchievements();
  render();
}

// Der Thron: Kronenasche, das Vermächtnis und „Erneut erwachen". Die Prestige-
// Szene — erst nach dem ersten Kronensieg über die Hub-Kachel erreichbar.
function renderThrone() {
  if (el.sceneThrone.hidden) return;
  el.throneSummary.textContent = `${formatNum(kronenascheAvailable(state))} Kronenasche verfügbar · ${formatNum(kronenascheEarnedOf(state))} erworben · ${formatNum(state.prestigeRuns)} ${state.prestigeRuns === 1 ? 'Lauf' : 'Läufe'} hinter dir`;
  el.legacyShop.replaceChildren();
  const head = document.createElement('h3');
  head.textContent = 'Das Vermächtnis';
  el.legacyShop.appendChild(head);
  const available = kronenascheAvailable(state);
  for (const [title, def] of Object.entries(LEGACY_TITLES)) {
    const level = legacyLevel(state, title);
    const maxed = level >= def.levels.length;
    const cost = maxed ? 0 : def.levels[level];
    const row = document.createElement('div');
    row.className = 'chronicle-entry';
    const who = document.createElement('div');
    who.className = 'chronicle-who';
    who.textContent = `${def.name}${maxed ? ' — vollständig' : ` · Stufe ${level + 1}/${def.levels.length}`}`;
    const text = document.createElement('div');
    text.className = 'chronicle-text';
    text.textContent = def.desc + (level > 0 ? ` (Aktuell: Stufe ${level})` : '');
    const buy = document.createElement('button');
    buy.className = 'btn-small';
    buy.dataset.legacy = title;
    if (maxed) {
      buy.textContent = 'Ausgeschöpft';
      buy.disabled = true;
    } else {
      buy.textContent = `Kaufen · ${cost} Kronenasche`;
      buy.disabled = available < cost;
    }
    row.append(who, text, buy);
    el.legacyShop.appendChild(row);
  }
  const ready = state.cleared >= MAIN_ZONE_COUNT;
  const reward = kronenascheReward(state.cleared);
  el.prestigePreview.innerHTML = ready
    ? `Der Lauf zahlt <strong>${reward} Kronenasche</strong>. Verfällt: Zone, Held, Asche, Ausrüstung, Runen. Bleibt: Ruhm, Bestiarium, Chronik, Vermächtnis.`
    : 'Der Thron verlangt die Krone dieses Laufs — hebe sie zuerst erneut.';
  el.prestigeButton.disabled = !ready;
  el.prestigeButton.classList.toggle('armed', prestigeArmed);
  el.prestigeButton.textContent = prestigeArmed
    ? 'Wirklich? Erwache erneut.'
    : ready ? `Erneut erwachen · ${reward} Kronenasche` : 'Die Krone dieses Laufs fehlt';
}

function buyLegacy(title) {
  const def = LEGACY_TITLES[title];
  const level = legacyLevel(state, title);
  if (!def || level >= def.levels.length) return;
  const cost = def.levels[level];
  if (kronenascheAvailable(state) < cost) return;
  state.kronenascheAusgegeben += cost;
  state.legacy[title] = level + 1;
  toast(`${def.name} — Stufe ${level + 1}.`, '#c1663a');
  sfx.unlock();
  save();
  renderThrone();
  render();
}

let prestigeArmed = false;

let prestigeArmTimer = null;

function attemptPrestige() {
  if (state.cleared < MAIN_ZONE_COUNT) return;
  if (!prestigeArmed) {
    prestigeArmed = true;
    el.prestigeButton.classList.add('armed');
    clearTimeout(prestigeArmTimer);
    prestigeArmTimer = setTimeout(() => {
      prestigeArmed = false;
      prestigeArmTimer = null;
      renderThrone();
    }, 4000);
    renderThrone();
    return;
  }
  clearTimeout(prestigeArmTimer);
  prestigeArmTimer = null;
  prestigeArmed = false;
  const reward = kronenascheReward(state.cleared);
  state.kronenascheEarned += reward;
  state.prestigeRuns += 1;
  // Der Lauf verfällt — alles Run-Bezogene kehrt zum Erwachen zurück.
  state.ash = 25 * legacyLevel(state, 'der-vorbereitete');
  state.xp = 0;
  state.level = 1;
  state.maxHp = 35;
  state.damage = 2;
  state.armorBase = 0;
  state.critBonus = 0;
  state.statPoints = 2 * legacyLevel(state, 'alter-pfad');
  state.skillPoints = 0;
  state.skills = ['start'];
  state.inventory = [];
  for (const slot of GEAR_SLOTS) state.equipment[slot.key] = null;
  state.zone = 0;
  state.cleared = 0;
  state.zoneKills = 0;
  state.safedropZones = {};
  // Die Annalen erneut: Der zweite Lauf liest dieselbe Geschichte neu.
  state.seenContinents = [];
  state.inField = false;
  heroHp = heroMaxHp();
  sfx.victory();
  save();
  showScreen(el.hub);
  render();
  showDismissibleOverlay(`Du erwachst erneut — der Lauf zahlt <strong>${reward} Kronenasche</strong>. Die Asche erinnert sich an alles andere.`, 5500, true);
}

// Das Bestiarium: 150 Kreaturen der fünf Kontinente plus die Namen der
// Tiefen — erlegt zählt, unerlegt bleibt als „???" versiegelt.
function renderBestiary() {
  if (!el.sceneBestiary || el.sceneBestiary.hidden) return;
  const killsOf = (name) => state.bestiary[name] ?? 0;
  const types = [['normal', 'Normal'], ['elite', 'Elite'], ['boss', 'Boss']];
  let known = 0;
  el.bestiarySummary.textContent = 'Erlege Kreaturen, um ihre Einträge zu entschleiern.';
  el.bestiaryList.replaceChildren();
  const entry = (name, kind, zoneName, continentKey) => {
    const kills = killsOf(name);
    if (kills > 0) known += 1;
    const row = document.createElement('div');
    row.className = 'chronicle-entry chronicle-entry-bestiary' + (kills > 0 ? '' : ' entry-locked');
    // Jede Kreatur trägt ihr Porträt — derselbe Sprite wie in der Arena,
    // ungelegt als dunkle Silhouette, wenn sie noch nie erlegt wurde.
    const icon = document.createElement('span');
    icon.className = `bestiary-icon cont-${continentKey}`;
    icon.innerHTML = spriteSvgFor(name, kind === 'boss');
    const body = document.createElement('div');
    body.className = 'chronicle-entry-body';
    const who = document.createElement('div');
    who.className = 'chronicle-who';
    who.textContent = (kills > 0 ? '' : '??? ') + name + (kind === 'boss' ? ' — Boss' : kind === 'elite' ? ' — Elite' : '');
    if (kind === 'boss') who.style.color = '#c1663a';
    const text = document.createElement('div');
    text.className = 'chronicle-text';
    text.textContent = kills > 0 ? `${zoneName} · ${kills} erlegt` : `${zoneName} · Noch nie erlegt.`;
    body.append(who, text);
    row.append(icon, body);
    el.bestiaryList.appendChild(row);
  };
  for (const [ci, continent] of CONTINENTS.entries()) {
    const head = document.createElement('h3');
    head.textContent = continent.name;
    el.bestiaryList.appendChild(head);
    const key = continentKeyOf(ci * 10);
    for (let z = ci * 10; z < ci * 10 + 10; z += 1) {
      for (const [kind] of types) {
        entry(ZONE_ENEMIES[z][kind].name, kind, ZONES[z].name, key);
      }
    }
  }
  const head = document.createElement('h3');
  head.textContent = 'Die Tiefen';
  el.bestiaryList.appendChild(head);
  for (const [kind, label] of types) {
    const labelMap = { normal: 'Normal', elite: 'Elite', boss: 'Boss' };
    for (const name of DEPTH_ENEMY_NAMES[kind]) {
      entry(name, kind, `Aschentiefe · ${labelMap[kind]}`, 'tiefen');
    }
  }
  el.bestiarySummary.textContent = `${known} von ${ZONE_ENEMIES.length * 3 + DEPTH_ENEMY_NAMES.normal.length + DEPTH_ENEMY_NAMES.elite.length + DEPTH_ENEMY_NAMES.boss.length} Kreaturen erlegt.`;
}

// Errungenschaften: Gesperrte Einträge zeigen ihren Fortschritt, errungene
// leuchten in Kronenfarbe. Darunter der Ruhm-Laden — Ruhm entsteht nur
// durch Errungenschaften und kauft permanente Erleichterungen.
function renderAchievements() {
  if (!el.sceneAchievements || el.sceneAchievements.hidden) return;
  const earned = new Set(state.achievements);
  el.achievementsSummary.textContent = `${earned.size} von ${ACHIEVEMENTS.length} errungen · Ruhm: ${formatNum(ruhmAvailable(state))} verfügbar (${ruhmEarned(state)} verdient)`;
  renderRuhmShop();
  el.achievementsList.replaceChildren();
  for (const achievement of ACHIEVEMENTS) {
    const done = earned.has(achievement.id);
    const row = document.createElement('div');
    row.className = 'chronicle-entry' + (done ? '' : ' entry-locked');
    const who = document.createElement('div');
    who.className = 'chronicle-who';
    who.textContent = (done ? '◆ ' : '◇ ') + achievement.name;
    who.style.color = done ? '#c1663a' : '';
    const text = document.createElement('div');
    text.className = 'chronicle-text';
    let line = achievement.desc;
    if (achievement.progress) {
      const [cur, target] = achievement.progress(state);
      line += achievement.format === 'zeit'
        ? ` (${formatDuration(cur)} / ${formatDuration(target)})`
        : ` (${formatNum(cur)} / ${formatNum(target)})`;
    }
    text.textContent = done ? line + ' — errungen.' : line;
    row.append(who, text);
    el.achievementsList.appendChild(row);
  }
}

// Gegner-Inspektor: Hover auf den Gegner zeigt Schaden, Tempo, Temperament
// und die eigene Schadensminderung — „warum stirbe ich?" wird beantwortbar.
function renderEnemyTooltip() {
  if (!enemy) {
    el.enemyTooltip.innerHTML = '';
    return;
  }
  const armor = heroArmor();
  const reduction = Math.min(0.5, armor / (armor + ARMOR_RESISTANCE * enemy.damage));
  const speed = (1000 / enemyAttackInterval()).toFixed(1).replace('.', ',');
  const temperament = enemy.enraged
    ? 'Wütend — greift schneller an'
    : enemy.type === 'boss' ? 'Standard' : (enemy.profileLabel || 'Standard');
  el.enemyTooltip.innerHTML = `
    <div class="tt-name">${enemy.name}</div>
    <div class="tt-rarity">${enemy.type === 'boss' ? 'Boss' : enemy.type === 'elite' ? 'Elite' : 'Normal'} · Lv ${enemy.level}</div>
    <div class="tt-stat">Schlag: bis zu ${formatNum(enemy.damage)} Schaden</div>
    <div class="tt-stat">Angriffstempo: ${speed} / s</div>
    <div class="tt-stat">Temperament: ${temperament}</div>
    <div class="tt-stat">Deine Rüstung mindert: ${Math.round(reduction * 100)} %</div>`;
}

function render() {
  el.hubLevel.textContent = state.level;
  el.hubAsh.textContent = formatNum(state.ash);
  renderHubHero();
  el.hudLevel.textContent = state.level;
  el.hudAsh.textContent = formatNum(state.ash);
  el.inventoryCount.textContent = `${state.inventory.length} / ${inventoryCap()}`;
  el.statPointsRow.hidden = state.statPoints === 0;
  el.statPointsValue.textContent = state.statPoints;
  const hasPoints = state.statPoints > 0;
  for (const button of el.statPlusButtons) {
    button.hidden = !hasPoints;
  }
  for (const button of el.spendButtons) {
    button.classList.toggle('active', Number(button.dataset.amount) === statSpendAmount);
  }
  const statCost = statRespecCost();
  el.statRespecCost.textContent = formatNum(statCost);
  el.statRespecButton.disabled = allocatedStatPoints() <= 0 || state.ash < statCost;
  el.statRespecButton.textContent = statRespecArmed
    ? 'Wirklich? Die Werte fallen.'
    : `Punkte neu verteilen · ${formatNum(statCost)} Asche`;
  el.skillPointsHud.textContent = state.skillPoints;
  el.skillPointsHud.classList.toggle('has-points', state.skillPoints > 0);
  const skillsLocked = state.level < SKILL_TREE_UNLOCK_LEVEL;
  el.tileSkills.disabled = skillsLocked;
  el.tileSkillsSub.textContent = skillsLocked
    ? `Erwacht ab Stufe ${SKILL_TREE_UNLOCK_LEVEL}`
    : state.skillPoints > 0 ? `${state.skillPoints} Punkte frei` : 'Wähle weise';
  el.tileThrone.hidden = !state.crownWon;
  el.tileThroneSub.textContent = state.crownWon && state.cleared >= MAIN_ZONE_COUNT
    ? `Erneut erwachen · ${formatNum(kronenascheReward(state.cleared))} Kronenasche`
    : state.crownWon ? 'Die Krone dieses Laufs fehlt' : 'Nach der Krone';
  const zone = zoneDef(state.zone);
  el.hudZone.textContent = `${zone.continent} · ${zone.name}`;
  const showProgress = state.cleared <= state.zone;
  el.hudProgress.hidden = !showProgress;
  if (showProgress) {
    const bossPhase = state.zoneKills >= BOSS_AFTER_KILLS;
    el.hudProgressText.textContent = bossPhase ? 'Boss!' : `${Math.min(state.zoneKills, BOSS_AFTER_KILLS)} / ${BOSS_AFTER_KILLS}`;
    el.hudProgressText.classList.toggle('gold', bossPhase);
  }
  el.tileMapSub.textContent = state.cleared < MAIN_ZONE_COUNT
    ? `${Math.min(state.cleared + 1, MAIN_ZONE_COUNT)} von ${MAIN_ZONE_COUNT} Gebieten offen`
    : `Tiefe ${state.cleared + 1 - MAIN_ZONE_COUNT} erreicht`;
  renderZones();
  renderCrafting();
  el.doorButton.hidden = !(state.zone + 1 <= state.cleared);
  el.doorButton.textContent = state.zone + 1 === MAIN_ZONE_COUNT ? 'In die Tiefen hinabsteigen' : 'Durch die Tür gehen';
  checkOnboardingHints();
  renderSkillTree();
  el.modalHeroLevel.textContent = state.level;
  el.modalHeroXp.textContent = `${formatNum(state.xp)} / ${formatNum(xpNeeded(state.level))}`;
  el.modalHeroHp.textContent = formatNum(heroMaxHp());
  const dmgBase = heroDamage();
  el.modalHeroDamage.textContent = `${formatNum(Math.round(dmgBase * (1 - DAMAGE_VARIANCE)))} – ${formatNum(Math.round(dmgBase * (1 + DAMAGE_VARIANCE)))}`;
  el.modalHeroArmor.textContent = formatNum(heroArmor());
  el.modalHeroCrit.textContent = `${heroCritChance()} %`;
  el.modalHeroCritDmg.textContent = `${Math.round(critMultiplier() * 100)} %`;
  const leech = heroLifeleech();
  el.modalHeroLeech.textContent = leech.pct && leech.flat
    ? `${leech.pct} % · +${formatNum(leech.flat)}`
    : leech.pct ? `${leech.pct} %`
    : leech.flat ? `+${formatNum(leech.flat)} / Treffer`
    : '0 %';
  el.modalHeroSpeed.textContent = `${heroAttackSpeed().toFixed(1).replace('.', ',')} / s`;
  el.modalHeroKills.textContent = formatNum(state.kills);
  el.heroLevel.textContent = `Lv ${state.level} · Held`;
  el.game.classList.toggle('low-hp', state.inField && !paused && heroHp / heroMaxHp() <= 0.25);
  setHpBar(el.heroHp, el.heroHpGhost, (heroHp / heroMaxHp()) * 100);
  el.heroHpText.textContent = `${formatNum(Math.max(0, heroHp))} / ${formatNum(heroMaxHp())}`;
  if (enemy) {
    el.enemyName.textContent = enemy.name;
    el.enemyLevel.textContent = `Lv ${enemy.level} · ${enemy.type === 'boss' ? 'Boss' : enemy.type === 'elite' ? 'Elite' : 'Normal'}`;
    setHpBar(el.enemyHp, el.enemyHpGhost, (enemy.hp / enemy.maxHp) * 100);
    el.enemyHpText.textContent = `${formatNum(Math.max(0, enemy.hp))} / ${formatNum(enemy.maxHp)}`;
    renderEnemyTooltip();
  } else {
    el.enemyLevel.textContent = '—';
    el.enemyHp.style.width = '0%';
    el.enemyHpText.textContent = '—';
    el.enemyTooltip.innerHTML = '';
  }
  renderGearIfDirty();
  renderStats();
  renderBestiary();
  renderAchievements();
}

// Errungenschaften prüfen: Im 3-Sekunden-Tick reicht — neu Errungenes wird
// mit Toast und Klang gefeiert, Offline-Errungenschaften erscheinen still.
function checkAchievements() {
  const fresh = evaluateAchievements(state);
  if (!fresh.length) return;
  for (const id of fresh) {
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    toast(`Errungenschaft: ${achievement.name}`, '#c1663a');
  }
  sfx.unlock();
  save();
}

function save() {
  if (saveSuppressed) return;
  state.lastSeen = Date.now();
  state.hp = Math.max(0, Math.round(heroHp));
  rotateBackups();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

const asNumber = (value, fallback) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

function parseSave(raw) {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    if (typeof data.level !== 'number' || !Number.isFinite(data.level)) return null;
    if (typeof data.ash !== 'number' || !Number.isFinite(data.ash)) return null;
    return data;
  } catch {
    return null;
  }
}

// ——— Onboarding: Einmal-Hinweise im richtigen Moment ———

const ONBOARDING_HINT_KEYS = ['hint-combat', 'hint-levelup', 'hint-drop', 'hint-epic', 'hint-leech', 'hint-boss', 'hint-skills', 'hint-map', 'hint-crafting'];

function hintOnce(key, text, { duration = 4400, pauseCombat = false } = {}) {
  if (state.hints[key]) return;
  // Kein Hinweis überdeckt laufende Overlays (Tod, Boss-Gate, Annalen).
  if (el.overlay.classList.contains('show')) return;
  state.hints[key] = true;
  const resume = pauseCombat && tickTimer && !paused;
  if (resume) paused = true;
  showDismissibleOverlay(text, duration, false, () => {
    if (resume) paused = false;
  });
  save();
}

// Zustandsbasierte Hinweise: in jedem render geprüft, fire-once.
function checkOnboardingHints() {
  if (state.level >= 2) {
    hintOnce('hint-levelup', 'Jede Stufe bringt 2 Statpunkte (Held-Screen). Ab Stufe 20 erwacht der Fertigkeitenbaum — danach kommt pro Stufe 1 Runenpunkt dazu.');
  }
  if (state.inventory.length > 0) {
    hintOnce('hint-drop', 'Beute landet im Inventar deines Helden — „Bestes anlegen" rüstet das Stärkste in einem Klick an.');
  }
  if (ownsEpic()) {
    hintOnce('hint-epic', 'Legendäre Stücke (orange) tragen eine goldene Meisterschaft — einen Prozentbonus, den es sonst nirgends gibt. Halte ihn in Ehren.');
  }
  if (ownsLifeleech()) {
    hintOnce('hint-leech', 'Lifeleech sitzt selten auf epischen und legendären Waffen — als Prozente deines Schadens oder als feste Zahl pro Treffer. Ein netter Bonus, der dich im Feld länger auf die Beine hält.');
  }
}

function ownsEpic() {
  for (const slot of GEAR_SLOTS) {
    if (state.equipment[slot.key]?.rarity === 'legendär') return true;
  }
  return state.inventory.some((item) => item.rarity === 'legendär');
}

function ownsLifeleech() {
  for (const slot of GEAR_SLOTS) {
    const item = state.equipment[slot.key];
    if ((item?.lifeleech ?? 0) > 0 || (item?.lifeleechFlat ?? 0) > 0) return true;
  }
  return state.inventory.some((item) => (item.lifeleech ?? 0) > 0 || (item.lifeleechFlat ?? 0) > 0);
}

function playCombatIntro() {
  if (state.hints['hint-combat']) return;
  state.hints['hint-combat'] = true;
  const resume = () => {
    if (tickTimer) paused = false;
  };
  const page = (i) => () => (i + 1 < COMBAT_INTRO_PAGES.length
    ? showDismissibleOverlay(COMBAT_INTRO_PAGES[i + 1], 4400, false, page(i + 1))
    : resume());
  paused = true;
  showDismissibleOverlay(COMBAT_INTRO_PAGES[0], 4400, false, page(0));
  save();
}

function migrateSave(data) {
  if (typeof data.saveVersion !== 'number') data.saveVersion = 1; // Spielstände vor 0.4.0
  if (data.saveVersion < 3) data.inField ??= true; // Spielstände vor 0.7.0: Held galt stets als im Feld
  if (data.saveVersion < 4) {
    // Spielstände vor 0.9.0: Onboarding nur nachholen, was wirklich verpasst wurde.
    data.hints = {};
    if ((data.kills ?? 0) > 0 || (data.cleared ?? 0) > 0) data.hints['hint-combat'] = true;
    if ((data.level ?? 1) >= 2) data.hints['hint-levelup'] = true;
    if ((data.itemSeq ?? 0) > 0) data.hints['hint-drop'] = true;
    if ((data.cleared ?? 0) > 0) data.hints['hint-boss'] = true;
    if ((data.kills ?? 0) > 30) {
      for (const key of ONBOARDING_HINT_KEYS) data.hints[key] = true;
    }
  }
  // Spielstände vor 0.11.0 (v4): Keine Migration nötig — die Felder Basis,
  // Ilvl und die Statistik-Zähler härtet prepareSave für Altbestand nach.
  // Spielstände vor 0.13.0 (v5): Bestiarium, Errungenschaften und
  // Tiefen-Meisterschaften kommen ebenfalls über die prepareSave-Härtung.
  // Künftige Migrationen hier anhängen (if (data.saveVersion === n) …).
  data.saveVersion = SAVE_VERSION;
  return data;
}

function rotateBackups(force = false) {
  const current = parseSave(localStorage.getItem(SAVE_KEY));
  if (!current) return;
  const newest = parseSave(localStorage.getItem(BACKUP_KEYS[0]));
  if (!force && newest && Date.now() - (newest.lastSeen ?? 0) < BACKUP_MIN_GAP_MS) return;
  localStorage.setItem(BACKUP_KEYS[2], localStorage.getItem(BACKUP_KEYS[1]) ?? '');
  localStorage.setItem(BACKUP_KEYS[1], localStorage.getItem(BACKUP_KEYS[0]) ?? '');
  localStorage.setItem(BACKUP_KEYS[0], JSON.stringify(current));
}

// Härtung: bereinigt ALLES auf dem rohen Spielstand-Objekt, bevor etwas davon
// den echten Spielstand berührt — korrupte Werte werden repariert oder
// verworfen, ein böser Spielstand darf nie den Render-Loop crashen.
function prepareSave(data) {
  migrateSave(data);
  data.ash = Math.max(0, asNumber(data.ash, 0));
  data.xp = Math.max(0, asNumber(data.xp, 0));
  data.level = Math.max(1, asNumber(data.level, 1));
  data.maxHp = Math.max(1, asNumber(data.maxHp, 30));
  data.hp = Math.max(0, asNumber(data.hp, 0));
  data.damage = Math.max(1, asNumber(data.damage, 2));
  data.kills = Math.max(0, asNumber(data.kills, 0));
  data.zoneKills = Math.max(0, asNumber(data.zoneKills, 0));
  data.statPoints = Math.max(0, asNumber(data.statPoints, 0));
  data.armorBase = Math.max(0, asNumber(data.armorBase, 0));
  data.critBonus = Math.max(0, asNumber(data.critBonus, 0));
  data.skillPoints = Math.max(0, asNumber(data.skillPoints, 0));
  data.itemSeq = asCount(data.itemSeq);
  const rawEquipment = data.equipment && typeof data.equipment === 'object' && !Array.isArray(data.equipment)
    ? data.equipment
    : {};
  data.equipment = {};
  const seenIds = new Set();
  const ensureId = (item) => {
    if (typeof item.id !== 'number' || !Number.isFinite(item.id) || seenIds.has(item.id)) {
      data.itemSeq += 1;
      item.id = data.itemSeq;
    }
    seenIds.add(item.id);
  };
  for (const slot of GEAR_SLOTS) {
    data.equipment[slot.key] = sanitizeItem(rawEquipment[slot.key]);
    if (data.equipment[slot.key]) ensureId(data.equipment[slot.key]);
  }
  data.inventory = (Array.isArray(data.inventory) ? data.inventory : [])
    .map(sanitizeItem)
    .filter(Boolean);
  data.inventory.forEach(ensureId);
  if (!Array.isArray(data.skills)) data.skills = ['start'];
  if (!data.skills.includes('start')) data.skills.unshift('start');
  data.skills = data.skills.filter((id) => SKILL_NODES_BY_ID[id]);
  // Runenpunkte gibt es erst ab SKILL_TREE_UNLOCK_LEVEL — verdient pro Stufe
  // darüber, verbraucht vom Startknoten abgesehen.
  const earnedSkillPoints = Math.max(0, data.level - SKILL_TREE_UNLOCK_LEVEL + 1);
  data.skillPoints = Math.max(0, earnedSkillPoints - (data.skills.length - 1));
  data.zone = Math.max(0, Math.min(Math.trunc(asNumber(data.zone, 0)), MAX_ZONE));
  data.cleared = Math.max(0, Math.min(Math.trunc(asNumber(data.cleared, 0)), MAX_ZONE));
  data.zone = Math.min(data.zone, data.cleared);
  data.crownWon = data.crownWon === true;
  data.inField = data.inField === true;
  // Statistik-Zähler: Alte Spielstände starten bei null, kaputte Werte
  // werden auf sichere Grenzen gezogen.
  data.deaths = Math.max(0, asNumber(data.deaths, 0));
  data.playtimeMs = Math.max(0, asNumber(data.playtimeMs, 0));
  data.drops = data.drops && typeof data.drops === 'object' && !Array.isArray(data.drops) ? data.drops : {};
  for (const rarity of RARITIES) data.drops[rarity.key] = Math.max(0, asNumber(data.drops[rarity.key], 0));
  // Bestiarium (Name → Kill-Zähler) und Errungenschaften (ID-Liste):
  // Fremdes wird verworfen, Überlängen geklemmt, Nullen verworfen.
  data.bestiary = data.bestiary && typeof data.bestiary === 'object' && !Array.isArray(data.bestiary) ? data.bestiary : {};
  const cleanBestiary = {};
  for (const [name, count] of Object.entries(data.bestiary)) {
    const kills = asCount(count);
    if (typeof name === 'string' && name && kills > 0) cleanBestiary[name.slice(0, 60)] = kills;
  }
  data.bestiary = cleanBestiary;
  data.achievements = Array.isArray(data.achievements)
    ? data.achievements.filter((id) => typeof id === 'string' && id.length <= 40)
    : [];
  // Ruhm-Laden: ausgegebener Ruhm und Kaufläufe geklemmt.
  data.ruhmAusgegeben = Math.max(0, asNumber(data.ruhmAusgegeben, 0));
  data.shopPurchases = data.shopPurchases && typeof data.shopPurchases === 'object' && !Array.isArray(data.shopPurchases) ? data.shopPurchases : {};
  data.shopPurchases.beutelschein = Math.min(3, asNumber(data.shopPurchases.beutelschein, 0));
  data.shopPurchases.zollerlass = Math.min(4, asNumber(data.shopPurchases.zollerlass, 0));
  data.shopPurchases.aschesegen = Math.min(3, asNumber(data.shopPurchases.aschesegen, 0));
  data.shopPurchases.tiefenkunde = Math.min(3, asNumber(data.shopPurchases.tiefenkunde, 0));
  data.shopPurchases.werkstatthandwerk = Math.min(3, asNumber(data.shopPurchases.werkstatthandwerk, 0));
  // Prestige: Kronenasche-Buch und Vermächtnis-Stufen (nur bekannte Titel, 0–3).
  data.kronenascheEarned = Math.max(0, asNumber(data.kronenascheEarned, 0));
  data.kronenascheAusgegeben = Math.min(data.kronenascheEarned, Math.max(0, asNumber(data.kronenascheAusgegeben, 0)));
  data.prestigeRuns = Math.max(0, Math.min(99999, Math.trunc(asNumber(data.prestigeRuns, 0))));
  data.legacy = data.legacy && typeof data.legacy === 'object' && !Array.isArray(data.legacy) ? data.legacy : {};
  const cleanLegacy = {};
  for (const title of Object.keys(LEGACY_TITLES)) {
    const level = asNumber(data.legacy[title], 0);
    if (level > 0) cleanLegacy[title] = Math.min(3, Math.trunc(level));
  }
  data.legacy = cleanLegacy;
  // Safedrop-Register: Gebiete, deren Elite-Erstkill schon gedroppt hat.
  data.safedropZones = data.safedropZones && typeof data.safedropZones === 'object' && !Array.isArray(data.safedropZones) ? data.safedropZones : {};
  const cleanSafedrops = {};
  for (const zone of Object.keys(data.safedropZones)) {
    const idx = asCount(zone);
    if (idx >= 0 && idx <= MAX_ZONE) cleanSafedrops[idx] = 1;
  }
  data.safedropZones = cleanSafedrops;
  data.seenContinents = Array.isArray(data.seenContinents)
    ? data.seenContinents.filter((key) => typeof key === 'string')
    : [];
  data.hints = data.hints && typeof data.hints === 'object' && !Array.isArray(data.hints)
    ? data.hints
    : {};
  return data;
}

function loadSave() {
  for (const [attempt, key] of [SAVE_KEY, ...BACKUP_KEYS].entries()) {
    const data = parseSave(localStorage.getItem(key));
    if (!data) continue;
    try {
      prepareSave(data);
    } catch {
      continue; // unerwartet Böses → nächste Backup-Generation probieren
    }
    Object.assign(state, data);
    if (attempt > 0) saveNotice = `Hauptspielstand war beschädigt — Backup ${attempt} geladen.`;
    return true;
  }
  return false;
}

const tauriSaveApi = () => (window.__TAURI__?.dialog && window.__TAURI__?.fs ? window.__TAURI__ : null);

function flashButton(button, text) {
  const original = button.textContent;
  button.textContent = text;
  button.disabled = true;
  setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, 2000);
}

async function exportSave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  const payload = JSON.stringify({
    game: 'ashen-crown',
    saveVersion: SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    state: JSON.parse(raw),
  }, null, 2);
  const fileName = `ashen-crown-spielstand-${new Date().toISOString().slice(0, 10)}.json`;
  const tauri = tauriSaveApi();
  if (tauri) {
    const path = await tauri.dialog.save({
      defaultPath: fileName,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!path) return false;
    await tauri.fs.writeTextFile(path, payload);
    return true;
  }
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}

function unwrapSave(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed?.game === 'ashen-crown' && parsed.state) return parsed.state;
    if (parsed && typeof parsed.level === 'number' && typeof parsed.ash === 'number') return parsed;
    return null;
  } catch {
    return null;
  }
}

function pickSaveFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      resolve(file ? await file.text() : null);
    });
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

async function importSave() {
  const button = el.importButton;
  if (!importArmed) {
    importArmed = true;
    button.classList.add('armed');
    button.textContent = 'Wirklich? Überschreibt den Spielstand.';
    importTimer = setTimeout(() => {
      importArmed = false;
      button.classList.remove('armed');
      button.textContent = 'Importieren';
    }, 4000);
    return;
  }
  clearTimeout(importTimer);
  importArmed = false;
  button.classList.remove('armed');
  button.textContent = 'Importieren';
  const tauri = tauriSaveApi();
  let text = null;
  if (tauri) {
    const path = await tauri.dialog.open({
      multiple: false,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!path) return;
    text = await tauri.fs.readTextFile(path);
  } else {
    text = await pickSaveFile();
  }
  if (!text) return;
  const data = unwrapSave(text);
  if (!data) {
    flashButton(button, 'Ungültige Datei');
    return;
  }
  rotateBackups(true);
  localStorage.setItem(SAVE_KEY, JSON.stringify(migrateSave(data)));
  location.reload();
}

function formatDuration(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

// Simulierter Kampf (Offline-Fortschritt): rechnet mit denselben Formeln wie
// das Live-Gefecht — Krit, Tempo, Gegnerprofile, erlittener Schaden und
// Lifeleech. Stoppt am Boss (Bosse verlangen deine Anwesenheit) oder beim
// Tod. Rückgabe: 'time' | 'boss' | 'died'.
function simulateKills(seconds) {
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
      offlineDiversion = zoneDef(state.zone).name;
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
    if (expectedTaken - healed >= heroHp) return 'died';
    // Safedrop: Der erste Elite-Kill eines Gebiets garantiert auch offline.
    const eliteSafedrop = isElite && !state.safedropZones[state.zone];
    if (eliteSafedrop) state.safedropZones[state.zone] = 1;
    heroHp = Math.min(heroMaxHp(), heroHp - expectedTaken + healed);
    state.kills += 1;
    state.zoneKills += 1;
    // Bestiarium: Offline-Erlegtes zählt wie im Feld unter dem Kreaturnamen.
    state.bestiary[def.name] = (state.bestiary[def.name] ?? 0) + 1;
    state.ash += Math.round(def.ash * (1 + statBonus('ash') / 100) * ashGainFactor());
    gainXp(Math.round(def.xp * enemyXpMultiplier(def.level, state.level)));
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
  const ashBefore = state.ash;
  const levelBefore = state.level;
  const killsBefore = state.kills;
  const dropsBefore = totalDropCount();
  const result = simulateKills(capped / 1000);
  const ash = state.ash - ashBefore;
  const levels = state.level - levelBefore;
  const kills = state.kills - killsBefore;
  const found = totalDropCount() - dropsBefore;
  const levelsPart = levels > 0 ? `, +${levels} ${levels === 1 ? 'Stufe' : 'Stufen'}` : '';
  const dropsPart = found > 0 ? `, ${found} ${found === 1 ? 'Beutestück gefunden' : 'Beutestücke gefunden'}` : '';
  let summary = `Während du fort warst (${formatDuration(capped)}): ${kills} Kämpfe, +${formatNum(ash)} Asche${levelsPart}${dropsPart}`;
  if (result === 'died') {
    state.deaths += 1;
    const toll = takeDeathToll();
    heroHp = Math.round(heroMaxHp() * DEATH_REVIVE_SHARE);
    summary += ` — gefallen. Die Asche nahm ${formatNum(toll)} Asche.`;
  } else if (result === 'boss') {
    summary += '. Ein Boss versperrt den Weg.';
  } else if (offlineDiversion) {
    summary += `. Ein Boss versperrte den Weg — ausgewichen auf ${offlineDiversion} und weitergefarmt.`;
  } else {
    summary += '.';
  }
  if (kills > 0 || result === 'died') {
    offlineSummary = summary;
    save();
  }
}

const totalDropCount = () => Object.values(state.drops ?? {}).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);

function idleTick() {
  // Spielzeit: echte Wanduhr-Deltas, bei Kommastillstand (Throttling,
  // Ruhezustand) auf eine Minute je Tick geklemmt.
  const now = Date.now();
  if (lastPlayTick !== null) state.playtimeMs += Math.min(60000, now - lastPlayTick);
  lastPlayTick = now;
  checkAchievements();
  save();
  render();
}

function beginCombat() {
  if (tickTimer) return;
  spawnEnemy();
  paused = false;
  tickTimer = setInterval(tick, TICK_MS);
}

function descend() {
  if (!state.inField) {
    // Der Abstieg nimmt die Lebenskraft mit, wie der Schrein sie hinterlässt —
    // volle Kraft nur durch Warten (hubTick) oder eine gewonnene Tür.
    state.inField = true;
    save();
  }
  showScreen(el.game);
  render();
  beginCombat();
  if (state.kills === 0) playCombatIntro();
}

// Beim ersten Betreten eines Kontinents (oder der Tiefen): seine Annale.
function announceContinent(index) {
  const key = continentLoreKeyOf(index);
  if (state.seenContinents.includes(key)) return;
  const lore = CONTINENT_LORE[key];
  if (!lore) return;
  state.seenContinents.push(key);
  showDismissibleOverlay(lore, 6800, true);
}

function enterZone(index) {
  if (index < 0 || index > state.cleared) return;
  state.zone = index;
  state.zoneKills = 0;
  announceContinent(index);
  save();
}

// Das Erwachen: Intro-Seiten für frisch Geformte, klickbar zum Weiterblättern.
function playIntro() {
  const pages = [...INTRO_PAGES];
  const next = () => {
    if (!pages.length) return;
    const page = pages.shift();
    showDismissibleOverlay(`<em>${page}</em>`, pages.length ? 4200 : 3400, true, next);
  };
  next();
}

function showVictory() {
  paused = true;
  state.inField = false;
  setLowHp(false);
  setBossFight(false);
  sfx.victory();
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  el.victoryKills.textContent = formatNum(state.kills);
  el.victoryLevel.textContent = formatNum(state.level);
  el.victoryAsh.textContent = formatNum(state.ash);
  showScreen(el.sceneVictory);
}

function returnToHub() {
  if (autoDoorTimer) {
    // Das Feld verlassen bricht den Auto-Tür-Lauf ab — kein Weitergehen aus dem Hub.
    clearTimeout(autoDoorTimer);
    autoDoorTimer = null;
  }
  if (sceneTimer) {
    clearTimeout(sceneTimer);
    sceneTimer = null;
  }
  hideOverlay();
  overlayDismissible = false;
  paused = true;
  state.inField = false;
  setLowHp(false);
  setBossFight(false);
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  // Die Lebenskraft bleibt, wie das Feld sie hinterließ — der Schrein im
  // Hub regeneriert sie stetig (hubTick), und der Abstieg nimmt sie mit.
  enemy = null;
  save();
  showScreen(el.hub);
  render();
}

function returnToMenu() {
  showScreen(el.menu);
}

function bindEvents() {
  el.shrineButton.addEventListener('click', () => {
    // Der Schrein verwirft den laufenden Kampf — Bosse heilen sich voll.
    if (enemy?.type === 'boss') toast('Der Boss heilt sich beim Verlassen vollständig.');
    returnToHub();
  });
  el.btnDescend.addEventListener('click', descend);
  el.doorButton.addEventListener('click', () => {
    if (state.zone + 1 > state.cleared) return;
    enterZone(state.zone + 1);
    enemy = null;
    heroAttackProgress = 0;
    enemyAttackProgress = 0;
    heroHp = heroMaxHp();
    spawnEnemy();
    render();
  });
  el.hubMenu.addEventListener('click', returnToMenu);
  el.victoryContinue.addEventListener('click', returnToHub);
  el.hubOptions.addEventListener('click', () => openOptions('hub'));
  el.overlay.addEventListener('click', dismissOverlay);
  el.optionsTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.options-tab');
    if (!btn) return;
    for (const tab of el.optionsTabs.querySelectorAll('.options-tab')) {
      tab.classList.toggle('active', tab === btn);
    }
    for (const page of el.optionsPanel.querySelectorAll('.options-page')) {
      page.hidden = page.dataset.page !== btn.dataset.tab;
    }
  });
  el.optionsPanel.addEventListener('change', (e) => {
    const input = e.target.closest('[data-setting]');
    if (input) {
      settings[input.dataset.setting] = input.checked;
      saveSettings();
      applySettings();
      return;
    }
    const select = e.target.closest('[data-choicesetting]');
    if (!select) return;
    settings[select.dataset.choicesetting] = select.value;
    saveSettings();
    applySettings();
  });
  el.optionsPanel.addEventListener('input', (e) => {
    const input = e.target.closest('[data-volume]');
    if (!input) return;
    settings[input.dataset.volume] = Number(input.value);
    saveSettings();
    applySettings();
  });
  el.resetButton.addEventListener('click', () => {
    if (!resetArmed) {
      resetArmed = true;
      el.resetButton.classList.add('armed');
      el.resetButton.textContent = 'Wirklich? Erneut klicken';
      resetTimer = setTimeout(() => {
        resetArmed = false;
        el.resetButton.classList.remove('armed');
        el.resetButton.textContent = 'Zurücksetzen';
      }, 4000);
      return;
    }
    clearTimeout(resetTimer);
    // Rücksichtslos löschen heißt: Hauptstand UND Backup-Kette — sonst lädt
    // der nächste Start still das Backup und der „gelöschte" Held kehrt
    // zurück. saveSuppressed hält Zwischenspeicherer aus dem Fenster.
    saveSuppressed = true;
    for (const key of [SAVE_KEY, ...BACKUP_KEYS]) localStorage.removeItem(key);
    location.reload();
  });
  el.exportButton.addEventListener('click', () => {
    exportSave()
      .then((ok) => flashButton(el.exportButton, ok ? 'Exportiert ✓' : 'Abgebrochen'))
      .catch(() => flashButton(el.exportButton, 'Fehlgeschlagen'));
  });
  el.importButton.addEventListener('click', importSave);
  el.feedbackButton.addEventListener('click', () => {
    const url = 'https://github.com/Trobikus/ashen-crown/issues';
    navigator.clipboard?.writeText(url).catch(() => {});
    try {
      window.open(url, '_blank');
    } catch {
      // Desktop-Webview blockt evtl. Pop-ups — die Zwischenablage reicht.
    }
    flashButton(el.feedbackButton, 'Adresse kopiert ✓');
  });
  document.getElementById('btn-options-back').addEventListener('click', () => {
    showScreen(optionsReturnScreen ?? el.hub);
  });
  el.tileHero.addEventListener('click', () => showScreen(el.sceneHero));
  el.tileSkills.addEventListener('click', () => {
    if (state.level < SKILL_TREE_UNLOCK_LEVEL) return;
    showScreen(el.sceneSkills);
    hintOnce('hint-skills', 'Benachbarte Runen schalten andere frei — klicke verfügbare an. Maximal zwei Pfade erwachen gleichzeitig; „Runen neu schneiden" bricht alles zurück und erstattet die Punkte.');
  });
  el.tileMap.addEventListener('click', () => {
    resetZoneView();
    showScreen(el.sceneMap);
    renderZones();
    hintOnce('hint-map', 'Errungene Ebenen bleiben offen — reise zurück, um sicher Asche und Beute zu farmen.');
  });
  el.tileCrafting.addEventListener('click', () => {
    showScreen(el.sceneCrafting);
    // Sofort rendern — sonst bleiben die Slots leer, bis der 3-Sekunden-Tick
    // die Szene das nächste Mal streift.
    renderCrafting();
    hintOnce('hint-crafting', 'Die Werkstatt stärkt getragene Ausrüstung: Verstärken hebt die Werte, Umschmieden die Seltenheit. Beides kostet Asche.');
  });
  el.tileChronik.addEventListener('click', () => {
    renderChronicle();
    showScreen(el.sceneChronik);
  });
  el.tileStats.addEventListener('click', () => {
    showScreen(el.sceneStats);
    renderStats();
  });
  el.tileBestiary.addEventListener('click', () => {
    showScreen(el.sceneBestiary);
    renderBestiary();
  });
  el.tileAchievements.addEventListener('click', () => {
    showScreen(el.sceneAchievements);
    renderAchievements();
  });
  el.ruhmShop.addEventListener('click', (e) => {
    const buy = e.target.closest('[data-buy]');
    if (!buy || buy.disabled) return;
    buyRuhmUpgrade(buy.dataset.buy);
  });
  el.tileThrone.addEventListener('click', () => {
    showScreen(el.sceneThrone);
    renderThrone();
  });
  el.legacyShop.addEventListener('click', (e) => {
    const buy = e.target.closest('[data-legacy]');
    if (!buy || buy.disabled) return;
    buyLegacy(buy.dataset.legacy);
  });
  el.prestigeButton.addEventListener('click', attemptPrestige);
  el.victoryThrone.addEventListener('click', () => {
    showScreen(el.sceneThrone);
    renderThrone();
  });
  bindCraftEvents(hooks);
  el.zoneList.addEventListener('click', (e) => {
    const pager = e.target.closest('.zone-pager');
    if (pager && !pager.disabled) {
      switchZoneView(Number(pager.dataset.dir));
      return;
    }
    const row = e.target.closest('.zone-row');
    if (!row || row.disabled) return;
    enterZone(Number(row.dataset.zone));
    showScreen(el.hub);
    render();
  });
  el.sortInventoryButton.addEventListener('click', sortInventory);
  el.equipBestButton.addEventListener('click', equipBest);
  el.sellButton.addEventListener('click', sellButtonAction);
  el.sellAllButton.addEventListener('click', selectAllForSale);
  el.inventoryGrid.addEventListener('click', handleInventoryClick);
  for (const button of el.statPlusButtons) {
    bindHoldToRepeat(button, () => allocateStat(button.dataset.stat));
  }
  el.statRespecButton.addEventListener('click', attemptStatRespec);
  for (const button of el.spendButtons) {
    button.addEventListener('click', () => {
      statSpendAmount = Number(button.dataset.amount);
      render();
    });
  }
  bindSkillTreeEvents(hooks);
  for (const slotEl of el.gearSlots) {
    slotEl.addEventListener('click', () => unequipItem(slotEl.dataset.slot));
  }
  document.querySelectorAll('[data-back]').forEach((btn) => {
    btn.addEventListener('click', () => showScreen(el.hub));
  });
}

function ensureInit() {
  if (el.game) return;
  cacheDom();
  Object.assign(hooks, {
    after: () => { heroHp = Math.min(heroHp, heroMaxHp()); save(); render(); },
    clampHp: () => { heroHp = Math.min(heroHp, heroMaxHp()); },
    save,
    render,
  });
  bindEvents();
  initItems({ clampHp: () => { heroHp = Math.min(heroHp, heroMaxHp()); }, save, render });
  buildSkillTree();
  buildZoneList();
  buildCraftSlots();
  applySkillView();
  loadSettings();
  applySettings();
  hasSave = loadSave();
  if (hasSave) {
    // Persistierte Lebenskraft übernehmen — 0 heißt voll (Alter Bestand).
    heroHp = state.hp > 0 ? Math.min(state.hp, heroMaxHp()) : heroMaxHp();
    applyOfflineProgress();
  }
  setInterval(idleTick, STATS_SYNC_INTERVAL_MS);
  setInterval(hubTick, TICK_MS);
}

export function startGame() {
  ensureInit();
  showScreen(el.hub);
  render();
  if (!visited) {
    visited = true;
    if (!hasSave) {
      paused = true;
      playIntro();
    } else if (saveNotice) {
      showDismissibleOverlay(saveNotice, 5000);
      saveNotice = null;
    } else if (offlineSummary) {
      if (settings.offlineSummary) showDismissibleOverlay(offlineSummary, 4500);
      offlineSummary = null;
    }
  }
}

export function openOptions(from) {
  ensureInit();
  optionsReturnScreen = from === 'menu' ? el.menu : el.hub;
  showScreen(el.sceneOptions);
  render();
}
