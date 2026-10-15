// Balance-Simulator für Ashen Crown.
//
// Spielt das Spiel mit den echten Formeln durch und misst pro Zone:
// Kill-Zeit, Tode, Überfarm-Aufwand. Sämtliche Spielkonstanten und die
// komplette Loot-Arithmetik (Seltenheitswürfe, Basen & Tiers, Affixe,
// Lifeleech, Meisterschaft, Werkstatt-Kosten) kommen direkt aus der echten
// src/data.js — der Sim kann neben der Balance nicht mehr altern. Moduliert
// wird nur die Spieler-Politik (Skill-Verteilung, Werkstatt-Käufe,
// Rast-Verhalten) und — im Preset-Modus — die Wachstumskurven selbst.
//
//   node tools/balance-sim.mjs            → Preset-Kandidaten durchrechnen
//   node tools/balance-sim.mjs --verify   → gegen die echte src/data.js spielen
//   node tools/balance-sim.mjs --depths   → Tiefen (Zone 51+) mitprüfen
//   node tools/balance-sim.mjs --sweep    → Kurvensuche über hp/dmg-Wachstum
//
// Determinismus: Math.random wird auf den Seeded-RNG (mulberry32) umgebogen,
// damit auch die echten data.js-Würfe (Loot, Lifeleech-Chance) Runs mit
// gleichem Seed vergleichbar machen (--seed N, Default 1234).

const D = await import('../src/data.js');

// ——— Welten ———

// WICHTIG: Gegner-Schaden bleibt wie in src/data.js Float (sig3) und wird
// erst beim Zuschlagen gerundet — hier nie vorzeitig Math.round().
const round3 = (v) => Number(v.toPrecision(3));

function worldFromParams(p, depthZones = 0) {
  const zones = [];
  const enemies = [];
  let normal = { ...p.baseNormal };
  for (let n = 0; n < D.MAIN_ZONE_COUNT; n += 1) {
    if (n > 0) {
      normal = {
        hp: round3(normal.hp * p.growth.hp),
        damage: Math.max(1, round3(normal.damage * p.growth.damage)),
        ash: round3(normal.ash * p.growth.ash),
        xp: round3(normal.xp * p.growth.xp),
      };
      // Kontinent-Bump — spiegelt CONTINENT_BUMP in src/data.js (1.12/1.08).
      if (n % 10 === 0) {
        normal = {
          hp: round3(normal.hp * 1.12),
          damage: Math.max(1, round3(normal.damage * 1.08)),
          ash: normal.ash,
          xp: normal.xp,
        };
      }
    }
    // Startzonen-Fundament — spiegelt src/data.js (+12 LP, schwindet bis Zone 10).
    const zoneNormal = n < (p.earlyHpBonusZones ?? 10)
      ? { ...normal, hp: round3(normal.hp + (p.earlyHpBonus ?? 12) * (1 - n / (p.earlyHpBonusZones ?? 10))) }
      : normal;
    const ilvl = Math.max(1, Math.round(p.ilvlBase * p.ilvlGrowth ** n * (n > 0 && n % 10 === 0 ? 1.15 : 1)));
    zones.push({ name: `Zone ${n + 1}`, ilvl });
    enemies.push({
      normal: zoneNormal,
      elite: {
        name: `Elite ${n + 1}`,
        hp: zoneNormal.hp * p.elite.hpMult,
        damage: Math.max(1, round3(zoneNormal.damage * p.elite.dmgMult)),
        ash: Math.round(zoneNormal.ash * p.elite.ashMult),
        xp: Math.round(zoneNormal.xp * p.elite.xpMult),
      },
      boss: {
        name: `Boss ${n + 1}`,
        hp: zoneNormal.hp * p.boss.hpMult,
        damage: Math.max(1, round3(zoneNormal.damage * p.boss.dmgMult)),
        ash: zoneNormal.ash * p.boss.ashMult,
        xp: zoneNormal.xp * p.boss.xpMult,
        boss: true,
      },
    });
  }
  const last = enemies[D.MAIN_ZONE_COUNT - 1];
  const depthGrowth = p.depth ?? p.growth;
  let prevNormal = last.normal;
  for (let d = 1; d <= depthZones; d += 1) {
    const nextNormal = {
      hp: round3(prevNormal.hp * depthGrowth.hp),
      damage: Math.max(1, round3(prevNormal.damage * depthGrowth.damage)),
      ash: round3(prevNormal.ash * depthGrowth.ash),
      xp: round3(prevNormal.xp * depthGrowth.xp),
    };
    prevNormal = nextNormal;
    const ilvl = Math.max(1, Math.round(zones[D.MAIN_ZONE_COUNT - 1].ilvl * p.ilvlGrowth ** d));
    zones.push({ name: `Tiefe ${d}`, ilvl });
    enemies.push({
      normal: nextNormal,
      elite: { name: `Tiefen-Elite ${d}`, hp: nextNormal.hp * p.elite.hpMult, damage: Math.max(1, round3(nextNormal.damage * p.elite.dmgMult)), ash: Math.round(nextNormal.ash * p.elite.ashMult), xp: Math.round(nextNormal.xp * p.elite.xpMult) },
      boss: { name: `Tiefen-Boss ${d}`, hp: nextNormal.hp * p.boss.hpMult, damage: Math.max(1, round3(nextNormal.damage * p.boss.dmgMult)), ash: nextNormal.ash * p.boss.ashMult, xp: nextNormal.xp * p.boss.xpMult, boss: true },
    });
  }
  return { zones, enemies };
}

