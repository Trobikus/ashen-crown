// Patchnote-Fenster beim Spielstart: zeigt die neuesten Änderungen einmal
// pro Tag — oder sofort wieder, wenn eine neue Version neue Notizen bringt.
// Das Häkchen „Heute nicht mehr anzeigen" speichert Tag + Version.

export const PATCH_NOTES = {
  version: '0.15.0',
  date: '15.10.2026',
  headline: 'Ruhm wird zur Wirtschaft — und der Schrein atmet jetzt wirklich',
  sections: [
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
