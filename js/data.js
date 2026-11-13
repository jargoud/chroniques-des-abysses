'use strict';

// ==================== GESTIONNAIRE D'ERREURS GLOBAL ====================
window.onerror = function (msg, url, lineNo, columnNo) {
    const banner = document.getElementById('globalErrorBanner');
    if (banner) {
        banner.textContent = 'Erreur détectée : ' + msg + ' (ligne ' + lineNo + ')';
        banner.classList.remove('hidden');
    }
    return false;
};

// ==================== 1. DONNÉES DE RÉFÉRENCE DU JEU ====================
const CLASSES = {
    warrior: {
        id: 'warrior',
        name: 'Guerrier',
        icon: '⚔️',
        color: '#ef4444',
        role: 'Mêlée & Robustesse',
        desc: 'Colosse blindé expert du corps-à-corps, capable d’encaisser de lourds assauts et de briser les lignes ennemies.',
        baseStats: { str: 14, dex: 9, int: 6, vit: 13 }
    }
};

const SKILL_TREES = {
    warrior: [
        { id: 'war_cleave', tier: 1, reqLvl: 1, name: 'Fendoir Sanglant', icon: '🪓', rage: 15, cd: 1.8, desc: 'Large arc d’acier infligeant 145% (+18%/rang) dégâts physiques devant vous.' },
        { id: 'war_ironskin', tier: 1, reqLvl: 1, name: 'Cuirasse de Fer', icon: '🛡️', rage: 0, cd: 0, passive: true, desc: 'Passif : +12% (+6%/rang) Armure totale et +15 (+10/rang) Vie Max.' },
        { id: 'war_charge', tier: 2, reqLvl: 5, name: 'Charge Héroïque', icon: '💨', rage: 20, cd: 4.5, desc: 'Bondit vers la cible, infligeant 135% (+20%/rang) dégâts et étourdissant 1.5s.' },
        { id: 'war_whirlwind', tier: 2, reqLvl: 5, name: 'Tourbillon d’Acier', icon: '🌪️', rage: 25, cd: 4.0, desc: 'Frappe tous les ennemis autour de vous pour 165% (+25%/rang) dégâts.' },
        { id: 'war_berserk', tier: 3, reqLvl: 10, name: 'Fureur du Titan', icon: '🔥', rage: 0, cd: 0, passive: true, desc: 'Ultime Passif : +15% (+5%/rang) Dégâts physiques et +3% Vol de vie.' },
        { id: 'war_earthquake', tier: 3, reqLvl: 10, name: 'Séisme Dévastateur', icon: '🌋', rage: 40, cd: 8.0, desc: 'Ultime : Brise le sol sur un large rayon (270% +45%/rang dégâts + étourdissement 2s).' }
    ]
};

const BIOMES = [
    { id: 'dungeon', name: 'Prison Souterraine', icon: '⛓️', minLvl: 1, floor: '#2a2622', wall: '#4a4440', accent: '#a8a29e', artifactId: 'art_iron' },
    { id: 'castle', name: 'Château en Ruines', icon: '🏰', minLvl: 2, floor: '#3a3f47', wall: '#5b6470', accent: '#94a3b8', artifactId: 'art_crest' },
    { id: 'crypt', name: 'Caveau Funéraire', icon: '⚰️', minLvl: 4, floor: '#1f1d24', wall: '#3b3842', accent: '#a78bfa', artifactId: 'art_soul' },
    { id: 'pyramid', name: 'Pyramide Oubliée', icon: '🏜️', minLvl: 6, floor: '#5a4526', wall: '#8a6a35', accent: '#facc15', artifactId: 'art_sun' },
    { id: 'temple', name: 'Temple Maudit', icon: '⛩️', minLvl: 8, floor: '#2e1a33', wall: '#5b2273', accent: '#e879f9', artifactId: 'art_rune' },
    { id: 'jungle', name: 'Jungle Luxuriante', icon: '🌴', minLvl: 10, floor: '#3d6b26', wall: '#1f6b2e', accent: '#4ade80', artifactId: 'art_emerald' },
    { id: 'forest', name: 'Forêt Sombre', icon: '🌲', minLvl: 12, floor: '#1a2a20', wall: '#2f6b45', accent: '#34d399', artifactId: 'art_amber' },
    { id: 'catacombs', name: 'Catacombes Profondes', icon: '💀', minLvl: 15, floor: '#2b1414', wall: '#5c1a1a', accent: '#f87171', artifactId: 'art_abyss' }
];

