import { el, cacheDom } from './dom.js';

import { state, settings, SAVE_KEY } from './state.js';

import { loadSettings, saveSettings, applySettings } from './settings.js';

import { TICK_MS, ATTACK_INTERVAL_MS, STATS_SYNC_INTERVAL_MS, ENEMY_RESPAWN_S, BOSS_AFTER_KILLS, ELITE_EVERY_KILLS, OFFLINE_CAP_MS, OFFLINE_MIN_GAP_MS, INVENTORY_CAP, ZONES, GEAR_SLOTS, SKILL_NODES_BY_ID, ARMOR_RESISTANCE, xpNeeded, upgradeCost, zoneOf, normalizeItem } from './data.js';

import { scaledEnemy, statBonus, heroDamage, heroMaxHp, heroArmor, heroCritChance, heroAttackSpeed, critMultiplier } from './stats.js';

import { buildSkillTree, renderSkillTree, bindSkillTreeEvents, applySkillView } from './skilltree.js';

import { buildZoneList, renderZones } from './zones.js';

import { buildCraftSlots, renderCrafting, bindCraftEvents } from './crafting.js';

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

let hooks = { after: () => {}, clampHp: () => {}, save: () => {}, render: () => {} };

function showOverlay(text) {
  document.getElementById('overlay-text').textContent = text;
  document.getElementById('overlay').classList.add('show');
  overlayDismissible = false;
}

function showDismissibleOverlay(text, duration) {
  showOverlay(text);
  overlayDismissible = true;
  sceneTimer = setTimeout(() => {
    sceneTimer = null;
    hideOverlay();
  }, duration);
}

function dismissOverlay() {
  if (!overlayDismissible) return;
  overlayDismissible = false;
  if (sceneTimer) {
    clearTimeout(sceneTimer);
    sceneTimer = null;
  }
  hideOverlay();
}

function hideOverlay() {
  document.getElementById('overlay').classList.remove('show');
}

