import { SKILL_NODES, SKILL_EDGES, SKILL_NODES_BY_ID, SKILL_NODE_RADIUS, SKILL_EFFECT_LABELS, LAST_ZONE_INDEX, zoneDef, formatNum } from './data.js';

import { state } from './state.js';

import { t, lname } from './i18n.js';

import { el } from './dom.js';



function skillBonus(stat) {
  let total = 0;
  for (const id of state.skills) {
    const node = SKILL_NODES_BY_ID[id];
    if (!node) continue;
    for (const effect of node.effects) {
      if (effect.stat === stat) total += effect.value;
    }
  }
  return total;
}

// Pfad-Bindung: Maximal zwei der vier Farben erwachen gleichzeitig — sind zwei
// verteilt, versiegeln sich die übrigen. Start- und Brücken-Knoten zählen nicht
// als Farbe; ein Respec unter zwei Farben öffnet alles wieder.
const BRANCH_KEYS = [...new Set(SKILL_NODES.map((node) => node.branch))]
  .filter((branch) => branch !== 'start' && branch !== 'bruecke');

const BRANCH_LOCK_LIMIT = 2;

// Die harte Ertrags-Obergrenze: Zwei vollständige Pfade — mehr kann die
// Pfad-Bindung je verteilen, also stoppt der Punktezustrom hier (Brücken-
// Knoten sind optionaler Zusatz, kein Bestandteil der Obergrenze).
const MAX_SKILL_POINTS = (() => {
  const sizes = BRANCH_KEYS
    .map((key) => SKILL_NODES.filter((node) => node.branch === key).length)
    .sort((a, b) => b - a);
  return sizes[0] + sizes[1];
})();

function activeBranches() {
  const active = new Set();
  for (const id of state.skills) {
    const branch = SKILL_NODES_BY_ID[id]?.branch;
    if (BRANCH_KEYS.includes(branch)) active.add(branch);
  }
  return active;
}

function branchLocked(branch) {
  if (!BRANCH_KEYS.includes(branch)) return false;
  const active = activeBranches();
  return active.size >= BRANCH_LOCK_LIMIT && !active.has(branch);
}

function isSkillable(id) {
  const node = SKILL_NODES_BY_ID[id];
  if (!node || branchLocked(node.branch)) return false;
  return SKILL_EDGES.some(
    ([a, b]) => (a === id && state.skills.includes(b)) || (b === id && state.skills.includes(a))
  );
}

function skillPos(node) {
  const rad = (node.angle * Math.PI) / 180;
  return { x: Math.round(node.radius * Math.cos(rad)), y: Math.round(-node.radius * Math.sin(rad)) };
}

function buildSkillTree() {
  if (skillTreeBuilt) return;
  const ns = 'http://www.w3.org/2000/svg';
  for (const [from, to] of SKILL_EDGES) {
    const a = skillPos(SKILL_NODES_BY_ID[from]);
    const b = skillPos(SKILL_NODES_BY_ID[to]);
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', a.x);
    line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x);
    line.setAttribute('y2', b.y);
    line.dataset.from = from;
    line.dataset.to = to;
    const fromBranch = SKILL_NODES_BY_ID[from].branch;
    const toBranch = SKILL_NODES_BY_ID[to].branch;
    const edgeBranch = [fromBranch, toBranch].find((b) => b !== 'start' && b !== 'bruecke') ?? 'bruecke';
    line.classList.add('skill-edge', `edge-${edgeBranch}`);
    if (SKILL_NODES_BY_ID[to].type === 'keystone') line.classList.add('edge-keystone');
    el.skillTree.appendChild(line);
  }
  for (const node of SKILL_NODES) {
    const { x, y } = skillPos(node);
    const group = document.createElementNS(ns, 'g');
    group.classList.add('skill-node', `branch-${node.branch}`, `type-${node.type}`);
    group.dataset.id = node.id;
    group.setAttribute('aria-label', lname(node.name) || t('Rune'));
    group.setAttribute('role', 'button');
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', SKILL_NODE_RADIUS[node.type]);
    group.appendChild(circle);
    el.skillTree.appendChild(group);
  }
  skillTreeBuilt = true;
}

