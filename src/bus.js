// Der Manager-Bus: Die zentrale Vermittlungsstelle des Laufs. Module mit
// Kern-Diensten (Rendern, Szenenwechsel, Lebenskraft des Helden, Kampf-
// Fortschritt) melden sie hier an; Verbraucher ziehen sie per use(), statt
// game.js kreuzweise zu importieren. So bleibt der Abhängigkeitsbaum ein
// Stern um den Bus — game.js liefert, die Fach-Module konsumieren.
//
// Anmeldung geschieht auf Modul-Ebene in game.js (Funktionsdeklarationen
// sind gehoistet, die Dienste existieren also, bevor der erste Gameplay-
// Code läuft); abgefragt wird erst zur Laufzeit.

const services = new Map();

// Melde einen Dienst unter seinem Namen an — erneutete Anmeldung ersetzt.
export function provide(name, service) {
  services.set(name, service);
}

// Hole einen Dienst. Vor ensureInit angemeldete Dienste sind jederzeit da;
// ein fehlender liefert undefined statt zu werfen — Aufrufer entscheiden.
export function use(name) {
  return services.get(name);
}
