'use strict';

// ==================== ENNEMIS & BOSS PAR BIOME ====================
// Durée du télégraphe de chaque attaque spéciale de boss (s)
const BOSS_WINDUP = { slam: 0.9, nova: 0.7, volley: 0.55, charge: 0.6, summon: 0.8 };

// look : silhouette procédurale dessinée par Art (js/art.js)
//   form  : biped | quad | flyer | blob | orb | wisp | skullhead | ghost | spider | insect | scorpion | serpent | tree
//   head  : human | skull | hollow | ghoul | beast | wolf | jackal | lizard | ape | bat | imp (quad : rat | rhino | stag | wolf | jackal | beast | skull | human)
//   options : scale, bulk, robe, thin, hunch, ghost, skin, hair, cloth, leg, sleeve, eye, horn, orb, rune, wing, shield, bark, mark, antler, tabard
//   acc   : accessoires (wings, featherwings, cape, tail, quiver, spikes, chains, shackles, stitches, runes, bandage, stone, pauldrons,
//           leaves, keys, arms4, armor, heads3, hair, cobra, nemes, feathers, hood, helm, helmOpen, plume, wizard, mask, crown, horns,
//           antlers, ears, tusks, halo, eyes3, fire, shield, sword, greatsword, dagger, axe, cleaver, club, spear, scythe, staff,
//           skullstaff, ankh, orb, bow, crossbow, blowgun, claws)
// body : ancienne silhouette (hum / mon / swarm / bomb), gardée en secours
// Boss : rangés par palier (0 = gardien du biome, 3 = le plus redoutable)
const BIOME_FOES = {
    dungeon: {
        enemies: [
            { name: 'Geôlier Squelette', kind: 'melee', body: 'hum', color: '#d6d3d1',
                look: { form: 'biped', head: 'skull', thin: true, eye: '#f97316', acc: ['keys', 'club'] } },
            { name: 'Rat Géant', kind: 'swarm', body: 'swarm', color: '#a8a29e',
                look: { form: 'quad', head: 'rat', scale: 0.62, eye: '#ef4444', acc: ['tail'] } },
            { name: 'Arbalétrier Déchu', kind: 'ranged', body: 'hum', color: '#78716c',
                look: { form: 'biped', head: 'human', skin: '#a8a29e', cloth: '#44403c', acc: ['hood', 'quiver', 'crossbow'] } },
            { name: 'Brute Enchaînée', kind: 'charger', body: 'mon', color: '#b45309',
                look: { form: 'biped', head: 'beast', bulk: true, hunch: true, skin: '#c2884f', eye: '#fde047', acc: ['chains', 'shackles', 'tusks'] } },
            { name: 'Gelée Putride', kind: 'bomber', body: 'bomb', color: '#84cc16',
                look: { form: 'blob', scale: 0.9 } }
        ],
        bosses: [
            { id: 'b_dungeon_0', name: 'Malakor le Geôlier', title: 'Maître des Clés', body: 'hum', color: '#f97316', patterns: ['slam', 'summon'],
                look: { form: 'biped', head: 'beast', bulk: true, skin: '#d6a274', cloth: '#7c2d12', acc: ['helm', 'chains', 'keys', 'club', 'pauldrons'] } },
            { id: 'b_dungeon_1', name: 'Bourreau Krog', title: 'Hache du Cachot', body: 'mon', color: '#dc2626', patterns: ['charge', 'slam'],
                look: { form: 'biped', head: 'beast', bulk: true, skin: '#b07a52', cloth: '#1c1917', acc: ['hood', 'shackles', 'axe'] } },
            { id: 'b_dungeon_2', name: 'Roi-Rat Squalor', title: 'Souverain des Égouts', body: 'mon', color: '#6b6158', patterns: ['summon', 'charge', 'nova'],
                look: { form: 'quad', head: 'rat', bulk: true, eye: '#ef4444', acc: ['tail', 'crown', 'spikes'] } },
            { id: 'b_dungeon_3', name: 'Morgrim l’Ossifère', title: 'Gardien des Oubliettes', body: 'hum', color: '#e7e5e4', patterns: ['slam', 'volley', 'summon'],
                look: { form: 'biped', head: 'skull', thin: true, eye: '#38bdf8', acc: ['crown', 'chains', 'shield', 'greatsword'] } }
        ]
    },
    castle: {
        enemies: [
            { name: 'Chevalier Déchu', kind: 'tank', body: 'hum', color: '#94a3b8',
                look: { form: 'biped', head: 'human', bulk: true, eye: '#ef4444', acc: ['helm', 'pauldrons', 'shield', 'sword'] } },
            { name: 'Arbalétrier Royal', kind: 'ranged', body: 'hum', color: '#60a5fa',
                look: { form: 'biped', head: 'human', tabard: '#1d4ed8', acc: ['helmOpen', 'plume', 'quiver', 'crossbow'] } },
            { name: 'Gargouille de Pierre', kind: 'charger', body: 'mon', color: '#64748b',
                look: { form: 'quad', head: 'beast', eye: '#f97316', wing: '#475569', acc: ['wings', 'horns', 'stone', 'tail'] } },
            { name: 'Chauve-souris des Remparts', kind: 'swarm', body: 'swarm', color: '#7c3aed',
                look: { form: 'flyer', head: 'bat', scale: 0.8, eye: '#ef4444', wing: '#4c1d95' } },
            { name: 'Mage de Cour', kind: 'caster', body: 'hum', color: '#818cf8',
                look: { form: 'biped', head: 'human', robe: true, hair: '#e5e7eb', cloth: '#4338ca', orb: '#38bdf8', acc: ['wizard', 'staff'] } }
        ],
        bosses: [
            { id: 'b_castle_0', name: 'Seigneur Vane', title: 'Tyran des Remparts', body: 'hum', color: '#e11d48', patterns: ['charge', 'volley'],
                look: { form: 'biped', head: 'human', tabard: '#7f1d1d', acc: ['cape', 'helm', 'crown', 'pauldrons', 'sword'] } },
            { id: 'b_castle_1', name: 'Reine Spectrale Elyndra', title: 'Dame du Donjon Hanté', body: 'hum', color: '#c4b5fd', patterns: ['nova', 'summon'],
                look: { form: 'ghost', head: 'human', ghost: true, skin: '#ddd6fe', hair: '#ede9fe', acc: ['hair', 'crown', 'orb'] } },
            { id: 'b_castle_2', name: 'Gauvain le Noir', title: 'Champion Déchu du Roi', body: 'hum', color: '#334155', patterns: ['charge', 'slam', 'volley'],
                look: { form: 'biped', head: 'human', bulk: true, eye: '#f43f5e', tabard: '#0f172a', acc: ['cape', 'helm', 'horns', 'pauldrons', 'greatsword'] } },
            { id: 'b_castle_3', name: 'Golem des Remparts', title: 'Muraille Vivante', body: 'mon', color: '#57534e', patterns: ['slam', 'charge', 'volley'],
                look: { form: 'biped', head: 'beast', bulk: true, scale: 1.12, skin: '#78716c', eye: '#38bdf8', acc: ['stone', 'runes', 'spikes'] } }
        ]
    },
    crypt: {
        enemies: [
            { name: 'Goule Affamée', kind: 'melee', body: 'mon', color: '#a3a3a3',
                look: { form: 'biped', head: 'ghoul', hunch: true, skin: '#9ca3a0', leg: '#57534e', eye: '#a3e635', acc: ['claws'] } },
            { name: 'Spectre Hurleur', kind: 'caster', body: 'mon', color: '#a78bfa',
                look: { form: 'ghost', head: 'hollow', ghost: true, eye: '#e0e7ff' } },
            { name: 'Nécromancien', kind: 'summoner', body: 'hum', color: '#7c3aed',
                look: { form: 'biped', head: 'hollow', robe: true, cloth: '#3b0764', eye: '#a3e635', rune: '#a3e635', acc: ['hood', 'runes', 'skullstaff'] } },
            { name: 'Crâne Volant', kind: 'swarm', body: 'swarm', color: '#e5e7eb',
                look: { form: 'skullhead', scale: 0.75, eye: '#c084fc', wing: '#57534e', acc: ['wings'] } },
            { name: 'Cadavre Gonflé', kind: 'bomber', body: 'bomb', color: '#65a30d',
                look: { form: 'blob', acc: ['stitches'] } }
        ],
        bosses: [
            { id: 'b_crypt_0', name: 'Liche Morvath', title: 'Seigneur des Tombes', body: 'hum', color: '#8b5cf6', patterns: ['nova', 'summon'],
                look: { form: 'biped', head: 'skull', robe: true, cloth: '#2e1065', eye: '#22d3ee', rune: '#22d3ee', acc: ['crown', 'runes', 'skullstaff'] } },
            { id: 'b_crypt_1', name: 'Abomination Cousue', title: 'Chair Rapiécée', body: 'mon', color: '#be123c', patterns: ['slam', 'charge'],
                look: { form: 'biped', head: 'ghoul', bulk: true, hunch: true, skin: '#a8a29e', eye: '#facc15', acc: ['stitches', 'chains', 'cleaver'] } },
            { id: 'b_crypt_2', name: 'Ysolde la Banshee', title: 'Voix du Linceul', body: 'hum', color: '#67e8f9', patterns: ['nova', 'volley', 'summon'],
                look: { form: 'ghost', head: 'ghoul', ghost: true, skin: '#cffafe', hair: '#ecfeff', eye: '#0e7490', acc: ['hair', 'eyes3'] } },
            { id: 'b_crypt_3', name: 'Gorrath Dévoreur d’Os', title: 'Dragon des Ossuaires', body: 'mon', color: '#f5f5f4', patterns: ['slam', 'charge', 'nova'],
                look: { form: 'quad', head: 'skull', bulk: true, scale: 1.1, eye: '#a855f7', wing: '#44403c', acc: ['wings', 'spikes', 'tail'] } }
        ]
    },
    pyramid: {
        enemies: [
            { name: 'Momie Gardienne', kind: 'tank', body: 'hum', color: '#d6c7a1',
                look: { form: 'biped', head: 'hollow', bulk: true, skin: '#d6c7a1', eye: '#22d3ee', acc: ['bandage'] } },
            { name: 'Scarabée Géant', kind: 'swarm', body: 'swarm', color: '#0d9488',
                look: { form: 'insect', scale: 0.85, eye: '#fde047' } },
            { name: 'Prêtre des Sables', kind: 'caster', body: 'hum', color: '#facc15',
                look: { form: 'biped', head: 'human', robe: true, skin: '#a16207', cloth: '#fef3c7', acc: ['nemes', 'ankh'] } },
            { name: 'Chacal d’Anubis', kind: 'charger', body: 'mon', color: '#44403c',
                look: { form: 'quad', head: 'jackal', eye: '#facc15', acc: ['tail'] } },
            { name: 'Archer du Désert', kind: 'ranged', body: 'hum', color: '#d97706',
                look: { form: 'biped', head: 'human', skin: '#a16207', cloth: '#fde68a', acc: ['hood', 'quiver', 'bow'] } }
        ],
        bosses: [
            { id: 'b_pyramid_0', name: 'Pharaon Khépri', title: 'Roi Momifié', body: 'hum', color: '#eab308', patterns: ['volley', 'summon'],
                look: { form: 'biped', head: 'human', robe: true, skin: '#d6c7a1', cloth: '#1e3a8a', acc: ['bandage', 'nemes', 'mask', 'ankh'] } },
            { id: 'b_pyramid_1', name: 'Sphinx Ancestral', title: 'Gardien des Énigmes', body: 'mon', color: '#ca8a04', patterns: ['nova', 'charge'],
                look: { form: 'quad', head: 'human', bulk: true, skin: '#d4a256', wing: '#a16207', acc: ['featherwings', 'nemes', 'tail'] } },
            { id: 'b_pyramid_2', name: 'Serket la Reine Scorpion', title: 'Dard des Dunes', body: 'mon', color: '#b45309', patterns: ['charge', 'volley', 'slam'],
                look: { form: 'scorpion', scale: 1.05, eye: '#a3e635', acc: ['crown'] } },
            { id: 'b_pyramid_3', name: 'Anubis Éveillé', title: 'Peseur des Âmes', body: 'hum', color: '#1e293b', patterns: ['slam', 'nova', 'summon'],
                look: { form: 'biped', head: 'jackal', bulk: true, scale: 1.08, eye: '#facc15', tabard: '#facc15', acc: ['nemes', 'pauldrons', 'scythe'] } }
        ]
    },
    temple: {
        enemies: [
            { name: 'Cultiste Zélote', kind: 'melee', body: 'hum', color: '#c026d3',
                look: { form: 'biped', head: 'hollow', robe: true, cloth: '#701a75', eye: '#f0abfc', acc: ['hood', 'dagger'] } },
            { name: 'Idole Animée', kind: 'tank', body: 'mon', color: '#a16207',
                look: { form: 'biped', head: 'beast', bulk: true, skin: '#ca8a04', eye: '#e879f9', acc: ['stone', 'mask', 'runes'] } },
            { name: 'Prêtre de Sang', kind: 'summoner', body: 'hum', color: '#b91c1c',
                look: { form: 'biped', head: 'human', robe: true, skin: '#e7c4a0', cloth: '#450a0a', horn: '#1c1917', orb: '#dc2626', acc: ['horns', 'staff'] } },
            { name: 'Orbe Instable', kind: 'bomber', body: 'bomb', color: '#e879f9',
                look: { form: 'orb', eye: '#fdf4ff', rune: '#fde047' } },
            { name: 'Lanceur de Runes', kind: 'caster', body: 'hum', color: '#22d3ee',
                look: { form: 'biped', head: 'hollow', robe: true, cloth: '#155e75', eye: '#a5f3fc', rune: '#a5f3fc', orb: '#67e8f9', acc: ['wizard', 'runes', 'orb'] } }
        ],
        bosses: [
            { id: 'b_temple_0', name: 'Archonte Xylar', title: 'Voix de l’Indicible', body: 'hum', color: '#d946ef', patterns: ['nova', 'volley'],
                look: { form: 'biped', head: 'human', robe: true, skin: '#c4b5fd', cloth: '#581c87', horn: '#fde047', acc: ['horns', 'halo', 'runes', 'staff'] } },
            { id: 'b_temple_1', name: 'Idole Dévoreuse', title: 'Bouche du Sanctuaire', body: 'mon', color: '#f59e0b', patterns: ['slam', 'summon'],
                look: { form: 'biped', head: 'beast', bulk: true, scale: 1.08, skin: '#d97706', eye: '#ef4444', acc: ['stone', 'mask', 'crown', 'runes'] } },
            { id: 'b_temple_2', name: 'Vashti la Naga', title: 'Gardienne du Bassin Sacré', body: 'mon', color: '#14b8a6', patterns: ['volley', 'nova', 'charge'],
                look: { form: 'serpent', head: 'human', skin: '#99f6e4', hair: '#134e4a', acc: ['cobra', 'crown', 'spear'] } },
            { id: 'b_temple_3', name: 'Avatar de Kâlrun', title: 'Dieu aux Quatre Bras', body: 'hum', color: '#7c3aed', patterns: ['slam', 'nova', 'summon'],
                look: { form: 'biped', head: 'beast', bulk: true, scale: 1.12, skin: '#6d28d9', eye: '#fde047', horn: '#fde047', acc: ['arms4', 'horns', 'eyes3', 'crown', 'runes', 'greatsword'] } }
        ]
    },
    jungle: {
        enemies: [
            { name: 'Homme-Lézard', kind: 'melee', body: 'mon', color: '#16a34a',
                look: { form: 'biped', head: 'lizard', eye: '#facc15', leg: '#15803d', acc: ['tail', 'spear'] } },
            { name: 'Araignée Venimeuse', kind: 'swarm', body: 'swarm', color: '#4d7c0f',
                look: { form: 'spider', scale: 0.7, eye: '#ef4444', mark: '#facc15' } },
            { name: 'Chaman Sauvage', kind: 'summoner', body: 'hum', color: '#f97316',
                look: { form: 'biped', head: 'human', skin: '#92400e', leg: '#78350f', orb: '#4ade80', acc: ['feathers', 'mask', 'staff'] } },
            { name: 'Rhino Cuirassé', kind: 'charger', body: 'mon', color: '#78716c',
                look: { form: 'quad', head: 'rhino', bulk: true, eye: '#fde047', acc: ['armor', 'tail'] } },
            { name: 'Sarbacanier', kind: 'ranged', body: 'hum', color: '#65a30d',
                look: { form: 'biped', head: 'human', skin: '#a16207', hair: '#1c1917', acc: ['feathers', 'blowgun'] } }
        ],
        bosses: [
            { id: 'b_jungle_0', name: 'Zul’Gath le Colosse', title: 'Troll de la Canopée', body: 'mon', color: '#15803d', patterns: ['slam', 'charge'],
                look: { form: 'biped', head: 'beast', bulk: true, hunch: true, skin: '#4d7c0f', eye: '#facc15', acc: ['tusks', 'feathers', 'spikes', 'club'] } },
            { id: 'b_jungle_1', name: 'Reine Arachnide Nyx', title: 'Tisseuse de Mort', body: 'mon', color: '#7e22ce', patterns: ['summon', 'volley'],
                look: { form: 'spider', scale: 1.1, eye: '#22d3ee', mark: '#22d3ee', acc: ['crown'] } },
            { id: 'b_jungle_2', name: 'Kongar le Primordial', title: 'Roi des Grands Singes', body: 'mon', color: '#44403c', patterns: ['slam', 'charge', 'summon'],
                look: { form: 'biped', head: 'ape', bulk: true, hunch: true, skin: '#a8a29e', eye: '#ef4444', acc: ['feathers', 'shackles'] } },
            { id: 'b_jungle_3', name: 'Quetzal le Serpent à Plumes', title: 'Souffle des Cimes', body: 'mon', color: '#0ea5e9', patterns: ['volley', 'nova', 'charge'],
                look: { form: 'serpent', head: 'lizard', eye: '#fde047', wing: '#16a34a', acc: ['featherwings', 'feathers'] } }
        ]
    },
    forest: {
        enemies: [
            { name: 'Loup-Garou', kind: 'charger', body: 'mon', color: '#57534e',
                look: { form: 'biped', head: 'wolf', hunch: true, bulk: true, eye: '#fde047', acc: ['claws'] } },
            { name: 'Tréant Corrompu', kind: 'tank', body: 'mon', color: '#3f6212',
                look: { form: 'tree', eye: '#f97316' } },
            { name: 'Chasseur Maudit', kind: 'ranged', body: 'hum', color: '#047857',
                look: { form: 'biped', head: 'hollow', cloth: '#064e3b', eye: '#5eead4', acc: ['cape', 'hood', 'quiver', 'bow'] } },
            { name: 'Feu Follet', kind: 'bomber', body: 'bomb', color: '#5eead4',
                look: { form: 'wisp', scale: 0.9 } },
            { name: 'Druide Noir', kind: 'caster', body: 'hum', color: '#166534',
                look: { form: 'biped', head: 'hollow', robe: true, cloth: '#14532d', eye: '#bef264', orb: '#bef264', acc: ['hood', 'antlers', 'leaves', 'staff'] } }
        ],
        bosses: [
            { id: 'b_forest_0', name: 'Sylvanus le Déchu', title: 'Cœur Pourri du Bois', body: 'mon', color: '#10b981', patterns: ['summon', 'nova'],
                look: { form: 'tree', scale: 1.05, bark: '#3f2a1d', eye: '#f0abfc', acc: ['antlers', 'runes'] } },
            { id: 'b_forest_1', name: 'Grand Loup Fenris', title: 'Croc de Lune', body: 'mon', color: '#9ca3af', patterns: ['charge', 'slam'],
                look: { form: 'quad', head: 'wolf', bulk: true, scale: 1.1, eye: '#38bdf8', acc: ['spikes', 'tail'] } },
            { id: 'b_forest_2', name: 'Morgane des Ronces', title: 'Sorcière du Sous-Bois', body: 'hum', color: '#be185d', patterns: ['summon', 'volley', 'nova'],
                look: { form: 'biped', head: 'ghoul', robe: true, skin: '#bbf7d0', cloth: '#3f1d38', hair: '#4a044e', orb: '#f472b6', acc: ['hair', 'wizard', 'leaves', 'staff'] } },
            { id: 'b_forest_3', name: 'Cernunnos le Cerf Spectral', title: 'Seigneur de la Chasse', body: 'mon', color: '#a5f3fc', patterns: ['charge', 'nova', 'slam'],
                look: { form: 'quad', head: 'stag', scale: 1.15, ghost: true, eye: '#ecfeff', antler: '#e0f2fe', acc: ['antlers', 'runes'] } }
        ]
    },
    catacombs: {
        enemies: [
            { name: 'Démon Mineur', kind: 'swarm', body: 'swarm', color: '#ef4444',
                look: { form: 'flyer', head: 'imp', scale: 0.8, horn: '#1c1917', eye: '#fde047', wing: '#7f1d1d' } },
            { name: 'Seigneur Squelette', kind: 'tank', body: 'hum', color: '#e7e5e4',
                look: { form: 'biped', head: 'skull', thin: true, eye: '#ef4444', horn: '#57534e', acc: ['horns', 'pauldrons', 'shield', 'sword'] } },
            { name: 'Cultiste Abyssal', kind: 'summoner', body: 'hum', color: '#7f1d1d',
                look: { form: 'biped', head: 'hollow', robe: true, cloth: '#450a0a', eye: '#f97316', rune: '#f97316', acc: ['hood', 'runes', 'skullstaff'] } },
            { name: 'Diablotin Explosif', kind: 'bomber', body: 'bomb', color: '#f97316',
                look: { form: 'blob', scale: 0.9, horn: '#1c1917', acc: ['horns', 'fire'] } },
            { name: 'Sorcier du Néant', kind: 'caster', body: 'hum', color: '#6d28d9',
                look: { form: 'biped', head: 'hollow', robe: true, cloth: '#1e1b4b', eye: '#c4b5fd', orb: '#a855f7', rune: '#c4b5fd', acc: ['wizard', 'runes', 'orb'] } },
            { name: 'Molosse Infernal', kind: 'charger', body: 'mon', color: '#b91c1c',
                look: { form: 'quad', head: 'wolf', eye: '#fde047', horn: '#1c1917', acc: ['horns', 'fire', 'spikes', 'tail'] } }
        ],
        bosses: [
            { id: 'b_catacombs_0', name: 'Kerbéros', title: 'Molosse des Portes', body: 'mon', color: '#7f1d1d', patterns: ['charge', 'slam'],
                look: { form: 'quad', head: 'wolf', bulk: true, scale: 1.08, eye: '#fde047', horn: '#1c1917', acc: ['heads3', 'fire', 'spikes', 'tail'] } },
            { id: 'b_catacombs_1', name: 'Belzéroth le Dévoreur', title: 'Gueule des Profondeurs', body: 'mon', color: '#9f1239', patterns: ['charge', 'volley'],
                look: { form: 'biped', head: 'beast', bulk: true, hunch: true, skin: '#9f1239', eye: '#fde047', horn: '#292524', acc: ['horns', 'spikes', 'tusks', 'claws'] } },
            { id: 'b_catacombs_2', name: 'Ignara', title: 'Mère des Flammes', body: 'hum', color: '#fb923c', patterns: ['nova', 'volley', 'summon'],
                look: { form: 'ghost', head: 'hollow', eye: '#fef08a', acc: ['fire', 'horns', 'runes'], horn: '#7c2d12', rune: '#fde047' } },
            { id: 'b_catacombs_3', name: 'Azazel', title: 'Fléau des Abysses', body: 'mon', color: '#dc2626', patterns: ['nova', 'slam', 'summon'],
                look: { form: 'biped', head: 'beast', bulk: true, scale: 1.15, skin: '#b91c1c', eye: '#fde047', horn: '#1c1917', wing: '#450a0a', acc: ['wings', 'horns', 'crown', 'fire', 'greatsword'] } }
        ]
    }
};
BIOMES.forEach(b => Object.assign(b, BIOME_FOES[b.id]));