function renderSkillTree() {
  // Guard wie bei den anderen Szenen: Der Baum hat ~150 Knoten + ~200 Kanten —
  // die Class-Toggles laufen sonst bei JEDEM render() (auch bei jedem Schlag)
  // für eine verborgene Szene. Beim Öffnen rendert der Tile-Klick explizit.
  if (el.sceneSkills.hidden) return;
  for (const group of el.skillTree.querySelectorAll('.skill-node')) {
    const id = group.dataset.id;
    const allocated = state.skills.includes(id);
    const canSkill = !allocated && isSkillable(id);
    group.classList.toggle('allocated', allocated);
    group.classList.toggle('available', canSkill && state.skillPoints > 0);
    group.classList.toggle('locked', !allocated && !canSkill);
    group.classList.toggle('branch-locked', !allocated && branchLocked(SKILL_NODES_BY_ID[id]?.branch));
    // Tastatur: Nur wirklich freischaltbare Knoten sind Tab-Stops — so bleibt
    // die Tab-Reihenfolge kurz; Fokus zeigt den Tooltip, Enter/Leer skillt.
    group.setAttribute('tabindex', canSkill && state.skillPoints > 0 ? '0' : '-1');
  }
  for (const line of el.skillTree.querySelectorAll('.skill-edge')) {
    line.classList.toggle('active', state.skills.includes(line.dataset.from) && state.skills.includes(line.dataset.to));
  }
  const cost = respecCost();
  el.respecCost.textContent = formatNum(cost);
  el.respecButton.disabled = state.ash < cost || state.skills.length <= 1;
  el.respecButton.textContent = respecArmed
    ? t('Wirklich? Die Runen brechen.')
    : t('Runen neu schneiden · {n} Asche', { n: formatNum(cost) });
}

function attemptAllocate(id, hooks) {
  if (state.skills.includes(id)) return;
  if (state.skillPoints <= 0 || !isSkillable(id)) return;
  state.skills.push(id);
  state.skillPoints -= 1;
  hooks.after();
}

// Respec: Asche-Kosten skalieren mit Item-Level (bis zum Hauptspiel-Ende,
// wie die Werkstatt) und mit der Zahl der geskillten Runen.
export function respecCost() {
  const ilvl = zoneDef(Math.min(state.cleared, LAST_ZONE_INDEX)).ilvl;
  return Math.round(150 * (1 + 0.1 * ilvl) * (1 + 0.15 * (state.skills.length - 1)));
}

let respecArmed = false;

let respecArmTimer = null;

function attemptRespec(hooks) {
  if (state.skills.length <= 1) return;
  if (!respecArmed) {
    respecArmed = true;
    el.respecButton.classList.add('armed');
    respecArmTimer = setTimeout(() => {
      respecArmed = false;
      el.respecButton.classList.remove('armed');
      renderSkillTree();
    }, 4000);
    return;
  }
  clearTimeout(respecArmTimer);
  respecArmed = false;
  el.respecButton.classList.remove('armed');
  const cost = respecCost();
  if (state.ash < cost) {
    renderSkillTree();
    return;
  }
  state.ash -= cost;
  state.skillPoints += state.skills.length - 1;
  state.skills = ['start'];
  hooks.after();
}

function skillTooltipHtml(node) {
  const allocated = state.skills.includes(node.id);
  const effects = node.effects
    .map((effect) => `<div class="tt-stat">${SKILL_EFFECT_LABELS[effect.stat](effect.value)}</div>`)
    .join('');
  let status;
  if (allocated) status = t('Geskillt.');
  else if (branchLocked(node.branch)) status = t('Versiegelt — maximal zwei Pfade erwachen gleichzeitig.');
  else if (!isSkillable(node.id)) status = t('Benötigt einen benachbarten geskillten Punkt.');
  else if (state.skillPoints > 0) status = t('Klicken zum Freischalten.');
  else status = t('Keine Skillpunkte.');
  return `
    ${node.name ? `<div class="tt-name">${lname(node.name)}</div>` : ''}
    ${node.desc ? `<div class="tt-desc">${t(node.desc)}</div>` : ''}
    ${effects}
    <div class="tt-hint">${status}</div>`;
}

const SKILL_VIEW_START = 320;

const SKILL_VIEW_MIN = 180;

const SKILL_VIEW_MAX = 1440;

const SKILL_WORLD = 720;

let skillView = { x: -SKILL_VIEW_START, y: -SKILL_VIEW_START, w: SKILL_VIEW_START * 2 };

let skillDrag = null;
let skillTreeBuilt = false;

let suppressSkillClick = false;

function applySkillView() {
  el.skillTree.setAttribute('viewBox', `${skillView.x} ${skillView.y} ${skillView.w} ${skillView.w}`);
}

function clampSkillView() {
  skillView.x = Math.max(-SKILL_WORLD, Math.min(SKILL_WORLD - skillView.w, skillView.x));
  skillView.y = Math.max(-SKILL_WORLD, Math.min(SKILL_WORLD - skillView.w, skillView.y));
}

function dragClamp(value, w) {
  return Math.max(-SKILL_WORLD, Math.min(SKILL_WORLD - w, value));
}

