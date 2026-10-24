# itch.io-Release — Checkliste für den Publish

> Diese Checkliste führt in 7 Schritten von „nichts hochgeladen“ zu
> „veröffentlicht“. Bausteine in diesem Ordner: Storepage-Texte
> (`storepage-de.md`, `storepage-en.md`), Launch-Devlog (`launch-devlog.md`),
> Attribution (`credits-attribution.md`), Cover (`cover-de.png`/`cover-en.png`,
> 1260×1000) und Screenshots (`../screenshots/` deutsch, `../screenshots-en/`
> englisch — frisch erzeugt mit `node tools/screenshots.mjs`).

## 1 · itch-Projekt anlegen (einmalig)

- [ ] Auf itch.io einloggen → **Dashboard → Create new project**
- [ ] Titel: `Ashen Crown`, URL z. B. `trobikus/ashen-crown` (die URL merken)
- [ ] **Noch nicht veröffentlichen** — erst speichern; die Page bleibt im Entwurf, bis unten „Save & view page“ → Visibility auf Public gesetzt wird.

## 2 · Pipeline verbinden (einmalig)

- [ ] In `.github/workflows/itch-deploy.yml` oben `ITCH_TARGET` prüfen (Zeile ~35, Form `nutzer/projekt`) und an die echte Projekt-URL anpassen.
- [ ] itch → **Settings → API keys** → neuen Key anlegen (Schreibrechte genügen) **oder** lokal `butler login` ausführen und den Key aus `~/.config/itch/butler` nehmen.
- [ ] GitHub → Repo → **Settings → Secrets and variables → Actions** → `BUTLER_API_KEY` anlegen.
- [ ] Ersten Test: Repo → **Actions → „itch.io Deploy“ → Run workflow** nur mit HTML-Kanal. Danach stehen auf itch unter „Files“ die Browser-Version; im Editor bei der Datei `html` prüfen, dass sie als **„embed in browser“**/HTML erkannt wird (sonst Kind of project → HTML setzen).

## 3 · Seite befüllen

- [ ] **Cover:** `docs/itch/cover-de.png` hochladen (itch fordert 630×500-Format; die 1260×1000-Datei erfüllt das Seitenverhältnis und bleibt auf Retina scharf).
- [ ] **Screenshots:** in der Reihenfolge aus `storepage-de.md` (kampf → skilltree → schrein → werkstatt → held → gebiete → menu).
- [ ] **Beschreibung/Kurzbeschreibung/Credits:** Blöcke aus `storepage-de.md` kopieren (englische Fassung: `storepage-en.md` — alternativ zweisprachig hintereinander).
- [ ] **Felder:** Kind of project „Downloadable“ + „HTML5“, Classification „Video game“, Genre „Role Playing“, Tags (`idle`, `incremental`, `dark fantasy`, …), Made with (`HTML5`, `JavaScript`, `Tauri`), Languages „Deutsch, English“, Release state „Alpha“ — Details-Tabelle steht in `storepage-de.md`.
- [ ] **Preis:** „Name your own price“ mit 0 $ Minimum (Alpha; Spenden möglich). Hinweis: `LICENSE` erlaubt Spielern private, nicht-kommerzielle Nutzung — Spenden an dich als Urheber sind davon nicht berührt; wer ganz sichergehen will, passt die LICENSE-Formulierung vor dem Publish an.
- [ ] **Community:** Kommentare aktivieren; Devlogs laufen automatisch mit.

## 4 · Builds hochladen

- [ ] **HTML5 (Browser):** Actions → „itch.io Deploy“ → Kanal `:html` (baut `dist/` und pusht). Alternativ manuell: `dist/` als ZIP (index.html im Wurzelverzeichnis) direkt im Dashboard hochladen und als HTML einbetten.
- [ ] **Windows:** Kanal `:windows` zieht den NSIS-Installer des neuesten GitHub-Releases (ein Release-Tag `v*` baut ihn automatisch — inkl. macOS/Linux seit der Release-Matrix).
- [ ] Im Dashboard unter „Files“ beide Kanäle sehen; Reihenfolge beliebig, itch gruppiert nach Plattform.

## 5 · Vor dem Veröffentlichen: selbst spielen

- [ ] Page im **Browser über die itch-URL** spielen (nicht nur lokal — der iframe ist der echte Einsatzort): Start, ein Kampf, Optionswechsel DE/EN, **Spielstand exportieren**.
- [ ] Desktop-Download einmal ziehen, installieren, Spielstand aus dem Browser **importieren** (der Weg, den Spieler nehmen werden).
- [ ] Handy kurz gegenprobe — das Spiel ist Desktop-first; die Storepage deutet das über den Desktop-Save-Hinweis an. Soll es ausdrücklich dastehen, unter „Gut zu wissen“ einen Satz ergänzen („Am besten am Desktop spielen“).

## 6 · Veröffentlichen

- [ ] **Visibility → Public**, Page noch einmal lesen (Links, Attribution!), dann Launch-Devlog aus `launch-devlog.md` als ersten Devlog-Post veröffentlichen.

## 7 · Nach dem Launch

- [ ] Erste Kommentare/Kommentar-Benachrichtigungen aktivieren (itch → Settings → Notifications).
- [ ] Nach jedem Release-Tag `v*` pusht die Pipeline beide Kanäle automatisch — Versionen auf itch folgen damit dem GitHub-Release ohne Handarbeit.
- [ ] Patchnotes aus `src/patchnotes.js` als Devlog-Posts wiederverwenden (Vorlagen in `launch-devlog.md`).

---

## Wartung der Store-Assets

| Asset | Befehl | Hinweis |
| --- | --- | --- |
| Screenshots (DE+EN) | `node tools/screenshots.mjs` | Braucht `pnpm build` + Edge; Demo-Stand sitzt im Skript |
| Cover (DE+EN) | `node tools/make-cover.mjs` | Reines Playwright/Edge-Rendering der festen Vorlage |
| Storepage-Zahlen | Mit README „The game in numbers“ abgleichen | Beide Storepage-Dateien zitieren dieselben Zahlen |

Bei Versionsänderungen: Cover ist versionlos (kein Datum, keine Nummer) — muss nicht neu gerendert werden; Screenshots nur bei sichtbaren UI-Änderungen.
