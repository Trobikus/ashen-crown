import { el, cacheDom } from './dom.js';

import { state, settings, SAVE_KEY, SAVE_VERSION } from './state.js';

import { loadSettings, saveSettings, applySettings } from './settings.js';

import { TICK_MS, ATTACK_INTERVAL_MS, STATS_SYNC_INTERVAL_MS, ENEMY_RESPAWN_S, BOSS_AFTER_KILLS, ELITE_EVERY_KILLS, OFFLINE_CAP_MS, OFFLINE_MIN_GAP_MS, INVENTORY_CAP, MAIN_ZONE_COUNT, LAST_ZONE_INDEX, MAX_ZONE, GEAR_SLOTS, SKILL_NODES_BY_ID, ARMOR_RESISTANCE, DEATH_ASH_PENALTY, KILL_REGEN_PCT, ENRAGE_THRESHOLD, ENRAGE_INTERVAL_MULT, continentKeyOf, xpNeeded, upgradeCost, zoneDef, normalizeItem, formatNum } from './data.js';

import { scaledEnemy, statBonus, heroDamage, heroMaxHp, heroArmor, heroCritChance, heroAttackSpeed, critMultiplier } from './stats.js';

import { buildSkillTree, renderSkillTree, bindSkillTreeEvents, applySkillView } from './skilltree.js';

import { buildZoneList, renderZones, resetZoneView, switchZoneView } from './zones.js';

import { sfx } from './audio.js';

import { toast, levelUpFloat } from './feedback.js';

import { buildCraftSlots, renderCrafting, bindCraftEvents } from './crafting.js';

import { INTRO_PAGES, CONTINENT_LORE, epitaphOf, continentLoreKeyOf, renderChronicle } from './lore.js';

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
  for (const screen of [el.menu, el.hub, el.sceneHero, el.sceneSkills, el.sceneOptions, el.sceneMap, el.sceneCrafting, el.sceneChronik, el.sceneVictory, el.game]) {
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
  enemy = { type, name: def.name, hp: def.hp, maxHp: def.hp, damage: def.damage, attackIntervalMs: def.attackIntervalMs, enraged: false };
  setEnemyFigure(state.zone, def.boss);
  el.enemyName.textContent = def.name;
  el.enemyProfile.textContent = def.profileLabel;
  el.enemyProfile.classList.remove('enraged-label');
  enemyAttackProgress = 0;
  if (def.boss) sfx.boss();
  render();
}

