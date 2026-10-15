// Patchnote-Fenster beim Spielstart: zeigt die neuesten Änderungen einmal
// pro Tag — oder sofort wieder, wenn eine neue Version neue Notizen bringt.
// Das Häkchen „Heute nicht mehr anzeigen" speichert Tag + Version.

export const PATCH_NOTES = {
  version: '0.11.0',
  date: '15.10.2026',
  headline: 'Loot nach Diablo-Handwerk — und eine Werkstatt, die den Endgame-Ascheberg frisst',
  sections: [
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