// Ambiance de rendu par biome : style de sol et de mur, extérieur (pas de torches, murs = végétation),
// voile d'obscurité, couleur des torches, particules d'ambiance (rise = montent comme des braises) et décors au sol
const BIOME_LOOK = {
    dungeon:   { floor: 'flag',   wall: 'brick',      dark: 'rgba(4,4,14,0.8)',    torch: '#f97316', mote: '#a8a29e', props: ['bones', 'chain', 'puddle'] },
    castle:    { floor: 'cobble', wall: 'block',      dark: 'rgba(8,12,34,0.6)',   torch: '#f97316', torchRate: 13, mote: '#cbd5e1', props: ['rubble', 'tuft', 'tuft'] },
    crypt:     { floor: 'crypt',  wall: 'cryptwall',  dark: 'rgba(10,4,18,0.86)',  torch: '#a855f7', mote: '#c4b5fd', props: ['skull', 'candle', 'bones'] },
    pyramid:   { floor: 'sand',   wall: 'sandstone',  dark: 'rgba(16,10,2,0.76)',  torch: '#fbbf24', mote: '#fde68a', props: ['urn', 'sandpile', 'sandpile'] },
    temple:    { floor: 'temple', wall: 'templewall', dark: 'rgba(14,4,20,0.8)',   torch: '#e879f9', mote: '#f0abfc', props: ['brazier', 'rune'] },
    jungle:    { floor: 'grass',  wall: 'foliage',    dark: 'rgba(6,26,8,0.22)',   outdoor: true, mote: '#bef264', props: ['fern', 'flower', 'fern'] },
    forest:    { floor: 'moss',   wall: 'pine',       dark: 'rgba(4,10,26,0.5)',   outdoor: true, mote: '#d9f99d', props: ['mushroom', 'log', 'tuft'] },
    catacombs: { floor: 'hell',   wall: 'bones',      dark: 'rgba(26,2,2,0.82)',   torch: '#ef4444', mote: '#fb923c', rise: true, props: ['lava', 'skullpile', 'bones'] }
};

// Comportements d'ennemis : multiplicateurs de PV / dégâts / vitesse, taille et options
// keepDist : garde ses distances et tire • spread : tir en éventail • summon : invoque des nuées • group : apparaît en meute
const ENEMY_KINDS = {
    melee:    { label: 'Combattant', hp: 1.0, dmg: 1.0, speed: 1.0, radius: 15 },
    ranged:   { label: 'Tireur', hp: 0.85, dmg: 0.9, speed: 0.8, radius: 14, keepDist: true },
    caster:   { label: 'Mage', hp: 0.8, dmg: 0.75, speed: 0.75, radius: 14, keepDist: true, spread: true },
    summoner: { label: 'Invocateur', hp: 1.0, dmg: 0.6, speed: 0.7, radius: 15, keepDist: true, summon: true },
    charger:  { label: 'Chargeur', hp: 1.2, dmg: 1.4, speed: 0.95, radius: 16 },
    swarm:    { label: 'Nuée', hp: 0.4, dmg: 0.5, speed: 1.35, radius: 10, group: 3 },
    bomber:   { label: 'Kamikaze', hp: 0.6, dmg: 2.0, speed: 1.25, radius: 13 },
    tank:     { label: 'Colosse', hp: 2.2, dmg: 1.3, speed: 0.6, radius: 22 }
};

// Durée du télégraphe de chaque attaque spéciale de boss (s)
const BOSS_WINDUP = { slam: 0.9, nova: 0.7, volley: 0.55, charge: 0.6, summon: 0.8 };

