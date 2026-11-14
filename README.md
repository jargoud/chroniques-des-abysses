# Chroniques des Abysses

Action-RPG « hack 'n' slash » jouable dans le navigateur, en graphismes modernes ou en pixel art 16-bit au choix. Le joueur incarne un Guerrier qui explore 8 biomes maudits, affronte des monstres et des boss, et récupère de l'équipement.

## Lancer le jeu

Jouer en ligne : <https://jargoud.github.io/chroniques-des-abysses/>

En local, ouvrir `index.html` dans un navigateur récent (Chrome, Edge, Firefox ou Safari).

Ou servir le dossier en local :

```bash
python3 -m http.server 8765
```

puis ouvrir <http://localhost:8765/>.

Une connexion Internet est nécessaire pour charger Tailwind CSS et les polices Google Fonts.

## Commandes

| Action | Touche |
|---|---|
| Se déplacer | ZQSD, WASD ou flèches |
| Attaquer | Espace ou clic gauche (vise la souris, sinon la direction de marche) |
| Changer d'arme (mêlée / distance) | Tab |
| Compétences | 1 à 4 (la 4 aussi au clic droit) |
| Potion de vie / de fureur | R / F |
| Interagir, ramasser | E ou Entrée |
| Camp : menu à onglets | souris, flèches et Entrée ; Échap ouvre le menu |
| Fiche du héros / Talents / Sac / Quêtes | C / K / I / J |
| Couper ou remettre le son | M |
| Menu pause | Échap |

Dans les fenêtres : flèches pour naviguer, Entrée pour valider, X pour jeter ou vendre l'objet sélectionné.

## Contenu

- **Héros** : un Guerrier avec 4 attributs à répartir et un arbre de 15 talents en 3 branches (Gardien, Berserker, Maître d'armes) : chaque palier exige un niveau et des points investis dans sa branche. Les talents d'attaque exigent une arme de mêlée ou à distance, indiquée dans l'arbre ; avec l'autre arme en main, ils sont grisés et indisponibles.
- **Rage** : la ressource des talents se remplit en frappant et en encaissant, puis retombe hors combat.
- **Attributs** : Force (dégâts, armure), Dextérité (critique, esquive, furtivité), Intelligence (puissance élémentaire, Rage générée, furtivité), Vitalité (santé).
- **Furtivité** : les ennemis repèrent le héros de plus près ; un « ! » signale chaque détection.
- **Armes** : un emplacement mêlée (dague, épée, hache, masse, lance, espadon) et un emplacement distance (arc court, arc long, arbalète, javelots), avec alternance en jeu.
- **Équipement** : 9 emplacements présentés sur une poupée d'équipement, 4 raretés (légendaires réservés aux boss), affixes aléatoires, 2 crans d'amélioration et sertissage d'artefacts à la forge (le bonus d'un artefact croît avec le niveau de l'objet serti, sauf critique et Rage). Chaque cran d'amélioration augmente de 50 % le prix de revente. Le sac affiche aussi le nombre de potions.
- **Comparateur** : au survol d'un objet du sac ou de la boutique, écart de statistiques avec l'objet porté (vert = hausse, rouge = baisse).
- **Camp** : menu à onglets (Expéditions, Quêtes, Marchand, Forge) sur fond de camp animé ; la vie y est restaurée. Le prix des potions suit le niveau du héros (30 Or au niveau 1, +8 par niveau).
- **Expéditions** : le portail tire le donjon au hasard, en favorisant les biomes de vos quêtes en cours.
- **Donjons** : 8 biomes générés aléatoirement (salles, halls à piliers ou cavernes selon le biome), chacun avec sa plage de niveaux qui plafonne ennemis et butin. Les Catacombes n'ont pas de plafond : leurs ennemis suivent le niveau du héros. La minicarte montre le portail, et dans les zones explorées les coffres, les ennemis, les élites et le boss.
- **Ennemis** : 8 comportements (combattant, tireur, mage, invocateur, chargeur, nuée, kamikaze, colosse), 41 types d'ennemis à la silhouette propre, élites avec affixes et halo. Les explosions (kamikazes, affixe Explosif) blessent aussi les autres ennemis, et les projectiles ennemis s'arrêtent sur les monstres placés sur leur trajet.
- **Boss** : 32 boss (4 par biome, de rang croissant) avec attaques spéciales annoncées à l'avance (onde de choc, nova, rafale, charge, invocation). Le boss d'un donjon dépend des quêtes en cours ; sans quête, c'est l'un de ceux déjà vaincus.
- **Quêtes** : chasses et têtes mises à prix, à valider au camp ; elles sont la principale source d'or (+25 % d'or et d'XP par cran de Menace, fixé à l'accomplissement), et la première victoire sur un boss rapporte l'artefact de son biome.
- **Rendu** : mode moderne lissé ou pixel art 16-bit (bouton « Graphismes » sur l'écran titre et dans le menu pause), avec sols, murs, décors, météo et ambiance lumineuse propres à chaque biome.
- **Audio** : 3 thèmes par lieu (camp et chaque biome) plus un thème de boss, enchaînés au hasard, avec une dizaine d'instruments synthétisés (flûte, luth, cloches, orgue, cuivres, chœur…), et bruitages, le tout généré en direct sans fichier audio.
- **Sauvegarde** : automatique dans le navigateur (`localStorage`).

## Structure

Aucune étape de compilation : `index.html` charge la feuille de style puis les scripts dans l'ordre, sous forme de `<script>` classiques qui partagent leurs variables globales (pas de modules ES, pour que le jeu s'ouvre aussi par double-clic).

| Fichier | Contenu |
|---|---|
| `index.html` | Structure de la page : écran titre, HUD, fenêtres |
| `css/style.css` | Styles propres au jeu (en complément de Tailwind) |
| `js/data.js` | Gestionnaire d'erreurs, données de référence (classes, talents, biomes, artefacts), mode graphique, état global |
| `js/foes.js` | Ennemis et boss de chaque biome, avec leur apparence |
| `js/hero.js` | Générateur d'équipements, calcul des statistiques du héros |
| `js/world.js` | Quêtes et boss, camp, génération des donjons, apparition des ennemis |
| `js/combat.js` | Combat, talents, butin, IA des ennemis, simulation |
| `js/art.js` | Dessin des créatures et du héros (moderne ou pixel art) |
| `js/render.js` | Canvas, tuiles, décors, météo, éclairage, décor du camp, minicarte |
| `js/ui.js` | Interface : HUD et fenêtres |
| `js/game.js` | Actions du joueur, sauvegarde |
| `js/audio.js` | Musiques et bruitages synthétisés |
| `js/main.js` | Contrôles clavier et souris, boucle de jeu, démarrage |

L'ordre des scripts compte : un fichier peut utiliser au chargement ce qui est défini dans les précédents.

## Historique

Voir [CHANGELOG.md](CHANGELOG.md).
