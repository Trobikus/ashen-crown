// Der App-Kern: Kampf (Held & Gegner, Tod, Wut, Ticks), Held-Fortschritt
// (EP, Statpunkte, Respec), der zentrale Render-Pfad, der Ablauf der Szenen
// (Hub, Abstieg, Sieg) und die Verkabelung der Eingaben.
//
// Fach-Module leben daneben: domfx (DOM-Effekte), overlay (Botschaften),
// saveio (Speichern/Laden), offline (Offline-Fortschritt), throne (Prestige),
// records (Bestiarium/Errungenschaften/Statistik). Ihre Rückwärts-Abhängig-
// keiten zu diesem Kern laufen über den Bus (bus.js) — game.js meldet dort
// Rendern, Szenenwechsel, Lebenskraft und Kampfhelfer als Dienste an.
import { el, cacheDom } from './dom.js';

import { state, settings, inventoryCap, deathPenalty, ashGainFactor, xpGainFactor, hubRegenFactor, deathReviveShare } from './state.js';

import { loadSettings, saveSettings, applySettings } from './settings.js';

import { TICK_MS, ATTACK_INTERVAL_MS, STATS_SYNC_INTERVAL_MS, BOSS_AFTER_KILLS, ELITE_EVERY_KILLS, MAIN_ZONE_COUNT, LAST_ZONE_INDEX, GEAR_SLOTS, ARMOR_RESISTANCE, ENRAGE_THRESHOLD, ENRAGE_INTERVAL_MULT, HUB_REGEN_PER_SECOND, ENEMY_MISS_CHANCE, HERO_MISS_CHANCE, DAMAGE_VARIANCE, SKILL_TREE_UNLOCK_LEVEL, STAT_POINTS_PER_LEVEL, enemyXpMultiplier, continentKeyOf, xpNeeded, zoneDef, formatNum } from './data.js';

import { scaledEnemy, statBonus, heroDamage, heroMaxHp, heroArmor, heroCritChance, heroAttackSpeed, critMultiplier, heroLifeleech } from './stats.js';

import { buildSkillTree, renderSkillTree, bindSkillTreeEvents, applySkillView, MAX_SKILL_POINTS } from './skilltree.js';

import { buildZoneList, renderZones, resetZoneView, switchZoneView } from './zones.js';

import { sfx, setLowHp, setBossFight, setCombatIntensity } from './audio.js';

import { toast, levelUpFloat } from './feedback.js';

import { buildCraftSlots, renderCrafting, bindCraftEvents } from './crafting.js';

import { INTRO_PAGES, COMBAT_INTRO_PAGES, CONTINENT_LORE, epitaphOf, continentLoreKeyOf, renderChronicle } from './lore.js';

import { initItems, rollDrop, unequipItem, sortInventory, equipBest, exitSellMode, sellButtonAction, selectAllForSale, handleInventoryClick, renderGearIfDirty, buildDepthRelic, grantItem, itemSellValue } from './items.js';

import { ACHIEVEMENTS, claimAchievement, evaluateAchievements } from './achievements.js';

import { kronenascheReward } from './prestige.js';

import { spriteSvgFor } from './sprites.js';

import { flash, pulseClass, setText, setWidth, setHidden, setHpBar, spawnDamageFloat, spawnHealFloat, spawnMissFloat, spawnSlash, spawnImpact, flashButton, refreshArenaParticles, CONTINENT_FIGURE_CLASSES } from './domfx.js';

import { showOverlay, hideOverlay, showDismissibleOverlay, dismissOverlay, cancelScene, clearSceneTimer, scheduleScene } from './overlay.js';

import { save, purgeSaves, loadSave, consumeSaveNotice, exportSave, importSave } from './saveio.js';

import { applyOfflineProgress, consumeOfflineSummary } from './offline.js';

import { renderThrone, buyLegacy, attemptPrestige } from './throne.js';