function showScreen(target) {
  if (target !== el.sceneHero) exitSellMode();
  for (const screen of [el.menu, el.hub, el.sceneHero, el.sceneSkills, el.sceneOptions, el.sceneMap, el.sceneCrafting, el.game]) {
    screen.hidden = screen !== target;
  }
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
  enemy = { type, name: def.name, hp: def.hp, maxHp: def.hp, damage: def.damage };
  el.enemyFigure.classList.toggle('boss', !!def.boss);
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

function killEnemy() {
  const def = scaledEnemy(enemy.type);
  state.kills += 1;
  state.zoneKills += 1;
  state.ash += Math.round(def.ash * (1 + statBonus('ash') / 100));
  gainXp(def.xp);
  rollDrop(enemy.type);
  if (def.boss) {
    state.cleared = Math.max(state.cleared, state.zone + 1);
    if (state.zone + 1 < ZONES.length) {
      showDismissibleOverlay(`${def.name} bezwungen — ${ZONES[state.zone + 1].name} ist jetzt offen.`, 4200);
    } else {
      showDismissibleOverlay(`${def.name} bezwungen — ${ZONES[state.zone].name} ist erreicht.`, 4200);
    }
  }
  enemy = null;
  save();
  setTimeout(spawnEnemy, 600);
  render();
}

function heroAttack() {
  let damage = heroDamage();
  const isCrit = Math.random() * 100 < heroCritChance();
  if (isCrit) damage = Math.round(damage * critMultiplier());
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

function die() {
  heroHp = 0;
  paused = true;
  showOverlay('Die Asche nimmt dich zurück.');
  render();
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

function tick() {
  if (paused || !enemy) return;
  heroAttackProgress += TICK_MS * heroAttackSpeed();
  enemyAttackProgress += TICK_MS;
  if (heroAttackProgress >= ATTACK_INTERVAL_MS) {
    heroAttackProgress = 0;
    heroAttack();
  }
  if (!paused && enemy && enemyAttackProgress >= ATTACK_INTERVAL_MS) {
    enemyAttackProgress = 0;
    enemyAttack();
  }
}

function render() {
  el.hubLevel.textContent = state.level;
  el.hubAsh.textContent = state.ash;
  el.hudLevel.textContent = state.level;
  el.hudAsh.textContent = state.ash;
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
  el.hudZone.textContent = zoneOf(state.zone).name;
  el.tileMapSub.textContent = `${Math.min(state.cleared + 1, ZONES.length)} von ${ZONES.length} Gebieten offen`;
  renderZones();
  renderCrafting();
  el.doorButton.hidden = !(state.zone + 1 <= Math.min(state.cleared, ZONES.length - 1));
  renderSkillTree();
  el.modalHeroLevel.textContent = state.level;
  el.modalHeroXp.textContent = `${state.xp} / ${xpNeeded(state.level)}`;
  el.modalHeroHp.textContent = heroMaxHp();
  el.modalHeroDamage.textContent = heroDamage();
  el.modalHeroArmor.textContent = heroArmor();
  el.modalHeroCrit.textContent = `${heroCritChance()} %`;
  el.modalHeroCritDmg.textContent = `${Math.round(critMultiplier() * 100)} %`;
  el.modalHeroSpeed.textContent = `${heroAttackSpeed().toFixed(1).replace('.', ',')} / s`;
  el.modalHeroKills.textContent = state.kills;
  el.heroHp.style.width = `${Math.max(0, heroHp / heroMaxHp()) * 100}%`;
  if (enemy) {
    el.enemyName.textContent = enemy.name;
    el.enemyHp.style.width = `${Math.max(0, enemy.hp / enemy.maxHp) * 100}%`;
  } else {
    el.enemyHp.style.width = '0%';
  }
  const dmgCost = upgradeCost(10, state.damageUps);
  const hpCost = upgradeCost(15, state.hpUps);
  el.costDamage.textContent = dmgCost;
  el.costHp.textContent = hpCost;
  el.upDamage.disabled = state.ash < dmgCost;
  el.upHp.disabled = state.ash < hpCost;
  renderGearIfDirty();
}

function save() {
  state.lastSeen = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    Object.assign(state, JSON.parse(raw));
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
    state.zone = Math.max(0, Math.min(Math.trunc(state.zone), ZONES.length - 1));
    state.cleared = Math.max(0, Math.min(Math.trunc(state.cleared), ZONES.length - 1));
    state.zone = Math.min(state.zone, state.cleared);
    return true;
  } catch {
    return false;
  }
}

function formatDuration(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function simulateKills(seconds) {
  let remaining = seconds;
  let guard = 0;
  while (remaining > 0 && guard < 1000000) {
    guard += 1;
    const isElite = state.zoneKills > 0 && state.zoneKills % ELITE_EVERY_KILLS === 0;
    const def = scaledEnemy(isElite ? 'elite' : 'normal');
    const hits = Math.max(1, Math.ceil(def.hp / heroDamage()));
    const duration = hits * (ATTACK_INTERVAL_MS / 1000) + ENEMY_RESPAWN_S;
    if (duration > remaining) break;
    remaining -= duration;
    state.kills += 1;
    state.zoneKills += 1;
    state.ash += Math.round(def.ash * (1 + statBonus('ash') / 100));
    gainXp(def.xp);
    rollDrop(isElite ? 'elite' : 'normal');
  }
}

function applyOfflineProgress() {
  if (!settings.offlineProgress) return;
  const elapsed = Date.now() - (state.lastSeen || Date.now());
  if (elapsed < OFFLINE_MIN_GAP_MS) return;
  const capped = Math.min(elapsed, OFFLINE_CAP_MS);
  const ashBefore = state.ash;
  const levelBefore = state.level;
  const killsBefore = state.kills;
  simulateKills(capped / 1000);
  const ash = state.ash - ashBefore;
  const levels = state.level - levelBefore;
  const kills = state.kills - killsBefore;
  if (kills <= 0) return;
  const levelsPart = levels > 0 ? `, +${levels} ${levels === 1 ? 'Stufe' : 'Stufen'}` : '';
  offlineSummary = `Während du fort warst (${formatDuration(capped)}): ${kills} Kämpfe, +${ash} Asche${levelsPart}.`;
  save();
}

function idleTick() {
  if (el.game.hidden === false) {
    render();
    return;
  }
  simulateKills(STATS_SYNC_INTERVAL_MS / 1000);
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
  showScreen(el.game);
  heroHp = heroMaxHp();
  render();
  beginCombat();
}

function enterZone(index) {
  if (index < 0 || index >= ZONES.length || index > state.cleared) return;
  state.zone = index;
  state.zoneKills = 0;
  save();
}

function returnToHub() {
  if (sceneTimer) {
    clearTimeout(sceneTimer);
    sceneTimer = null;
    hideOverlay();
  }
  paused = true;
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
    if (state.zone + 1 >= ZONES.length || state.zone + 1 > state.cleared) return;
    enterZone(state.zone + 1);
    enemy = null;
    heroAttackProgress = 0;
    enemyAttackProgress = 0;
    heroHp = heroMaxHp();
    spawnEnemy();
    render();
  });
  el.hubMenu.addEventListener('click', returnToMenu);
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
  document.getElementById('btn-options-back').addEventListener('click', () => {
    showScreen(optionsReturnScreen ?? el.hub);
  });
  el.tileHero.addEventListener('click', () => showScreen(el.sceneHero));
  el.tileSkills.addEventListener('click', () => showScreen(el.sceneSkills));
  el.tileMap.addEventListener('click', () => showScreen(el.sceneMap));
  el.tileCrafting.addEventListener('click', () => showScreen(el.sceneCrafting));
  bindCraftEvents(hooks);
  el.zoneList.addEventListener('click', (e) => {
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
  if (hasSave) applyOfflineProgress();
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
      showDismissibleOverlay('Du erwachst in Asche. Die Krone ruft.', 2600);
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
