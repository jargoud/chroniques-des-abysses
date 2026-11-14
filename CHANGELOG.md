# Changelog

Toutes les évolutions notables du projet sont consignées dans ce fichier.

Le format s'inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet suit le [versionnage sémantique](https://semver.org/lang/fr/).

## [0.4.2] - 2026-11-14

### Ajouté

- Protection du débutant : les dégâts subis baissent de 15 % au niveau 1, puis de moins en moins jusqu'au niveau 6. S'y ajoutent 3 % par niveau d'avance de l'ennemi sur le niveau d'équipement du héros (moyenne des objets portés, pondérée par la rareté et les améliorations), 12 % au plus. Total plafonné à 20 %, nul dès que le héros est au niveau de ses ennemis. Valeur visible sur la fiche du héros.
- Potions de secours : à chaque mort, le guérisseur du camp offre 1 potion de vie, +1 si le coup fatal vient d'un ennemi de plus haut niveau que le héros, +1 si la bourse ne permet plus d'acheter 2 potions (3 au maximum).

## [0.4.1] - 2026-11-14

### Corrigé

- Erreur « prj is undefined » quand le héros mourait sous plusieurs projectiles dans la même image.
- Murs du Temple : les frises d'or formaient des bandes horizontales continues. Ils sont désormais en pierres taillées décalées, avec incrustations d'or, pilastres et runes ponctuels.

## [0.4.0] - 2026-11-14

### Ajouté

- Graphismes modernes (par défaut) : rendu lissé en pleine résolution, créatures dessinées en vectoriel, tuiles, décors, effets et lumières affinés. Le pixel art 16-bit reste disponible : bouton « Graphismes » sur l'écran titre et dans le menu pause.
- Biomes bien plus variés : 8 variantes de sol et jusqu'à 10 de mur par biome, zones de matière à grande échelle (flaques, herbe envahissante, dunes, mosaïques dorées, boue, tapis de feuilles, coulées de lave…), une trentaine de détails au sol, et météo ou ambiance propre à chaque biome (brouillard, pluie, sable, encens, lucioles, braises).
- Silhouette propre à chaque ennemi de chaque biome, en mode moderne comme en pixel art.
- 32 boss (4 par biome, du gardien au plus redoutable), chacun avec son apparence. Le boss d'un donjon est celui de la quête en cours ; sans quête, l'un de ceux déjà vaincus (le gardien la première fois). Plus le boss est de haut rang, plus il est coriace et plus il a de chances de lâcher un légendaire.
- Quêtes de boss : les boss d'un biome se débloquent dans l'ordre, au fil des niveaux. La première victoire sur chacun rapporte l'artefact du biome ; ensuite, des contrats de traque sans artefact.
- Arbre de talents en 3 branches de 5 talents (rang max 3) : Gardien (Coup de Bouclier, Cuirasse de Fer, Représailles, Cri de Ralliement, Rempart Inébranlable), Berserker (Fendoir, Soif de Sang, Tourbillon, Frénésie, Séisme) et Maître d'armes (Tir Perçant, Pas Léger, Charge, Œil de Lynx, Pluie de Flèches). Chaque palier exige un niveau et des points investis dans sa branche. Réinitialisation gratuite.
- Musiques : 3 thèmes par biome et 3 pour le camp (30 thèmes avec le boss et les 2 thèmes rock), enchaînés au hasard toutes les 2 boucles. Aux Catacombes, 2 thèmes rock'n'roll en plus (riff métal en galop, boogie blues) à la guitare saturée. Nouveaux instruments synthétisés : flûte, luth, clavecin, cloches, marimba, orgue, cuivres, cordes, chœur, oud, et toms graves.
- Plans de donjon propres au biome : salles et couloirs (Prison, Château, Caveau), grandes salles à piliers (Pyramide, Temple), cavernes organiques (Jungle, Forêt, Catacombes).

### Modifié