// body : silhouette du sprite (hum = humanoïde, mon = créature, swarm = volant, bomb = boule)
const BIOME_FOES = {
    dungeon: {
        enemies: [
            { name: 'Geôlier Squelette', kind: 'melee', body: 'hum', color: '#d6d3d1', deco: ['skull'] },
            { name: 'Rat Géant', kind: 'swarm', body: 'swarm', color: '#a8a29e' },
            { name: 'Arbalétrier Déchu', kind: 'ranged', body: 'hum', color: '#78716c', deco: ['hood'] },
            { name: 'Brute Enchaînée', kind: 'charger', body: 'mon', color: '#b45309', deco: ['chains'] },
            { name: 'Gelée Putride', kind: 'bomber', body: 'bomb', color: '#84cc16' }
        ],
        bosses: [
            { name: 'Malakor le Geôlier', body: 'hum', color: '#f97316', patterns: ['slam', 'summon'], deco: ['helm', 'chains'] },
            { name: 'Bourreau Krog', body: 'mon', color: '#dc2626', patterns: ['charge', 'slam'], deco: ['hood', 'chains'] }
        ]
    },
    castle: {
        enemies: [
            { name: 'Chevalier Déchu', kind: 'tank', body: 'hum', color: '#94a3b8', deco: ['helm'] },
            { name: 'Arbalétrier Royal', kind: 'ranged', body: 'hum', color: '#60a5fa', deco: ['helm', 'plume'] },
            { name: 'Gargouille de Pierre', kind: 'charger', body: 'mon', color: '#64748b', deco: ['stone', 'wings'] },
            { name: 'Chauve-souris des Remparts', kind: 'swarm', body: 'swarm', color: '#7c3aed' },
            { name: 'Mage de Cour', kind: 'caster', body: 'hum', color: '#818cf8', deco: ['wizard'] }
        ],
        bosses: [
            { name: 'Seigneur Vane', body: 'hum', color: '#e11d48', patterns: ['charge', 'volley'], deco: ['helm', 'crown'] },
            { name: 'Reine Spectrale Elyndra', body: 'hum', color: '#c4b5fd', patterns: ['nova', 'summon'], deco: ['ghost', 'crown'] }
        ]
    },
    crypt: {
        enemies: [
            { name: 'Goule Affamée', kind: 'melee', body: 'mon', color: '#a3a3a3', deco: ['bones'] },
            { name: 'Spectre Hurleur', kind: 'caster', body: 'mon', color: '#a78bfa', deco: ['ghost'] },
            { name: 'Nécromancien', kind: 'summoner', body: 'hum', color: '#7c3aed', deco: ['hood', 'runes'] },
            { name: 'Crâne Volant', kind: 'swarm', body: 'swarm', color: '#e5e7eb', deco: ['skull'] },
            { name: 'Cadavre Gonflé', kind: 'bomber', body: 'bomb', color: '#65a30d', deco: ['stitches'] }
        ],
        bosses: [
            { name: 'Liche Morvath', body: 'hum', color: '#8b5cf6', patterns: ['nova', 'summon'], deco: ['skull', 'crown', 'runes'] },
            { name: 'Abomination Cousue', body: 'mon', color: '#be123c', patterns: ['slam', 'charge'], deco: ['stitches', 'bones'] }
        ]
    },
    pyramid: {
        enemies: [
            { name: 'Momie Gardienne', kind: 'tank', body: 'hum', color: '#d6c7a1', deco: ['bandage'] },
            { name: 'Scarabée Géant', kind: 'swarm', body: 'swarm', color: '#0d9488', deco: ['beetle'] },
            { name: 'Prêtre des Sables', kind: 'caster', body: 'hum', color: '#facc15', deco: ['nemes'] },
            { name: 'Chacal d’Anubis', kind: 'charger', body: 'mon', color: '#78716c', deco: ['ears'] },
            { name: 'Archer du Désert', kind: 'ranged', body: 'hum', color: '#d97706', deco: ['hood'] }
        ],
        bosses: [
            { name: 'Pharaon Khépri', body: 'hum', color: '#eab308', patterns: ['volley', 'summon'], deco: ['nemes', 'mask'] },
            { name: 'Sphinx Ancestral', body: 'mon', color: '#ca8a04', patterns: ['nova', 'charge'], deco: ['nemes', 'wings'] }
        ]
    },
    temple: {
        enemies: [
            { name: 'Cultiste Zélote', kind: 'melee', body: 'hum', color: '#c026d3', deco: ['hood'] },
            { name: 'Idole Animée', kind: 'tank', body: 'mon', color: '#a16207', deco: ['stone', 'runes'] },
            { name: 'Prêtre de Sang', kind: 'summoner', body: 'hum', color: '#b91c1c', deco: ['hood', 'horns'] },
            { name: 'Orbe Instable', kind: 'bomber', body: 'bomb', color: '#e879f9', deco: ['runes'] },
            { name: 'Lanceur de Runes', kind: 'caster', body: 'hum', color: '#22d3ee', deco: ['wizard', 'runes'] }
        ],
        bosses: [
            { name: 'Archonte Xylar', body: 'hum', color: '#d946ef', patterns: ['nova', 'volley'], deco: ['horns', 'runes', 'crown'] },
            { name: 'Idole Dévoreuse', body: 'mon', color: '#f59e0b', patterns: ['slam', 'summon'], deco: ['stone', 'runes', 'crown'] }
        ]
    },
    jungle: {
        enemies: [
            { name: 'Homme-Lézard', kind: 'melee', body: 'mon', color: '#16a34a', deco: ['spikes'] },
            { name: 'Araignée Venimeuse', kind: 'swarm', body: 'swarm', color: '#4d7c0f', deco: ['spider'] },
            { name: 'Chaman Sauvage', kind: 'summoner', body: 'hum', color: '#f97316', deco: ['feathers'] },
            { name: 'Rhino Cuirassé', kind: 'charger', body: 'mon', color: '#78716c', deco: ['tusk'] },
            { name: 'Sarbacanier', kind: 'ranged', body: 'hum', color: '#65a30d', deco: ['feathers'] }
        ],
        bosses: [
            { name: 'Zul’Gath le Colosse', body: 'mon', color: '#15803d', patterns: ['slam', 'charge'], deco: ['spikes', 'tusk', 'feathers'] },
            { name: 'Reine Arachnide Nyx', body: 'mon', color: '#7e22ce', patterns: ['summon', 'volley'], deco: ['eyes', 'crown'] }
        ]
    },
    forest: {
        enemies: [
            { name: 'Loup-Garou', kind: 'charger', body: 'mon', color: '#57534e', deco: ['ears'] },
            { name: 'Tréant Corrompu', kind: 'tank', body: 'mon', color: '#3f6212', deco: ['antlers', 'leaves'] },
            { name: 'Chasseur Maudit', kind: 'ranged', body: 'hum', color: '#047857', deco: ['hood'] },
            { name: 'Feu Follet', kind: 'bomber', body: 'bomb', color: '#5eead4', deco: ['wisp'] },
            { name: 'Druide Noir', kind: 'caster', body: 'hum', color: '#166534', deco: ['antlers'] }
        ],
        bosses: [
            { name: 'Sylvanus le Déchu', body: 'mon', color: '#10b981', patterns: ['summon', 'nova'], deco: ['antlers', 'leaves', 'runes'] },
            { name: 'Grand Loup Fenris', body: 'mon', color: '#9ca3af', patterns: ['charge', 'slam'], deco: ['ears', 'spikes'] }
        ]
    },
    catacombs: {
        enemies: [
            { name: 'Démon Mineur', kind: 'swarm', body: 'swarm', color: '#ef4444', deco: ['fire'] },
            { name: 'Seigneur Squelette', kind: 'tank', body: 'hum', color: '#e7e5e4', deco: ['skull', 'horns'] },
            { name: 'Cultiste Abyssal', kind: 'summoner', body: 'hum', color: '#7f1d1d', deco: ['hood', 'runes'] },
            { name: 'Diablotin Explosif', kind: 'bomber', body: 'bomb', color: '#f97316', deco: ['horns'] },
            { name: 'Sorcier du Néant', kind: 'caster', body: 'hum', color: '#6d28d9', deco: ['wizard', 'runes'] },
            { name: 'Molosse Infernal', kind: 'charger', body: 'mon', color: '#b91c1c', deco: ['horns', 'fire'] }
        ],
        bosses: [
            { name: 'Azazel, Fléau des Abysses', body: 'mon', color: '#dc2626', patterns: ['nova', 'slam', 'summon'], deco: ['horns', 'wings', 'fire'] },
            { name: 'Belzéroth le Dévoreur', body: 'mon', color: '#9f1239', patterns: ['charge', 'volley', 'slam'], deco: ['horns', 'spikes', 'fire'] }
        ]
    }
};
BIOMES.forEach(b => Object.assign(b, BIOME_FOES[b.id]));