import { renderStats, renderBestiary, renderAchievements, renderRuhmShop, buyRuhmUpgrade } from './records.js';

import { provide } from './bus.js';



let heroHp = state.maxHp;

let enemy = null;

let paused = true;

let tickTimer = null;

let heroAttackProgress = 0;

let enemyAttackProgress = 0;

let autoDoorTimer = null;

let hasSave = false;

let visited = false;

let statSpendAmount = 1;

let optionsReturnScreen = null;

let resetArmed = false;

let resetTimer = null;

let lastPlayTick = null;

let hooks = { after: () => {}, clampHp: () => {}, save: () => {}, render: () => {} };

// Der Name kommt vom Spieler — überall, wo er in innerHTML landet
// (Begrüßung, Tod, Sieg), wird er escaped; der Schrein schreibt per textContent.
const escapeHtml = (text) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Der Stat-Respec erscheint erst, wenn genug verteilt wurde — darunter gäbe
// es nichts zurückzuholen und die Zeile wäre nur Deko.
const STAT_RESPEC_MIN_SPENT = 5;

// Die Bus-Anmeldung: Kern-Dienste für die Fach-Module. Funktionsdeklarationen
// sind gehoistet — die Closures dürfen sich auf weiter unten stehende
// Funktionen beziehen, denn gelesen wird erst zur Laufzeit.
provide('heroHp', { get: () => heroHp, set: (value) => { heroHp = value; } });

provide('gainXp', gainXp);

provide('takeDeathToll', takeDeathToll);

provide('showScreen', showScreen);

provide('render', render);

// Der Auto-Tür-Lauf hängt an einem eigenen Timer-Register statt am Szenen-
// Timer: dismissOverlay räumt die Szene ab, ein Klick aufs Gate würde den
// Lauf sonst canceln und die Arena leer zurücklassen. Klick aufs Gate führt
// den Lauf sofort aus — Tür auf, voll heilen, Kampf an.
provide('overlayGate', () => {
  if (!autoDoorTimer) return false;
  autoDoorAdvance();
  return true;
});

