import { el, cacheDom } from './dom.js';

import { state, settings, SAVE_KEY, SAVE_VERSION } from './state.js';

import { loadSettings, saveSettings, applySettings } from './settings.js';

import { TICK_MS, ATTACK_INTERVAL_MS, STATS_SYNC_INTERVAL_MS, ENEMY_RESPAWN_S, BOSS_AFTER_KILLS, ELITE_EVERY_KILLS, OFFLINE_CAP_MS, OFFLINE_MIN_GAP_MS, INVENTORY_CAP, MAIN_ZONE_COUNT, LAST_ZONE_INDEX, MAX_ZONE, GEAR_SLOTS, RARITIES, SKILL_NODES_BY_ID, ARMOR_RESISTANCE, DEATH_ASH_PENALTY, ENRAGE_THRESHOLD, ENRAGE_INTERVAL_MULT, HUB_REGEN_PER_SECOND, ENEMY_MISS_CHANCE, HERO_MISS_CHANCE, DAMAGE_VARIANCE, SKILL_TREE_UNLOCK_LEVEL, STAT_POINTS_PER_LEVEL, enemyXpMultiplier, continentKeyOf, xpNeeded, zoneDef, sanitizeItem, asCount, formatNum } from './data.js';

import { scaledEnemy, statBonus, heroDamage, heroMaxHp, heroArmor, heroCritChance, heroAttackSpeed, critMultiplier, heroLifeleech } from './stats.js';

import { buildSkillTree, renderSkillTree, bindSkillTreeEvents, applySkillView } from './skilltree.js';

import { buildZoneList, renderZones, resetZoneView, switchZoneView } from './zones.js';

import { sfx, setLowHp, setBossFight } from './audio.js';

import { toast, levelUpFloat } from './feedback.js';

import { buildCraftSlots, renderCrafting, bindCraftEvents } from './crafting.js';

import { INTRO_PAGES, COMBAT_INTRO_PAGES, CONTINENT_LORE, epitaphOf, continentLoreKeyOf, renderChronicle } from './lore.js';

import { initItems, rollDrop, equipItem, unequipItem, sortInventory, equipBest, sellSelected, toggleSellMode, exitSellMode, sellButtonAction, selectAllForSale, handleInventoryClick, renderGearIfDirty } from './items.js';



let heroHp = state.maxHp;

let enemy = null;

let paused = true;

let tickTimer = null;

let heroAttackProgress = 0;

let enemyAttackProgress = 0;

let sceneTimer = null;

let overlayDismissible = false;

let hasSave = false;

let visited = false;

let offlineSummary = null;

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
  if (sceneTimer) {
    clearTimeout(sceneTimer);
    sceneTimer = null;
  }
  finishDismissible();
}

function hideOverlay() {
  document.getElementById('overlay').classList.remove('show');
}

function showScreen(target) {
  if (target !== el.sceneHero) exitSellMode();
  for (const screen of [el.menu, el.hub, el.sceneHero, el.sceneSkills, el.sceneOptions, el.sceneMap, el.sceneCrafting, el.sceneStats, el.sceneChronik, el.sceneVictory, el.game]) {
    screen.hidden = screen !== target;
  }
}

const CONTINENT_FIGURE_CLASSES = ['cont-aschenlande', 'cont-frostreich', 'cont-faulmoor', 'cont-blutmark', 'cont-sternenleere', 'cont-tiefen'];

