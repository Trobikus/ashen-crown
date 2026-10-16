# Prestige-Optionen-Papier — „Erneut erwachen"

> Design-Entwurf, Stand v0.15.0 (2026-10-15). **Entschieden (2026-10-15):
> Modell B mit A-Fundament, Währung „Kronenasche", Run-2-Ziel ~60–75 %,
> Annalen erneut zeigen.** Alle Prozentwerte sind Sim-Kandidaten, keine
> Zusagen; das Tuning beginnt mit einem `balance-sim`-Lauf.

## 1. Was Prestige hier leisten soll

- **Replay-Motivation** nach Krone und Tiefen: ein Grund, den Kampagnen-Loop
  freiwillig wieder zu durchlaufen.
- **Wiederkehrende Meta-Währung**: Ruhm ist an Errungenschaften gebunden und
  damit endlich (~77 gesamt). Prestige schafft die zweite, unbegrenzte Quelle.
- **Kürzere Folgeläufe** ohne Treadmill-Kipps: Run 2 soll spürbar schneller
  sein — aber Zone 1 darf nie trivial werden (gleiche Philosophie wie das
  gedämpfte Tiefen-Wachstum).

**Sim-Basis (geduldige Politik):** Kampagne 25,8 h / 151 Tode bis zur Krone.
**Zielkorridor für Run 2:** grob 60–75 % der Basiskampagne — Stellschrauben
je Modell unten, exakte Werte liefert der Sim vor der Umsetzung.

## 2. Gemeinsame Basis (alle Modelle)

### Die Währung: Kronenasche

- **Erwerb:** 1 Kronenasche für das Heben der Krone, +1 je volle 5 errungene
  Aschentiefen im Lauf. Ein Krone-plus-Tiefe-5-Lauf zahlt also 2, ein
  Tiefe-20-Lauf 5. Wer tief geht, formt schneller neu.
- **Status:** Meta-Ebene wie Ruhm — überlebt jeden Prestige, wird nicht
  konvertierbar. Zwei Währungen, zwei Aufgaben: **Ruhm** (einmalige Errungen-
  schaften → permanente Erleichterungen), **Kronenasche** (wiederholbare Läufe
  → Macht des nächsten Erwachens).
- **Namens-Kandidaten:** *Kronenasche* (Empfehlung — passt zum Thron-Motiv),
  *Kronenstaub*, *Echomark*, *Die Erinnerung*.

### Der Reset (Modell-unabhängig)

| Zurückgesetzt | Bleibt |
| --- | --- |
| Zone, `cleared`, Siege, Safedrop-Register | **Ruhm-Ökosystem** (Errungenschaften, Ruhm, Laden) |
| Asche | **Bestiarium, Statistik, Chronik** (kumulativ) |
| Heldenlevel, XP, Statpunkte & -verteilung | **Ruhm-Laden-Käufe** (Beutelschein & Co.) |
| Runen (Skills) und Pfad-Bindung | Onboarding-Hinweise (kein erneutes Nerven) |
| Inventar & Ausrüstung (inkl. Tiefenrelikten) | Sieg-Flag (Krone gilt als gehoben) |

Harte Begründung für Gear-Reset: Ein Tiefenrelikt (ilvl 500k+) in Zone 1 löscht
die Kampagne — Beute **muss** im Lauf bleiben. Dafür erzählt der Sieg-Screen
beim Prestige, was das Erbe des Laufs war.

**Freischaltung:** Nach dem ersten Kronensieg erscheint die Hub-Kachel
**„Der Thron"** (dort, wo die Krone ruht). Prestige = Thron besteigen, Vorschau
anzeigen, was verfällt, Doppelklick bestätigt. Der Sieg-Screen bekommt einen
Zweitknopf „Erneut erwachen".

**Save v9:** `kronenasche` (Erwerbs-Buch), `prestigeRuns` (Zähler), plus je
Modell eine Kauf-Struktur. Errungenschaften-Neuzugänge als Ruhm-Quelle
(„Zweites Erwachen", „Dreifach geboren") — die Ruhm-Wirtschaft wächst mit.

## 3. Modell A — „Der Aschensegen" (flach & schnell)

**Prinzip:** Jede Kronenasche segnet den *nächsten* Lauf pauschal — kein Kaufen,
keine Auswahl, die Währung wirkt direkt.

