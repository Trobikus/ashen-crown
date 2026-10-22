// Der Thron: Kronenasche, das Vermächtnis und „Erneut erwachen". Die Prestige-
// Szene — erst nach dem ersten Kronensieg über die Hub-Kachel erreichbar.
// Rendering und Kauf der Titel leben hier; der eigentliche Lauf-Reset als
// abgeschlossener Akt ebenfalls — die Kern-Werte (Szene öffnen, rendern,
// Lebenskraft) zieht er sich vom Bus.
import { state } from './state.js';
import { MAIN_ZONE_COUNT, GEAR_SLOTS, formatNum } from './data.js';
import { heroMaxHp } from './stats.js';
import { LEGACY_TITLES, kronenascheAvailable, kronenascheEarnedOf, kronenascheReward, legacyLevel } from './prestige.js';
import { el } from './dom.js';
import { pulseClass } from './domfx.js';
import { sfx, setCombatIntensity } from './audio.js';
import { toast } from './feedback.js';
import { resetGearForPrestige } from './items.js';
import { save } from './saveio.js';
import { showDismissibleOverlay } from './overlay.js';
import { use } from './bus.js';

function renderThrone() {
  if (el.sceneThrone.hidden) return;
  el.throneSummary.textContent = `${formatNum(kronenascheAvailable(state))} Kronenasche verfügbar · ${formatNum(kronenascheEarnedOf(state))} erworben · ${formatNum(state.prestigeRuns)} ${state.prestigeRuns === 1 ? 'Lauf' : 'Läufe'} hinter dir`;
  el.legacyShop.replaceChildren();
  const head = document.createElement('h3');
  head.textContent = 'Das Vermächtnis';
  el.legacyShop.appendChild(head);
  const available = kronenascheAvailable(state);
  for (const [title, def] of Object.entries(LEGACY_TITLES)) {
    const level = legacyLevel(state, title);
    const maxed = level >= def.levels.length;
    const cost = maxed ? 0 : def.levels[level];
    // Kronen-Akzent: Der Thron-Laden spricht eine andere Währung als der
    // Ruhm-Laden — das soll man den Zeilen ansehen.
    const row = document.createElement('div');
    row.className = 'chronicle-entry chronicle-entry-legacy';
    const who = document.createElement('div');
    who.className = 'chronicle-who';
    who.textContent = `${def.name}${maxed ? ' — vollständig' : ` · Stufe ${level + 1}/${def.levels.length}`}`;
    const text = document.createElement('div');
    text.className = 'chronicle-text';
    text.textContent = def.desc + (level > 0 ? ` (Aktuell: Stufe ${level})` : '');
    const buy = document.createElement('button');
    buy.className = 'btn-small';
    buy.dataset.legacy = title;
    if (maxed) {
      buy.textContent = 'Ausgeschöpft';
      buy.disabled = true;
    } else {
      buy.textContent = `Kaufen · ${cost} Kronenasche`;
      buy.disabled = available < cost;
    }
    row.append(who, text, buy);
    el.legacyShop.appendChild(row);
  }
  const ready = state.cleared >= MAIN_ZONE_COUNT;
  const reward = kronenascheReward(state.cleared);
  // Vorschau als Zwei-Spalten: Was verfällt, was bleibt — der größte Moment
  // des Spiels verdient eine klare Abbildung statt Fließtext.
  el.prestigePreview.innerHTML = ready
    ? `<div class="prestige-reward">Der Lauf zahlt <strong>${reward} Kronenasche</strong>.</div>
      <div class="prestige-columns">
        <div class="prestige-col"><h4>Verfällt</h4><ul><li>Zone &amp; Gebiete</li><li>Held — Stufe, EP, Punkte</li><li>Asche</li><li>Ausrüstung &amp; Inventar</li><li>Runen &amp; Pfad-Bindung</li></ul></div>
        <div class="prestige-col prestige-col-kept"><h4>Bleibt</h4><ul><li>Ruhm — Errungenschaften &amp; Laden</li><li>Kronenasche &amp; Vermächtnis</li><li>Bestiarium</li><li>Chronik &amp; Statistik</li></ul></div>
      </div>`
    : 'Der Thron verlangt die Krone dieses Laufs — hebe sie zuerst erneut.';
  el.prestigeButton.disabled = !ready;
  el.prestigeButton.classList.toggle('armed', prestigeArmed);
  el.prestigeButton.textContent = prestigeArmed
    ? 'Wirklich? Erwache erneut.'
    : ready ? `Erneut erwachen · ${reward} Kronenasche` : 'Die Krone dieses Laufs fehlt';
}

