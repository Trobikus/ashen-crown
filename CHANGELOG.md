# Changelog

Alle nennenswerten Änderungen an Ashen Crown werden hier dokumentiert.
Format orientiert an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/);
Versionen folgen [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### Behoben
- **Tiefenrelikt ehrt den Beutelschein**: Der Inventar-Check beim Relikt-Fund
  nutzte die Grundgrenze (40) statt der echten Obergrenze — mit Beutelschein
  wurde ein Relikt trotz freiem Platz zu Asche. Jetzt zählt `inventoryCap()`.
- **Offline-Fortschritt zahlt Elite-Safedrops**: Der erste Elite-Kill eines
  Gebiets garantiert offline wie online ein Stück — die Offline-Simulation
  pflegt das Safedrop-Register jetzt mit und übergibt den Garantiewurf.
- **Offline-Kills zählen ins Bestiarium**: Die Offline-Simulation buchte ihre
  Erlegungen nur auf die Gesamtsumme — jetzt landen sie wie im Feld unter dem
  Kreaturnamen.

## [0.14.0] — 2026-10-15

### Hinzugefügt
- **Ruhm — die Errungenschaften-Währung**: Jede Errungenschaft trägt 1–4
  Ruhm (nach Schwierigkeit, bis zu 40 gesamt). Ruhm wird nicht separat
  gespeichert, sondern aus den errungenen IDs abgeleitet — Ausgaben zählt
  `ruhmAusgegeben`. Alte Spielstände sind damit rückwirkend versorgt.
- **Ruhm-Laden** in der Errungenschaften-Szene: **Beutelschein** (+8
  Inventarplätze pro Stufe, 3 Stufen, 3/6/9 Ruhm) und **Zollerlass**
  (Todeszoll −3 % pro Stufe, 4 Stufen, 2/4/6/8 Ruhm — Boden bei 3 %).
  Beides permanent; Inventar-Anzeige und Todeszoll folgen den Käufen.
- **Tiefen-Meisterschaft neu schmieden** (Werkstatt, bei Tiefenrelikten):
  Die zweite Meisterschaft eines Relikts lässt sich für **2 Ruhm** neu
  würfeln — günstig und unbegrenzt, die Endgame-Jagd der Ruhm-Währung.

### Geändert
- **Safedrops**: Der **erste Elite-Kill eines Gebiets garantiert** ein
  Stück; Wiederholungs-Eliten rollen die alte Chance (8 %), der Boss
  kämpft nur einmal pro Gebiet und rollt erhöht (**75 %** statt 50 %),
  Normal-Gegner bleiben das seltene Ereignis (1 %). Auslöser war die
  Testermeldung „halbe Story durch, keine einzige Waffe gehabt": Bei 8 %
  Elite- und 50 % Boss-Chance war ein Waffen-Blackout über Dutzende
  Gebiete reines Pech. Sim-Impact: Kampagne 24,7 h → **~24,3 h**, Tode
  278 → **151** — gleiche Länge, halb so viele Tode, Loot-Fluss +40 %.
- **Heldenlevel hält konstant ~3 Stufen Abstand zu den Gegnern**: Bisher
  wuchsen die Gegner-EP exponentiell mit der Zone, während der
  Level-Bedarf quadratisch mit der Heldenstufe wächst — diese Kurven
  konnten keinen festen Abstand halten, und der Held lief Mitte Frostreich
  mit Stufe 16 gegen Gegner der Stufe 35 (Testermeldung). Die Gegner-EP
  werden jetzt direkt aus der Gegnerstufe abgeleitet (~11 Kills pro
  Level, quadratisch in der Gegnerstufe): Der Held holt innerhalb von
  ein bis zwei Gebieten auf und bleibt dann dauerhaft knapp unter den
  Gegnern. Alte Spielstände holen beim Weiterspielen selbst auf — der
  Abstand schließt sich, ohne Migration. Bestehende Saves mit
  überlevelten Helden profitieren unverändert von der EP-Dämpfung.
  Sim gegen die neue Kurve (ohne Safedrops gemessen): 24,7 h / 278 Tode
  bis zur Aschenkrone (vorher 56,2 h / 708) — ein Held, der mitwächst,
  ist stärker als einer, der 15 Stufen hinten hinkt; dafür endet er bei
  Stufe ~155 statt ~160. Der frühe EP-Boden (8/Kill in Zone 1) hält den
  ersten Boss erreichbar.
- Inventar-Obergrenze und Todeszoll sind keine Konstanten mehr, sondern
  folgen den Ruhm-Käufen (`inventoryCap()` / `deathPenalty()`).

### Behoben
- **Meisterschafts-Rerolls wirken wieder sichtbar**: Neu würfeln garantiert
  jetzt ein **anderes** Ergebnis (der Meisterschafts-Pool hat nur wenige
  Stats — vorher traf der Wurf häufig denselben Wert und das Schmieden
  wirkte wie ein No-op). Und wenn Asche oder Ruhm nicht reichen, sagt der
  Knopf jetzt den Grund („Zu wenig Asche — du hast …") statt still zu
  schweigen — bei Spätspiel-Preisen im Milliardenbereich war das die
  Quelle der Meldung „Meisterschaft umschmieden bewirkt nichts".

## [0.13.0] — 2026-10-15

### Hinzugefügt
- **Bestiarium** (neue Hub-Kachel): Alle 150 Kreaturen der fünf Kontinente
  plus die Namen der Tiefen, gruppiert nach Kontinent — wer sie noch nie
  erlegt hat, bleibt als „???" versiegelt; erlegte zählen ihre Kills.
  Das Spielstand-Feld `bestiary` (Name → Kills, Save v6) füllt sich beim
  Erlegen, rückwirkend ist nichts nachzuholen.
- **Errungenschaften** (neue Hub-Kachel): 20 Auszeichnungen aus den
  Statistik-Zählern — Jagd, Stürze, Spielzeit, Beute (inkl. Legendär-Jagd)
  und Reich-Fortschritt bis zur Aschenkrone und in die Tiefen. Gesperrte
  zeigen ihren Fortschritt, neue Errungenschaften feiern sich mit Toast
  und Klang; IDs liegen im Spielstand (`achievements`, Save v6).
- **Tiefenrelikte**: Der erste Boss einer Aschentiefe hinterlässt garantiert
  ein **Tiefenrelikt** — ein Legendärstück auf Tiefen-ilvl mit gesicherter
  Lifeleech und **zwei Meisterschaften** (dem neuen `mastery2`-Feld, das in
  allen Heldenwerten, Tooltips und der Werkstatt mitzählt). Das Jagdziel
  des Endgames: jede Tiefe belohnt den ersten Durchbruch, volle Inventare
  wandeln das Relikt in seinen Aschewert. ‼️ Werte-Balance der Relikte ist
  bewusst großzügig — die Tiefen sollen sich lohnen.

## [0.12.1] — 2026-10-15

### Behoben
- **Werkstatt zeigt Slots sofort**: Beim Öffnen des Crafting-Menüs blieb die
  Slot-Liste leer, bis der globale 3-Sekunden-Tick die Szene das nächste Mal
  rendernte — die Szene wird jetzt direkt beim Öffnen gerendert.

## [0.12.0] — 2026-10-15

### Hinzugefügt
- **Statistik-Seite** (neue Hub-Kachel): Spielzeit, erlegte Kreaturen, Tode,
  befreite Gebiete, höchst errungenes Gebiet und gefundene Beute je Seltenheit
  in Seltenheitsfarbe — die Zähler aus 0.11.2 bekommen ihr Gesicht.
- **Screenshake-Option** (Optionen → Anzeige): Die Arena wackelt nur noch,
  wenn sie soll; zusätzlich respektiert das Spiel `prefers-reduced-motion`
  aus der Systemeinstellung (Krits, Boss-Schläge, Partikel und Zahlen ohne
  Bewegung).
- **CI spielt den Balance-Simulator**: `--verify` läuft bei jedem Push und
  Pull-Request gegen die echte `data.js` — Kurven-Regressionen fliegen jetzt
  sofort auf, statt erst bei der nächsten Handabstimmung.

### Behoben
- **XSS-Klemme für Item-Namen**: Namen sind Freitext aus (importierten)
  Spielständen und landen in innerHTML-Tooltips — beim Laden werden jetzt
  HTML-Zeichen und Überlängen an der Quelle entfernt, bevor irgendetwas
  gerendert wird.
- **ilvl-Deckel für die Tiefen**: Ab Aschentiefe ~2.100/~2.800 wurden
  Gegnerwerte bzw. ilvl rechnerisch unendlich (NaN-Items, unbezwingbare
  Zahlen) — ein Zahlen-Deckel bei 1e15 (spielpraktisch Unerreichbares)
  klemmt jetzt sämtliches Tiefen-Wachstum.
- **Verkaufswert wächst mit dem Stück**: Bisher brachte ein Tiefenstück
  denselben Asche-Betrag wie ein Anfangsstück (Seltenheit × 4 + Stufe) —
  jetzt fließt das Ilvl ein (Seltenheit × (4 + Stufe) × (1 + 0,25 × Ilvl)),
  für Auto-Verkauf, Inventar-voll-Verkauf und manuelles Verkaufen gleicher-
  maßen.
- **Der Held lunget auch beim Verfehlen** — vorher stand er bei eigenen
  Fehlschlägen reglos, während der Gegner seine Fehlschläge choreografiert
  bekam.

## [0.11.2] — 2026-10-15

### Behoben
- **Auto-Verkauf „Aus" hat heimlich alles verkauft**: Die Standardeinstellung
  setzte die Verkaufsschwelle auf die Listengrenze statt auf null — der
  Vergleich „Seltenheits-Index unter der Schwelle" war damit für jede Beute
  wahr, und jeder Fund (bis hinauf zu Legendär) wurde beim Aufheben sofort
  zu Asche. Nichts landete je im Inventar. „Aus" heißt jetzt: nichts wird
  automatisch verkauft. Die Stufen „unter Selten" / „unter Episch"
  verhielten sich korrekt und sind unverändert.

## [0.11.1] — 2026-10-15

### Behoben
- **Branding lückenlos auf die Aschenkrone**: Der Windows-Setup-Installer
  trug bisher den NSIS-Standardpfeil — jetzt die Aschenkrone
  (`bundle.windows.nsis.installerIcon`). Die Spiel-Exe selbst
  (Desktop-Shortcut, Taskleiste, Explorer) trägt die Krone bereits seit
  0.11.0; dort zeigte nur der Altstand 0.10.0 noch das Tauri-Logo, bis
  das Auto-Update greift.
- **Favicon & Apple-Touch-Icon** für den Web-Build: Browser-Tabs auf
  GitHub Pages (und im Dev-Server) zeigen jetzt die Krone statt des
  Browser-Standard-Icons.

## [0.11.0] — 2026-10-15

### Hinzugefügt
- **Meisterschaft neu schmieden**: Der goldene Bonus auf Legendär-Stücken
  lässt sich in der Werkstatt gegen viel Asche neu würfeln — die Endgame-
  Asche-Senke und das Zuhause der Perfekt-Wurf-Jagd (Kosten skalieren mit
  der Werkstatt-Stufe, Doppelklick bestätigt, damit kein Fehlklick den
  guten Wurf wegwirft).
- **Auto-Tür** (Optionen → Spiel, standardmäßig an): Nach einem besiegten
  Boss geht die Tür von allein weiter — der Epitaph bleibt kurz lesbar,
  der Eintritt ins nächste Gebiet heilt voll. Abschaltbar für alle, die
  nach dem Boss erst farmen wollen.
- **Auto-Verkauf** (Optionen → Spiel): Beute unter einer gewählten
  Seltenheit („alles unter Selten“ / „alles unter Episch“) wird beim Fund
  sofort zum Verkaufspreis in Asche umgetauscht — das Inventar bleibt für
  echte Funde.
- **Der Held im Hub** (oben links): Name, Stufe und Lebenskraft-Balken. Der
  Schrein atmet — außerhalb des Felds regeneriert der Held **2 % seines
  maximalen Lebens pro Sekunde** (50 s von null auf voll). Die Rückkehr ins
  Hub heilt nicht mehr automatisch: Gefallen oder Rückzug hinterlässt den
  Balken, wie das Feld ihn hinterlassen hat; der Abstieg in die Krypta
  heilt weiterhin voll.
- **Itemlevel sichtbar**: Tooltips und die Werkstatt-Beschreibung zeigen
  „Seltenheit · Ilvl n". Neue Stücke speichern ihr Ilvl; Altbestand erhält
  eine Schätzung aus dem Hauptwert. Das Umschmieden zieht das Ilvl auf die
  aktuelle Werkstatt-Stufe.
- **Alt-Taste zeigt Roll-Spannen** (Diablo-Lese): Solange Alt gedrückt ist,
  steht hinter jedem Wert die Spanne, die dieses Feld bei Seltenheit, Ilvl
  und Basis hätte rollen können — z. B. „+45 % Kritschaden [30 – 60]“.
  Ohne Alt nur der gerollte Wert. Die Spannen spiegeln die Wurf-Arithmetik
  inklusive Zwischenrundung und Basis-Prägungen (Axt verschiebt die
  Krit-Spanne, Tier- und Seltenheitsmultiplikatoren die Hauptwerte).
- **Loot nach Diablo-Handwerk**: Seltenheit kauft **Affixplätze** (Gewöhnlich
  0, Magisch 1, Selten 2, Episch 3, Legendär 4) aus einem Slot-Pool ohne
  Doppelte — Waffen würfeln Kritchance/Kritschaden/%Schaden/Flatschaden,
  Rüstung %Lebenskraft/Lebenskraft/%Rüstung/Rüstung, Handschuhe mischen
  beides (inkl. Rüstung wie in D4). Die Wertebereiche steigen je Seltenheit
  (z. B. Kritschaden Legendär 30–60 %). Neue Item-Affixe fließen in alle
  Heldenwerte ein: **+X % Schaden, +X % Lebenskraft, +X % Rüstung,
  +X % Kritschaden**.
- **Basen als Stufenleiter** (D4): Die fünf Basen je Slot sind jetzt Tier
  1–5 und schalten per ilvl frei (ungefähr Zone 5/10/19/22); höhere Stufen
  rollen bis zu +50 % Hauptwert. Alte Basen veralten damit natürlich. Die
  Basis-Prägungen (Axt: Wucht, Speer: Präzision, Sense: doppelte
  Lifeleech-Chance, Kettenhandschuhe: Rüstung, …) bleiben als inhärente
  Identität erhalten; Lifeleech selbst bleibt Chance-Affix ab Episch.
- **Meisterschaft = Legendary Power**: rollt nur noch auf Legendär — auch
  bei Drops (bisher fälschlich schon auf Episch) und beim Umschmieden.

- **Statistik-Zähler im Spielstand**: Tode, Spielzeit und gefundene Beute
  (je Seltenheit) werden ab jetzt mitgezählt — das Fundament für die
  kommende Statistik-Seite. Alte Spielstände starten bei null und zählen
  ab dem Laden weiter; kaputte Werte zieht der Loader auf sichere Grenzen.

### Geändert
- Kritchance ist kein garantierter Waffen-Wert mehr, sondern ein Affix im
  Pool — ein magisches Stück kann sie haben oder auch nicht (Wertebereich
  leicht gesenkt: 2–3/3–5/5–8/7–10). „Bestes anlegen" bewertet die neuen
  %-Affixe heuristisch mit.
- **Fünf Item-Basen pro Slot** (35 statt 7): Jeder Drop würfelt eine Basis —
  Waffe: Klinge/Axt/Streitkolben/Speer/Sense, Brust: Brustplatte/Kettenhemd/
  Schuppenpanzer/Plattenharnisch/Knochenpanzer, Helm: Helm/Kübelhelm/
  Spangenhelm/Hornhelm/Kettenhaube, Hose: Beinlinge/Kettenbeinlinge/
  Plattenhose/Knochenhose/Schattenhose, Schuhe: Stiefel/Plattenschuhe/
  Knochenstiefel/Sporenstiefel/Wanderstiefel, Handschuhe: Handschuh/
  Fäustling/Kettenhandschuhe/Plattenhandschuhe/Krallenhandschuhe. Alte
  Spielstände behalten ihre Items samt Namen; das Umschmieden erhält die
  Basis des Stücks.
- **Basen tragen Prägungen**: Jede Basis hat eine eigene Stat-Identität —
  Wucht gegen Präzision bei Waffen (Axt/Streitkolben: mehr Schaden, weniger
  Krit; Speer: weniger Schaden, mehr Krit; Sense: doppelte Lifeleech-Chance),
  Ketten- und Plattenhandschuhe geben als Schadens-Slots zusätzlich Rüstung,
  und Rüstungsbasen schieben auf der Achse Lebenskraft ↔ Rüstung (z. B.
  Plattenharnisch: −15 % LP, +35 % Rüstung; Knochenpanzer: +25 % LP,
  −30 % Rüstung). Die erste Basis je Slot bleibt die neutrale Referenz;
  die Prägungen sind im Schnitt machtwertneutral.
- **Offline-Zusammenfassung meldet jetzt auch Beute** („…, 3 Beutestücke
  gefunden") — wie es der README bereits versprochen hat. Tode offline
  zählen mit in den Todes-Zähler.
- **Balance-Simulator spielt das echte Loot-System**: Seltenheitswürfe,
  Basen & Tiers, Affix-Pools, Lifeleech-Chancen und die Meisterschaft
  kommen direkt aus der echten `src/data.js` statt aus einer abgewandelten
  Kopie; `--verify --depths` rechnet die Tiefen jetzt wirklich (vorher
  endete die echte Welt bei Zone 50 und der Modus war ein No-op). Die
  Endlos-Wand bricht die Simulation sauber ab, statt Müllzeilen zu
  produzieren. Neu verifiziert (Seed 1234): **~58,4 h / 713 Tode /
  langsamste Killzeit ~71 s** bis zur Aschenkrone — der Loot-Overhaul hat
  das Hauptspiel gegenüber der 0.10.0-Messung (48,7 h / 618 Tode / ~40 s)
  spürbar verlängert; die Streuung zwischen Seeds ist groß (Glück bei
  Lifeleech- und Krit-Affixen). Die Gesamtlänge vor einem Release
  wohlwollend prüfen.
- **Umschmieden mit Ilvl-Sockel**: Das Umschmieden zieht das Ilvl auf die
  Werkstatt-Stufe, senkt es aber nie mehr — Tiefen-Beute (höheres ilvl als
  der Werkstatt-Deckel) verliert beim Umschmieden nicht ihre Werte, und die
  Würfe rollen auf der Sockel-Höhe statt auf der Werkstatt-Stufe.
- **Save-Version 5** (vor 0.11.0: v4): Kennzeichnet das Loot-Format (Basis,
  Ilvl) und die Statistik-Zähler. Keine Migration nötig — der Loader härtet
  Altbestand ohnehin nach.
- Die Alpha-Version heißt ab jetzt **0.11.0** (package.json, Tauri,
  Cargo — der Cargo-Stand hing noch bei 0.9.1).

### Behoben
- **Inventar voll ist kein Verlust mehr**: Beute wird bei vollem Inventar
  sofort zum Verkaufspreis in Asche umgetauscht (mit Meldung) — vorher
  versprach der Toast einen Asche-Zerfall, den es nie gab.
- **Neue Drops tragen ihr Ilvl sofort** — bisher setzten erst geparsede
  Spielstände (also ein Neuladen) das Feld, wodurch Ilvl-Anzeige und
  Alt-Roll-Spannen bis dahin auf der neutralen Schätzung statt auf der
  echten Basis saßen.
- **Boss-Wand-Guidance beim Tod**: Stirbt der Held an einem unbesiegten
  Boss, erklärt der Todes-Screen jetzt den Weg zurück — das Gebiet spawnt
  bis zur Befreiung nur noch den Boss, und der erneute Eintritt über die
  Gebiete-Karte setzt das Zählwerk für sicheres Farmen zurück.
- Getragene Stücke lassen sich bei vollem Inventar nicht mehr still
  ablegen — eine Meldung weist auf den vollen Beutel.

## [0.10.0] — 2026-10-15

### Hinzugefügt
- **Fünf Raritäten** (Anlehnung an Diablo 4): Gewöhnlich (weiß) → **Magisch
  (blau, neu)** → Selten (jetzt gelb) → Episch (lila) → **Legendär (orange,
  neu)**. Höhere Stufen tragen stärkere Werte, mehr Kritchance und seltener
  werdende Drop-Gewichte (54/26/14/5/1). Die goldene **Meisterschaft wandert
  von Episch zu Legendär**.
- **Zufällige Affixe**: Jedes Stück rollt seine Werte (Basiswerte 85–115 %,
  Kritchance und Lifeleech als Bereich je Seltenheit) — das „perfekte" Item
  ist ein Fund, kein Rechenresultat, und lohnt das Farmen.
- **Lifeleech** als Waffen-Affix: sitzt **ausschließlich auf Waffen** und erst
  ab **Episch** — und selbst dort nur gerollt (Episch 40 % … Legendär 65 %
  Chance, nie garantiert). Zwei Varianten: **Prozent** (10–20 % des
  ausgeteilten Schadens je nach Stufe/Rolle) oder **Flat** (feste Lebenskraft
  pro Treffer, skaliert mit der Gegenstandsstufe). Lifeleech ist ein
  Survivability-Bonus zum Durchhalten des Farmens — keine Pflicht, keine
  Königsdisziplin. Einmal-Hinweis beim ersten Fund.
- **Der Held verfehlt auch**: 12 % seiner Schläge gehen daneben („Verfehlt"
  über dem Gegner) — kein Schlag sitzt garantiert.
- **Schadensspanne**: Jeder Helden-Schlag rollt ±15 % um seinen Wert — die
  Schadenszahlen tanzen statt zu frieren (Erwartungswert unverändert, die
  Simulationen bleiben exakt). Der Helden-Screen zeigt den Schaden als
  Spanne („85 – 115") statt als Fixwert.
- **Gegner-Level & -Typ sichtbar**: Über dem Gegner steht jetzt „Lv 12 · Elite"
  — Normal trägt die Gebietsnummer, Elite +2, Boss +3. Die Gebiete-Übersicht
  zeigt je Zeile die Levelrange des Gebiets (z. B. „Lv 12–15"); die Stufen
  fließen auch in die XP-Abmagerung ein.
- **Atmosphäre in der Arena** (alles Code, keine Assets):
  - **Treibende Partikel** je Kontinent — Glutfunken in den Aschenlanden,
    Schneefall im Frostreich, Sporen-Drift im Faulmoor, Blutstaub im
    Blutmark, Sternenstaub in der Sternenleere, Aschenregen in den Tiefen.
  - **Vignette + feines Filmkorn** über der Arena (SVG-Noise, zur Laufzeit
    generiert).
  - **Angriffs-Bewegung**: Der Angreifer stößt vor, der Getroffene weicht
    zurück; beide Figuren atmen im Idle. Gegner steigen beim Spawn aus der
    Asche auf und zerfallen beim Tod.
  - **Screenshake**: leicht bei kritischen Treffern, hart bei Boss-Schlägen.
  - **Niedrige Lebenskraft**: roter Pulssaum um die Arena plus
    Herzschlag-Sound (wie immer prozedural). Bosse bekommen einen dumpfen
    Trommelpuls, solange sie auf dem Feld stehen.
- **Boss-Warnung beim Rasten**: Verlässt man einen laufenden Bosskampf zum
  Schrein, weist ein Toast darauf hin, dass sich der Boss vollständig heilt
  (das Zurücksetzen an sich galt schon immer).
- **Schrein-Reset-Warnung** (siehe unten) und Balance-Simulator mit
  **deterministischem Seed** (`--seed`) sowie modellierten Schrein-Runden —
  Runs sind jetzt vergleichbar.

### Geändert
- **Balance-Überholung gegen das Godlike-Problem** — der Held ließ sich zu
  leicht über die Kurve treiben:
  - **Erfahrung neu gebaut**: Basis-XP 10 statt 30, XP-Wachstum 1,15 statt
    1,38 pro Ebene, und der Levelbedarf steil angezogen (9L²+13L statt
    4L²+6L). Gegner unter dem eigenen Niveau magern ab — pro Level Differenz
    ein Zwanzigstel, ab **20 Stufen Unterschied nichts mehr**. Gegnerstufen
    steigen 3 pro Gebiet (Range: Normal 3N−2, Elite +2, Boss +4 — beginnt
    nie mehr als 1 unter der Höchststufe des Vorgehenden); der Held endet
    im Hauptspiel bei Stufe ~160 statt ~3.000.
  - **Statpunkte**: 2 pro Stufe statt 3.
  - **Fertigkeitenbaum erwacht ab Stufe 20**: Kachel vorher versiegelt,
    Runenpunkte erst ab da. Alle Runenwerte auf die Hälfte gedämpft.
  - **Kritchance deckelt bei 75 %**; **Gegner greifen zu 15 % daneben**.
  - **Gegnerschaden wächst jetzt wirklich** (1,24 pro Ebene, siehe „Behoben")
    und Bosse sind spürbar härter (4,2× Leben, 1,55× Schaden): Ab Zone ~16
    entstehen echte **Wände** — der Held stirbt am Boss, kehrt zurück, farmt
    Asche und Beute, schmiedet in der Werkstatt und bricht die Wand.
  - **Beute ist ein Ereignis**: Drop-Chancen gesenkt (Normal 1 %, Elite 8 %,
    Boss 50 % statt 2/15/100 %).
  - **Startzonen-Fundament**: Normale Gegner starten mit +12 Lebenskraft, das
    linear bis Zone 10 schwindet — ein Damage-All-in oneshottet die ersten
    Gebiete nicht mehr, ohne den weiteren Kurvenverlauf zu verbiegen.
  - **Item-Wachstum angeglichen** (ilvl 1,29 statt 1,28) — zusammen mit der
    gedämpften XP-Kurve das Zeitziel: laut `tools/balance-sim.mjs` (echte
    data.js, deterministischer Seed) dauert das Hauptspiel jetzt
    **~48,7 h mit 618 Toden** (zuvor 6,7 h, 0 Tode): sichere Zonen 1–8,
    Wand-Zonen mit Farm-Zwang ab 9 und im Endgame 39–50, langsamste
    Killzeit ~40 s.
- **Werkstatt-Umschmieden**: Kette auf vier Stufen verlängert (… → Episch →
  Legendär) mit eskalierenden Kosten; Legendär rollt die Meisterschaft.

### Entfernt
- **Klinge schärfen / Haut härten**: Die Asche-Upgrades im Kampfbildschirm sind
  hinfällig — Werte wachsen jetzt über Statpunkte, Gear und Werkstatt. Asche
  finanziert ausschließlich die Werkstatt. (Alte Spielstände laden die
  zurückgelassenen Zähler gefahrlos los.)
- **Kill-Regeneration**: Siege heilen nicht mehr. Der Held regeneriert im Feld
  nie von selbst — heilen tut nur das Rasten am Schrein (bzw. das Betreten des
  Felds vom HUB aus) und, mit Glück, eine Lifeleech-Waffe. Die Offline-
  Simulation rechnet beide Lifeleech-Varianten.

### Behoben
- **Gegner trafen das ganze Spiel lang für exakt 1 Schaden**: Beim Wachstum
  rundete `Math.round(1 × 1,34)` stets zu 1 — Schadenswachstum, Boss- und
  Elite-Multiplikatoren waren wirkungslose Zierde. Gegnerschaden bleibt jetzt
  Float und wird erst beim Spawn bzw. Zuschlagen gerundet. (Die obige
  Balance-Überholung stand auf diesem Bein.)
- **Spielstand zurücksetzen resettet jetzt wirklich**: Zuvor löschte der Knopf
  nur den Hauptspielstand — die Backup-Kette blieb, und der nächste Start lud
  still das alte Backup samt der irreführenden Meldung „Hauptspielstand war
  beschädigt". Der Reset räumt jetzt auch die drei Backups weg und verhindert
  im selben Zug, dass ein Zwischenspeicher den alten Zustand vor dem Reload
  zurückschreibt.
- Epische Drops warfen eine `ReferenceError` (fehlender `rollMastery`-Import in
  `src/items.js`) und blockierten den Kampf-Tick, statt Beute ins Inventar zu
  legen.


## [0.9.1] — 2026-10-14

### Hinzugefügt
- **Lebenspunktzahlen in der Arena** für Held und Gegner — bei langen
  Bosskämpfen sieht man endlich, wie nah der Kill ist.
- **Alpha-Vorbereitung**: Versionsanzeige jetzt auch im Web-Build
  (statisch aus der package.json, Desktop bevorzugt weiter die Tauri-Abfrage),
  Alpha-Zeile im Hauptmenü und ein „GitHub Issues"-Knopf unter Optionen →
  Spiel — öffnet die Issue-Liste und legt die Adresse zusätzlich in die
  Zwischenablage (Desktop-Webviews blocken Pop-ups teils).

### Behoben
- **Save-Härtung**: Korrupte Items (unbekannter Slot oder Seltenheit, fehlende
  Namen, NaN-Werte, doppelte oder fehlende IDs) werden beim Laden repariert
  oder verworfen, statt den Render-Loop zu crashen; Kernfelder wie Asche,
  Stufe oder Lebenskraft werden auf sichere Grenzen gezogen. Die Backup-Kette
  greift unverändert davor.

## [0.9.0] — 2026-10-14

### Hinzugefügt
- **Onboarding für neue Helden**: Einmal-Hinweise im richtigen Moment statt
  eines Tutorials — eine zweiseitige Feld-Einführung beim ersten Abstieg
  (pausiert den Kampf), ein Rast-Tipp beim ersten Boss (pausiert ebenfalls),
  der Punkte-Hinweis beim ersten Aufstieg, der Beute-Hinweis beim ersten Drop,
  der Meisterschafts-Hinweis beim ersten epischen Stück und Einsteig-Hinweise
  für Fertigkeiten, Gebiete und Werkstatt. Jeder Hinweis erscheint genau
  einmal und wird im Spielstand gemerkt (Save-Version 4): Bestehende Helden
  erhalten nur die Hinweise, die sie noch nicht verpasst haben.

## [0.8.0] — 2026-10-14

### Hinzugefügt
- **Chronik** (neues Hub-Tile): Die Asche erinnert sich — eine wachsende
  Sammlung der Erzählung, unterteilt in Die Erweckung, die fünf Kontinent-
  Annalen mit den Epitaphen ihrer bezwungenen Bosse, die Tiefen und den
  Thron. Freigeschaltet wird durchs Spielen (Zone frei → Annale, Boss
  gefallen → Epitaph); Versiegeltes kündigt sich an.
- **Intro-Erzählung**: Neue Helden erwachen nicht mehr in einem Satz, sondern
  in vier klickbaren Seiten — vom Reich vor der Asche bis zum Ruf der Krone.
- **Kontinent-Annalen**: Beim ersten Betreten jedes Kontinents (und der
  Tiefen) erzählt eine Einblendung, welches Reich hier versuchte, der Asche
  zu entkommen — der Hof im Frost, die Gelehrten im Moor, die Blutwährung
  des Ostens, der Aufstieg zu den Sternen.
- **50 Boss-Epitaphe**: Jeder Boss-Kill öffnet sein Epitaph über dem
  Gate-Text — von Grabwächter („Er bewacht ein Grab, das nie gegraben
  wurde: sein eigenes.“) bis zur Aschenkrone. Die Tiefen-Bosse flüstern
  vier rotierende Zeilen.
- Sieg-Text erweitert („Vier Reiche sind auf dem Weg hierher verbrannt.“).

### Geändert
- **Gegnernamen loretreu**: Die Normal- und Elite-Gegner aller Kontinente sind
  jetzt die Menschen und Ränge der untergegangenen Reiche — der verbrannte Hof
  (Grabesdiener, Ascheschreiber, Leichenprediger, Staubkämmerer), das geflohene
  Frostvolk (Frostpilger, Eiskämmerin, Schneewaise, Winterbotschafter), die
  ertränkten Gelehrten des Moores (Archivarsleim, Heilkundiger, Reliquien-
  schwimmer, Seuchenärztin), das blutbezahlende Kriegsvolk (Lanzknecht,
  Doppelgelder, Rostfähnrich, Zahlmeister) und die Aufgestiegenen (Leerenpilger,
  Sternwarter, Astrolabit, Sternenschürfer). Die 50 Boss-Namen bleiben — sie
  tragen den Erzählbogen und die Epitaphe.

### Behoben
- Überholt ein Overlay ein anderes (Boss-Gate → Kontinent-Annale), stoppte
  dessen Timer nicht und blätterte den Nachfolger vorzeitig weg.

## [0.7.0] — 2026-10-14

### Hinzugefügt
- **Feld & Schrein**: Fortschritt gibt es nur im Feld — die Kampfszene läuft
  weiter, solange sie offen ist, am Schrein und in allen Menüs rastet der Held
  (und heilt). Der Offline-Fortschritt bleibt: Wer im Feld aufhört, kämpft beim
  nächsten Start bis zu 8 Stunden nach — inklusive Todesrisiko und Boss-Stopp
  (Bosse verlangen deine Anwesenheit).
- **Todeszoll**: Beim Fallen behält die Asche **15 % der aktuellen Asche** ein —
  live wie offline. Rasten am Schrein vor einem Boss ist jetzt die kluge Wahl.
- **Gegnerprofile**: Jede Zone trägt ein Temperament — **Flink** (weniger Leben,
  schneller Angriff) oder **Massiv** (mehr Leben, härterer Schlag), Standard als
  drittes im Wechsel. Bosse verfallen unter 35 % Lebenskraft in **Wut**
  (beschleunigte Angriffe, rotes Glühen, goldener „Wütend"-Schriftzug).
- **Kontinent-Färbung**: Jeder Gegner trägt die Tönung seiner Heimat
  (Aschenbraun, Frostanthrazit, Moorgrün, Blutrot, Sternenviolett, Tiefenschwarz).
- **Kill-Regeneration**: Jeder Sieg heilt **10 % der maximalen Lebenskraft**
  (grüne Heil-Zahlen) — Zonen-Farming ist durchhaltbar, Bosskämfe bleiben die
  Nagelprobe, weil während des Kampfs nichts heilt.
- Sound für die Enrage-Phase; Erst-Abstieg-Hinweis, der das Feld-Schrein-
  Prinzip erklärt.

### Geändert
- **Offline-Simulation auf Live-Formeln gebracht**: Sie rechnet jetzt mit Krit,
  Angriffstempo, Gegnerprofilen, erlittenem Schaden und Kill-Regeneration statt
  mit idealisierten Werten; die Zusammenfassung meldet gefallene Helden und
  wartende Bosse. Save-Version 3 (alte Spielstände gelten als im Feld).
- Balance-Simulator (`tools/balance-sim.mjs`) modelliert Profile, Enrage,
  Regeneration und Todeszoll mit.

## [0.6.0] — 2026-10-14

### Hinzugefügt
- **Vollbild-Option** unter Optionen → Anzeige: Das Spiel startet jetzt im
  Fenster (1280×800) statt erzwungen im Vollbild; der Toggle wechselt
  live (Desktop über die Tauri-Window-API, Web über die
  Browser-Fullscreen-API) und die Wahl wird persistiert und beim
  nächsten Start wiederhergestellt.

## [0.5.0] — 2026-10-14

### Hinzugefügt
- **Sound** (prozedural über die Web Audio API, keine Assets): Treffer,
  Kritische Treffer, Siege, Boss-Auftritte, Stufenaufstiege, Raritäten-
  Beute, Tod und Sieg-Fanfare — dazu ein dunkler Ambient-Drone als
  Musik. Neuer Optionen-Tab **Audio** mit Reglern für Gesamt, Effekte
  und Musik.
- **Feedback-Loop**: Boss-Fortschritt im HUD („7 / 30", Boss-Phase in
  Gold), Goldener „Stufe X"-Schriftzug beim Aufstieg, Toasts für seltene
  und epische Beute (in Seltenheitsfarbe) und einen gedrosselten
  Hinweis, wenn das Inventar voll ist und Beute verfällt.

### Behoben
- Optionen wurden nie aus dem Speicher geladen und nie gespeichert
  (fehlender `SETTINGS_KEY`-Import) — alle Einstellungen verhielten sich
  wie Zurückgesetzt nach jedem Neustart.

## [0.4.0] — 2026-10-14

### Hinzugefügt
- **Save-Schutz**: Spielstände tragen jetzt eine Version (Migration-Hook
  für künftige Formate). Automatische **rotierende Backups** (3
  Generationen, min. 10 Minuten Abstand) — ist der Hauptspielstand
  beschädigt, lädt das Spiel den jüngsten Backup automatisch und weist
  darauf hin.
- **Export/Import** unter Optionen → Spiel: Spielstand als JSON-Datei
  sichern und wieder einlesen (Desktop mit nativen Datei-Dialogen,
  Web-Build über Download/Auswahl). Vor jedem Import wird automatisch
  ein Backup des aktuellen Standes erstellt.
- **Runen-Respec**: Im Fertigkeiten-Baum lassen sich alle Fertigkeiten
  gegen Asche neu schneiden (zweimal klicken zur Bestätigung) — Kosten
  skalieren mit Item-Level und Zahl der Runen, Punkte werden voll
  erstattet.

## [0.3.0] — 2026-10-14

### Hinzugefügt
- **Ende und Endlos-Spiel**: Nach „Herz der Leere" wartet der
  Sieg-Bildschirm „Die Aschenkrone" mit Runenstatistik; dahinter öffnen
  sich die prozeduralen **Aschentiefen** (Zone 51+) mit eigenen Gegnern
  und römisch nummerierten Ebenen — eine Endlos-Wand mit gedämpftem
  XP-Wachstum, damit der Treadmill nie kippt.
- **Balance-Simulator** (`tools/balance-sim.mjs`): spielt die echten
  Spiel-Formeln mit Spieler-Richtlinien durch und misst Kill-Zeiten,
  Tode und Überfarm-Aufwand pro Zone (`--verify` gegen die echte data.js,
  `--depths` für die Tiefen, `--sweep` für Kurvensuche).

### Geändert
- **Komplettes Rebalancing**: Gegner-Wachstum von ×3,7 pro Zone auf ×1,4
  gedämpft. Das alte Modell brach real ab Zone ~12 zusammen (Sim-Befund:
  10–60 Stunden Zwangsgrind je Zone ab Zone 8, danach unspielbar). Neu:
  Hauptspiel ~6–12 h mit stetigem Anstieg (Killzeiten 1,5 s → ~50 s),
  kein forciertes Überfarmen, alle Zahlen bleiben präzise (unter 2^53).
- Item-Level wachsen geometrisch (×1,28/Zone, Kontinent-Sprünge) statt
  der alten Handkurve; Elite/Boss-Verhältnisse leicht nachjustiert
  (Elite HP ×2,4, Boss HP ×4). Werkstatt skaliert bewusst nur bis zum
  Hauptspiel-Ende weiter.
- Alte Spielstände bleiben kompatibel; Helden der alten Kurve stürmen
  die flacheren Zonen schneller durch.

## [0.2.2] — 2026-10-14

### Geändert
- Update-Banner zeigt beim Laden nur noch „Updating" mit Prozentanzeige
  über dem Balken statt Patchnote-Text.

## [0.2.1] — 2026-10-14

### Hinzugefügt
- Versionsnummer im Hauptmenü angezeigt (nur Desktop-App).

## [0.2.0] — 2026-10-14

### Hinzugefügt
- **Auto-Update**: Beim Öffnen prüft das Spiel auf neue GitHub-Releases und
  installiert gefundene Patches selbst (Fortschrittsbalken im Hauptmenü,
  überspringbar) — signiert über den offiziellen Tauri-Updater, mit
  automatischer Release-Pipeline für Windows-Installer.
- **Fünf Kontinente** mit je zehn Gebieten (50 Gebiete, 150 Gegner): die
  Aschenlande, das Frostreich, das Faulmoor, das Blutmark und die
  Sternenleere — Bestien der neuen Kontinente folgen generatorisch der
  Progression der handabgestimmten Ausgangszone (Elite/Boss-Verhältnisse).
- **Kontinent-Karussell** in der Gebiete-Karte: aktueller Kontinent zentriert,
  Pfeile zum Durchschalten, Zurücksetzen auf den Aufenthaltskontinent.
- **Kompakte Zahlenformatierung** („12,4K", „3,2M", deutsches Komma) für
  Asche, Kosten, Heldenwerte, EP, Schadenszahlen und Item-Tooltips.
- CI-Workflow (Web-Build + Rust-Check), Dependabot, Repo-Community-Dateien.

### Behoben
- Beenden-Button im Hauptmenü schließt die App jetzt tatsächlich
  (`core:window:allow-close` fehlte in den Tauri-Capabilities).

## [0.1.0] — 2026-10-13

### Hinzugefügt
- Grundspiel: Auto-Kampf, Zonen mit Bossen nach 30 Siegen, Eliten alle 10 Siege.
- Skilltree im Path-of-Exile-Stil (217 Knoten, 4 Pfade, 12 Keystones, 12 Brücken).
- Loot mit 3 Raritäten über 7 Rüstungsslots, Inventar-Tools (Sortieren,
  Bestes anlegen, Verkauf).
- Werkstatt: Verstärken und Umschmieden, Episch rollt eine Meisterschaft.
- Offline-Fortschritt (bis 8 Stunden) mit Zusammenfassung.
- Desktop-Shell via Tauri 2, Vollbild-Start.
- Ausrüstungs-Icons als maskierte SVGs (game-icons.net, CC BY 3.0).

[Unreleased]: https://github.com/Trobikus/ashen-crown/compare/v0.14.0...HEAD
[0.14.0]: https://github.com/Trobikus/ashen-crown/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/Trobikus/ashen-crown/compare/v0.12.1...v0.13.0
[0.12.1]: https://github.com/Trobikus/ashen-crown/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/Trobikus/ashen-crown/compare/v0.11.2...v0.12.0
[0.11.2]: https://github.com/Trobikus/ashen-crown/compare/v0.11.1...v0.11.2
[0.11.1]: https://github.com/Trobikus/ashen-crown/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/Trobikus/ashen-crown/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/Trobikus/ashen-crown/compare/v0.9.1...v0.10.0
[0.9.1]: https://github.com/Trobikus/ashen-crown/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/Trobikus/ashen-crown/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/Trobikus/ashen-crown/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/Trobikus/ashen-crown/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/Trobikus/ashen-crown/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/Trobikus/ashen-crown/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Trobikus/ashen-crown/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Trobikus/ashen-crown/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/Trobikus/ashen-crown/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Trobikus/ashen-crown/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Trobikus/ashen-crown/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Trobikus/ashen-crown/releases/tag/v0.1.0