export function bindSkillTreeEvents(hooks) {

  el.respecButton.addEventListener('click', () => attemptRespec(hooks));

  el.skillTree.addEventListener('click', (e) => {

    if (suppressSkillClick) {

      suppressSkillClick = false;

      return;

    }

    const group = e.target.closest('.skill-node');

    if (group) attemptAllocate(group.dataset.id, hooks);

  });

  // Tooltip-Aufbau + Positionierung — geteilt zwischen Maus (Cursor-Anker)
  // und Tastatur (Knoten-Anker über getBoundingClientRect, pan/zoom-fest).
  const showSkillTooltip = (group, anchor) => {
    const tooltip = el.skillTooltip;
    tooltip.innerHTML = skillTooltipHtml(SKILL_NODES_BY_ID[group.dataset.id]);
    tooltip.hidden = false;
    const wrapRect = el.skillTreeWrap.getBoundingClientRect();
    const left = Math.min(anchor.left - wrapRect.left + (anchor.width ?? 0) / 2 + 14, wrapRect.width - tooltip.offsetWidth - 4);
    const top = Math.min(anchor.top - wrapRect.top + 14, wrapRect.height - tooltip.offsetHeight - 4);
    tooltip.style.left = `${Math.max(0, left)}px`;
    tooltip.style.top = `${Math.max(0, top)}px`;
  };
  const nodeAnchor = (group) => group.querySelector('circle').getBoundingClientRect();

  el.skillTree.addEventListener('mousemove', (e) => {

    if (skillDrag) {

      el.skillTooltip.hidden = true;

      return;

    }

    const group = e.target.closest('.skill-node');

    if (!group) {

      el.skillTooltip.hidden = true;

      return;

    }

    showSkillTooltip(group, { left: e.clientX, top: e.clientY, width: 0 });

  });

  el.skillTree.addEventListener('focusin', (e) => {
    const group = e.target.closest('.skill-node');
    if (group) showSkillTooltip(group, nodeAnchor(group));
  });

  el.skillTree.addEventListener('focusout', () => {
    el.skillTooltip.hidden = true;
  });

  el.skillTree.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const group = e.target.closest('.skill-node');
    if (!group) return;
    e.preventDefault();
    attemptAllocate(group.dataset.id, hooks);
  });

  el.skillTree.addEventListener('mouseleave', () => {

    el.skillTooltip.hidden = true;

  });

  el.skillTree.addEventListener('wheel', (e) => {

    e.preventDefault();

    const factor = e.deltaY > 0 ? 1.18 : 1 / 1.18;

    const rect = el.skillTree.getBoundingClientRect();

    const fx = (e.clientX - rect.left) / rect.width;

    const fy = (e.clientY - rect.top) / rect.height;

    const worldX = skillView.x + fx * skillView.w;

    const worldY = skillView.y + fy * skillView.w;

    const newW = Math.max(SKILL_VIEW_MIN, Math.min(SKILL_VIEW_MAX, skillView.w * factor));

    skillView.x = worldX - fx * newW;

    skillView.y = worldY - fy * newW;

    skillView.w = newW;

    clampSkillView();

    applySkillView();

    el.skillTooltip.hidden = true;

  }, { passive: false });

  el.skillTree.addEventListener('pointerdown', (e) => {

    if (e.target.closest('.skill-node')) return;

    skillDrag = { px: e.clientX, py: e.clientY, viewX: skillView.x, viewY: skillView.y, moved: false };

    el.skillTree.setPointerCapture(e.pointerId);

    el.skillTree.classList.add('dragging');

  });

  el.skillTree.addEventListener('pointermove', (e) => {

    if (!skillDrag) return;

    const rect = el.skillTree.getBoundingClientRect();

    const dx = ((e.clientX - skillDrag.px) / rect.width) * skillView.w;

    const dy = ((e.clientY - skillDrag.py) / rect.height) * skillView.w;

    if (Math.abs(e.clientX - skillDrag.px) + Math.abs(e.clientY - skillDrag.py) > 5) skillDrag.moved = true;

    skillView.x = dragClamp(skillDrag.viewX - dx, skillView.w);

    skillView.y = dragClamp(skillDrag.viewY - dy, skillView.w);

    applySkillView();

    el.skillTooltip.hidden = true;

  });

  el.skillTree.addEventListener('pointerup', () => {

    suppressSkillClick = skillDrag?.moved ?? false;

    skillDrag = null;

    el.skillTree.classList.remove('dragging');

  });

  el.skillTree.addEventListener('dblclick', (e) => {

    if (e.target.closest('.skill-node')) return;

    skillView = { x: -SKILL_VIEW_START, y: -SKILL_VIEW_START, w: SKILL_VIEW_START * 2 };

    clampSkillView();

    applySkillView();

  });

}



// Sprachwechsel: Die im Baum einmal gebauten Aria-Label tragen den Knoten-
// Namen — hier nachziehen, ohne den Baum neu zu bauen.
function refreshSkillLabels() {
  for (const group of el.skillTree.querySelectorAll('.skill-node')) {
    const node = SKILL_NODES_BY_ID[group.dataset.id];
    if (node) group.setAttribute('aria-label', lname(node.name) || t('Rune'));
  }
}

export { skillBonus, MAX_SKILL_POINTS, buildSkillTree, renderSkillTree, attemptAllocate, applySkillView, refreshSkillLabels };