- **Wirkung je Kronenasche:** +10 % Asche-Ertrag, +8 % Erfahrung — dafür
  +4 % Gegner-Leben und +4 % Gegner-Schaden. Additiv gestapelt, kein
  Zinseszins: 3 Kronenaschen = +30 %/+24 % Ertrag gegen +12 % Widerstand.
- **Stellschrauben:** Ertrags-Bonus, Gegner-Bump, Tiefe-Bonus auf den Erwerb.
  Der Sim sucht den Punkt, an dem Run 2 im Zielkorridor liegt.

| + | − |
| --- | --- |
| Kleinster Aufwand (~1 Session: Währung, Reset, zwei Faktoren, Sim) | Wenig „Meta-Gefühl" — kein Kaufen, kein Shapen |
| Kann nicht falsch gebaut werden (keine Fehlinvestition) | Kronenasche ist Zähler, keine Wirtschaft — kein Sink |
| Stilistisch konsistent (gedämpfte Kurven wie die Tiefen) | Langfristig austauschbar; Ausbau zu B/C später nötig |

## 4. Modell B — „Das Vermächtnis" (gestufte Titel)

**Prinzip:** Kronenasche kauft **Titel** mit Stufen — das Erwachen wird
formbar. Empfohlener Start-Satz (je 3 Stufen, Kosten 1/2/3 Kronenasche):

| Titel | Wirkung je Stufe |
| --- | --- |
| *Zweiter Atem* | Start +5 % Lebenskraft & Schaden (Helden-Grundwert) |
| *Aschengeist* | +5 % Erfahrung |
| *Beutelspähler* | +5 % Asche-Ertrag |
| *Alter Pfad* | Start +2 Statpunkte frei verteilt |
| *Tiefenwissen* | +3 % Elite-/Boss-Fundchance (Deckel) |
| *Der Vorbereitete* | Start mit 25 Asche je Stufe (frühe Werkstatt) |

- Pro Lauf fließen 1–5 Kronenasche — der Titel-Satz (~24 Kosten) füllt sich über
  mehrere Läufe; Reihenfolge wählt der Spieler = **Run-Shaping** ohne Baum-UI.
- **Stellschrauben:** Kosten, Stufen-Werte, Titel-Satz. Kein Start-in-Zone-X und
  kein Start-Gear im ersten Satz — beides kippt Zone 1 und wird bewusst
  zurückgehalten (Kandidat für späteren Teuer-Titel).

