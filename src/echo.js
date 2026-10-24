// Der Asche-Nachhall: Was vom endenden Lauf bleibt, wenn „Erneut erwachen"
// ihn zurücksetzt. Die Asche formt aus dem alten Ich ein Abbild — Name,
// Stufe, Tempo und die Klinge samt ihrem Gedächtnis — und stellt es in der
// Grenzzone des alten Laufs auf. Dort manifestiert es sich mitten im Gebiet
// und verteidigt die Zone, bis der neue Lauf es bricht.
//
// Reines Rechen-Modul wie prestige.js: Der Spielstand kommt als Parameter,
// kein eigener Zustand. Kampfwerte bewusst ZONEN-bezogen (80 % der Boss-Werte
// der Grenzzone) statt Snapshot-bezogen: Wer die Zone erneut durchsteigt,
// kann auch ihren Nachhall brechen — selbst-balancierend über den Lauf
// hinweg, ohne eigene Balance-Kurve. Der Snapshot liefert Identität (Name,
// Stufe, Tempo, Klinge), nicht die Zahlen.
import { ATTACK_INTERVAL_MS, BOSS_AFTER_KILLS, MAX_ZONE, enemyDef, sanitizeMemory } from './data.js';

// Manifestation: Ab diesem Sieg-Zähler in der Grenzzone steigt der Nachhall.
export const ECHO_MANIFEST_KILLS = 8;

// Kampfwert-Faktoren auf den BOSS der Grenzzone (bosse kämpfen standardisiert,
// siehe ENEMY_PROFILES) — hart genug für einen Duell-Moment, fair für jeden,
// der die Zone bezwingen kann.
export const ECHO_BOSS_HP_FACTOR = 0.8;

export const ECHO_BOSS_DAMAGE_FACTOR = 0.8;

// Das Angriffstempo des alten Ichs (Schläge/s), geklemmt auf ein menschlich
// lesbares Band um das Standard-Boss-Intervall — Zeitraffungs-Builds aus
// tiefen Läufen dürfen nicht unschlagbar schnell zuschlagen.
export const ECHO_INTERVAL_MIN_MS = 1100;

export const ECHO_INTERVAL_MAX_MS = 1900;

// Snapshot beim Erwachen: zone = die tiefste eroberTE Zone des endenden
// Laufs (cleared − 1) — der Ort, an dem das alte Ich stand. Die Waffe wird
// als Basis-Name + Gedächtnis-Kopie mitgenommen (die Werte würfelt das
// Nachhallrelikt auf der Zonen-Stufe neu).
export function buildEchoSnapshot(s, { attackSpeed }) {
  const weapon = s.equipment?.waffe ?? null;
  const cleared = Number.isFinite(s.cleared) ? Math.trunc(s.cleared) : 1;
  return {
    zone: Math.max(0, Math.min(MAX_ZONE, cleared - 1)),
    name: String(s.heroName ?? '').trim().slice(0, 24) || 'Held',
    level: Math.max(1, Math.trunc(Number.isFinite(s.level) ? s.level : 1)),
    kills: Math.max(0, Math.trunc(Number.isFinite(s.kills) ? s.kills : 0)),
    speed: Number.isFinite(attackSpeed) && attackSpeed > 0 ? attackSpeed : 1,
    weaponBase: typeof weapon?.base === 'string' && weapon.base ? weapon.base : null,
    weaponMemory: weapon?.memory ? sanitizeMemory({ ...weapon.memory }) : null,
    defeated: false,
  };
}

// Kampfwerte des Nachhalls in seiner Zone: 80 % des Zonen-Bosses, Tempo aus
// dem alten Lauf (geklammert), Stufe nur für die Anzeige.
export function echoEnemy(echo, zoneIndex) {
  const boss = enemyDef(zoneIndex).boss;
  const raw = Math.round(ATTACK_INTERVAL_MS / Math.max(0.5, echo.speed || 1));
  return {
    hp: Math.max(1, Math.round(boss.hp * ECHO_BOSS_HP_FACTOR)),
    damage: Math.max(1, Math.round(boss.damage * ECHO_BOSS_DAMAGE_FACTOR)),
    attackIntervalMs: Math.max(ECHO_INTERVAL_MIN_MS, Math.min(ECHO_INTERVAL_MAX_MS, raw)),
  };
}

// Manifestations-Bedingung im Spawn-Pfad: Der Nachhall lebt, steht in seiner
// Zone, der Sieg-Zähler hat die Schwelle erreicht — und die Boss-Wand hat
// Vorrang, sobald der Zonen-Boss dran ist (Offline-Ausweichfälle).
export function echoManifests(s) {
  const echo = s.echo;
  if (!echo || echo.defeated) return false;
  if (s.zone !== echo.zone) return false;
  if ((s.zoneKills ?? 0) < ECHO_MANIFEST_KILLS) return false;
  if (s.cleared <= s.zone && s.zoneKills >= BOSS_AFTER_KILLS) return false;
  return true;
}

const asCount = (value) => (typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0);

// Härtung für geladene Spielstände: Kaputter Snapshots wird repariert oder
// verworfen (null) — ein böser Spielstand darf den Spawn-Pfad nie crashen.
export function sanitizeEcho(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const name = String(raw.name ?? '')
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, ' ')
    .trim()
    .slice(0, 24);
  const speed = typeof raw.speed === 'number' && Number.isFinite(raw.speed) && raw.speed >= 0.5 && raw.speed <= 5
    ? raw.speed
    : 1;
  return {
    zone: Math.min(MAX_ZONE, asCount(raw.zone)),
    name: name || 'Held',
    level: Math.max(1, asCount(raw.level) || 1),
    kills: asCount(raw.kills),
    speed,
    weaponBase: typeof raw.weaponBase === 'string' && raw.weaponBase ? raw.weaponBase.slice(0, 30) : null,
    weaponMemory: sanitizeMemory(raw.weaponMemory),
    defeated: raw.defeated === true,
  };
}
