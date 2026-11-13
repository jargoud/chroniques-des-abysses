# Chroniques des Abysses

Action-RPG « hack 'n' slash » en pixel art 16-bit, jouable dans le navigateur. Le joueur incarne un Guerrier qui explore 8 biomes maudits, affronte des monstres et des boss, et récupère de l'équipement.

## Lancer le jeu

Ouvrir `index.html` dans un navigateur récent (Chrome, Edge, Firefox ou Safari).

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
| Fiche du héros / Talents / Sac / Quêtes | C / K / I / J |
| Couper ou remettre le son | M |
| Menu pause | Échap |

Dans les fenêtres : flèches pour naviguer, Entrée pour valider, X pour jeter ou vendre l'objet sélectionné.

## Contenu

- **Héros** : un Guerrier avec un arbre de 6 talents sur 3 paliers et 4 attributs à répartir.
- **Rage** : la ressource des talents se remplit en frappant et en encaissant, puis retombe hors combat.
- **Attributs** : Force (dégâts, armure), Dextérité (critique, esquive, furtivité), Intelligence (puissance élémentaire, Rage générée, furtivité), Vitalité (santé).
- **Furtivité** : les ennemis repèrent le héros de plus près ; un « ! » signale chaque détection.
- **Armes** : un emplacement mêlée (dague, épée, hache, masse, lance, espadon) et un emplacement distance (arc court, arc long, arbalète, javelots), avec alternance en jeu.
- **Équipement** : 9 emplacements présentés sur une poupée d'équipement, 4 raretés, affixes aléatoires, amélioration et sertissage d'artefacts chez le forgeron.
- **Comparateur** : au survol d'un objet du sac ou de la boutique, écart de statistiques avec l'objet porté (vert = hausse, rouge = baisse).
- **Camp** : chef de quêtes, forgeron et marchand devant leurs bâtiments, portail des donjons, et camp d'entraînement avec mannequins à briser (XP, or et potions jusqu'au niveau 6).
- **Donjons** : 8 biomes générés aléatoirement, chacun débloqué à partir d'un niveau requis ; le portail apparaît sur la minicarte.
- **Ennemis** : 8 comportements (combattant, tireur, mage, invocateur, chargeur, nuée, kamikaze, colosse), 41 types d'ennemis aux ornements propres à leur biome, élites avec affixes et halo. Leur puissance suit le niveau du héros.
- **Boss** : 16 boss (2 par biome) avec halo lumineux et attaques spéciales annoncées à l'avance (onde de choc, nova, rafale, charge, invocation).
- **Quêtes** : objectifs de chasse ou d'artefacts, triées par niveau du donjon, récompenses à valider au camp.
- **Rendu** : pixel art 16-bit avec sols, murs, décors et ambiance lumineuse propres à chaque biome (intérieurs éclairés aux torches, extérieurs de jour ou de nuit), particules, tremblements d'écran.
- **Audio** : musiques chiptune (camp, une par biome, boss) et bruitages synthétisés en direct, sans fichier audio.
- **Sauvegarde** : automatique dans le navigateur (`localStorage`).

## Structure

Aucune étape de compilation : `index.html` charge la feuille de style puis les scripts dans l'ordre, sous forme de `<script>` classiques qui partagent leurs variables globales (pas de modules ES, pour que le jeu s'ouvre aussi par double-clic).

| Fichier | Contenu |
|---|---|
| `index.html` | Structure de la page : écran titre, HUD, fenêtres |
| `css/style.css` | Styles propres au jeu (en complément de Tailwind) |
| `js/data.js` | Gestionnaire d'erreurs, données de référence (classes, talents, biomes, ennemis, artefacts), état global |
| `js/hero.js` | Générateur d'équipements, calcul des statistiques du héros |
| `js/world.js` | Quêtes, camp, génération des donjons, apparition des ennemis |
| `js/combat.js` | Combat, butin, mannequins, IA des ennemis, simulation |
| `js/render.js` | Canvas, sprites et tuiles pixel art, décors, éclairage, minicarte |
| `js/ui.js` | Interface : HUD et fenêtres |
| `js/game.js` | Actions du joueur, sauvegarde |
| `js/audio.js` | Musiques et bruitages synthétisés |
| `js/main.js` | Contrôles clavier et souris, boucle de jeu, démarrage |

L'ordre des scripts compte : un fichier peut utiliser au chargement ce qui est défini dans les précédents.

## Historique

Voir [CHANGELOG.md](CHANGELOG.md).
