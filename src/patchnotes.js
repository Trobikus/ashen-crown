// Patchnote-Fenster beim Spielstart: zeigt die neuesten Änderungen einmal
// pro Tag — oder sofort wieder, wenn eine neue Version neue Notizen bringt.
// Das Häkchen „Heute nicht mehr anzeigen" speichert Tag + Version.

export const PATCH_NOTES = {
  version: '0.18.0',
  date: '22.10.2026',
  headline: 'Der Schrein neu geordnet — ein Hub, der mitwächst',
  sections: [
    {
      heading: '0.18.0 — Der Schrein neu geordnet',
      items: [
        'Ruhigerer Schrein: Nur Kacheln mit etwas zu sagen. Fertigkeiten erscheinen ab Stufe 20 (mit Meldestreifen), die Werkstatt mit der ersten Beute — ein frischer Lauf startet mit Held, Krypta und Gebieten.',
        'Die Annalen: Bestiarium, Errungenschaften und Chronik sind jetzt eine kompakte eigene Reihe unter den Kacheln — Ansehen getrennt vom Handeln.',
        'Statistik in den Optionen: Spielzeit, Tode, Beute je Seltenheit und die Tiefe liegen als eigener Reiter in den Optionen — die Kachel im Schrein ist weg.',
        'Der Held am Schrein: Das Porträt füllt den Bereich oben links und steht auf seiner Lebenskraft-Leiste — Wert und Regenerations-Timer („voll in X s“) sitzen am unteren Rand.',
        'Fix: Nach dem „Erneut erwachen“ zeigte das Inventar noch die Ausrüstung des vorigen Laufs — das Panel leert sich jetzt sauber, der Verkaufsmodus ebenfalls.',
        'Unter der Haube: Die Spiellogik wurde in Fach-Module um einen zentralen Bus geordnet (Overlay, Speicher-Subsystem, Offline-Fortschritt, Thron, Aufzeichnungen) — gleiche Regeln, wartbarer Code für alles Kommende.',
      ],
    },
    {
      heading: '0.17.0 — Flüssiger durch die Asche',
      items: [
        'Daueranimationen auf dem Grafik-Compositor: Filmkorn, Low-HP-Puls und Schrein-Schimmer malen die Arena nicht mehr pro Frame neu — spürbar auf schwächeren Maschinen und im Desktop-Fenster.',
        'Angriffsanimationen starten ohne erzwungenes Layout neu — Hieb, Rückstoß und Funken kosten im Kampf kaum noch etwas.',
        'Spielstand-Sicherung leichter: Die Backup-Rotation liest den Spielstand nicht mehr bei jedem Speichern komplett neu (3-Sekunden-Takt plus jeder Kill).',
        'Render-Pfad schreibt nur Änderungen: Im Kampf sinken die DOM-Operationen um gut die Hälfte; der Gegner-Inspektor baut sein Markup nur noch bei geänderter Signatur, Effekt-Knoten sind auf 14 pro Kämpfer gedeckelt.',
      ],
    },
    {
      heading: '0.16.3 — Momente, Klang & Layout',
      items: [
        'Elite-Moment: Eliten blitzen beim Auftritt gold auf und melden sich mit einem kurzen Sting.',
        'Musik atmet: Am Schrein ruhig, im Feld dichter — weiche Übergänge bei Abstieg und Rückkehr.',
        'Sieg & Prestige: Der Krone-Titel senkt sich glühend auf den Sieg-Screen; beim „Erneut erwachen" atmet der Hub kronengolden.',
        'Layout: Kontinent-Fortschritt sitzt unter dem Namen (0 links, 10 rechts), der Helden-HP-Balken ist doppelt so dick mit Wert darin, der EP-Balken gleich darunter.',
        'Fix: Das Intro-Overlay verdeckt den Schrein jetzt sicher — der Lebenskraft-Balken leuchtete vorher durch.',
      ],
    },
    {
      heading: '0.16.2 — Orientierung & Fortschritt',
      items: [
        'Siege-Balken: Im Kampf-HUD läuft neben der Zahl ein goldener Faden — in der Boss-Phase voll und golden.',
        'Gebiete-Kopf: Jeder Kontinent zählt seine offenen Gebiete („3 / 10" mit Balken), die Tiefen nennen die erreichte Tiefe.',
        'Prestige-Vorschau: Der Thron zeigt „Verfällt / Bleibt" in zwei klaren Spalten mit Belohnungs-Zeile.',
        'Vermächtnis-Akzent: Die Vermächtnis-Zeilen tragen Kronengold — klar getrennt vom Ruhm-Laden.',
      ],
    },
    {
      heading: '0.16.1 — Loot & Vergleich',
      items: [
        'Delta-Vergleich: Inventar-Tooltips zeigen unter „Getragen: …" nur die Unterschiede zum angelegten Stück — grün rauf, rot runter, Meisterschafts-Wechsel inklusive.',
        'Loot-Puls: Jedes Fund leuchtet beim Sterben des Gegners in seiner Seltenheitsfarbe auf — der Beute-Moment passiert in der Arena.',
        'Legendär: Legendäre Stücke hatten bisher gar keinen Toast und keinen Klang — jetzt eigenes Jingle plus oranger Meldestreifen.',
      ],
    },
    {
      heading: '0.16.0 — Feinschliff: XP-Streifen, Erstkill-Feier & Tastatur',
      items: [
        'XP-Streifen: Unter deiner Lebenskraft läuft jetzt ein goldener Faden mit dem Stufenfortschritt — Hover zeigt die exakten EP.',
        'Erstkill-Feier: Die erste Erlegung einer Kreaturart blendet „Neue Kreatur erlegt“ ein — das Bestiarium füllt sich nicht mehr heimlich.',
        'Tastatur: Tooltips öffnen sich per Fokus (Tab), Enter/Leer legt Ausrüstung ab oder skillt Runen — im Baum sind nur freischaltbare Knoten Tab-Stops.',
        'Prestige-Balance: Tiefenwissen zahlt jetzt +10 % Elite-/Boss-Fundchance je Stufe; jede erworbene Kronenasche segnet +3 % Asche & Erfahrung.',
        'Save-Härtung: Ein blockierter Speicher (Privatmodus, Quota) wirft das Spiel nicht mehr um — Warnung statt Absturz.',
        'Grafik-Polish: Sieben handgesetzte Gegner-Sprites mit Arena-Bühne je Kontinent, Funken/Hieb/HP-Geist bei Treffern, Kronen-Menü.',
        'Schrein: Heldenporträt mit Lebenskraft-Leiste und Regenerations-Timer („voll in 12 s“).',
        'Fixes: „Alles auswählen“ im Verkaufsmodus greift sofort; sinnlose Render-Arbeit im Kampf entfernt.',
      ],
    },
    {
      heading: '0.15.1 — Prestige: Erneut erwachen',
      items: [
        'Der Thron: Nach dem ersten Kronensieg öffnet sich die neue Kachel — hebe die Krone erneut und forme dich aus Kronenasche neu.',
        'Kronenasche: Jeder Lauf zahlt 1 plus 1 je fünf Tiefen; jede erworbene segnet alle künftigen Läufe (+2 % Asche & Erfahrung).',
        'Das Vermächtnis: Sechs Titel mit je drei Stufen — Grundwerte, Erfahrung, Asche, Start-Statpunkte, Fundchance, Start-Asche.',
        'Der Reset nimmt Zone, Held, Asche, Ausrüstung und Runen — Ruhm, Bestiarium, Chronik und dein Vermächtnis bleiben.',
        'Außerdem: Der Stat-Respec-Knopf sitzt jetzt sauber unter dem letzten Stat.',
      ],
    },
    {
      heading: '0.15.0 — Pfad-Bindung, Schrein-Regen & die Ruhm-Wirtschaft',
      items: [
        'Pfad-Bindung: Maximal zwei Fertigkeiten-Farben gleichzeitig — die übrigen versiegeln sich, Respec öffnet sie wieder.',
        'Die Schrein-Regeneration zählt: Wer aufbricht, nimmt seine Lebenskraft mit; nach dem Tod erwachst du mit einem Viertel.',
        'Ruhm wächst weiter: 9 neue Errungenschaften (+37 Ruhm) und 3 neue Käufe — Aschesegen, Tiefenkunde, Werkstatthandwerk.',
        'Statpunkte neu verteilen: In der Held-Szene lassen sich alle Statpunkte erstatten (Doppelklick bestätigt).',
        'Offline an der Boss-Wand? Der simulierte Held weicht aufs beste errungene Gebiet aus und farmt die Nacht weiter.',
        'Gegner-Inspektor (Hover) und Todesrückblick: Du weißt endlich, warum du gestorben bist.',
        'Fixes: Tiefenrelikt ehrt den Beutelschein, Offline zahlt Safedrops und Bestiarium, Klick aufs Boss-Gate geht sofort weiter.',
      ],
    },
    {
      heading: '0.14.0 — Ruhm, Safedrops & das Level-System',
      items: [
        'Ruhm: Errungenschaften zahlen jetzt eine eigene Währung — Beutelschein (+Inventar) und Zollerlass (−Todeszoll) im Ruhm-Laden.',
        'Tiefen-Meisterschaften von Relikten lassen sich für 2 Ruhm neu schmieden.',
        'Safedrops: Der erste Elite-Kill jedes Gebiets garantiert Beute, Bosse rollen 75 %.',
        'Level-System neu: Der Held hält konstant ~3 Stufen Abstand zu den Gegnern — kein Hintenherlaufen mehr.',
        'Meisterschafts-Rerolls zeigen ihren Grund und würfeln garantiert ein anderes Ergebnis.',
      ],
    },
    {
      heading: '0.13.0 — Bestiarium, Ruhm & Tiefenrelikte',
      items: [
        'Neues Bestiarium: 150 Kreaturen plus Tiefen-Namen — erlegen entschleiert, unerlegt bleibt „???"',
        '20 Errungenschaften von der ersten Ernte bis zur Aschenkrone — mit Fortschrittsanzeige.',
        'Tiefenrelikte: Der erste Boss jeder Aschentiefe hinterlässt ein Legendärstück mit ZWEI Meisterschaften und gesicherter Lifeleech.',
      ],
    },
    {
      heading: '0.12.1 — Hotfix: Werkstatt ohne Wartezeit',
      items: [
        'Die Werkstatt zeigt ihre Slots jetzt sofort beim Öffnen statt bis zu 3 Sekunden später.',
      ],
    },
    {
      heading: '0.12.0 — Zahlwerk & Härtung',
      items: [
        'Neue Statistik-Seite: Spielzeit, Tode, Beute je Seltenheit und Rekorde am Schrein.',
        'Verkaufswerte wachsen jetzt mit dem Itemlevel — Spätspiel-Verkäufe zählen endlich.',
        'Screenshake abschaltbar; Bewegungsreduktion aus der Systemeinstellung wird respektiert.',
        'Härtung: Item-Namen aus importierten Saves werden bereinigt, Tiefen-Zahlen geklemmt.',
      ],
    },
    {
      heading: '0.11.2 — Hotfix: Der Beutel ist wieder da',
      items: [
        'Auto-Verkauf „Aus" verkaufte heimlich JEDE Beute beim Fund — jetzt landet Loot wieder im Inventar, wie es die Einstellung verspricht.',
      ],
    },
    {
      heading: '0.11.1 — Die Krone überall',
      items: [
        'Setup-Installer und Browser-Tabs tragen jetzt ebenfalls die Aschenkrone.',
        'Das Spiel läuft zusätzlich im Browser: trobikus.github.io/ashen-crown',
      ],
    },
    {
      heading: 'Loot — Basen, Tiers, Affixe',
      items: [
        'Fünf Item-Basen pro Slot (35 insgesamt): Klinge bis Sense, Brustplatte bis Plattenharnisch — höhere Basen schalten per Itemlevel frei und rollen bis +50 % Hauptwert.',
        'Jede Basis trägt eine Prägung: Axt-Wucht gegen Speer-Präzision, Plattenharnisch gegen Knochenpanzer.',
        'Seltenheit kauft Affixplätze (0–4) aus Slot-Pools — Krit ist ab jetzt ein Wurf, kein Garant.',
        'Itemlevel sichtbar; gedrückte Alt-Taste zeigt die Roll-Spannen jedes Werts (Diablo-Lese).',
        'Meisterschaft rollt nur noch auf Legendär — und lässt sich jetzt neu schmieden.',
      ],
    },
    {
      heading: 'Werkstatt & Komfort',
      items: [
        'Meisterschaft neu schmieden: Der goldene Bonus lässt sich gegen viel Asche neu würfeln — die Jagd nach dem Perfekt-Wurf hat ein Zuhause (Doppelklick bestätigt).',
        'Umschmieden senkt das Itemlevel nie mehr — Tiefen-Beute bleibt beim Umschmieden wertvoll.',
        'Auto-Tür: Nach dem Boss geht es von allein weiter (Optionen → Spiel, abschaltbar).',
        'Auto-Verkauf: Beute unter einer gewählten Seltenheit wird beim Fund sofort zu Asche (Optionen → Spiel).',
        'Inventar voll? Beute wird sofort zum Verkaufspreis in Asche umgetauscht statt zu verfallen.',
      ],
    },
    {
      heading: 'Im Hintergrund',
      items: [
        'Die Offline-Zusammenfassung meldet jetzt auch gefundene Beutestücke.',
        'Tod an einer Boss-Wand erklärt den Weg: Gebiets-Reise (auch erneut ins gleiche Gebiet) setzt das Zählwerk zurück.',
        'Der Spielstand zählt jetzt Tode, Spielzeit und Beute je Seltenheit — Fundament für die Statistik-Seite.',
        'Der Balance-Simulator spielt das echte Loot-System mit: Neu vermessen ~58 Stunden bis zur Aschenkrone.',
      ],
    },
  ],
};

