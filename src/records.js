// Die Aufzeichnungen: Errungenschaften (inkl. Ruhm-Laden), das Bestiarium
// und die Statistik — die Gedächtnis-Ansichten des Laufs. Die Statistik lebt
// dabei als eigener Reiter in den Optionen. Sie lesen nur aus dem
// Spielstand; gekauft wird über den Ruhm-Laden, gerendert wird je Ansicht nur
// bei Sichtbarkeit (render() streift sie im 3-Sekunden-Tick).
import { state } from './state.js';
import { MAIN_ZONE_COUNT, RARITIES, ZONE_ENEMIES, ZONES, DEPTH_ENEMY_NAMES, CONTINENTS, continentKeyOf, zoneDef, formatNum, formatDuration } from './data.js';
import { ACHIEVEMENTS, ruhmAvailable, ruhmEarned, RUHM_SHOP } from './achievements.js';
import { el } from './dom.js';
import { sfx } from './audio.js';
import { toast } from './feedback.js';
import { spriteSvgFor } from './sprites.js';
import { save } from './saveio.js';
import { use } from './bus.js';

// Die Statistik: Spielzeit, Tode, Beute je Seltenheit — die Zähler aus dem
// Spielstand bekommen ihr Gesicht. Rendert nur, wenn die Optionen offen sind
// und ihr Reiter sichtbar ist.
function renderStats() {
  if (!el.sceneOptions || el.sceneOptions.hidden || el.sceneStats.hidden) return;
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
  use('render')();
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

export { renderStats, renderBestiary, renderAchievements, buyRuhmUpgrade };