| + | − |
| --- | --- |
| Sichtbare, thematische Belohnungen („Du erwachst als …") | Mittlerer Aufwand (~2–3 Sessions: Käufe, UI, Sim) |
| Entscheidungs-Tiefe ohne zweiten Skilltree | Fehlinvestitionen möglich → sorgfältige Kostenskala |
| Wächst sauber: neue Titel = neue Content-Patches | Mehr Text/Balance als A |

## 5. Modell C — „Die Ewige Asche" (Meta-Baum)

**Prinzip:** Ein zweiter, kleiner Fertigkeitenbaum (24–30 Knoten, drei Zweige
im Stil der Haupt-Pfade) mit Kronenasche als Punkten — inklusive Keystones mit
Tradeoffs, damit die Baum-Identität erhalten bleibt: *„Zweites Erwachen: +15 %
auf alles — die Gegner erinnern sich: +10 %."*

| + | − |
| --- | --- |
| Tiefste Replay-Werte, echtes Endgame-Bau-Feld | Größter Aufwand (4+ Sessions, eigene Design-Runde für den Baum) |
| Stilistische Krönung („die Asche erinnert sich") | Baum × Pfad-Bindung × Ruhm-Laden = dreidimensionale Balance |
| Skaliert für 1.0+ (Knoten nachrüstbar) | Overkill, wenn Run 2–3 vorerst genügen |

## 6. Vergleich & Empfehlung

| | A Aschensegen | B Vermächtnis | C Ewige Asche |
| --- | --- | --- | --- |
| Aufwand | ~1 Session | ~2–3 Sessions | 4+ Sessions |
| Replay-Wert | solide, flach | hoch, sichtbar | höchst, tief |
| Balance-Risiko | gering | mittel | hoch |
| Sim-Aufwand | klein | mittel | groß |
| Erweiterbar zu | → B/C | → C | — |

**Empfehlung: B, mit A als Fundament.** Kronenasche, Reset und Thron-UI sind in
allen Modellen gleich — sie werden so gebaut, dass der Aschensegen (A) als
Baseline-Effekt je Kronenasche klein mitläuft (z. B. +2 % Ertrag), und die
Titel aus B die eigentliche Währung **ausgeben**. Damit existiert von Tag eins
eine echte Kronenasche-Wirtschaft, C bleibt als 1.0-Vision offen, ohne
Rückbau. Der Sim (`--prestige N`-Modus) modelt Run 2 und Run 3 vor jeder
Freigabe.

## 7. Folgearbeiten nach der Entscheidung

1. Save v9 (Kronenasche, Lauf-Zähler, Käufe) mit Migration.
2. `balance-sim.mjs`: Prestige-Parameter + Zielkorridor-Check als CI-Step.
3. Thron-Kachel + Sieg-Screen-Zweitknopf + Prestige-Vorschau (Doppelklick).
4. Errungenschaften „Zweites Erwachen" / „Dreifach geboren" (Ruhm-Faucet).
5. Feintuning per Sim; Zahlen dieses Papiers sind Kandidaten, keine Zusagen.

## 8. Offene Fragen an die Entscheidung

1. **Modell:** A, B (Empfehlung: B mit A-Fundament) oder direkt C?
2. **Währungsname:** Kronenasche (Empfehlung) / Kronenstaub / Echomark / …?
3. **Tempo-Ziel:** Run 2 auf ~60–75 % der Basiskampagne (Empfehlung) — oder
   aggressiver (~50 %, Risiko: Zone 1–10 fühlen sich leer an)?
4. **Reset-Feinheit:** Kontinent-Annalen beim zweiten Lauf erneut zeigen
   (Empfehlung: ja, sie sind Teil des Wiedererkens) oder stumm bleiben?

## 9. Sim-Befund (2026-10-16, erste `--prestige`-Messung)

`tools/balance-sim.mjs --prestige` misst Run 2 gepaart über 120 Seeds gegen
die Basiskampagne. Methodik-Notiz: Ein Einzel-Seed ist Rauschen — die
Baseline schwankt je Seed zwischen ~8 und ~95 h, weil Wände zufällig brechen
oder nicht. Belastbar sind nur Median/geo-⌀ über viele Seeds; das
Rausch-Fundament liegt bei ±5–10 %-Punkten.

| Szenario (Run-1-Push) | Kronenasche | Run 2, Median über Seeds |
| --- | --- | --- |
| Krone | 1 | ~92–99 % |
| Krone + Tiefe 5 (kanonisch) | 2 | ~93–102 % |
| Krone + Tiefe 20 | 5 | ~87–93 % |
| Vermächtnis voll (36) | 36 | ~72–81 % |

**Befund:** Der Zielkorridor 60–75 % für Run 2 ist mit den gebauten
Stellschrauben unerreichbar. Frühe Runs (1–5 Kronenasche) landen bei
~90–100 % der Basiskampagne; selbst das voll ausgebaute Vermächtnis nur bei
~72–81 %. Ein Extrem-Test (Fundament 5×, Titel-Werte 3×) bewegte frühe Runs
weiterhin nicht unter ~80 %, füllte aber immerhin den Sättigungsfall
(62–73 %) — und ließe das +x-%-Fundament ungebremst mit der lebenslangen
Kronenasche wachsen (Treadmill-Risiko).

**Entscheidungsoptionen:**

1. **Korridor als Sättigungsziel verstehen** — Run 3+ mit gefülltem
   Vermächtnis soll im 60–75-%-Band liegen, Run 2 darf bei ~85–95 % bleiben.
   Mit moderatem Tuning (Fundament ~3 %, Titel leicht angehoben) erreichbar,
   ohne Zone 1 zu kippen. Geringster Aufwand.
2. **Früh-Skip-Mechanik nachrüsten** — Start-in-Zone-X-/Start-Gear-Titel
   (bewusst zurückgehalten, siehe §4): die einzige realistische Route, Run 2
   selbst in den Korridor zu bringen. Neuer Titel-Satz = Balance-Risiko.
3. **Korridor senken** (z. B. 75–90 % für Run 2) und das Prestige als
   langsamen Komfort definieren statt als Speedup-Sprung.

Bis zur Entscheidung läuft der CI-Step `--prestige` berichtend (ohne
`--gate`); das Gate prüft den Median-Korridor, sobald der Zielkanon
festgelegt ist.
