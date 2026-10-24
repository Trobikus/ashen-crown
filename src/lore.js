// Die Chronik von Ashen Crown: Rahmenerzählung, Kontinent-Annalen, Epitaphe
// der Bosse und die Tiefen-Flüstertöne. Alles Reines Daten- und Erzählgut —
// Freischaltung leitet sich aus dem Fortschritt ab (state.cleared), damit
// keine eigene Speicherlogik nötig ist.

import { CONTINENTS, MAIN_ZONE_COUNT, MAX_ZONE, ZONES, ZONE_ENEMIES, zoneDef, formatNum } from './data.js';

import { state } from './state.js';

import { t, lname } from './i18n.js';

import { el } from './dom.js';

// ——— Die Erweckung: Intro-Seiten für neue Helden ———

export const INTRO_PAGES = [
  'Ehe es Asche gab, war da ein Reich. Ehe das Reich fiel, war da eine Krone.',
  'Drei Häupter trugen sie: ein König, ein Gott, ein Narr. Was die Krone berührte, brannte — langsam, höflich, bis auf den Grund.',
  'Am Ende war nur Asche. Und die Asche erinnerte sich an alles, was sie einmal war.',
  'Jetzt erwachst du daraus — ohne Namen, ohne Grab. Die Asche hat dich geformt, und die Krone ruft nach ihrem nächsten Haupt.',
];

// Onboarding: die zwei Seiten beim ersten Abstieg ins Feld.
export const COMBAT_INTRO_PAGES = [
  'Dein Held kämpft von allein. Du lenkst: Asche ausgeben, Türen öffnen, tiefer steigen.',
  'Und er kämpft nur hier im Feld. Am Schrein rastet er — und heilt.',
];

// ——— Kontinent-Annalen: beim ersten Betreten ———

export const CONTINENT_LORE = {
  aschenlande: 'Hier stand der Thron, als die Welt noch einen Namen hatte. Der erste Träger setzte die Krone auf und nannte das Feuer Ordnung. Sein Hof tanzte weiter, während es sie fraß — Schatten mit Ämtern, Gebein mit Etikette. Sie erwarten dich. Sie erwarten jeden.',
  frostreich: 'Als die Glut kam, floh der Hof des Nordens in den Frost. Sie glaubten, Kälte könne löschen, was brennen will. Der Winter hat sie gehalten, wie Salz ein Fleisch hält — weiß, still, aufbewahrt. Der Frost ist keine Rettung. Er ist die konservierte Asche.',
  faulmoor: 'Die Gelehrten flohen in den Süden und wollten die Asche ertränken, begraben, vergessen. Das Moor nahm alles: die Bücher, die Heilmittel, die Betenden. Was heute an die Oberfläche steigt, ist nicht Wasser. Es ist, was sie versenken wollten — mit Erinnerung.',
  blutmark: 'Das Kriegervolk des Ostens kannte nur eine Währung: Blut. Sie opferten Schlachten, Söhne, zuletzt sich selbst — um die Asche zu sättigen. Sie hatten recht, die Asche nimmt Zahlung. Nur hört sie nie auf zu kassieren.',
  sternenleere: 'Zuletzt stiegen die Gelehrten und Könige auf — in Kathedralen aus Sternenlicht, über der Asche, die sie hinter sich ließen. Aber der Himmel war nie leer. Er ist der Ofen, aus dem alles Asche kommt. Oben wartet die Krone. Sie hat auf dich gewartet.',
  tiefen: 'Unter dem Thron liegt, was die Krone nie aussprach: die Erinnerung aller getragenen Häupter. Hier unten hat die Asche Zeit. Sie hat alle Zeit der Welt — und deine.',
};

export const TIEFEN_KEY = 'tiefen';

// Schlüssel des Kontinents einer Zone — inklusive der Tiefen.
export function continentLoreKeyOf(zoneIndex) {
  const i = Math.max(0, Math.min(Math.trunc(zoneIndex) || 0, MAX_ZONE));
  if (i >= MAIN_ZONE_COUNT) return TIEFEN_KEY;
  return CONTINENTS[Math.floor(i / 10)].key;
}

// ——— Boss-Epitaphe: eine Zeile pro besiegtem Boss ———
// Bogen der Aschenlande: der Hof des ersten Trägers. Frost: die Flucht.
// Moor: das Begraben. Blutmark: das Bezahlen. Sternenleere: der Aufstieg.