function gainXp(amount) {
  state.xp += Math.round(amount * (1 + statBonus('xp') / 100));
  while (state.xp >= xpNeeded(state.level)) {
    state.xp -= xpNeeded(state.level);
    state.level += 1;
    state.statPoints += 3;
    state.skillPoints += 1;
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

function healFromKill() {
  const heal = Math.round(heroMaxHp() * KILL_REGEN_PCT);
  if (heal <= 0) return;
  const before = heroHp;
  heroHp = Math.min(heroMaxHp(), heroHp + heal);
  if (heroHp > before) spawnHealFloat(el.heroFighter, heroHp - before);
}

function killEnemy() {
  const def = scaledEnemy(enemy.type);
  state.kills += 1;
  state.zoneKills += 1;
  state.ash += Math.round(def.ash * (1 + statBonus('ash') / 100));
  gainXp(def.xp);
  healFromKill();
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
  }
  enemy = null;
  save();
  setTimeout(spawnEnemy, 600);
  render();
}

function heroAttack() {
  let damage = heroDamage();
  const isCrit = Math.random() * 100 < heroCritChance();
  if (isCrit) {
    damage = Math.round(damage * critMultiplier());
    sfx.crit();
  } else {
    sfx.hit();
  }
  enemy.hp -= damage;
  flash(el.heroFigure);
  spawnDamageFloat(el.enemyFighter, damage, isCrit);
  if (enemy.hp <= 0) {
    killEnemy();
  } else {
    render();
  }
}

function enemyAttack() {
  const armor = heroArmor();
  const reduction = armor / (armor + ARMOR_RESISTANCE * enemy.damage);
  const taken = Math.max(1, Math.round(enemy.damage * (1 - reduction)));
  heroHp -= taken;
  flash(el.enemyFigure);
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
  const toll = takeDeathToll();
  sfx.death();
  showOverlay(toll > 0
    ? `Die Asche nimmt dich zurück — und ihren Zoll: ${formatNum(toll)} Asche.`
    : 'Die Asche nimmt dich zurück.');
  render();
  save();
  sceneTimer = setTimeout(() => {
    sceneTimer = null;
    hideOverlay();
    returnToHub();
  }, 2000);
}

function buyUpgrade(kind) {
  if (kind === 'damage') {
    const cost = upgradeCost(10, state.damageUps);
    if (state.ash < cost) return;
    state.ash -= cost;
    state.damageUps += 1;
    state.damage += 1;
  } else {
    const cost = upgradeCost(15, state.hpUps);
    if (state.ash < cost) return;
    state.ash -= cost;
    state.hpUps += 1;
    state.maxHp += 5;
    heroHp += 5;
  }
  save();
  render();
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
  el.enemyProfile.textContent = enraged ? 'Wütend' : 'Boss';
  el.enemyProfile.classList.toggle('enraged-label', enraged);
  if (enraged) sfx.enrage();
}

function tick() {
  if (paused || !enemy) return;
  updateEnrage();
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

function render() {
  el.hubLevel.textContent = state.level;
  el.hubAsh.textContent = formatNum(state.ash);
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
  el.tileSkillsSub.textContent = state.skillPoints > 0 ? `${state.skillPoints} Punkte frei` : 'Wähle weise';
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
  renderSkillTree();
  el.modalHeroLevel.textContent = state.level;
  el.modalHeroXp.textContent = `${formatNum(state.xp)} / ${formatNum(xpNeeded(state.level))}`;
  el.modalHeroHp.textContent = formatNum(heroMaxHp());
  el.modalHeroDamage.textContent = formatNum(heroDamage());
  el.modalHeroArmor.textContent = formatNum(heroArmor());
  el.modalHeroCrit.textContent = `${heroCritChance()} %`;
  el.modalHeroCritDmg.textContent = `${Math.round(critMultiplier() * 100)} %`;
  el.modalHeroSpeed.textContent = `${heroAttackSpeed().toFixed(1).replace('.', ',')} / s`;
  el.modalHeroKills.textContent = formatNum(state.kills);
  el.heroHp.style.width = `${Math.max(0, heroHp / heroMaxHp()) * 100}%`;
  if (enemy) {
    el.enemyName.textContent = enemy.name;
    el.enemyHp.style.width = `${Math.max(0, enemy.hp / enemy.maxHp) * 100}%`;
  } else {
    el.enemyHp.style.width = '0%';
  }
  const dmgCost = upgradeCost(10, state.damageUps);
  const hpCost = upgradeCost(15, state.hpUps);
  el.costDamage.textContent = formatNum(dmgCost);
  el.costHp.textContent = formatNum(hpCost);
  el.upDamage.disabled = state.ash < dmgCost;
  el.upHp.disabled = state.ash < hpCost;
  renderGearIfDirty();
}

function save() {
  state.lastSeen = Date.now();
  rotateBackups();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function parseSave(raw) {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data.level !== 'number' || typeof data.ash !== 'number') return null;
    return data;
  } catch {
    return null;
  }
}

function migrateSave(data) {
  if (typeof data.saveVersion !== 'number') data.saveVersion = 1; // Spielstände vor 0.4.0
  if (data.saveVersion < 3) data.inField ??= true; // Spielstände vor 0.7.0: Held galt stets als im Feld
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

function loadSave() {
  for (const [attempt, key] of [SAVE_KEY, ...BACKUP_KEYS].entries()) {
    const data = parseSave(localStorage.getItem(key));
    if (!data) continue;
    Object.assign(state, migrateSave(data));
    for (const slot of GEAR_SLOTS) {
      normalizeItem(state.equipment[slot.key]);
    }
    state.inventory.forEach(normalizeItem);
    state.statPoints ??= 0;
    state.armorBase ??= 0;
    state.critBonus ??= 0;
    if (!Array.isArray(state.skills)) state.skills = ['start'];
    if (!state.skills.includes('start')) state.skills.unshift('start');
    state.skills = state.skills.filter((id) => SKILL_NODES_BY_ID[id]);
    state.skillPoints = Math.max(0, state.level - state.skills.length);
    state.zone ??= 0;
    state.cleared ??= 0;
    state.zoneKills ??= 0;
    state.crownWon ??= false;
    state.inField ??= false;
    state.seenContinents = Array.isArray(state.seenContinents)
      ? state.seenContinents.filter((key) => typeof key === 'string')
      : [];
    state.zone = Math.max(0, Math.min(Math.trunc(state.zone), MAX_ZONE));
    state.cleared = Math.max(0, Math.min(Math.trunc(state.cleared), MAX_ZONE));
    state.zone = Math.min(state.zone, state.cleared);
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
// das Live-Gefecht — Krit, Tempo, Gegnerprofile, erlittener Schaden, Kill-
// Regeneration. Stoppt am Boss (Bosse verlangen deine Anwesenheit) oder beim
// Tod. Rückgabe: 'time' | 'boss' | 'died'.
function simulateKills(seconds) {
  const speed = heroAttackSpeed();
  const critFactor = 1 + (Math.min(100, heroCritChance()) / 100) * (critMultiplier() - 1);
  const avgHit = heroDamage() * critFactor;
  let remaining = seconds;
  let guard = 0;
  while (remaining > 0 && guard < 200000) {
    guard += 1;
    if (state.cleared <= state.zone && state.zoneKills >= BOSS_AFTER_KILLS) return 'boss';
    const isElite = state.zoneKills > 0 && state.zoneKills % ELITE_EVERY_KILLS === 0;
    const def = scaledEnemy(isElite ? 'elite' : 'normal');
    const fightS = Math.max(1, Math.ceil(def.hp / avgHit)) * (ATTACK_INTERVAL_MS / 1000) / speed;
    const duration = fightS + ENEMY_RESPAWN_S;
    if (duration > remaining) return 'time';
    remaining -= duration;
    const swings = Math.max(0, Math.floor(fightS / (def.attackIntervalMs / 1000)) - 1);
    const reduction = heroArmor() / (heroArmor() + ARMOR_RESISTANCE * def.damage);
    const taken = Math.max(1, Math.round(def.damage * (1 - reduction)));
    if (swings * taken >= heroHp) return 'died';
    heroHp -= swings * taken;
    state.kills += 1;
    state.zoneKills += 1;
    state.ash += Math.round(def.ash * (1 + statBonus('ash') / 100));
    gainXp(def.xp);
    healFromKill();
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
  const result = simulateKills(capped / 1000);
  const ash = state.ash - ashBefore;
  const levels = state.level - levelBefore;
  const kills = state.kills - killsBefore;
  const levelsPart = levels > 0 ? `, +${levels} ${levels === 1 ? 'Stufe' : 'Stufen'}` : '';
  let summary = `Während du fort warst (${formatDuration(capped)}): ${kills} Kämpfe, +${formatNum(ash)} Asche${levelsPart}`;
  if (result === 'died') {
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

function idleTick() {
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
    if (state.kills === 0) showDismissibleOverlay('Dein Held kämpft nur im Feld. Am Schrein rastet und heilt er.', 4200);
    save();
  }
  showScreen(el.game);
  render();
  beginCombat();
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
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  heroHp = heroMaxHp();
  enemy = null;
  save();
  showScreen(el.hub);
  render();
}

function returnToMenu() {
  showScreen(el.menu);
}

function bindEvents() {
  el.upDamage.addEventListener('click', () => buyUpgrade('damage'));
  el.upHp.addEventListener('click', () => buyUpgrade('hp'));
  el.shrineButton.addEventListener('click', returnToHub);
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
    if (!input) return;
    settings[input.dataset.setting] = input.checked;
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
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  });
  el.exportButton.addEventListener('click', () => {
    exportSave()
      .then((ok) => flashButton(el.exportButton, ok ? 'Exportiert ✓' : 'Abgebrochen'))
      .catch(() => flashButton(el.exportButton, 'Fehlgeschlagen'));
  });
  el.importButton.addEventListener('click', importSave);
  document.getElementById('btn-options-back').addEventListener('click', () => {
    showScreen(optionsReturnScreen ?? el.hub);
  });
  el.tileHero.addEventListener('click', () => showScreen(el.sceneHero));
  el.tileSkills.addEventListener('click', () => showScreen(el.sceneSkills));
  el.tileMap.addEventListener('click', () => {
    resetZoneView();
    showScreen(el.sceneMap);
    renderZones();
  });
  el.tileCrafting.addEventListener('click', () => showScreen(el.sceneCrafting));
  el.tileChronik.addEventListener('click', () => {
    renderChronicle();
    showScreen(el.sceneChronik);
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
