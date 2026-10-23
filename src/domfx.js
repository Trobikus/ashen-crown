// DOM-Schreib-Helfer und Kampf-Effekte: differenzielle Schreibvorgänge,
// kurzlebige Animations-Klassen, der Effekt-Deckel und die treibenden
// Partikel der Arena. Reines Anzeige-Handwerk — kein Spielzustand.
import { state, settings } from './state.js';
import { el } from './dom.js';
import { t } from './i18n.js';
import { continentKeyOf, CONTINENTS, formatNum } from './data.js';

function flash(figure) {
  if (!settings.hitFlash) return;
  figure.classList.add('hit');
  setTimeout(() => figure.classList.remove('hit'), 150);
}

// Kurzlebige Animations-Klasse: entfernen, wieder anheften, nach ms abräumen.
// Der Reflow-Neustart (offsetWidth) ist nur fällig, wenn die Keyframes noch
// liefen — der Normalfall (Klasse längst abgelaufen) startet die Animation
// durch das erneute Anheften von allein, ohne erzwungenes Layout.
function pulseClass(element, cls, ms = 260) {
  const liefNoch = element.classList.contains(cls);
  element.classList.remove(cls);
  if (liefNoch) void element.offsetWidth;
  element.classList.add(cls);
  clearTimeout(element.__pulseTimer);
  element.__pulseTimer = setTimeout(() => element.classList.remove(cls), ms);
}

// Differenzielle Schreibvorgänge: Identische Werte nicht erneut in den DOM
// schreiben — der 3-Sekunden-Tick und jeder Schlag melden sonst dieselben
// Zahlen als DOM-Mutation, obwohl sich nichts geändert hat. render() läuft
// mehrmals pro Sekunde; die Meßlatte sind DOM-Mutationen, nicht CPU.
function setText(node, value) {
  if (node.textContent !== value) node.textContent = value;
}

function setWidth(node, pct) {
  const width = `${pct}%`;
  if (node.style.width !== width) node.style.width = width;
}

function setHidden(node, value) {
  if (node.hidden !== value) node.hidden = value;
}

// HP-Leiste mit Geist-Nachlauf: Die helle Schicht hält kurz die alte Höhe,
// während die Füllung schon fällt — jeder Treffer ist ablesbar, statt in
// der Breite zu verschwinden. Bei Heilung springt der Geist ohne Verzögerung.
// Schreibungen werden geglättet: gleiche Breite = keine DOM-Mutation.
function setHpBar(fill, ghost, pct) {
  const clamped = Math.max(0, Math.min(100, pct));
  const width = `${clamped}%`;
  if (ghost) {
    const previous = parseFloat(fill.style.width);
    ghost.classList.toggle('healing', !(previous <= clamped));
    if (ghost.style.width !== width) ghost.style.width = width;
  }
  if (fill.style.width !== width) fill.style.width = width;
}

// Effekt-Knoten (Funken, Hieb, Zahlen): Über einem Deckel keine neuen mehr —
// schützt Häufungs-Szenarien (schnelle Kritketten an zähen Gegnern), ohne
// dass die Arena optisch kippt; sie wäre dann ohnehin unlesbar.
const MAX_EFFEKTE_PRO_KÄMPFER = 14;

function effekteVoll(fighter) {
  return (fighter.__effektKnoten ?? 0) >= MAX_EFFEKTE_PRO_KÄMPFER;
}

function effektAnhängen(fighter, knoten, ms) {
  fighter.appendChild(knoten);
  fighter.__effektKnoten = (fighter.__effektKnoten ?? 0) + 1;
  setTimeout(() => {
    knoten.remove();
    fighter.__effektKnoten -= 1;
  }, ms);
}

function spawnDamageFloat(fighter, amount, isCrit = false) {
  if (!settings.damageNumbers || effekteVoll(fighter)) return;
  const span = document.createElement('span');
  span.className = isCrit ? 'dmg-float crit' : 'dmg-float';
  span.textContent = formatNum(amount);
  span.style.left = `${35 + Math.random() * 30}%`;
  effektAnhängen(fighter, span, 900);
}

function spawnHealFloat(fighter, amount) {
  if (!settings.damageNumbers || effekteVoll(fighter)) return;
  const span = document.createElement('span');
  span.className = 'dmg-float heal';
  span.textContent = `+${formatNum(amount)}`;
  span.style.left = `${35 + Math.random() * 30}%`;
  effektAnhängen(fighter, span, 900);
}

function spawnMissFloat(fighter) {
  if (!settings.damageNumbers || effekteVoll(fighter)) return;
  const span = document.createElement('span');
  span.className = 'dmg-float miss';
  span.textContent = t('Verfehlt');
  span.style.left = `${30 + Math.random() * 40}%`;
  effektAnhängen(fighter, span, 900);
}

// Hieb-Bogen: Ein heller Bogen schwingt in Angriffsrichtung — der Schlag
// bekommt eine sichtbare Bahn, nicht nur den Lunge-Schwung des Körpers.
function spawnSlash(fighter, direction) {
  if (!settings.hitFlash || effekteVoll(fighter)) return;
  const span = document.createElement('span');
  span.className = 'slash';
  span.style.setProperty('--slash-rot', `${direction * 38}deg`);
  span.style.setProperty('--slash-sweep', `${direction * 64}deg`);
  effektAnhängen(fighter, span, 240);
}

// Funken-Burst am Trefferpunkt: kurze Partikel-Explosion aus Asche und
// Glut; der Krit setzt einen goldenen Ring darüber. Gekoppelt an die
// bestehende Treffer-Effekt-Option (Aufblitzen), kein neuer Schalter.
function spawnImpact(fighter, kind = 'hit') {
  if (!settings.hitFlash || effekteVoll(fighter)) return;
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
  effektAnhängen(fighter, burst, 560);
  if (kind === 'crit') {
    const ring = document.createElement('span');
    ring.className = 'crit-ring';
    ring.style.left = burst.style.left;
    ring.style.top = burst.style.top;
    effektAnhängen(fighter, ring, 450);
  }
}

// Button-Kurzbestätigung: Text für zwei Sekunden tauschen, gesperrt halten.
function flashButton(button, text) {
  const original = button.textContent;
  button.textContent = text;
  button.disabled = true;
  setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, 2000);
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

const CONTINENT_FIGURE_CLASSES = ['cont-aschenlande', 'cont-frostreich', 'cont-faulmoor', 'cont-blutmark', 'cont-sternenleere', 'cont-tiefen'];

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

export {
  flash, pulseClass, setText, setWidth, setHidden, setHpBar,
  spawnDamageFloat, spawnHealFloat, spawnMissFloat, spawnSlash, spawnImpact,
  flashButton, refreshArenaParticles, CONTINENT_FIGURE_CLASSES,
};