// Echte Welt: Zonen, Gegner — und auf Wunsch die Tiefen (Zone 51+) über
// zoneDef/enemyDef, damit --verify --depths wirklich die Tiefen spielt.
function worldFromRealData(depthZones = 0) {
  const zones = [...D.ZONES];
  const enemies = [...D.ZONE_ENEMIES];
  for (let i = D.MAIN_ZONE_COUNT; i < D.MAIN_ZONE_COUNT + depthZones; i += 1) {
    zones.push(D.zoneDef(i));
    enemies.push(D.enemyDef(i));
  }
  return { zones, enemies };
}

// Deterministischer Zufall (mulberry32): Runs mit gleichem Seed sind
// vergleichbar — ohne Seedentscheidung war jede Abstimmung Glückssache.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = (() => {
  const flag = process.argv.indexOf('--seed');
  return flag > -1 ? Number(process.argv[flag + 1]) || 1234 : 1234;
})();

let rng = mulberry32(SEED);

function seedRandom() {
  rng = mulberry32(SEED);
  Math.random = rng; // data.js würfelt über Math.random — umlenken, nicht kopieren
}

// ——— Loot: unverfälscht aus der echten data.js ———

const SLOT_DEFS = Object.fromEntries(D.GEAR_SLOTS.map((slot) => [slot.key, slot]));
const SLOT_KEYS = Object.keys(SLOT_DEFS);

// Baut ein Item exakt wie items.js generateItem: Basis per ilvl würfeln,
// Seltenheit würfeln, Meisterschaft nur auf Legendär, Werte via
// rollItemValues (Affix-Pools, Tier-Multiplikatoren, Basis-Prägungen).
function makeItem(slotKey, ilvl) {
  const slot = SLOT_DEFS[slotKey];
  const rarity = D.rollRarity();
  const baseItem = D.pickBase(slot, ilvl);
  return {
    id: 0,
    slot: slotKey,
    base: baseItem.name,
    name: `${baseItem.name} ${rarity.suffix}`,
    rarity: rarity.key,
    ilvl,
    enhance: 0,
    mastery: rarity.key === 'legendär' ? D.rollMastery(slot.stat) : null,
    ...D.rollItemValues(slot, rarity, ilvl, baseItem),
  };
}