- Camp d'Oakhaven : un menu à onglets (Expéditions, Quêtes, Marchand, Forge) remplace la carte à parcourir. Fiche, talents et sac restent accessibles depuis le camp.
- Expéditions : un seul bouton « Partir en exploration » tire le donjon au hasard parmi les biomes accessibles. Une quête de boss ouverte ajoute +3 au poids du biome, une quête de chasse +2, et un biome dépassé par le héros ne pèse plus que 0,15. Les chances de chaque biome s'affichent dans l'onglet.
- Chaque biome a une plage de niveaux (Prison 1-4, Château 3-6, Caveau 5-8, Pyramide 7-10, Temple 9-12, Jungle 11-14, Forêt 13-16, Catacombes 15-20) : ennemis et butin plafonnent au maximum du biome, +2 niveaux par cran de Menace. L'XP baisse de 20 % par niveau d'avance du héros sur l'ennemi.
- Amélioration limitée à 2 crans par objet (+12 % chacun), pour 1,5× puis 3× la valeur de l'objet.
- Artefacts obtenus uniquement en récompense de quête de boss ; sertissage au choix de l'artefact.
- Or : moins fréquent et moins abondant en exploration, l'essentiel vient des quêtes. Revente à 25 % de la valeur, potions à 30 Or, marchand un niveau sous le héros et plus cher.
- Butin : légendaires réservés aux boss, objets rares moins fréquents.
- Progression plus lente : moins d'XP par ennemi, quêtes de chasse plus longues (8 à 12 créatures).

### Retiré

- Camp d'entraînement et mannequins.
- Quêtes de reliques et artefacts lâchés par les ennemis.

### Migration des sauvegardes

- Les talents sont remboursés (1 point par niveau), les objets améliorés au-delà de +2 ramenés à +2, les anciennes quêtes de relique retirées.

## [0.3.0] - 2026-11-13

### Ajouté

- Une musique d'exploration par biome, chacune avec sa gamme, son tempo, son instrument principal et sa rythmique : marche royale au Château, orgue funèbre au Caveau, mode hijaz et darbouka à la Pyramide, rituel pentatonique au Temple, percussions tribales dans la Jungle, flûte folk dans la Forêt, basse infernale aux Catacombes. La Prison garde la musique de donjon existante ; le thème de boss reste commun.
- Rendu propre à chaque biome : sols, murs, décors au sol, couleur des torches, voile de lumière et particules d'ambiance.
  - Prison : dalles jointoyées, grilles de cellule, os, chaînes, flaques.
  - Château : remparts lierrés et fissurés, pavés envahis d'herbe, nuit au clair de lune.
  - Caveau : carrelage fissuré, niches à crânes, bougies violettes.
  - Pyramide : grès gravé de hiéroglyphes, sable, urnes, torches dorées.
  - Temple : dalles incrustées d'or, pilastres sculptés, braseros et runes lumineuses.
  - Jungle (extérieur, en plein jour) : herbe haute, canopée tropicale, fougères et fleurs.
  - Forêt (extérieur, de nuit) : mousse, sapins noirs, champignons luminescents, lucioles.
  - Catacombes : murs d'ossements, roche craquelée de lave, braises qui montent.

### Modifié

- Code découpé en plusieurs fichiers : `index.html` pour la page, `css/style.css` et 9 scripts dans `js/`. Le jeu s'ouvre toujours sans compilation.
- Camp d'entraînement : les mannequins se brisent en une dizaine de coups et réapparaissent 8 s plus tard. Sous le niveau 6, chaque coup rapporte environ 1/60 du niveau suivant, et briser un mannequin donne un bonus d'XP plus de l'or (70 %) ou une potion (30 %). Au-delà, ils servent seulement à s'exercer.

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

[0.3.0]: https://github.com/jargoud/chroniques-des-abysses/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/jargoud/chroniques-des-abysses/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/jargoud/chroniques-des-abysses/releases/tag/0.1.0