const STORAGE_KEY = 'ashen-crown-patchnotes';

// Lokales Datum als yyyy-mm-dd — „dieser Tag" zählt im Spieler-Localtime.
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function dismissedForToday() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return stored?.day === todayKey() && stored?.version === PATCH_NOTES.version;
  } catch {
    return false;
  }
}

function rememberDismissed() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ day: todayKey(), version: PATCH_NOTES.version }));
}

function renderNotes() {
  const versionEl = document.getElementById('patch-version');
  const dateEl = document.getElementById('patch-date');
  const bodyEl = document.getElementById('patch-body');
  versionEl.textContent = `v${PATCH_NOTES.version}`;
  dateEl.textContent = PATCH_NOTES.date;
  const headline = document.createElement('p');
  headline.className = 'patch-headline';
  headline.textContent = PATCH_NOTES.headline;
  bodyEl.replaceChildren(headline);
  for (const section of PATCH_NOTES.sections) {
    const heading = document.createElement('h3');
    heading.className = 'patch-heading';
    heading.textContent = section.heading;
    const list = document.createElement('ul');
    for (const item of section.items) {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    }
    bodyEl.append(heading, list);
  }
}

export function initPatchNotes() {
  if (dismissedForToday()) return;
  renderNotes();
  const modal = document.getElementById('patchnotes');
  const checkbox = document.getElementById('patch-skip-checkbox');
  checkbox.checked = false;
  modal.hidden = false;
  document.getElementById('patch-close').addEventListener('click', () => {
    if (checkbox.checked) rememberDismissed();
    modal.hidden = true;
  });
}