const BOSS_EPITAPHS = [
  'Er bewacht ein Grab, das nie gegraben wurde: sein eigenes.',
  'Knochen erinnern länger als Namen. Seine hat er vergessen, als er aufstand.',
  'Sie wiegte Kinder in Glut, damit sie warm sterben. Einige erwachten. Du hörst sie noch.',
  'Drei Mal begruben sie ihn. Beim vierten Mal hat er mitgeholfen.',
  'Er saß, bis der Stuhl zu Asche wurde. Er sitzt immer noch.',
  'Was von einem Feuer bleibt, wenn es schläft: Funken mit Geduld.',
  'Sie stapelten die Gefallenen zu einer Mauer. Die Mauer hat gelernt zu gehen.',
  'Die Asche nahm ihn ganz. Deshalb spricht er mit ihrer Stimme.',
  'Ein König aus Leihknochen, gekrönt von Hofschatten. Sein Reich endet an deiner Klinge.',
  'Er nannte sich Gott, als der letzte Ofen erlosch. Die Asche ließ es ihn zu — sie braucht Lügen zum Atmen.',
  'Er führte den Hof in den Norden, damit die Glut erfriert. Er friert noch.',
  'Er hält Wache am Tor des Winters. Niemand hat ihm gesagt, dass das Tor verbrannt ist.',
  'Sie küsste die Sterblichen, damit sie nicht verglühen. Kälte ist auch eine Art Liebe.',
  'Sein letzter Schrei hängt als Eis in der Luft. Wer leise ist, hört ihn noch.',
  'Er versprach seinem Volk den ewigen Frost als Rettung. Er hielt Wort. Das war das Problem.',
  'Ein Fluch sollte ihn schützen. Der Frost hat ihn behalten, wie man einen Brief behält.',
  'Anketten kann man nur, was stehen bleibt. Der Sturm steht seither still.',
  'Es schlägt einmal im Jahrhundert. Gerade jetzt ist so ein Moment.',
  'Er betete zu einem Gott aus Eis. Als das Eis schmolz, betete er weiter — zu dem, was übrig blieb.',
  'Der Norden froren einen Gott ein, um warm zu bleiben. Er ist aufgetaut und hat Hunger.',
  'Er handelte jeden Schritt aus dem Sumpf heraus. Der letzte Schritt war sein teuerster.',
  'Sie nährte das Moor mit dem, was sie verlor. Es wächst noch immer.',
  'Ein Fürst, der sich auflöste, um nicht zu verbrennen. Er löst sich weiter. Seit Wochen? Jahren?',
  'Die Fäulnis fraß seinen Namen zuerst. Den Rest isst sie langsam.',
  'Er wollte die Asche im Moor begraben. Jetzt trägt er sie als Krone im Schlamm.',
  'Seine Seuche konnte die Asche nicht töten. Sie freundeten sich an.',
  'Was sie umarmt, bleibt. Nichts verlässt ihre Arme — auch du nicht, versprichst du.',
  'Das Moor verschlang ihn mit Sattel, Krone und Namen. Es hat noch Platz.',
  'Er pries die Ruhe des Moores. Er hat sie jetzt. Er will sie nicht mehr.',
  'Ein Gott aus Schlamm und Geduld. Er wartet, bis alles oben faul genug ist.',
  'Er zahlte die Asche in Blut. Die Rechnung ging auf — seine.',
  'Ihr Reich war Eisen, ihr Atem Rost. Zeit war ihre einzige Waffe, und sie hatte davon.',
  'Er schmiedete sich eine Haut aus Klingen. Jetzt kann ihn niemand mehr umarmen.',
  'Er verkaufte jeden Krieg zweimal: an beide Seiten, dann an die Asche.',
  'Er opferte sein Volk, um die Asche zu sättigen. Sie aß. Sie fragte nach mehr.',
  'Er zählte nicht Leichen, sondern Liegen. Die Asche zahlt pro Stück.',
  'Tausende Waffen, zu einem Leib verschmolzen. Keine von ihnen weiß mehr, wer sie war.',
  'Er trank, was sein Reich vergoß. Irgendwann trank das Reich ihn.',
  'Er predigte, dass Blut der einzige Preis ist. Amen. Amen. Amen.',
  'Aus jedem gefallenen Reiter wuchs er um eine Spanne. Er ist auf die Höhe eines Gottes gewachsen.',
  'Er floh vor der Asche in die Nacht. Die Nacht war schon vergeben.',
  'Er bewacht Sterne, die längst erloschen sind. Wachen tut man ja nicht für die Sterne.',
  'Sie gebar Lichter, damit oben etwas lebt. Ihr letztes Kind fällt noch.',
  'Er war einst der hellste am Himmel. Jetzt ist er ein Loch in der Welt mit Krone.',
  'Er baute sein Reich auf dem Rücken des Himmels. Der Himmel hat sich gedreht.',
  'Zwischen den Sternen wohnt etwas, das Namen vergisst. Es hat seinen behalten — als Warnung.',
  'Ein Leib aus erkalteter Sternenasche. Er trägt eine Kathedrale, die niemand mehr betritt.',
  'Am Ende aller Lichter sitzt er und isst. Er ist noch nicht am Ende.',
  'Er las in den Sternen, dass du kommen würdest. Er hat sich verlesen. Oder nicht.',
  'Sie hat auf Häuptern von Königen, Göttern und Narren gesessen. Jetzt ist deins dran.',
];