const ARTIFACTS = {
    art_iron:    { id: 'art_iron',    name: 'Rune d’Acier Trempé', icon: '🪨', bonusStat: 'dmg', val: 4, label: '+4 Dégâts Physiques' },
    art_crest:   { id: 'art_crest',   name: 'Blason Royal Brisé',  icon: '🛡️', bonusStat: 'armor', val: 6, label: '+6 Armure' },
    art_soul:    { id: 'art_soul',    name: 'Cristal de Givre',    icon: '❄️', bonusStat: 'elemDmg', val: 6, label: '+6 Dégâts de Givre' },
    art_sun:     { id: 'art_sun',     name: 'Éclat Igné Solaire',  icon: '🔥', bonusStat: 'elemDmg', val: 8, label: '+8 Dégâts de Feu' },
    art_rune:    { id: 'art_rune',    name: 'Essence Ancienne',    icon: '🔮', bonusStat: 'mp', val: 20, label: '+20 Rage Max' },
    art_emerald: { id: 'art_emerald', name: 'Émeraude de Vitalité',icon: '💚', bonusStat: 'hp', val: 30, label: '+30 Vie Max' },
    art_amber:   { id: 'art_amber',   name: 'Ambre du Prédateur',  icon: '⚡', bonusStat: 'crit', val: 4, label: '+4% Chance Critique' },
    art_abyss:   { id: 'art_abyss',   name: 'Cœur des Abysses',    icon: '💎', bonusStat: 'allStats', val: 3, label: '+3 Tous Attributs' }
};