function buyLegacy(title) {
  const def = LEGACY_TITLES[title];
  const level = legacyLevel(state, title);
  if (!def || level >= def.levels.length) return;
  const cost = def.levels[level];
  if (kronenascheAvailable(state) < cost) return;
  state.kronenascheAusgegeben += cost;
  state.legacy[title] = level + 1;
  toast(`${def.name} — Stufe ${level + 1}.`, '#c1663a');
  sfx.unlock();
  save();
  renderThrone();
  use('render')();
}

let prestigeArmed = false;

let prestigeArmTimer = null;

function attemptPrestige() {
  if (state.cleared < MAIN_ZONE_COUNT) return;
  if (!prestigeArmed) {
    prestigeArmed = true;
    el.prestigeButton.classList.add('armed');
    clearTimeout(prestigeArmTimer);
    prestigeArmTimer = setTimeout(() => {
      prestigeArmed = false;
      prestigeArmTimer = null;
      renderThrone();
    }, 4000);
    renderThrone();
    return;
  }
  clearTimeout(prestigeArmTimer);
  prestigeArmTimer = null;
  prestigeArmed = false;
  const reward = kronenascheReward(state.cleared);
  state.kronenascheEarned += reward;
  state.prestigeRuns += 1;
  // Der Lauf verfällt — alles Run-Bezogene kehrt zum Erwachen zurück. Die
  // Start-Werte kommen aus den Titel-Definitionen (perLevel), nie aus Kopien.
  state.ash = LEGACY_TITLES['der-vorbereitete'].perLevel * legacyLevel(state, 'der-vorbereitete');
  state.xp = 0;
  state.level = 1;
  state.maxHp = 35;
  state.damage = 2;
  state.armorBase = 0;
  state.critBonus = 0;
  state.statPoints = LEGACY_TITLES['alter-pfad'].perLevel * legacyLevel(state, 'alter-pfad');
  state.skillPoints = 0;
  state.skills = ['start'];
  state.inventory = [];
  for (const slot of GEAR_SLOTS) state.equipment[slot.key] = null;
  // „Ausrüstung & Inventar verfällt" gilt auch fürs Panel — ohne den Reset
  // zeigt es den alten Stand weiter (gearDirty bliebe false).
  resetGearForPrestige();
  state.zone = 0;
  state.cleared = 0;
  state.zoneKills = 0;
  state.safedropZones = {};
  // Die Annalen erneut: Der zweite Lauf liest dieselbe Geschichte neu.
  state.seenContinents = [];
  state.inField = false;
  use('heroHp').set(heroMaxHp());
  setCombatIntensity(false);
  sfx.victory();
  save();
  use('showScreen')(el.hub);
  // Asche-Wiedergeburt: Der Hub atmet einmal kronengolden, während der
  // neue Lauf beginnt.
  pulseClass(el.hub, 'ash-rebirth', 1800);
  use('render')();
  showDismissibleOverlay(`Du erwachst erneut — der Lauf zahlt <strong>${reward} Kronenasche</strong>. Die Asche erinnert sich an alles andere.`, 5500, true);
}

export { renderThrone, buyLegacy, attemptPrestige };