// Flüstertöne der Tiefen: rotieren mit der Tiefe, weil unten niemand zählt.
const DEPTH_EPITAPHS = [
  'Unter dem Thron liegt, was die Krone verschwieg: die Erinnerung aller, die sie trugen.',
  'Hier unten zählt die Asche ihre Toten. Du bist eine Zahl geworden, die mitgeht.',
  'Die Tiefen haben keinen Boden. Sie haben nur Geduld.',
  'Was du oben erbeutest, wird unten vermisst.',
];

export function epitaphOf(zoneIndex) {
  const i = Math.max(0, Math.min(Math.trunc(zoneIndex) || 0, MAX_ZONE));
  if (i < MAIN_ZONE_COUNT) return BOSS_EPITAPHS[i] ?? null;
  const depth = i - MAIN_ZONE_COUNT + 1;
  return DEPTH_EPITAPHS[(depth - 1) % DEPTH_EPITAPHS.length];
}

// ——— Die Chronik: Szene ———

function chronicleEntry(who, text) {
  const entry = document.createElement('div');
  entry.className = 'chronicle-entry';
  const whoLine = document.createElement('div');
  whoLine.className = 'chronicle-who';
  whoLine.textContent = who;
  const textLine = document.createElement('div');
  textLine.className = 'chronicle-text';
  textLine.textContent = text;
  entry.append(whoLine, textLine);
  return entry;
}

function chronicleSection(title) {
  const section = document.createElement('div');
  section.className = 'chronicle-section';
  const head = document.createElement('h3');
  head.textContent = title;
  section.appendChild(head);
  return section;
}

export function renderChronicle() {
  const list = el.chronicleList;
  list.replaceChildren();

  const awakening = chronicleSection(t('Die Erweckung'));
  for (const page of INTRO_PAGES) {
    awakening.appendChild(chronicleEntry(lname('Der Erweckte'), t(page)));
  }
  list.appendChild(awakening);

  CONTINENTS.forEach((continent, ci) => {
    const start = ci * 10;
    const section = chronicleSection(lname(continent.name));
    if (state.cleared >= start) {
      section.appendChild(chronicleEntry(t('Annale'), t(CONTINENT_LORE[continent.key])));
      for (let z = start; z < start + 10; z += 1) {
        if (state.cleared <= z) continue;
        const boss = ZONE_ENEMIES[z].boss;
        section.appendChild(chronicleEntry(`${lname(ZONES[z].name)} · ${lname(boss.name)}`, t(BOSS_EPITAPHS[z])));
      }
    } else {
      const sealed = document.createElement('div');
      sealed.className = 'chronicle-sealed';
      sealed.textContent = t('Noch versiegelt. Die Asche gibt erst her, was errungen wurde.');
      section.appendChild(sealed);
    }
    list.appendChild(section);
  });

  const depths = chronicleSection(lname('Die Tiefen'));
  if (state.cleared >= MAIN_ZONE_COUNT) {
    depths.appendChild(chronicleEntry(t('Annale'), t(CONTINENT_LORE[TIEFEN_KEY])));
    const clearedDepths = state.cleared - MAIN_ZONE_COUNT + 1;
    depths.appendChild(chronicleEntry(t('Zählwerk'), t('Bislang errungene Tiefe: {n}. Unten zählt niemand mit — nur die Asche.', { n: formatNum(clearedDepths) })));
  } else {
    const sealed = document.createElement('div');
    sealed.className = 'chronicle-sealed';
    sealed.textContent = t('Unter dem Thron verschlossen. Hebe die Krone, und die Tiefen öffnen sich.');
    depths.appendChild(sealed);
  }
  list.appendChild(depths);

  // Der Nachhall: keine Fortschritts-Angelegenheit, sondern Erinnerung —
  // er steht im Spielstand (state.echo), nicht in cleared. Wartend erzählt
  // er vom alten Ich, gebrochen von seinem Ende.
  if (state.echo) {
    const echo = state.echo;
    const section = chronicleSection(t('Der Nachhall'));
    section.appendChild(chronicleEntry(
      echo.defeated ? t('Gebrochen') : t('Wartend'),
      echo.defeated
        ? t('Der Nachhall von {name} ist gebrochen — Stufe {lvl}, einst {kills} erlegt. Die Asche nimmt ihn zurück, bis du erneut erwachst.', { name: echo.name, lvl: formatNum(echo.level), kills: formatNum(echo.kills) })
        : t('Ein Nachhall von {name} wartet in {zone}: Stufe {lvl}, {kills} erlegt einst. Er trägt alles, was du warst.', { name: echo.name, zone: lname(zoneDef(echo.zone).name), lvl: formatNum(echo.level), kills: formatNum(echo.kills) }),
    ));
    list.appendChild(section);
  }

  if (state.crownWon) {
    const throne = chronicleSection(t('Der Thron'));
    throne.appendChild(chronicleEntry(t('Die Aschenkrone'), t('Du hast sie gehoben — die Krone, aus der die Asche kam. Sie ist leicht. Sie ist kalt. Sie ist dein. Vier Reiche sind auf dem Weg hierher verbrannt. Hüte dein Haupt.')));
    list.appendChild(throne);
  }
}