function setEnemyFigure(zoneIndex, isBoss) {
  for (const cls of CONTINENT_FIGURE_CLASSES) el.enemyFigure.classList.remove(cls);
  el.enemyFigure.classList.remove('enraged');
  el.enemyFigure.classList.add(`cont-${continentKeyOf(zoneIndex)}`);
  el.enemyFigure.classList.toggle('boss', isBoss);
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
  enemy = { type, name: def.name, level: def.level, hp: def.hp, maxHp: def.hp, damage: def.damage, attackIntervalMs: def.attackIntervalMs, enraged: false };
  setEnemyFigure(state.zone, def.boss);
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
  state.xp += Math.round(amount * (1 + statBonus('xp') / 100));
  while (state.xp >= xpNeeded(state.level)) {
    state.xp -= xpNeeded(state.level);
    state.level += 1;
    state.statPoints += STAT_POINTS_PER_LEVEL;
    // Runenpunkte gibt es erst, sobald der Fertigkeitenbaum offen ist.
    if (state.level >= SKILL_TREE_UNLOCK_LEVEL) state.skillPoints += 1;
    heroHp = heroMaxHp();
    sfx.levelUp();
    levelUpFloat(state.level);
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
  state.ash += Math.round(def.ash * (1 + statBonus('ash') / 100));
  // Gegner unter dem Helden-Niveau tragen weniger bis keine Erfahrung bei.
  gainXp(Math.round(def.xp * enemyXpMultiplier(enemy.level, state.level)));
  rollDrop(enemy.type);
  sfx.kill();
  if (def.boss) {
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
    showDismissibleOverlay(
      `${epitaph}<br><br>${def.name} bezwungen — ${continentGate}${next.name} ist jetzt offen.`,
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
      sceneTimer = setTimeout(() => {
        sceneTimer = null;
        hideOverlay();
        overlayDismissible = false;
        enterZone(state.zone + 1);
        heroAttackProgress = 0;
        enemyAttackProgress = 0;
        heroHp = heroMaxHp();
        spawnEnemy();
      }, 2200);
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
  flash(el.enemyFigure);
  pulseClass(el.heroFigure, 'recoil');
  spawnDamageFloat(el.heroFighter, taken);
  if (heroHp <= 0) {
    die();
  } else {
    render();
  }
}

// Der Todeszoll: Die Asche einbehält einen Anteil der getragenen Asche.
function takeDeathToll() {
  const toll = Math.min(state.ash, Math.round(state.ash * DEATH_ASH_PENALTY));
  state.ash -= toll;
  return toll;
}

function die() {
  heroHp = 0;
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
  showOverlay((toll > 0
    ? `Die Asche nimmt dich zurück — und ihren Zoll: ${formatNum(toll)} Asche.`
    : 'Die Asche nimmt dich zurück.') + wallHint, true);
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

function renderHubHero() {
  const max = heroMaxHp();
  el.hubHeroLevel.textContent = state.level;
  el.hubHeroHp.style.width = `${Math.max(0, Math.min(100, (heroHp / max) * 100))}%`;
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

function render() {
  el.hubLevel.textContent = state.level;
  el.hubAsh.textContent = formatNum(state.ash);
  renderHubHero();
  el.hudLevel.textContent = state.level;
  el.hudAsh.textContent = formatNum(state.ash);
  el.inventoryCount.textContent = `${state.inventory.length} / ${INVENTORY_CAP}`;
  el.statPointsRow.hidden = state.statPoints === 0;
  el.statPointsValue.textContent = state.statPoints;
  const hasPoints = state.statPoints > 0;
  for (const button of el.statPlusButtons) {
    button.hidden = !hasPoints;
  }
  for (const button of el.spendButtons) {
    button.classList.toggle('active', Number(button.dataset.amount) === statSpendAmount);
  }
  el.skillPointsHud.textContent = state.skillPoints;
  el.skillPointsHud.classList.toggle('has-points', state.skillPoints > 0);
  const skillsLocked = state.level < SKILL_TREE_UNLOCK_LEVEL;
  el.tileSkills.disabled = skillsLocked;
  el.tileSkillsSub.textContent = skillsLocked
    ? `Erwacht ab Stufe ${SKILL_TREE_UNLOCK_LEVEL}`
    : state.skillPoints > 0 ? `${state.skillPoints} Punkte frei` : 'Wähle weise';
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
  el.heroHp.style.width = `${Math.max(0, heroHp / heroMaxHp()) * 100}%`;
  el.heroHpText.textContent = `${formatNum(Math.max(0, heroHp))} / ${formatNum(heroMaxHp())}`;
  if (enemy) {
    el.enemyName.textContent = enemy.name;
    el.enemyLevel.textContent = `Lv ${enemy.level} · ${enemy.type === 'boss' ? 'Boss' : enemy.type === 'elite' ? 'Elite' : 'Normal'}`;
    el.enemyHp.style.width = `${Math.max(0, enemy.hp / enemy.maxHp) * 100}%`;
    el.enemyHpText.textContent = `${formatNum(Math.max(0, enemy.hp))} / ${formatNum(enemy.maxHp)}`;
  } else {
    el.enemyLevel.textContent = '—';
    el.enemyHp.style.width = '0%';
    el.enemyHpText.textContent = '—';
  }
  renderGearIfDirty();
  renderStats();
}

function save() {
  if (saveSuppressed) return;
  state.lastSeen = Date.now();
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
    if (state.cleared <= state.zone && state.zoneKills >= BOSS_AFTER_KILLS) return 'boss';
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
    heroHp = Math.min(heroMaxHp(), heroHp - expectedTaken + healed);
    state.kills += 1;
    state.zoneKills += 1;
    state.ash += Math.round(def.ash * (1 + statBonus('ash') / 100));
    gainXp(Math.round(def.xp * enemyXpMultiplier(def.level, state.level)));
    rollDrop(isElite ? 'elite' : 'normal');
  }
  return 'time';
}

function applyOfflineProgress() {
  if (!state.inField) return;
  state.inField = false;
  if (!settings.offlineProgress) {
    save();
    return;
  }
  const elapsed = Date.now() - (state.lastSeen || Date.now());
  if (elapsed < OFFLINE_MIN_GAP_MS) {
    save();
    return;
  }
  const capped = Math.min(elapsed, OFFLINE_CAP_MS);
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
    summary += ` — gefallen. Die Asche nahm ${formatNum(toll)} Asche.`;
  } else if (result === 'boss') {
    summary += '. Ein Boss versperrt den Weg.';
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
    state.inField = true;
    heroHp = heroMaxHp();
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
  if (sceneTimer) {
    clearTimeout(sceneTimer);
    sceneTimer = null;
    hideOverlay();
  }
  paused = true;
  state.inField = false;
  setLowHp(false);
  setBossFight(false);
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  // Die Lebenskraft bleibt, wie das Feld sie hinterließ — der Schrein im
  // Hub regeneriert sie stetig (hubTick). Der Abstieg heilt weiter voll.
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
    hintOnce('hint-skills', 'Benachbarte Runen schalten andere frei — klicke verfügbare an. „Runen neu schneiden" bricht alles zurück und erstattet die Punkte.');
  });
  el.tileMap.addEventListener('click', () => {
    resetZoneView();
    showScreen(el.sceneMap);
    renderZones();
    hintOnce('hint-map', 'Errungene Ebenen bleiben offen — reise zurück, um sicher Asche und Beute zu farmen.');
  });
  el.tileCrafting.addEventListener('click', () => {
    showScreen(el.sceneCrafting);
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
    heroHp = heroMaxHp();
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