// ——— Spieler-Politik (modelliert, bewusst grob) ———

// Richtlinien-Annahmen für "einen denkenden Spieler": Skillpunkte entstehen
// erst ab Stufe 20 und wirken als pro Level anwachsende Prozent-Boni mit
// Deckeln (die echten Runenwerte sind gedämpft), Statpunkte werden
// 1 Schaden : 1 Lebenskraft verteilt und Asche nach Grenznutzen ausgegeben.
const skillProfile = (level) => {
  const pts = Math.max(0, level - (D.SKILL_TREE_UNLOCK_LEVEL - 1));
  return {
    damagePct: Math.min(1.0 * pts, 80),
    hpPct: Math.min(0.6 * pts, 50),
    armor: Math.min(0.25 * pts, 30),
    crit: Math.min(0.1 * pts, 6),
    critDmg: Math.min(0.3 * pts, 30),
    speed: Math.min(0.075 * pts, 8),
    ash: Math.min(0.15 * pts, 15),
    xp: Math.min(0.15 * pts, 15),
  };
};

// Werkstatt-Kette: Umschmieden bleibt der planbare Weg zur besseren Waffe.
const REFORGE_BASES = [600, 3000, 12000, 50000];

function simulate(world, { depthTarget = 0 } = {}) {
  seedRandom(); // jeder Run deterministisch, Runs vergleichbar
  const totalZones = world.zones.length;
  const hero = {
    level: 1, xp: 0, maxHpBase: 35, damageBase: 2, armorBase: 0,
    hp: 35, ash: 0,
    gear: Object.fromEntries(SLOT_KEYS.map((k) => [k, null])),
  };

  const statPts = { damage: 0, hp: 0, armor: 0, crit: 0 };
  let statPoints = 0;

  const gearStats = () => {
    const acc = { damage: 0, hp: 0, armor: 0, critChance: 0, critDmg: 0, damagePct: 0, hpPct: 0, armorPct: 0, lifeleech: 0, lifeleechFlat: 0 };
    for (const key of SLOT_KEYS) {
      const item = hero.gear[key];
      if (!item) continue;
      acc.damage += item.damage;
      acc.hp += item.hp;
      acc.armor += item.armor;
      acc.critChance += item.critChance;
      acc.critDmg += item.critDmg;
      acc.damagePct += item.damagePct;
      acc.hpPct += item.hpPct;
      acc.armorPct += item.armorPct;
      acc.lifeleech += item.lifeleech;
      acc.lifeleechFlat += item.lifeleechFlat;
      if (item.enhanceBonus) {
        acc.damage += item.enhanceBonus.damage ?? 0;
        acc.hp += item.enhanceBonus.hp ?? 0;
        acc.armor += item.enhanceBonus.armor ?? 0;
      }
    }
    return acc;
  };

  // Meisterschaften fließen wie in src/stats.js in dieselben Boni-Pfade.
  const masteryOf = () => {
    const m = {};
    for (const key of SLOT_KEYS) {
      const item = hero.gear[key];
      if (item?.mastery) m[item.mastery.stat] = (m[item.mastery.stat] ?? 0) + item.mastery.value;
    }
    return m;
  };

  const bonuses = () => {
    const sk = skillProfile(hero.level);
    const m = masteryOf();
    return {
      damageFlat: (sk.damage ?? 0) + (m.damage ?? 0),
      hpFlat: (sk.hp ?? 0) + (m.hp ?? 0),
      armorFlat: (sk.armor ?? 0) + (m.armor ?? 0),
      crit: (sk.crit ?? 0) + (m.crit ?? 0),
      critDmg: (sk.critDmg ?? 0) + (m.critDmg ?? 0),
      speed: (sk.speed ?? 0) + (m.speed ?? 0),
      ash: (sk.ash ?? 0) + (m.ash ?? 0),
      xp: (sk.xp ?? 0) + (m.xp ?? 0),
      damagePct: (sk.damagePct ?? 0) + (m.damagePct ?? 0),
      hpPct: (sk.hpPct ?? 0) + (m.hpPct ?? 0),
      armorPct: (sk.armorPct ?? 0) + (m.armorPct ?? 0),
    };
  };

  const craftIlvl = () => world.zones[Math.min(cleared, D.MAIN_ZONE_COUNT - 1)].ilvl;

  let cleared = 0;
  let zone = 0;
  let zoneKills = 0;
  let kills = 0;
  let deaths = 0;
  let maxTracked = 0;
  let enhanceSpent = 0;

  const heroDamage = () => {
    const s = gearStats();
    const b = bonuses();
    return Math.round((hero.damageBase + s.damage + statPts.damage + b.damageFlat) * (1 + (b.damagePct + s.damagePct) / 100));
  };
  const heroMaxHp = () => {
    const s = gearStats();
    const b = bonuses();
    return Math.round((hero.maxHpBase + s.hp + statPts.hp * 5 + b.hpFlat) * (1 + (b.hpPct + s.hpPct) / 100));
  };
  const heroArmor = () => {
    const s = gearStats();
    const b = bonuses();
    return Math.round((hero.armorBase + s.armor + statPts.armor + b.armorFlat) * (1 + (b.armorPct + s.armorPct) / 100));
  };
  const critChance = () => Math.min(D.CRIT_CHANCE_CAP, D.BASE_CRIT_CHANCE + statPts.crit + gearStats().critChance + bonuses().crit);
  const attackSpeed = () => D.BASE_ATTACK_SPEED + bonuses().speed / 100;
  const avgHit = () => {
    const s = gearStats();
    const b = bonuses();
    const critMult = D.CRIT_MULTIPLIER + (b.critDmg + s.critDmg) / 100;
    return heroDamage() * (1 + (critChance() / 100) * (critMult - 1));
  };
  const heroLeech = () => {
    const s = gearStats();
    return { pct: s.lifeleech, flat: s.lifeleechFlat };
  };

  const gainXp = (raw) => {
    const amount = Math.round(raw * (1 + bonuses().xp / 100));
    hero.xp += amount;
    // Schnellsprung (Summe der Levelbedarfe ≈ 3·L³ bei 9L²+13L), damit
    // Riesensprünge nicht millionenfach iterieren; danach fein per While.
    if (hero.xp > 1e4 * D.xpNeeded(hero.level)) {
      hero.level = Math.max(hero.level + 1, Math.floor(Math.cbrt(hero.xp / 3)));
      hero.xp = Math.min(hero.xp, D.xpNeeded(hero.level) * 4);
    }
    let leveled = false;
    let guard = 0;
    while (hero.xp >= D.xpNeeded(hero.level) && guard < 100000) {
      hero.xp -= D.xpNeeded(hero.level);
      hero.level += 1;
      statPoints += D.STAT_POINTS_PER_LEVEL;
      leveled = true;
      guard += 1;
    }
    if (leveled) {
      hero.hp = heroMaxHp();
      // 2 Punkte pro Stufe: 1 Schaden, 1 Lebenskraft.
      statPts.damage += 1;
      statPts.hp += 1;
      statPoints -= 2;
    }
  };

  // Der denkende Spieler legt das Beste an (echte itemScore-Heuristik) und
  // verkauft den Rest sofort — Inventar-Logistik modelliert der Sim nicht.
  const sellValue = (item) => Math.round(D.rarityOf(item.rarity).mult * (4 + hero.level));
  const equip = (item) => {
    const current = hero.gear[item.slot];
    if (!current || D.itemScore(item) > D.itemScore(current)) {
      hero.gear[item.slot] = item;
      if (current) hero.ash += sellValue(current);
      hero.hp = Math.min(hero.hp, heroMaxHp());
    } else {
      hero.ash += sellValue(item);
    }
  };

  const onDrop = (type, ilvl) => {
    if (Math.random() >= (D.DROP_CHANCES[type] ?? 0)) return;
    const slotKey = SLOT_KEYS[Math.floor(Math.random() * SLOT_KEYS.length)];
    equip(makeItem(slotKey, ilvl));
  };

  // Umschmieden — spiegelt craftReforge in src/crafting.js: Basis bleibt,
  // das Ilvl zieht auf die Werkstatt-Stufe (senkt nie), Werte rollen auf der
  // Sockel-Höhe neu, Legendär rollt die Meisterschaft.
  const doReforge = (slotKey) => {
    const item = hero.gear[slotKey];
    const slot = SLOT_DEFS[slotKey];
    const next = D.RARITIES[D.RARITIES.findIndex((r) => r.key === item.rarity) + 1];
    if (!next) return;
    const baseItem = D.baseOf(slot, item.base);
    const reforgeIlvl = Math.max(D.itemIlvl(item), craftIlvl());
    item.rarity = next.key;
    item.ilvl = reforgeIlvl;
    item.name = `${baseItem.name} ${next.suffix}`;
    Object.assign(item, D.rollItemValues(slot, next, reforgeIlvl, baseItem));
    if (next.key === 'legendär') item.mastery = D.rollMastery(slot.stat);
  };

  const buyUpgrades = () => {
    // Asche fließt nur in die Werkstatt — der denkende Spieler schmiedet die
    // Waffe nach oben (Verstärken und Umschmieden nach Grenznutzen).
    const weapon = hero.gear.waffe;
    if (!weapon) return;
    for (let guard = 0; guard < 200; guard += 1) {
      const enhanceCost = Math.round(30 * 1.6 ** (weapon.enhance + 1) * (1 + 0.25 * craftIlvl()));
      const weaponIndex = D.RARITIES.findIndex((r) => r.key === weapon.rarity);
      const reforgeCost = weaponIndex < D.RARITIES.length - 1
        ? Math.round(REFORGE_BASES[weaponIndex] * (1 + 0.4 * craftIlvl()))
        : Infinity;
      const options = [
        { kind: 'enh', cost: enhanceCost, value: (0.2 * craftIlvl()) / Math.max(1, enhanceCost) },
        { kind: 'reforge', cost: reforgeCost, value: Number.isFinite(reforgeCost) ? (0.55 * craftIlvl()) / Math.max(1, reforgeCost) : 0 },
      ].filter((o) => o.cost <= hero.ash);
      if (!options.length) return;
      options.sort((a, b) => b.value - a.value);
      const best = options[0];
      hero.ash -= best.cost;
      if (best.kind === 'enh') {
        // Spiegelt craftEnhance: Absoluter Bonus je Stufe, Werkstatt-Skala.
        weapon.enhance += 1;
        const bonus = Math.max(1, Math.round((1 + 0.5 * craftIlvl()) * (1 + 0.4 * (weapon.enhance - 1))));
        weapon.enhanceBonus = { damage: bonus };
        enhanceSpent += best.cost;
      } else {
        doReforge('waffe');
      }
    }
  };

  const fight = (type) => {
    // Der denkende Spieler geht bei zaghafter Lebenskraft kurz zum Schrein:
    // Rückweg + Rast + Rückkehr kostet ~30 s, heilt aber gratis voll.
    if (hero.hp < heroMaxHp() * 0.4) {
      totalSeconds += 30;
      hero.hp = heroMaxHp();
    }
    const base = world.enemies[Math.min(zone, world.enemies.length - 1)][type];
    const prof = D.profileOf(zone, type);
    const def = {
      ...base,
      hp: Math.max(1, Math.round(base.hp * prof.hp)),
      damage: Math.max(1, Math.round(base.damage * prof.damage)),
    };
    maxTracked = Math.max(maxTracked, def.hp, def.ash, def.xp);
    // Erwartete Treffer: HERO_MISS_CHANCE der eigenen Schläge geht daneben.
    const hits = Math.max(1, Math.ceil(def.hp / avgHit())) / (1 - D.HERO_MISS_CHANCE);
    const seconds = hits * (D.ATTACK_INTERVAL_MS / 1000) / attackSpeed();
    if (!Number.isFinite(seconds) && !debugged) {
      debugged = true;
      console.error(`⚠ NaN bei Zone ${zone + 1} (${type}): def.hp=${def.hp} avgHit=${avgHit()} heroDamage=${heroDamage()} speed=${attackSpeed()} ash=${hero.ash} level=${hero.level} craftIlvl=${craftIlvl()}`);
    }
    const intervalS = (D.ATTACK_INTERVAL_MS / 1000) * prof.interval;
    let swings = Math.max(0, Math.floor(seconds / intervalS) - 1);
    // Enrage: im letzten HP-Drittel greift der Boss schneller an.
    if (def.boss) swings = Math.round(swings * (1 - D.ENRAGE_THRESHOLD + D.ENRAGE_THRESHOLD / D.ENRAGE_INTERVAL_MULT));
    const armor = heroArmor();
    // Rüstung mindert höchstens die Hälfte — spiegelt src/game.js.
    const reduction = Math.min(0.5, armor / (armor + D.ARMOR_RESISTANCE * def.damage));
    const taken = Math.max(1, Math.round(def.damage * (1 - reduction)));
    // Erwartungswert: ENEMY_MISS_CHANCE der Gegner-Schläge geht daneben.
    const dmgTaken = swings * taken * (1 - D.ENEMY_MISS_CHANCE);
    // Lifeleech: Prozent des verursachten Schadens (≈ Gegner-Leben) plus
    // fester Anteil pro eigenem Treffer.
    const healed = Math.round(def.hp * (heroLeech().pct / 100)) + heroLeech().flat * hits;
    if (process.env.SIM_DEBUG && zone >= 30) {
      console.error(`Z${zone + 1} ${type}: hp=${(hero.hp / 1e6).toFixed(2)}M/${(heroMaxHp() / 1e6).toFixed(2)}M swings=${swings} taken=${(taken / 1e3).toFixed(0)}k dmgTaken=${(dmgTaken / 1e6).toFixed(2)}M healed=${(healed / 1e6).toFixed(2)}M leech=${heroLeech().pct.toFixed(1)}%+${heroLeech().flat.toFixed(0)} armor=${(armor / 1e3).toFixed(0)}k red=${(reduction * 100).toFixed(1)}%`);
    }
    maxTracked = Math.max(maxTracked, hero.ash + def.ash, hero.xp + def.xp);
    if (dmgTaken - healed >= hero.hp) {
      deaths += 1;
      hero.ash -= Math.min(hero.ash, Math.round(hero.ash * D.DEATH_ASH_PENALTY));
      hero.hp = heroMaxHp();
      return { killed: false, seconds: seconds + 2 };
    }
    hero.hp = Math.min(heroMaxHp(), hero.hp - dmgTaken + healed);
    kills += 1;
    zoneKills += 1;
    hero.ash += Math.round(def.ash * (1 + bonuses().ash / 100));
    // Gegner unter dem Helden-Niveau tragen weniger bis keine Erfahrung bei —
    // Stufen steigen 3 pro Gebiet: Normal 3N−2, Elite +2, Boss +4.
    const enemyLevel = zone * 3 + 1 + (type === 'boss' ? 4 : type === 'elite' ? 2 : 0);
    gainXp(def.xp * D.enemyXpMultiplier(enemyLevel, hero.level));
    onDrop(type, world.zones[Math.min(zone, world.zones.length - 1)].ilvl);
    buyUpgrades();
    if (def.boss) cleared = Math.max(cleared, zone + 1);
    return { killed: true, seconds: seconds + D.ENEMY_RESPAWN_S };
  };

  const report = [];
  let totalSeconds = 0;
  let debugged = false;
  const zoneDeaths = { count: 0 };

  for (zone = 0; zone < totalZones; zone += 1) {
    zoneKills = 0;
    zoneDeaths.count = 0;
    const zoneStart = totalSeconds;
    const killsBefore = kills;
    hero.hp = heroMaxHp();

    let guard = 0;
    while (cleared <= zone && guard < 20000) {
      guard += 1;
      const stuck = zoneDeaths.count > 15 || guard > 8000;
      if (stuck && zone > 0) {
        // Überfarmen: in der letzten freigespielten Zone Grinder, dann zurück.
        const returnZone = zone;
        zone = zone - 1;
        zoneKills = 0;
        for (let i = 0; i < 50; i += 1) fight('normal');
        zone = returnZone;
        zoneKills = 0;
        zoneDeaths.count = Math.max(0, zoneDeaths.count - 5);
        continue;
      }
      const type = zoneKills >= D.BOSS_AFTER_KILLS ? 'boss' : (zoneKills > 0 && zoneKills % D.ELITE_EVERY_KILLS === 0 ? 'elite' : 'normal');
      const result = fight(type);
      totalSeconds += result.seconds;
      if (!result.killed) zoneDeaths.count += 1;
    }

    const stalled = cleared <= zone; // Gebiet trotz Überfarm-Logik nicht gebrochen
    report.push({
      zone: zone + 1,
      name: world.zones[zone].name,
      kills: kills - killsBefore,
      deaths: zoneDeaths.count,
      minutes: (totalSeconds - zoneStart) / 60,
      ilvl: world.zones[zone].ilvl,
      level: hero.level,
      stalled,
      killTimeNormal: (() => {
        const def = world.enemies[zone].normal;
        const prof = D.profileOf(zone, 'normal');
        return Math.max(1, Math.ceil(def.hp * prof.hp / avgHit())) * 1.5 / attackSpeed() / (1 - D.HERO_MISS_CHANCE);
      })(),
    });
    if (zone + 1 === D.MAIN_ZONE_COUNT && depthTarget === 0) break;
    // Endlos-Wand erreicht: Weitere Tiefen wären nur noch Guard-Müll
    // (Millionen-Minuten, Phantom-Tode) — sauber abbrechen und melden.
    if (stalled && zone >= D.MAIN_ZONE_COUNT) break;
    if (stalled) console.error(`⚠ Zone ${zone + 1} (${world.zones[zone].name}) nicht gebrochen — Balancing prüfen!`);
  }

  return {
    report,
    totals: {
      hours: totalSeconds / 3600,
      kills,
      deaths,
      level: hero.level,
      ash: Math.round(hero.ash),
      maxTracked,
      precisionSafe: maxTracked < Number.MAX_SAFE_INTEGER,
      enhanceSpent: Math.round(enhanceSpent),
      damage: heroDamage(),
      maxHp: heroMaxHp(),
      armor: heroArmor(),
    },
  };
}

