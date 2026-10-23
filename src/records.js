// Die Aufzeichnungen: Errungenschaften (inkl. Ruhm-Laden), das Bestiarium
// und die Statistik — die Gedächtnis-Ansichten des Laufs. Die Statistik lebt
// dabei als eigener Reiter in den Optionen. Sie lesen nur aus dem
// Spielstand; gekauft wird über den Ruhm-Laden, gerendert wird je Ansicht nur
// bei Sichtbarkeit (render() streift sie im 3-Sekunden-Tick).
import { state } from './state.js';
import { MAIN_ZONE_COUNT, RARITIES, ZONE_ENEMIES, ZONES, DEPTH_ENEMY_NAMES, CONTINENTS, continentKeyOf, zoneDef, formatNum, formatDuration } from './data.js';
import { ACHIEVEMENTS, ruhmAvailable, ruhmEarned, RUHM_SHOP } from './achievements.js';
import { t, lname } from './i18n.js';
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
  el.statsCleared.textContent = t('{a} von {b}', { a: Math.min(state.cleared, MAIN_ZONE_COUNT), b: MAIN_ZONE_COUNT });
  el.statsDepth.textContent = state.cleared > 0 ? lname(zoneDef(state.cleared - 1).name) : '—';
  el.statsAsh.textContent = formatNum(state.ash);
  el.statsDrops.replaceChildren();
  for (const rarity of RARITIES) {
    const row = document.createElement('div');
    const label = document.createElement('dt');
    label.textContent = t(rarity.label);
    label.style.color = rarity.color;
    const value = document.createElement('dd');
    value.textContent = formatNum(state.drops[rarity.key] ?? 0);
    row.append(label, value);
    el.statsDrops.appendChild(row);
  }
}

// Der Ruhm-Laden: Beutelschein und Zollerlass, gestaffelt, permanent —
// eigener Reiter neben der Errungenschaften-Liste.
function renderRuhmShop() {
  if (!el.sceneAchievements || el.sceneAchievements.hidden || el.ruhmPage.hidden) return;
  el.ruhmShop.replaceChildren();
  const head = document.createElement('h3');
  head.textContent = t('Ruhm-Laden');
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
    who.textContent = maxed
      ? t('{name} — vollständig', { name: t(def.name) })
      : t('{name} · Stufe {a}/{b}', { name: t(def.name), a: level + 1, b: def.levels.length });
    const text = document.createElement('div');
    text.className = 'chronicle-text';
    text.textContent = t(def.desc) + (level > 0 ? t(' (Aktuell: Stufe {n})', { n: level }) : '');
    const buy = document.createElement('button');
    buy.className = 'btn-small';
    buy.dataset.buy = kind;
    if (maxed) {
      buy.textContent = t('Ausgeschöpft');
      buy.disabled = true;
    } else {
      buy.textContent = t('Kaufen · {n} Ruhm', { n: cost });
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
  toast(t('{name} erworben — Stufe {n}.', { name: t(def.name), n: level + 1 }), '#c1663a');
  sfx.unlock();
  save();
  renderRuhmShop();
  use('render')();
}

// Das Bestiarium: 150 Kreaturen der fünf Kontinente plus die Namen der
// Tiefen — erlegt zählt, unerlegt bleibt als „???" versiegelt.
function renderBestiary() {
  if (!el.sceneBestiary || el.sceneBestiary.hidden) return;
  const killsOf = (name) => state.bestiary[name] ?? 0;
  const types = [['normal', 'Normal'], ['elite', 'Elite'], ['boss', 'Boss']];
  let known = 0;
  el.bestiarySummary.textContent = t('Erlege Kreaturen, um ihre Einträge zu entschleiern.');
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
    who.textContent = (kills > 0 ? '' : '??? ') + lname(name) + (kind === 'boss' ? ` — ${t('Boss')}` : kind === 'elite' ? ` — ${t('Elite')}` : '');
    if (kind === 'boss') who.style.color = '#c1663a';
    const text = document.createElement('div');
    text.className = 'chronicle-text';
    text.textContent = kills > 0 ? t('{zone} · {n} erlegt', { zone: zoneName, n: formatNum(kills) }) : t('{zone} · Noch nie erlegt.', { zone: zoneName });
    body.append(who, text);
    row.append(icon, body);
    el.bestiaryList.appendChild(row);
  };
  for (const [ci, continent] of CONTINENTS.entries()) {
    const head = document.createElement('h3');
    head.textContent = lname(continent.name);
    el.bestiaryList.appendChild(head);
    const key = continentKeyOf(ci * 10);
    for (let z = ci * 10; z < ci * 10 + 10; z += 1) {
      for (const [kind] of types) {
        entry(ZONE_ENEMIES[z][kind].name, kind, lname(ZONES[z].name), key);
      }
    }
  }
  const head = document.createElement('h3');
  head.textContent = lname('Die Tiefen');
  el.bestiaryList.appendChild(head);
  for (const [kind, label] of types) {
    const labelMap = { normal: 'Normal', elite: 'Elite', boss: 'Boss' };
    for (const name of DEPTH_ENEMY_NAMES[kind]) {
      entry(name, kind, `${t('Aschentiefe')} · ${t(labelMap[kind])}`, 'tiefen');
    }
  }
  el.bestiarySummary.textContent = t('{known} von {total} Kreaturen erlegt.', {
    known,
    total: ZONE_ENEMIES.length * 3 + DEPTH_ENEMY_NAMES.normal.length + DEPTH_ENEMY_NAMES.elite.length + DEPTH_ENEMY_NAMES.boss.length,
  });
}