const RARITIES = {
    common:    { id: 'common',    name: 'Commun',     color: '#e5e7eb', mult: 1.0,  affixes: 0 },
    magic:     { id: 'magic',     name: 'Magique',    color: '#60a5fa', mult: 1.22, affixes: 1 },
    rare:      { id: 'rare',      name: 'Rare',       color: '#facc15', mult: 1.48, affixes: 2 },
    legendary: { id: 'legendary', name: 'Légendaire', color: '#fb923c', mult: 1.85, affixes: 3 }
};

const ELITE_AFFIXES = [
    { id: 'fast',      label: 'Rapide',     color: '#38bdf8' },
    { id: 'vampiric',  label: 'Vampirique', color: '#f43f5e' },
    { id: 'explosive', label: 'Explosif',   color: '#f97316' },
    { id: 'shielded',  label: 'Bouclier',   color: '#a855f7' }
];

const SLOT_LABELS = {
    weapon: 'Arme de Mêlée', ranged: 'Arme à Distance', offhand: 'Main Gauche', helm: 'Casque', armor: 'Armure',
    gloves: 'Gants', boots: 'Bottes', ring: 'Anneau', amulet: 'Amulette'
};

// ==================== 2. ÉTAT GLOBAL DU JEU ====================
const State = {
    screen: 'start',
    location: 'town',
    currentBiome: null,
    difficulty: 1,
    activeModal: null,
    modalFocusIdx: 0,

    hero: {
        name: 'Aldric',
        classId: 'warrior',
        level: 1,
        xp: 0,
        xpNext: 200,
        gold: 65,
        attrPoints: 0,
        skillPoints: 1,
        stats: { str: 14, dex: 9, int: 6, vit: 13 },
        skills: {},
        skillBar: [null, null, null, null, null],
        activeWeapon: 'weapon',
        equipment: {
            weapon: null, ranged: null, offhand: null, helm: null, armor: null,
            gloves: null, boots: null, ring: null, amulet: null
        },
        inventory: [],
        artifacts: {},
        hp: 115, maxHp: 115,
        // ponytail: champs mp / maxMp conservés pour la compatibilité des sauvegardes, ils portent la Rage
        mp: 0, maxMp: 100,
        potionsHp: 3,
        potionsMp: 1,
        potionCd: 0
    },

    quests: [],
    shopStock: [],

    world: {
        cols: 34,
        rows: 26,
        tileSize: 48,
        grid: [],
        explored: [],
        rooms: [],
        player: { x: 800, y: 600, radius: 16, facing: 0, lastMoveAngle: 0, attackCd: 0, swingAnim: 0 },
        npcs: [],
        enemies: [],
        chests: [],
        projectiles: [],
        lootDrops: [],
        particles: [],
        floatingTexts: [],
        portal: null,
        camera: { x: 0, y: 0 }
    },

    cooldowns: {},
    keys: {},
    mouse: { x: 0, y: 0, worldX: 0, worldY: 0, leftDown: false, active: false }
};