function showScreen(target) {
  if (target !== el.sceneHero) exitSellMode();
  for (const screen of [el.menu, el.hub, el.sceneHero, el.sceneSkills, el.sceneOptions, el.sceneMap, el.sceneCrafting, el.sceneBestiary, el.sceneAchievements, el.sceneThrone, el.sceneChronik, el.sceneVictory, el.game]) {
    screen.hidden = screen !== target;
  }
  // Sanfter Einstieg statt harter Schaltung — ein kurzes Aufblenden pro
  // Szenenwechsel (pulseClass erzwingt per Reflow den Neustart der Animation).
  pulseClass(target, 'scene-enter', 450);
}

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
  // Elite-Moment: Der goldene Rand blitzt einmal auf, ein kurzer Sting
  // meldet den Auftritt — Eliten sind ein Ereignis, kein Normalgegner.
  if (type === 'elite') {
    pulseClass(el.enemyFigure, 'elite-flash', 900);
    sfx.rare();
  }
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
    // Runenpunkte gibt es erst ab SKILL_TREE_UNLOCK_LEVEL, dann alle zwei
    // Stufen einen — und der Zustrom stoppt an der Obergrenze: Mehr Punkte,
    // als zwei vollständige Pfade je verteilen können, würde nur gehortet.
    if (state.level >= SKILL_TREE_UNLOCK_LEVEL && (state.level - SKILL_TREE_UNLOCK_LEVEL) % 2 === 0) {
      if (state.skills.length - 1 + state.skillPoints < MAX_SKILL_POINTS) {
        state.skillPoints += 1;
        if (state.level === SKILL_TREE_UNLOCK_LEVEL) toast('Stufe 20 — die Runen erwachen: Die Fertigkeiten-Kachel ist im Schrein erschienen.', '#c1663a');
      }
    }
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
  // Bestiarium: Jede erlegte Kreatur zählt unter ihrem Namen; der Erstkill
  // einer Art wird gefeiert — sonst füllt sich das Bestiarium unsichtbar.
  const firstOfKind = !state.bestiary[def.name];
  state.bestiary[def.name] = (state.bestiary[def.name] ?? 0) + 1;
  if (firstOfKind) toast(`Neue Kreatur erlegt: ${def.name}`, '#c1663a');
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
      clearSceneTimer();
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
  // Aschewille hebt den Anteil an.
  heroHp = Math.round(heroMaxHp() * deathReviveShare());
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
  showOverlay(`<strong>${escapeHtml(state.heroName)}</strong> ist gefallen — die Asche nimmt dich zurück${toll > 0 ? `, und ihren Zoll: ${formatNum(toll)} Asche` : ''}. Am Schrein erwachst du mit einem Viertel deiner Lebenskraft.` + recap + wallHint, true);
  render();
  save();
  scheduleScene(() => {
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
// 2 % des Maximums pro Sekunde (Schrein-Atem beschleunigt das), ganz ohne
// Zutun.
function hubTick() {
  if (state.inField) return;
  const max = heroMaxHp();
  if (heroHp >= max) return;
  const regen = HUB_REGEN_PER_SECOND * hubRegenFactor();
  heroHp = Math.min(max, heroHp + max * regen * (TICK_MS / 1000));
  renderHubHero();
}

function renderHubHero() {
  const max = heroMaxHp();
  setText(el.heroNameText, state.heroName);
  setText(el.hubHeroLevel, state.level);
  setHpBar(el.hubHeroHp, el.hubHeroHpGhost, (heroHp / max) * 100);
  setText(el.hubHeroHpText, `${formatNum(Math.ceil(Math.max(0, heroHp)))} / ${formatNum(max)}`);
  // Schrein-Regeneration sichtbar machen: Der Balken schimmert, während er
  // kehrt, und daneben zählt ein Timer die Sekunden bis zum vollen Leben.
  const regenerating = !state.inField && heroHp < max;
  el.hubHeroHpBar.classList.toggle('regen', regenerating);
  if (regenerating) {
    const regen = HUB_REGEN_PER_SECOND * hubRegenFactor();
    const seconds = Math.ceil((max - heroHp) / (max * regen));
    setHidden(el.hubHeroRegen, false);
    setText(el.hubHeroRegen, seconds === 1 ? 'voll in 1 s' : `voll in ${seconds} s`);
  } else {
    setHidden(el.hubHeroRegen, true);
  }
}

// Gegner-Inspektor: Hover auf den Gegner zeigt Schaden, Tempo, Temperament
// und die eigene Schadensminderung — „warum stirbe ich?" wird beantwortbar.
// Das Markup baut nur bei geänderter Signatur neu — nicht bei jedem Schlag.
let tooltipSignatur = '';

function renderEnemyTooltip() {
  if (!enemy) {
    if (tooltipSignatur) {
      el.enemyTooltip.innerHTML = '';
      tooltipSignatur = '';
    }
    return;
  }
  const armor = heroArmor();
  const reduction = Math.min(0.5, armor / (armor + ARMOR_RESISTANCE * enemy.damage));
  const speed = (1000 / enemyAttackInterval()).toFixed(1).replace('.', ',');
  const temperament = enemy.enraged
    ? 'Wütend — greift schneller an'
    : enemy.type === 'boss' ? 'Standard' : (enemy.profileLabel || 'Standard');
  const signatur = `${enemy.name}|${enemy.level}|${enemy.type}|${enemy.enraged ? 'wütend' : 'ruhig'}|${reduction.toFixed(3)}`;
  if (signatur === tooltipSignatur) return;
  tooltipSignatur = signatur;
  el.enemyTooltip.innerHTML = `
    <div class="tt-name">${enemy.name}</div>
    <div class="tt-rarity">${enemy.type === 'boss' ? 'Boss' : enemy.type === 'elite' ? 'Elite' : 'Normal'} · Lv ${enemy.level}</div>
    <div class="tt-stat">Schlag: bis zu ${formatNum(enemy.damage)} Schaden</div>
    <div class="tt-stat">Angriffstempo: ${speed} / s</div>
    <div class="tt-stat">Temperament: ${temperament}</div>
    <div class="tt-stat">Deine Rüstung mindert: ${Math.round(reduction * 100)} %</div>`;
}

function render() {
  setText(el.hubLevel, state.level);
  setText(el.hubAsh, formatNum(state.ash));
  renderHubHero();
  setText(el.hudLevel, state.level);
  setText(el.hudAsh, formatNum(state.ash));
  setText(el.inventoryCount, `${state.inventory.length} / ${inventoryCap()}`);
  setHidden(el.statPointsRow, state.statPoints === 0);
  setText(el.statPointsValue, state.statPoints);
  const hasPoints = state.statPoints > 0;
  for (const button of el.statPlusButtons) {
    setHidden(button, !hasPoints);
  }
  for (const button of el.spendButtons) {
    button.classList.toggle('active', Number(button.dataset.amount) === statSpendAmount);
  }
  const statSpent = allocatedStatPoints();
  const statCost = statRespecCost();
  setHidden(el.statRespecRow, statSpent < STAT_RESPEC_MIN_SPENT);
  setText(el.statRespecCost, formatNum(statCost));
  el.statRespecButton.disabled = statSpent <= 0 || state.ash < statCost;
  setText(el.statRespecButton, statRespecArmed
    ? 'Wirklich? Die Werte fallen.'
    : `Punkte neu verteilen · ${formatNum(statCost)} Asche`);
  setText(el.skillPointsHud, state.skillPoints);
  el.skillPointsHud.classList.toggle('has-points', state.skillPoints > 0);
  const skillsLocked = state.level < SKILL_TREE_UNLOCK_LEVEL;
  // Der Schrein hält Kacheln verborgen, bis sie etwas zu sagen haben:
  // Fertigkeiten erwachen auf Stufe 20 (mit Toast), die Werkstatt erscheint
  // mit der ersten Beute — hint-drop hält sie dauerhaft sichtbar, sobald
  // einmal etwas gefunden wurde.
  setHidden(el.tileSkills, skillsLocked);
  setText(el.tileSkillsSub, state.skillPoints > 0 ? `${state.skillPoints} Punkte frei` : 'Wähle weise');
  setHidden(el.tileCrafting, !(state.inventory.length > 0 || state.hints['hint-drop']));
  setHidden(el.tileThrone, !state.crownWon);
  setText(el.tileThroneSub, state.crownWon && state.cleared >= MAIN_ZONE_COUNT
    ? `Erneut erwachen · ${formatNum(kronenascheReward(state.cleared))} Kronenasche`
    : state.crownWon ? 'Die Krone dieses Laufs fehlt' : 'Nach der Krone');
  const zone = zoneDef(state.zone);
  setText(el.hudZone, `${zone.continent} · ${zone.name}`);
  const showProgress = state.cleared <= state.zone;
  setHidden(el.hudProgress, !showProgress);
  if (showProgress) {
    const bossPhase = state.zoneKills >= BOSS_AFTER_KILLS;
    setText(el.hudProgressText, bossPhase ? 'Boss!' : `${Math.min(state.zoneKills, BOSS_AFTER_KILLS)} / ${BOSS_AFTER_KILLS}`);
    el.hudProgressText.classList.toggle('gold', bossPhase);
    setWidth(el.hudProgressFill, Math.min(100, (state.zoneKills / BOSS_AFTER_KILLS) * 100));
  }
  setText(el.tileMapSub, state.cleared < MAIN_ZONE_COUNT
    ? `${Math.min(state.cleared + 1, MAIN_ZONE_COUNT)} von ${MAIN_ZONE_COUNT} Gebieten offen`
    : `Tiefe ${state.cleared + 1 - MAIN_ZONE_COUNT} erreicht`);
  renderZones();
  renderCrafting();
  setHidden(el.doorButton, !(state.zone + 1 <= state.cleared));
  setText(el.doorButton, state.zone + 1 === MAIN_ZONE_COUNT ? 'In die Tiefen hinabsteigen' : 'Durch die Tür gehen');
  checkOnboardingHints();
  renderSkillTree();
  setText(el.modalHeroLevel, state.level);
  setText(el.modalHeroXp, `${formatNum(state.xp)} / ${formatNum(xpNeeded(state.level))}`);
  setText(el.modalHeroHp, formatNum(heroMaxHp()));
  const dmgBase = heroDamage();
  setText(el.modalHeroDamage, `${formatNum(Math.round(dmgBase * (1 - DAMAGE_VARIANCE)))} – ${formatNum(Math.round(dmgBase * (1 + DAMAGE_VARIANCE)))}`);
  setText(el.modalHeroArmor, formatNum(heroArmor()));
  setText(el.modalHeroCrit, `${heroCritChance()} %`);
  setText(el.modalHeroCritDmg, `${Math.round(critMultiplier() * 100)} %`);
  const leech = heroLifeleech();
  setText(el.modalHeroLeech, leech.pct && leech.flat
    ? `${leech.pct} % · +${formatNum(leech.flat)}`
    : leech.pct ? `${leech.pct} %`
    : leech.flat ? `+${formatNum(leech.flat)} / Treffer`
    : '0 %');
  setText(el.modalHeroSpeed, `${heroAttackSpeed().toFixed(1).replace('.', ',')} / s`);
  setText(el.modalHeroKills, formatNum(state.kills));
  setText(el.heroLevel, `Lv ${state.level} · Held`);
  el.game.classList.toggle('low-hp', state.inField && !paused && heroHp / heroMaxHp() <= 0.25);
  setHpBar(el.heroHp, el.heroHpGhost, (heroHp / heroMaxHp()) * 100);
  setText(el.heroHpText, `${formatNum(Math.max(0, heroHp))} / ${formatNum(heroMaxHp())}`);
  // XP-Streifen: Der Stufenfortschritt läuft unter dem HP-Balken mit.
  const xpNeed = xpNeeded(state.level);
  setWidth(el.heroXpFill, Math.min(100, (state.xp / xpNeed) * 100));
  setText(el.heroXpText, `${formatNum(state.xp)} / ${formatNum(xpNeed)}`);
  if (enemy) {
    setText(el.enemyName, enemy.name);
    setText(el.enemyLevel, `Lv ${enemy.level} · ${enemy.type === 'boss' ? 'Boss' : enemy.type === 'elite' ? 'Elite' : 'Normal'}`);
    setHpBar(el.enemyHp, el.enemyHpGhost, (enemy.hp / enemy.maxHp) * 100);
    setText(el.enemyHpText, `${formatNum(Math.max(0, enemy.hp))} / ${formatNum(enemy.maxHp)}`);
    renderEnemyTooltip();
  } else {
    setText(el.enemyLevel, '—');
    setWidth(el.enemyHp, 0);
    setText(el.enemyHpText, '—');
    renderEnemyTooltip();
  }
  renderGearIfDirty();
  renderStats();
  renderBestiary();
  renderAchievements();
  renderRuhmShop();
}

// Errungenschaften prüfen: Im 3-Sekunden-Tick reicht — Erfülltes landet im
// Abhol-Regal, meldet sich mit Toast und Klang und pulsier in den Annalen;
// gebucht wird der Ruhm erst beim Einsammeln. Offline-Errungenschaften
// erscheinen beim nächsten Tick wie gewohnt.
function checkAchievements() {
  const fresh = evaluateAchievements(state);
  if (!fresh.length) return;
  for (const id of fresh) {
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    toast(`Errungenschaft erfüllt: ${achievement.name} — bereit zum Abholen.`, '#c1663a');
  }
  sfx.unlock();
  save();
}

// ——— Onboarding: Einmal-Hinweise im richtigen Moment ———

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

// Zustandsbasierte Hinweise: in jedem render geprüft, fire-once. Sobald alle
// vier verbraucht sind, steigt render() hier ohne Inventar-/Ausrüstungs-
// Durchläufe aus — der Normalfall ab den ersten Spielminuten.
function checkOnboardingHints() {
  if (state.hints['hint-levelup'] && state.hints['hint-drop'] && state.hints['hint-epic'] && state.hints['hint-leech']) return;
  if (state.level >= 2) {
    hintOnce('hint-levelup', 'Jede Stufe bringt 2 Statpunkte (Held-Screen). Ab Stufe 20 erwacht der Fertigkeitenbaum — danach kommt alle zwei Stufen ein Runenpunkt dazu.');
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
  setCombatIntensity(true);
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

// Das Erwachen: Intro-Seiten für frisch Geformte, klickbar zum Weiterblättern —
// als Abschluss gibt sich der Held seinen Namen.
function playIntro() {
  const pages = [...INTRO_PAGES];
  const next = () => {
    if (!pages.length) return askHeroName();
    const page = pages.shift();
    showDismissibleOverlay(`<em>${page}</em>`, pages.length ? 4200 : 3400, true, next);
  };
  next();
}

// Die Namensfrage: Kein Klick-Weiter hier — das Overlay bleibt stehen, Enter
// oder der Knopf bestätigen. Steuerzeichen schneidet die Save-Härtung ohnehin
// weg; hier klemmen wir nur Zeilenabstände und Länge vor. Wer leer lässt,
// bleibt schlicht „Held".
function askHeroName() {
  showOverlay(`
    <h3>Wie nennst du dich?</h3>
    <p>Die Asche wird dich so erinnern — Lauf für Lauf, bis du selbst vergisst.</p>
    <input id="hero-name-input" class="hero-name-input" maxlength="24" autocomplete="off" spellcheck="false" placeholder="Held">
    <button id="hero-name-confirm" class="btn-small hero-name-confirm">Erwache</button>
  `, true);
  const input = document.getElementById('hero-name-input');
  const confirm = () => {
    state.heroName = (input.value || '').replace(/\s+/g, ' ').trim().slice(0, 24) || 'Held';
    save();
    hideOverlay();
    showDismissibleOverlay(`So sei gegrüßt, <strong>${escapeHtml(state.heroName)}</strong> — die Asche erinnert sich an dich.`, 4400, true);
    render();
  };
  const onKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirm();
    }
  };
  input.addEventListener('keydown', onKey);
  document.getElementById('hero-name-confirm').addEventListener('click', confirm);
  setTimeout(() => input.focus(), 60);
}

function showVictory() {
  paused = true;
  state.inField = false;
  setLowHp(false);
  setBossFight(false);
  setCombatIntensity(false);
  sfx.victory();
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  el.victoryKills.textContent = formatNum(state.kills);
  el.victoryLevel.textContent = formatNum(state.level);
  el.victoryAsh.textContent = formatNum(state.ash);
  setText(el.victoryHeroName, `${state.heroName} trägt die Krone.`);
  showScreen(el.sceneVictory);
  // Kronen-Settle: Der Titel senkt sich einmal glühend auf den Sieg-Screen.
  pulseClass(el.sceneVictory.querySelector('h2'), 'crown-settle', 1600);
}

function returnToHub() {
  if (autoDoorTimer) {
    // Das Feld verlassen bricht den Auto-Tür-Lauf ab — kein Weitergehen aus dem Hub.
    clearTimeout(autoDoorTimer);
    autoDoorTimer = null;
  }
  cancelScene();
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
  setCombatIntensity(false);
  save();
  showScreen(el.hub);
  render();
}

function returnToMenu() {
  showScreen(el.menu);
}

// Szene-interne Reiter: gleiche Mechanik wie die Options-Tabs — Klick setzt
// den aktiven Knopf und die sichtbare Seite; onPage rendert die neue Seite
// sofort, sonst bliebe sie bis zum nächsten 3-Sekunden-Tick im alten Stand.
function bindSceneTabs(nav, panel, onPage) {
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.options-tab');
    if (!btn) return;
    for (const tab of nav.querySelectorAll('.options-tab')) {
      tab.classList.toggle('active', tab === btn);
    }
    for (const page of panel.querySelectorAll('.options-page')) {
      page.hidden = page.dataset.page !== btn.dataset.tab;
    }
    onPage(btn.dataset.tab);
  });
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
  bindSceneTabs(el.optionsTabs, el.optionsPanel, (tab) => {
    // Sofort rendern — der Guard in renderStats überspringt den Reiter,
    // solange er verborgen ist; ohne diesen Aufruf bliebe er bis zum
    // nächsten 3-Sekunden-Tick im alten Zustand.
    if (tab === 'stats') renderStats();
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
    // purgeSaves löscht Hauptstand UND Backup-Kette und dämmt das Speichern
    // bis zum Reload — sonst lädt der nächste Start still das Backup und
    // der „gelöschte" Held kehrt zurück.
    purgeSaves();
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
    // Sofort rendern — der Guard in renderSkillTree überspringt die Szene,
    // solange sie verborgen ist; ohne diesen Aufruf bliebe sie bis zum
    // nächsten 3-Sekunden-Tick im alten Zustand.
    renderSkillTree();
    hintOnce('hint-skills', 'Benachbarte Runen schalten andere frei — klicke verfügbare an. Maximal zwei Pfade erwachen gleichzeitig; „Runen neu schneiden“ bricht alles zurück und erstattet die Punkte.');
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
  el.tileBestiary.addEventListener('click', () => {
    showScreen(el.sceneBestiary);
    renderBestiary();
  });
  el.tileAchievements.addEventListener('click', () => {
    showScreen(el.sceneAchievements);
    renderAchievements();
  });
  el.achievementsList.addEventListener('click', (e) => {
    const claim = e.target.closest('[data-claim]');
    if (!claim) return;
    const reward = claimAchievement(state, claim.dataset.claim);
    if (!reward) return;
    toast(`Ruhm eingeheimst: +${formatNum(reward)} Ruhm.`, '#c1663a');
    sfx.unlock();
    save();
    renderAchievements();
    renderRuhmShop();
  });
  bindSceneTabs(el.achievementsTabs, el.achievementsPanel, (tab) => {
    if (tab === 'achievements') renderAchievements();
    if (tab === 'ruhm') renderRuhmShop();
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
    // Tastaturbedienung (Tab + Enter/Leer) für die Slot-Divs — der Tooltip
    // erscheint über :focus-visible, das Ablegen wie per Klick.
    slotEl.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      unequipItem(slotEl.dataset.slot);
    });
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
    } else {
      // Rettungs-Meldung schlägt Offline-Zusammenfassung — letztere bleibt
      // für den nächsten Start liegen, bis sie drankommt.
      const notice = consumeSaveNotice();
      if (notice) showDismissibleOverlay(notice, 5000);
      else {
        const summary = consumeOfflineSummary();
        if (summary && settings.offlineSummary) showDismissibleOverlay(summary, 4500);
      }
    }
  }
}

export function openOptions(from) {
  ensureInit();
  optionsReturnScreen = from === 'menu' ? el.menu : el.hub;
  showScreen(el.sceneOptions);
  render();
}