const fmt = (v) => {
  if (!Number.isFinite(v)) return '∞';
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return `${Math.round(v)}`;
};

function printResult(label, result, { verbose = false } = {}) {
  const { report, totals } = result;
  console.log(`\n=== ${label} ===`);
  if (verbose) {
    console.log('Zone | Kill(s) | Zeit | Tod | ilvl | Lvl | Killzeit normal');
    for (const r of report) {
      console.log(
        `${String(r.zone).padStart(4)} | ${String(r.kills).padStart(6)} | ${r.minutes.toFixed(1).padStart(5)} min | ${String(r.deaths).padStart(3)} | ${fmt(r.ilvl).padStart(6)} | ${fmt(r.level).padStart(5)} | ${r.killTimeNormal.toFixed(1)}s`
      );
    }
  }
  const slowest = Math.max(...report.map((r) => r.killTimeNormal));
  const overfarm = report.reduce((s, r) => s + Math.max(0, r.kills - 34), 0);
  const wall = [...report].reverse().find((r) => r.stalled);
  console.log(
    `→ ${totals.hours.toFixed(1)} h bis Ziel · Tode ${totals.deaths} · langsamste Killzeit ${slowest.toFixed(1)}s · Überfarm-Kills ${overfarm} · Level ${fmt(totals.level)} · Schaden ${fmt(totals.damage)} · ${totals.precisionSafe ? 'Zahlen präzise ✓' : '⚠ 2^53 überschritten'}`
  );
  if (wall) console.log(`  Endlos-Wand bei ${wall.name} (Zone ${wall.zone}) — Simulation dort beendet.`);
  if (!totals.precisionSafe) console.log(`  (größter Wert ${totals.maxTracked.toExponential(2)})`);
}

