# Changelog

Toutes les évolutions notables du projet sont consignées dans ce fichier.

Le format s'inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet suit le [versionnage sémantique](https://semver.org/lang/fr/).

## [0.2.0] - 2026-11-13

### Ajouté

- Rage, la ressource du Guerrier : elle monte quand une attaque de base touche (+8 au corps-à-corps, +6 à distance) et quand le héros encaisse un coup, puis retombe hors combat. L'Intelligence accélère son remplissage (+2 % par point).
- Potion de Fureur (+50 % de Rage), touche F.
- Furtivité (Dextérité + Intelligence) : les ennemis repèrent le héros de plus près, jusqu'à −45 % de distance ; un « ! » signale chaque détection.
- Donjons verrouillés tant que le héros n'a pas le niveau requis ; les quêtes ne ciblent plus que les donjons accessibles.
- Ornements pixel art propres à chaque ennemi selon son biome : crânes, capuches, heaumes, couronnes, cornes, némès, bandelettes, bois de cerf, ailes, flammes, runes…
- Halo lumineux autour des boss et des mini-boss (élites).
- Camp d'entraînement avec 3 mannequins indestructibles qui ne ripostent pas : on y teste armes et talents, et chaque coup rapporte 8 XP jusqu'au niveau 3.
- Un bâtiment derrière chaque PNJ du camp : hutte au toit de chaume et panneau de quêtes pour le Chef, forge fumante avec enclume pour le Forgeron, étal sous auvent rayé pour le Marchand.
- Portail affiché sur la minicarte (anneau violet) : au camp, et dans le donjon une fois le boss vaincu.
- Journal de quêtes trié par niveau requis du donjon, avec le niveau et le donjon affichés sur chaque quête (🔒 si encore inaccessible).

### Modifié

- Coût des talents en Rage, affiché dans l'arbre de talents : Fendoir 15, Charge 20, Tourbillon 25, Séisme 40.
- La Puissance Magique devient la Puissance élémentaire : dégâts élémentaires des objets et artefacts (Givre, Feu…), amplifiés par l'Intelligence (+4 % par point) et ajoutés aux dégâts des talents au lieu d'être en concurrence avec les dégâts physiques.
- Esquive renforcée : +0,35 % par point de Dextérité (au lieu de 0,2 %), plafond 40 %.
- Les PV et dégâts des monstres suivent la progression du héros (équipement et attributs) : refaire un donjon à plus haut niveau reste un défi.
- Les élites gardent la couleur de leur biome et sont affichées 25 % plus grandes ; leur affixe colore désormais leur halo.
- Donjons deux fois plus grands : 54 × 42 tuiles au lieu de 38 × 30, et jusqu'à 14 salles au lieu de 7.
- Camp plus compact : 15 × 10 tuiles au lieu de 24 × 18, PNJ alignés devant leurs bâtiments.

### Supprimé

- La mana et la potion de mana, remplacées par la Rage et la Potion de Fureur. Les sauvegardes existantes restent compatibles ; les bonus « Mana Max » des objets deviennent « Rage Max ».

## [0.1.0] - 2026-11-13

Première version publiée.

### Ajouté

- Classe unique : le Guerrier, avec un arbre de 6 talents sur 3 paliers.
- Deux emplacements d'arme, mêlée et distance, et alternance avec la touche Tab.
- 6 variantes d'armes de mêlée et 4 variantes d'armes à distance, chacune avec sa vitesse, sa portée, son ouverture de coup ou ses projectiles perforants.
- Poupée d'équipement : les objets portés sont disposés autour de la silhouette du héros, avec un résumé des statistiques.
- Inventaire trié par niveau puis par rareté.
- Comparateur d'équipement au survol, dans le sac et chez le marchand : écart de chaque caractéristique, en vert ou en rouge.
- 8 comportements d'ennemis et 41 types d'ennemis répartis sur 8 biomes.
- 16 boss (2 par biome) avec attaques spéciales télégraphiées, plus fréquentes sous 50 % de vie.
- Validation des quêtes réservée au camp.
- Graphismes pixel art 16-bit : sprites, tuiles par biome, animations d'attaque, éclairage dynamique, torches, ondes de choc, flashs d'impact, tremblements d'écran et caméra fluide.
- Menus modernes en verre dépoli, police Inter pour la lisibilité.
- Musiques chiptune (camp, donjon, boss) avec réverbération et écho, et bruitages synthétisés ; son coupable avec la touche M.
- Les murs bloquent les attaques, les sorts de zone et la détection des ennemis.
