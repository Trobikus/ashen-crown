// Patchnote-Fenster beim Spielstart: zeigt die neuesten Änderungen einmal
// pro Tag — oder sofort wieder, wenn eine neue Version neue Notizen bringt.
// Das Häkchen „Heute nicht mehr anzeigen" speichert Tag + Version.

export const PATCH_NOTES = {
  version: '0.10.0',
  date: '15.10.2026',
  headline: 'Das große Balance-Update: härter, tiefer, lohnender',
  sections: [
    {
      heading: 'Loot — neu aufgebaut',
      items: [
        'Fünf Raritäten: Gewöhnlich, Magisch (neu), Selten (gelb), Episch (lila), Legendär (orange, neu).',
        'Jedes Stück rollt seine Werte — das perfekte Exemplar ist ein Fund.',
        'Lifeleech sitzt nur auf Waffen ab Episch: als Prozente deines Schadens oder als feste Zahl pro Treffer.',
        'Beute ist selten geworden — jeder Drop zählt.',
      ],
    },
    {
      heading: 'Kampf — nichts ist gratis',
      items: [
        'Der Held verfehlt 12 % seiner Schläge, Gegner 15 % — „Verfehlt" über dem Ziel.',
        'Kritchance deckelt bei 75 %, Rüstung mindert nie mehr als die Hälfte.',
        'Schadensspanne: Jeder Schlag rollt ±15 %.',
        'Keine Kill-Heilung mehr: Nur der Schrein heilt — und Lifeleech-Waffen.',
        'Gegner tragen jetzt ihr Level (Normal = Gebietsnummer, Elite +2, Boss +4) und richten echten Schaden an.',
      ],
    },
    {
      heading: 'Fortschritt — der lange Weg',
      items: [
        '2 Statpunkte pro Stufe; der Fertigkeitenbaum erwacht ab Stufe 20 (gedämpfte Werte).',
        'Erfahrung gibt es nur von Würdigen — 20 Stufen unter dir bringen nichts.',
        'Bosse sind Wände: Stirbst du, farmst du Asche und Gear — und schlägst zurück.',
        'Hauptspiel-Ziel: rund 40–50 Stunden bis zur Aschenkrone. Viel Erfolg.',
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