const args = process.argv.slice(2);
const verbose = args.includes('-v') || args.includes('--verbose');
const verify = args.includes('--verify');
const depths = args.includes('--depths');
const sweep = args.includes('--sweep');

const PRESET_SHAPE = {
  baseNormal: { hp: 10, damage: 1, ash: 4, xp: 10 },
  elite: { hpMult: 2.4, dmgMult: 1.25, ashMult: 3.5, xpMult: 2.8 },
  boss: { hpMult: 4.2, dmgMult: 1.55, ashMult: 10, xpMult: 8 },
  ilvlBase: 2, ilvlGrowth: 1.29,
};

if (sweep) {
  console.log('hp  | dmg  | Zeit  | maxKill | Tod | Überfarm | Level');
  for (let hp = 1.34; hp <= 1.52 + 1e-9; hp += 0.03) {
    for (let dmg = 1.22; dmg <= 1.34 + 1e-9; dmg += 0.04) {
      const params = {
        ...PRESET_SHAPE,
        growth: { hp, damage: dmg, ash: hp + 0.08, xp: hp - 0.02 },
      };
      const r = simulate(worldFromParams(params));
      const slowest = Math.max(...r.report.map((row) => row.killTimeNormal));
      const overfarm = r.report.reduce((s, row) => s + Math.max(0, row.kills - 34), 0);
      console.log(
        `${hp.toFixed(2)} | ${dmg.toFixed(2)} | ${r.totals.hours.toFixed(1).padStart(4)} h | ${slowest.toFixed(1).padStart(6)}s | ${String(r.totals.deaths).padStart(3)} | ${String(overfarm).padStart(6)} | ${fmt(r.totals.level)}`
      );
    }
  }
} else if (verify) {
  const world = worldFromRealData(depths ? 30 : 0);
  const result = simulate(world, { depthTarget: depths ? 30 : 0 });
  printResult(`Echte data.js${depths ? ' inkl. Tiefen-Simulation' : ''}`, result, { verbose });
} else {
  const presets = {
    A: {
      ...PRESET_SHAPE,
      baseNormal: { hp: 10, damage: 1, ash: 4, xp: 10 },
      growth: { hp: 1.4, damage: 1.24, ash: 1.48, xp: 1.15 },
      depth: { hp: 1.4, damage: 1.30, ash: 1.48, xp: 1.12 },
    },
    B: {
      ...PRESET_SHAPE,
      baseNormal: { hp: 10, damage: 1, ash: 4, xp: 10 },
      growth: { hp: 1.37, damage: 1.26, ash: 1.44, xp: 1.13 },
    },
    C: {
      ...PRESET_SHAPE,
      baseNormal: { hp: 10, damage: 1, ash: 4, xp: 10 },
      growth: { hp: 1.42, damage: 1.28, ash: 1.52, xp: 1.17 },
    },
  };
  for (const [name, params] of Object.entries(presets)) {
    const world = worldFromParams(params, depths ? 30 : 0);
    printResult(`Kandidat ${name}`, simulate(world, { depthTarget: depths ? 30 : 0 }), { verbose });
  }
}