// Errungenschaften: Gesperrte Einträge zeigen ihren Fortschritt, errungene
// leuchten in Kronenfarbe. Die Zusammenfassung bleibt über beiden Reitern
// sichtbar; die Liste rendert nur auf ihrem Reiter, der Ruhm-Laden auf
// seinem (jeder Guard schützt einen Tick-Durchlauf).
function renderAchievements() {
  if (!el.sceneAchievements || el.sceneAchievements.hidden) return;
  const earned = new Set(state.achievements);
  const pendingIds = state.achievementsPending ?? [];
  const pendingSet = new Set(pendingIds);
  el.achievementsSummary.textContent = t('{earned} von {total} errungen', { earned: earned.size, total: ACHIEVEMENTS.length })
    + (pendingIds.length ? t(' · {n} bereit zum Abholen', { n: pendingIds.length }) : '')
    + t(' · Ruhm: {a} verfügbar ({b} verdient)', { a: formatNum(ruhmAvailable(state)), b: formatNum(ruhmEarned(state)) });
  if (el.achievementsPage.hidden) return;
  el.achievementsList.replaceChildren();
  for (const achievement of ACHIEVEMENTS) {
    const done = earned.has(achievement.id);
    const ready = pendingSet.has(achievement.id);
    const row = document.createElement('div');
    row.className = 'chronicle-entry'
      + (done ? '' : ready ? ' chronicle-entry-ready' : ' entry-locked');
    const who = document.createElement('div');
    who.className = 'chronicle-who';
    who.textContent = (done || ready ? '◆ ' : '◇ ') + t(achievement.name);
    who.style.color = done || ready ? '#c1663a' : '';
    const text = document.createElement('div');
    text.className = 'chronicle-text';
    let line = t(achievement.desc);
    if (achievement.progress) {
      const [cur, target] = achievement.progress(state);
      line += achievement.format === 'zeit'
        ? ` (${formatDuration(cur)} / ${formatDuration(target)})`
        : ` (${formatNum(cur)} / ${formatNum(target)})`;
    }
    text.textContent = done ? t('{line} — errungen.', { line }) : ready ? t('{line} — bereit.', { line }) : line;
    if (ready) {
      const claim = document.createElement('button');
      claim.className = 'btn-small';
      claim.dataset.claim = achievement.id;
      claim.textContent = t('Abholen · +{n} Ruhm', { n: formatNum(achievement.ruhm) });
      row.append(who, text, claim);
    } else {
      row.append(who, text);
    }
    el.achievementsList.appendChild(row);
  }
}

export { renderStats, renderBestiary, renderAchievements, renderRuhmShop, buyRuhmUpgrade };
