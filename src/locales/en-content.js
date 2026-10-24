// Englische Inhaltsnamen: Gebiete, Gegner, Item-Basen, Runen, Errungenschaften,
// Läden und Titel — der deutsche Name ist der Schlüssel (siehe lname() in
// src/i18n.js). Unbekannte Schlüssel fallen durch, Spieler- und Altbestand-
// Namen bleiben also unverändert stehen.
export const EN_NAMES = {
  // ——— Helden ———
  'Held': 'Hero',
  'Der Erweckte': 'The Awakened',

  // ——— Kontinente ———
  'Die Aschenlande': 'The Ashen Lands',
  'Das Frostreich': 'The Frost Realm',
  'Das Faulmoor': 'The Rot Moor',
  'Das Blutmark': 'The Blood March',
  'Die Sternenleere': 'The Star Void',
  'Die Tiefen': 'The Depths',

  // ——— Gebiete: Die Aschenlande ———
  'Aschenkrypta': 'Ashen Crypt',
  'Knochengewölbe': 'Bone Vault',
  'Aschekatakomben': 'Ash Catacombs',
  'Grabestiefe': 'Grave Depths',
  'Thronhalle der Asche': 'Throne Hall of Ash',
  'Glutgruft': 'Ember Tomb',
  'Knochenlabyrinth': 'Bone Labyrinth',
  'Aschenabgrund': 'Ashen Abyss',
  'Knochenkathedrale': 'Bone Cathedral',
  'Herz der Asche': 'Heart of Ash',

  // ——— Gebiete: Das Frostreich ———
  'Frostkrypta': 'Frost Crypt',
  'Reifgewölbe': 'Rime Vault',
  'Eiskatakomben': 'Ice Catacombs',
  'Schneetiefe': 'Snow Depths',
  'Halle des Frosts': 'Hall of Frost',
  'Frostgruft': 'Frost Tomb',
  'Eisverlies': 'Ice Dungeon',
  'Winterabgrund': 'Winter Abyss',
  'Eiskathedrale': 'Ice Cathedral',
  'Herz des Winters': 'Heart of Winter',

  // ——— Gebiete: Das Faulmoor ———
  'Moorkrypta': 'Moor Crypt',
  'Faulgewölbe': 'Rot Vault',
  'Sumpfkatakomben': 'Swamp Catacombs',
  'Modertiefe': 'Mould Depths',
  'Halle der Fäulnis': 'Hall of Rot',
  'Pestgruft': 'Plague Tomb',
  'Schlinglabyrinth': 'Strangler Labyrinth',
  'Moorabgrund': 'Moor Abyss',
  'Moorkathedrale': 'Moor Cathedral',
  'Herz des Moores': 'Heart of the Moor',

  // ——— Gebiete: Das Blutmark ———
  'Blutkrypta': 'Blood Crypt',
  'Rostgewölbe': 'Rust Vault',
  'Eisenkatakomben': 'Iron Catacombs',
  'Kriegstiefe': 'War Depths',
  'Halle des Blutes': 'Hall of Blood',
  'Rostgruft': 'Rust Tomb',
  'Klingenlabyrinth': 'Blade Labyrinth',
  'Blutabgrund': 'Blood Abyss',
  'Eisenkathedrale': 'Iron Cathedral',
  'Herz des Blutes': 'Heart of Blood',

  // ——— Gebiete: Die Sternenleere ———
  'Leerenkrypta': 'Void Crypt',
  'Nachtgewölbe': 'Night Vault',
  'Sternenkatakomben': 'Star Catacombs',
  'Leerentiefe': 'Void Depths',
  'Halle der Leere': 'Hall of the Void',
  'Finsternisgruft': 'Dark Tomb',
  'Sternenlabyrinth': 'Star Labyrinth',
  'Leerenabgrund': 'Void Abyss',
  'Sternenkathedrale': 'Star Cathedral',
  'Herz der Leere': 'Heart of the Void',

  // ——— Gegner: Die Aschenlande (Normal · Elite · Boss je Gebiet) ———
  'Ascheratte': 'Ash Rat', 'Grabesdiener': 'Grave Servant', 'Grabwächter': 'Grave Warden',
  'Knochenkriecher': 'Bone Creeper', 'Beinhauskämmerer': 'Ossuary Chamberlain', 'Gebeinwächter': 'Bone Guardian',
  'Aschenwicht': 'Ash Imp', 'Ascheschreiber': 'Ash Scribe', 'Aschenmutter': 'Ash Mother',
  'Grabwurm': 'Grave Worm', 'Leichenprediger': 'Corpse Preacher', 'Der Bestattete': 'The Interred',
  'Hofschatten': 'Court Shade', 'Kronenritter': 'Crown Knight', 'Der Thronende': 'The Enthroned',
  'Glutschleicher': 'Ember Stalker', 'Funkenmagd': 'Spark Maiden', 'Glutfürst': 'Ember Lord',
  'Knochenläufer': 'Bone Runner', 'Knochenherold': 'Bone Herald', 'Knochenkoloss': 'Bone Colossus',
  'Aschenwanderer': 'Ash Wanderer', 'Staubkämmerer': 'Dust Chamberlain', 'Der Verschluckte': 'The Swallowed',
  'Knochenchor': 'Bone Choir', 'Grabesorganist': 'Grave Organist', 'Der Knochenkönig': 'The Bone King',
  'Ascheavatar': 'Ash Avatar', 'Ewige Glut': 'Eternal Ember', 'Der Aschegott': 'The Ash God',

  // ——— Gegner: Das Frostreich ———
  'Frostpilger': 'Frost Pilgrim', 'Eiskämmerin': 'Ice Chamberlain', 'Der Frostherzog': 'The Frost Duke',
  'Reifknecht': 'Rime Serf', 'Gewölbejäger': 'Vault Hunter', 'Der Reifwächter': 'The Rime Warden',
  'Schneewaise': 'Snow Orphan', 'Katakombenwache': 'Catacomb Guard', 'Die Eisjungfrau': 'The Ice Maiden',
  'Schneewühler': 'Snow Burrower', 'Gefrorenes Gefolge': 'Frozen Retinue', 'Der Eingefrorene': 'The Frozen One',
  'Winterherold': 'Winter Herald', 'Eisritter': 'Ice Knight', 'Der Winterkönig': 'The Winter King',
  'Frostläufer': 'Frost Runner', 'Frostwartin': 'Frost Keeper', 'Der Eisbann': 'The Icebind',
  'Kettenfrost': 'Chainfrost', 'Frostkerkerer': 'Frost Jailer', 'Sturmfessel': 'Stormfetter',
  'Schneesturmschreiter': 'Blizzard Strider', 'Winterbotschafter': 'Winter Envoy', 'Das Winterherz': 'The Winter Heart',
  'Chor des Frosts': 'Choir of Frost', 'Frostorganist': 'Frost Organist', 'Der Eispriester': 'The Ice Priest',
  'Winteravatar': 'Winter Avatar', 'Ewiger Frost': 'Eternal Frost', 'Der Frostgott': 'The Frost God',

  // ——— Gegner: Das Faulmoor ———
  'Moorkriecher': 'Moor Creeper', 'Moorpilger': 'Moor Pilgrim', 'Der Moorgraf': 'The Moor Count',
  'Moderschleicher': 'Mould Stalker', 'Archivarsleim': 'Archivist Slime', 'Die Moormutter': 'The Moor Mother',
  'Sumpfwicht': 'Swamp Imp', 'Heilkundiger': 'Herbalist', 'Der Schleimfürst': 'The Slime Lord',
  'Madenwühler': 'Maggot Burrower', 'Reliquienschwimmer': 'Relic Swimmer', 'Der Verweste': 'The Rotted',
  'Hofsmoder': 'Court Mould', 'Pestherold': 'Plague Herald', 'Der Moorkönig': 'The Moor King',
  'Pestträger': 'Plague Bearer', 'Seuchenärztin': 'Plague Doctor', 'Der Pestfürst': 'The Plague Lord',
  'Dornenschlinger': 'Thorn Swallower', 'Rankenwürger': 'Vine Strangler', 'Die Schlingmutter': 'The Strangle Mother',
  'Sumpfschatten': 'Swamp Shade', 'Tiefenschleim': 'Deep Slime', 'Der Verschlundene': 'The Engulfed',
  'Chor der Moder': 'Choir of Mould', 'Pestorganist': 'Plague Organist', 'Der Faulpriester': 'The Rot Priest',
  'Mooravatar': 'Moor Avatar', 'Ewige Fäulnis': 'Eternal Rot', 'Der Moorgott': 'The Moor God',

  // ——— Gegner: Das Blutmark ———
  'Blutschleicher': 'Blood Stalker', 'Söldnerleiche': 'Mercenary Corpse', 'Der Blutgraf': 'The Blood Count',
  'Rostkriecher': 'Rust Creeper', 'Rostfähnrich': 'Rust Ensign', 'Die Rostkönigin': 'The Rust Queen',
  'Eisenwicht': 'Iron Imp', 'Waffenknecht': 'Armsman', 'Der Eisenfürst': 'The Iron Lord',
  'Lanzknecht': 'Landsknecht', 'Doppelgelder': 'Doppelsoldner', 'Der Schlachtherr': 'The Warmaster',
  'Hofsmörder': 'Court Assassin', 'Blutritter': 'Blood Knight', 'Der Blutkönig': 'The Blood King',
  'Blutwurm': 'Blood Worm', 'Zahlmeister': 'Paymaster', 'Der Schlächter': 'The Butcher',
  'Klingentänzer': 'Blade Dancer', 'Stahlweber': 'Steel Weaver', 'Der Stahlkoloss': 'The Steel Colossus',
  'Blutschatten': 'Blood Shade', 'Rostschreiter': 'Rust Strider', 'Der Blutherr': 'The Blood Lord',
  'Chor der Klinge': 'Choir of the Blade', 'Rostorganist': 'Rust Organist', 'Der Blutpriester': 'The Blood Priest',
  'Blutavatar': 'Blood Avatar', 'Ewige Wut': 'Eternal Wrath', 'Der Blutgott': 'The Blood God',

  // ——— Gegner: Die Sternenleere ———
  'Nachtschleicher': 'Night Stalker', 'Leerenpilger': 'Void Pilgrim', 'Der Nachtfürst': 'The Night Lord',
  'Leerenkriecher': 'Void Creeper', 'Sternwarter': 'Star Warden', 'Der Sternenwächter': 'The Star Guardian',
  'Sternenwicht': 'Star Imp', 'Astrolabit': 'Astrolabite', 'Die Sternenmutter': 'The Star Mother',
  'Nachtwühler': 'Night Burrower', 'Sternenschürfer': 'Star Miner', 'Der Gestürzte Stern': 'The Fallen Star',
  'Nachtherold': 'Night Herald', 'Sternenritter': 'Star Knight', 'Der Sternenkönig': 'The Star King',
  'Finsterniswurm': 'Gloom Worm', 'Schwarzfunke': 'Black Spark', 'Der Finsterfürst': 'The Dark Lord',
  'Sternenläufer': 'Star Runner', 'Mondweber': 'Moon Weaver', 'Der Sternenkoloss': 'The Star Colossus',
  'Nachtschatten': 'Night Shade', 'Leerenschreiter': 'Void Strider', 'Der Verschlinger': 'The Devourer',
  'Chor der Sterne': 'Choir of Stars', 'Nachtorganist': 'Night Organist', 'Der Sternenpriester': 'The Star Priest',
  'Leerenavatar': 'Void Avatar', 'Ewige Nacht': 'Eternal Night', 'Die Aschenkrone': 'The Ashen Crown',

  // ——— Gegner der Tiefen ———
  'Aschenecho': 'Ash Echo', 'Tiefenschleicher': 'Depth Stalker', 'Nachtasche': 'Night Ash', 'Staubgeborener': 'Dustborn', 'Echo der Gebeine': 'Echo of Bones',
  'Grabanomalie': 'Grave Anomaly', 'Leerenspross': 'Void Offshoot', 'Ascheprime': 'Ash Prime', 'Tiefenwächter': 'Depth Warden',
  'Hüter der Tiefe': 'Keeper of the Depth', 'Der Namelose': 'The Nameless', 'Wächter der Aschenkrone': 'Warden of the Ashen Crown', 'Das stille Herz': 'The Silent Heart',

  // ——— Ausrüstungs-Slots ———
  'Waffe': 'Weapon', 'Brust': 'Chest', 'Helm': 'Helm', 'Hose': 'Legs', 'Schuhe': 'Boots',
  'Handschuh Links': 'Glove Left', 'Handschuh Rechts': 'Glove Right',
  'Waffe ablegen': 'Unequip weapon', 'Brust ablegen': 'Unequip chest', 'Helm ablegen': 'Unequip helm',
  'Hose ablegen': 'Unequip legs', 'Schuhe ablegen': 'Unequip boots',
  'Handschuh Links ablegen': 'Unequip glove left', 'Handschuh Rechts ablegen': 'Unequip glove right',

  // ——— Item-Basen ———
  'Klinge': 'Blade', 'Axt': 'Axe', 'Speer': 'Spear', 'Streitkolben': 'Mace', 'Sense': 'Scythe',
  'Brustplatte': 'Breastplate', 'Kettenhemd': 'Chainmail', 'Schuppenpanzer': 'Scale Armor', 'Knochenpanzer': 'Bone Cuirass', 'Plattenharnisch': 'Plate Harness',
  'Spangenhelm': 'Spangenhelm', 'Kettenhaube': 'Chain Coif', 'Hornhelm': 'Horned Helm', 'Kübelhelm': 'Kettle Helm',
  'Beinlinge': 'Chausses', 'Kettenbeinlinge': 'Chain Chausses', 'Schattenhose': 'Shadow Leggings', 'Knochenhose': 'Bone Leggings', 'Plattenhose': 'Plate Leggings',
  'Stiefel': 'Boots', 'Wanderstiefel': 'Traveler Boots', 'Sporenstiefel': 'Spurred Boots', 'Knochenstiefel': 'Bone Boots', 'Plattenschuhe': 'Plate Sabatons',
  'Handschuh': 'Glove', 'Fäustling': 'Mitten', 'Krallenhandschuhe': 'Claw Gloves', 'Kettenhandschuhe': 'Chain Gloves', 'Plattenhandschuhe': 'Plate Gloves',

  // ——— Seltenheiten und Namens-Suffixe ———
  'Gewöhnlich': 'Common', 'Magisch': 'Magic', 'Selten': 'Rare', 'Episch': 'Epic', 'Legendär': 'Legendary',
  'der Asche': 'of Ash', 'des Funkens': 'of the Spark', 'der Gebeine': 'of Bones', 'der Krone': 'of the Crown', 'der Aschenkrone': 'of the Ashen Crown',

  // ——— Runenbaum: Start ———
  'Der erste Funke in der Asche.': 'The first spark in the ash.',

  // ——— Runenbaum: Krieg ———
  'Wucht': 'Force', 'Wuchtiger Hieb': 'Weighty Blow', 'Wildheit': 'Ferocity', 'Zermalmend': 'Crushing', 'Kriegsfürst': 'Warlord',
  'Kriegslied': 'War Song', 'Schlachtruf': 'Battle Cry', 'Nerven aus Stahl': 'Nerves of Steel', 'Henkerswerk': "Headsman's Work", 'Zorn der Asche': 'Wrath of Ash',
  'Blutrausch': 'Blood Frenzy', 'Zweite Klinge': 'Second Blade', 'Klingensturm': 'Blade Storm', 'Blutdurst': 'Bloodlust', 'Scharfer Rand': 'Keen Edge',
  'Knochenbrecher': 'Bonebreaker', 'Überwältigende Gewalt, zerbrechliches Fleisch.': 'Overwhelming force, brittle flesh.',
  'Todesklinge': 'Deathblade', 'Jeder Schlag ein Todesurteil.': 'Every strike a death sentence.',
  'Raserei': 'Frenzy', 'Wer nie stillsteht, wird nie gefasst.': 'Whoever never stands still is never caught.',

  // ——— Runenbaum: Haut ———
  'Steinnarbe': 'Stone Scar', 'Eisenhaut': 'Iron Skin', 'Schildseele': 'Shield Soul', 'Dornenpanzer': 'Thorn Plate', 'Fels in der Brandung': 'Rock in the Breakers',
  'Derbe Haut': 'Thick Skin', 'Zähes Fleisch': 'Tough Flesh', 'Dicke Schwiele': 'Hard Callus', 'Massiv': 'Massive', 'Gigantisch': 'Gigantic',
  'Narbengewebe': 'Scar Tissue', 'Sturmfest': 'Stormfast', 'Granithaut': 'Granite Skin', 'Unbeugsam': 'Unbending', 'Mauer der Asche': 'Wall of Ash',
  'Ungebrochen': 'Unbroken', 'Die Mauer fällt nicht. Sie tötet nur langsamer.': 'The wall does not fall. It only kills slower.',
  'Aschengestalt': 'Ashen Form', 'Was aus Asche geformt ist, bricht nicht.': 'What is shaped from ash does not break.',
  'Blutzoll': 'Blood Toll', 'Leben im Überfluss, bezahlt mit Schwere.': 'Life in abundance, paid for with heaviness.',

  // ——— Runenbaum: Asche ———
  'Asche ziehen': 'Draw Ash', 'Funkenflug': 'Flying Sparks', 'Funkelnder Haufen': 'Glittering Heap', 'Beutelschneider': 'Cutpurse', 'Aschebringer': 'Ashbringer',
  'Gierige Hand': 'Grasping Hand', 'Gier': 'Greed', 'Aschepfad': 'Ashen Path', 'Totenlehre': 'Death Lore', 'Gelehrter des Todes': 'Scholar of Death',
  'Sammler': 'Collector', 'Knochenzoll': 'Bone Toll', 'Reliquienjäger': 'Relic Hunter', 'Hordennest': 'Hoard Nest', 'Wachsender Haufen': 'Growing Heap',
  'Midashand': 'Midashand', 'Alles, was du berührst, fällt zu Asche. Und Asche vermehrt sich.': 'Everything you touch turns to ash. And ash multiplies.',
  'Aschenherr': 'Ash Lord', 'Die Toten zollen dir ihren letzten Zent.': 'The dead pay you their last cent.',
  'Zehnt der Toten': 'Tithe of the Dead', 'Der Tod selbst zahlt dir Lehrgeld.': 'Death itself pays you tuition.',

  // ——— Runenbaum: Geist ———
  'Klarer Blick': 'Clear Sight', 'Ruhige Hand': 'Steady Hand', 'Geistesgegenwart': 'Presence of Mind', 'Wahre Sicht': 'True Sight', 'Vollstrecker': 'Executioner',
  'Gedankenschärfe': 'Razor Thought', 'Kalter Zorn': 'Cold Wrath', 'Gedankenblitz': 'Thought Bolt', 'Zeitsprung': 'Time Skip', 'Todesurteil': 'Death Sentence',
  'Flinke Finger': 'Nimble Fingers', 'Zeitgefühl': 'Time Sense', 'Vorahnung': 'Foreboding', 'Nebelblick': 'Mist Sight', 'Sturmkonzentration': 'Storm Focus',
  'Henkersauge': "Headsman's Eye", 'Du siehst den Moment, in dem alles endet.': 'You see the moment when everything ends.',
  'Geistesblitz': 'Flash of Genius', 'Ein Gedanke, drei Schläge.': 'One thought, three strikes.',
  'Zeitraffung': 'Time Lapse', 'Die Welt wirkt träge, seit du erwacht bist.': 'The world seems sluggish since you awakened.',

  // ——— Runenbaum: Brücken ———
  'Klingenwall': 'Blade Wall', 'Zwillingstor': 'Twin Gate', 'Knochenburg': 'Bone Keep',
  'Aschepanzer': 'Ash Armor', 'Reliquienposten': 'Relic Post', 'Reliquienwacht': 'Relic Watch',
  'Funkenblick': 'Spark Sight', 'Nebelpfad': 'Mist Path', 'Geisterzins': 'Spectral Interest',
  'Henkershilfe': "Headsman's Aid", 'Kalte Wut': 'Cold Rage', 'Kaltblütig': 'Cold-Blooded',

  // ——— Errungenschaften ———
  'Erste Ernte': 'First Harvest', 'Erlege deine erste Kreatur.': 'Slay your first creature.',
  'Aschenjäger': 'Ash Hunter', 'Erlege 100 Kreaturen.': 'Slay 100 creatures.',
  'Gebeinleser': 'Bone Gatherer', 'Erlege 1.000 Kreaturen.': 'Slay 1,000 creatures.',
  'Schrecken der Asche': 'Terror of Ash', 'Erlege 10.000 Kreaturen.': 'Slay 10,000 creatures.',
  'Erster Sturz': 'First Fall', 'Falle zum ersten Mal — die Asche nimmt ihren Zoll.': 'Fall for the first time — the ash takes its toll.',
  'Zollschuldner': 'Toll Debtor', 'Falle 10 Male.': 'Fall 10 times.',
  'Halb Asche': 'Half Ash', 'Falle 50 Male.': 'Fall 50 times.',
  'Erwacht': 'Awakened', 'Verbringe 1 Stunde im Spiel.': 'Spend 1 hour in the game.',
  'Brennende Geduld': 'Burning Patience', 'Verbringe 10 Stunden im Spiel.': 'Spend 10 hours in the game.',
  'Von Asche umhangen': 'Cloaked in Ash', 'Verbringe 50 Stunden im Spiel.': 'Spend 50 hours in the game.',
  'Horter': 'Hoarder', 'Finde 10 Beutestücke.': 'Find 10 pieces of loot.',
  'Finde 100 Beutestücke.': 'Find 100 pieces of loot.',
  'Aschenbaron': 'Ash Baron', 'Finde 500 Beutestücke.': 'Find 500 pieces of loot.',
  'Goldhauch': 'Glimmer of Gold', 'Finde dein erstes legendäres Stück.': 'Find your first legendary piece.',
  'Kronjäger': 'Crown Chaser', 'Finde 10 legendäre Stücke.': 'Find 10 legendary pieces.',
  'Über den Thron hinaus': 'Beyond the Throne', 'Befreie 10 Gebiete.': 'Free 10 areas.',
  'Der halbe Weg': 'Half the Way', 'Befreie 25 Gebiete.': 'Free 25 areas.',
  'Kronenträger': 'Crownbearer', 'Hebe die Aschenkrone — alle 50 Gebiete sind frei.': 'Lift the Ashen Crown — all 50 areas are free.',
  'Unter dem Thron': 'Beneath the Throne', 'Erringe die erste Aschentiefe.': 'Reach your first Ashen Depth.',
  'Tiefenwanderer': 'Depth Wanderer', 'Erringe fünf Aschentiefen.': 'Reach five Ashen Depths.',
  'Schrecken der Tiefen': 'Terror of the Depths', 'Erlege 50.000 Kreaturen.': 'Slay 50,000 creatures.',
  'Vom Tode gezeichnet': 'Marked by Death', 'Falle 200 Male.': 'Fall 200 times.',
  'Ewigkeit in Grau': 'Eternity in Grey', 'Verbringe 100 Stunden im Spiel.': 'Spend 100 hours in the game.',
  'Beutefürst': 'Loot Lord', 'Finde 2.000 Beutestücke.': 'Find 2,000 pieces of loot.',
  'Kronsammler': 'Crown Collector', 'Finde 50 legendäre Stücke.': 'Find 50 legendary pieces.',
  'Zehnfach versunken': 'Tenfold Sunken', 'Erringe zehn Aschentiefen.': 'Reach ten Ashen Depths.',
  'Dem Grund entgegen': 'Toward the Bottom', 'Erringe 25 Aschentiefen.': 'Reach 25 Ashen Depths.',
  'Unter allem Licht': 'Beneath All Light', 'Erringe 50 Aschentiefen.': 'Reach 50 Ashen Depths.',
  'Chronist der Asche': 'Chronicler of Ash', 'Erlege jede der 150 Kreaturen des Hauptspiels mindestens einmal.': 'Slay each of the 150 creatures of the main game at least once.',

  // ——— Ruhm-Laden ———
  'Beutelschein': 'Loot License', '+8 Inventarplätze pro Stufe — die Asche trägt mehr.': '+8 inventory slots per level — the ash carries more.',
  'Zollerlass': 'Toll Waiver', 'Todeszoll −3 % pro Stufe (15 % → 3 %).': 'Death toll −3 % per level (15 % → 3 %).',
  'Aschesegen': 'Ash Blessing', '+10 % Asche-Ertrag pro Stufe — im Feld wie offline.': '+10 % ash gain per level — in the field and offline.',
  'Tiefenkunde': 'Depth Lore', 'Offline-Fortschritt +4 Stunden pro Stufe (8 h → bis 20 h).': 'Offline progress +4 hours per level (8 h → up to 20 h).',
  'Werkstatthandwerk': 'Workshop Craft', 'Werkstatt-Kosten −5 % pro Stufe.': 'Workshop costs −5 % per level.',
  'Kriegerherz': 'Warrior Heart', '+5 % Lebenskraft pro Stufe — auf den gesamten Maximalwert.': '+5 % health per level — on the total maximum.',
  'Wuchtschlag': 'Mighty Blow', '+10 % Kritschaden pro Stufe.': '+10 % crit damage per level.',
  'Alte Lehre': 'Ancient Teaching', '+5 % Erfahrung pro Stufe.': '+5 % experience per level.',
  'Schrein-Atem': 'Shrine Breath', 'Schrein-Regeneration +25 % pro Stufe.': 'Shrine regeneration +25 % per level.',
  'Aschewille': 'Ash Will', 'Auferstehung +5 % Lebenskraft pro Stufe (25 % → 40 %).': 'Revival +5 % health per level (25 % → 40 %).',

  // ——— Vermächtnis-Titel ———
  'Zweiter Atem': 'Second Wind', '+5 % Lebenskraft & Schaden auf den Helden-Grundwert, je Stufe.': "+5 % health & damage on the hero's base value, per level.",
  'Aschengeist': 'Ash Spirit', '+5 % Erfahrung, je Stufe.': '+5 % experience, per level.',
  'Beutelspähler': 'Loot Scout', '+5 % Asche-Ertrag, je Stufe.': '+5 % ash gain, per level.',
  'Alter Pfad': 'Old Path', 'Erwache mit +2 freien Statpunkten, je Stufe.': 'Awaken with +2 free stat points, per level.',
  'Tiefenwissen': 'Depth Knowledge', '+10 % Elite-/Boss-Fundchance, je Stufe.': '+10 % elite/boss loot chance, per level.',
  'Der Vorbereitete': 'The Prepared', 'Erwache mit 25 Asche, je Stufe.': 'Awaken with 25 ash, per level.',

  // ——— Kreatur-Familien (Gedächtnis der Ausrüstung) ———
  'Knechte': 'Minions',
  'Bestien': 'Beasts',
  'Ritter': 'Knights',
  'Kultisten': 'Cultists',
  'Schatten': 'Shades',
  'Kolosse': 'Colossi',
  'Regenten': 'Regents',

  // ——— Relikte ———
  'Nachhallrelikt': 'Echo Relic',

  // ——— Errungenschaften: Gedächtnis & Nachhall ———
  'Die Klinge erinnert sich': 'The Blade Remembers',
  'Besitze ein Stück, das sich an 300 Beutezüge gegen eine Kreaturfamilie erinnert (+3 % Schaden).': 'Own a piece that remembers 300 hunts against one creature family (+3 % damage).',
  'Das Ich im Aschenschleier': 'The Self in the Ash Veil',
  'Brich den Nachhall deines früheren Ichs.': 'Break the Ash Echo of your former self.',
};
