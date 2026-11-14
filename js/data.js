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
        icon: 'warrior',
        color: '#ef4444',
        role: 'Mêlée & Robustesse',
        desc: 'Colosse blindé expert du corps-à-corps, capable d’encaisser de lourds assauts et de briser les lignes ennemies.',
        baseStats: { str: 14, dex: 9, int: 6, vit: 13 }
    }
};

// Arbre du Guerrier : 3 branches de 5 talents (rang max 3). Un talent de palier n exige le niveau BRANCH_REQ[n].lvl
// et BRANCH_REQ[n].pts points déjà investis dans sa branche : impossible de tout apprendre, il faut choisir un style.
const SKILL_BRANCHES = [
    { id: 'guard', name: 'Gardien', icon: 'shield', color: '#60a5fa', desc: 'Défense, contrôle et représailles.' },
    { id: 'berserk', name: 'Berserker', icon: 'blood', color: '#ef4444', desc: 'Rage, vol de vie et dégâts de zone.' },
    { id: 'master', name: 'Maître d’armes', icon: 'bow', color: '#4ade80', desc: 'Distance, mobilité et coups critiques.' }
];
const BRANCH_REQ = { 1: { lvl: 1, pts: 0 }, 2: { lvl: 3, pts: 1 }, 3: { lvl: 6, pts: 3 }, 4: { lvl: 10, pts: 5 }, 5: { lvl: 14, pts: 7 } };
const SKILL_MAX_RANK = 3;

const SKILL_TREES = {
    warrior: [
        { id: 'war_bash', weapon: 'melee', branch: 'guard', tier: 1, name: 'Coup de Bouclier', icon: 'shield', rage: 12, cd: 3.0, desc: 'Frappe courte devant vous : 110% (+25%/rang) dégâts et étourdit 1.2s.' },
        { id: 'war_ironskin', branch: 'guard', tier: 2, name: 'Cuirasse de Fer', icon: 'mail', passive: true, desc: 'Passif : +12% Armure et +15 Vie Max par rang.' },
        { id: 'war_thorns', branch: 'guard', tier: 3, name: 'Représailles', icon: 'cactus', passive: true, desc: 'Passif : renvoie 25% (+25%/rang) des dégâts de mêlée subis à l’attaquant.' },
        { id: 'war_rally', branch: 'guard', tier: 4, name: 'Cri de Ralliement', icon: 'horn', rage: 30, cd: 14, desc: 'Bouclier absorbant 20% (+10%/rang) de votre Vie Max pendant 6s.' },
        { id: 'war_bulwark', branch: 'guard', tier: 5, name: 'Rempart Inébranlable', icon: 'tower', passive: true, desc: 'Ultime passif : sous 40% de Vie, dégâts subis réduits de 12% par rang.' },

        { id: 'war_cleave', weapon: 'melee', branch: 'berserk', tier: 1, name: 'Fendoir Sanglant', icon: 'axe', rage: 15, cd: 1.8, desc: 'Large arc d’acier : 145% (+25%/rang) dégâts devant vous.' },
        { id: 'war_bloodthirst', branch: 'berserk', tier: 2, name: 'Soif de Sang', icon: 'blood', passive: true, desc: 'Passif : +2% Vol de vie et +10% Rage générée par rang.' },
        { id: 'war_whirlwind', weapon: 'melee', branch: 'berserk', tier: 3, name: 'Tourbillon d’Acier', icon: 'whirl', rage: 25, cd: 4.0, desc: 'Frappe tout autour de vous : 165% (+35%/rang) dégâts.' },
        { id: 'war_frenzy', branch: 'berserk', tier: 4, name: 'Frénésie', icon: 'flame', passive: true, desc: 'Passif : +10% dégâts par rang tant que la Rage dépasse 50.' },
        { id: 'war_earthquake', weapon: 'melee', branch: 'berserk', tier: 5, name: 'Séisme Dévastateur', icon: 'volcano', rage: 40, cd: 8.0, desc: 'Ultime : brise le sol sur un large rayon, 270% (+60%/rang) dégâts et étourdit 2s.' },

        { id: 'war_pierce', weapon: 'ranged', branch: 'master', tier: 1, name: 'Tir Perçant', icon: 'training', rage: 10, cd: 2.0, desc: 'Projectile qui traverse les ennemis : 130% (+25%/rang) dégâts.' },
        { id: 'war_swift', branch: 'master', tier: 2, name: 'Pas Léger', icon: 'feather', passive: true, desc: 'Passif : +6% vitesse de déplacement et +3% Esquive par rang.' },
        { id: 'war_charge', weapon: 'melee', branch: 'master', tier: 3, name: 'Charge Héroïque', icon: 'dash', rage: 20, cd: 4.5, desc: 'Bondit vers la cible : 135% (+30%/rang) dégâts et étourdit 1.5s.' },
        { id: 'war_lynx', branch: 'master', tier: 4, name: 'Œil de Lynx', icon: 'eye', passive: true, desc: 'Passif : +4% Critique et +15% dégâts critiques par rang.' },
        { id: 'war_arrows', weapon: 'ranged', branch: 'master', tier: 5, name: 'Pluie de Flèches', icon: 'arrowRain', rage: 40, cd: 9.0, desc: 'Ultime : déluge sur la zone visée, 220% (+50%/rang) dégâts.' }
    ]
};

// Amélioration chez le forgeron : 2 crans seulement, +12 % de dégâts / armure chacun
const MAX_UPGRADE = 2;
const UPGRADE_STEP = 0.12;

// minLvl : niveau requis • maxLvl : plafond du niveau des ennemis et du butin (refaire un vieux donjon rapporte peu)
const BIOMES = [
    { id: 'dungeon', name: 'Prison Souterraine', icon: 'chains', minLvl: 1, maxLvl: 4, floor: '#2a2622', wall: '#4a4440', accent: '#a8a29e', artifactId: 'art_iron' },
    { id: 'castle', name: 'Château en Ruines', icon: 'tower', minLvl: 2, maxLvl: 6, floor: '#3a3f47', wall: '#5b6470', accent: '#94a3b8', artifactId: 'art_crest' },
    { id: 'crypt', name: 'Caveau Funéraire', icon: 'coffin', minLvl: 3, maxLvl: 8, floor: '#1f1d24', wall: '#3b3842', accent: '#a78bfa', artifactId: 'art_soul' },
    { id: 'pyramid', name: 'Pyramide Oubliée', icon: 'pyramid', minLvl: 4, maxLvl: 10, floor: '#5a4526', wall: '#8a6a35', accent: '#facc15', artifactId: 'art_sun' },
    { id: 'temple', name: 'Temple Maudit', icon: 'torii', minLvl: 5, maxLvl: 12, floor: '#2e1a33', wall: '#5b2273', accent: '#e879f9', artifactId: 'art_rune' },
    { id: 'jungle', name: 'Jungle Luxuriante', icon: 'palm', minLvl: 6, maxLvl: 14, floor: '#3d6b26', wall: '#1f6b2e', accent: '#4ade80', artifactId: 'art_emerald' },
    { id: 'forest', name: 'Forêt Sombre', icon: 'pine', minLvl: 7, maxLvl: 16, floor: '#1a2a20', wall: '#2f6b45', accent: '#34d399', artifactId: 'art_amber' },
    { id: 'catacombs', name: 'Catacombes Profondes', icon: 'skull', minLvl: 8, maxLvl: 20, floor: '#2b1414', wall: '#5c1a1a', accent: '#f87171', artifactId: 'art_abyss' }
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


const ARTIFACTS = {
    art_iron:    { id: 'art_iron',    name: 'Rune d’Acier Trempé', icon: 'runeStone', bonusStat: 'dmg', val: 4, label: '+4 Dégâts Physiques' },
    art_crest:   { id: 'art_crest',   name: 'Blason Royal Brisé',  icon: 'shield', bonusStat: 'armor', val: 6, label: '+6 Armure' },
    art_soul:    { id: 'art_soul',    name: 'Cristal de Givre',    icon: 'snowflake', bonusStat: 'elemDmg', val: 6, label: '+6 Dégâts de Givre' },
    art_sun:     { id: 'art_sun',     name: 'Éclat Igné Solaire',  icon: 'flame', bonusStat: 'elemDmg', val: 8, label: '+8 Dégâts de Feu' },
    art_rune:    { id: 'art_rune',    name: 'Essence Ancienne',    icon: 'orb', bonusStat: 'mp', val: 20, label: '+20 Rage Max' },
    art_emerald: { id: 'art_emerald', name: 'Émeraude de Vitalité',icon: 'emerald', bonusStat: 'hp', val: 30, label: '+30 Vie Max' },
    art_amber:   { id: 'art_amber',   name: 'Ambre du Prédateur',  icon: 'bolt', bonusStat: 'crit', val: 4, label: '+4% Chance Critique' },
    art_abyss:   { id: 'art_abyss',   name: 'Cœur des Abysses',    icon: 'abyss', bonusStat: 'allStats', val: 3, label: '+3 Tous Attributs' }
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

// Mode graphique (réglage du navigateur, hors sauvegarde) : 'hd' = rendu moderne lissé, 'pixel' = pixel art 16-bit
const Gfx = {
    mode: (() => { try { return localStorage.getItem('chroniques_gfx') || 'hd'; } catch (e) { return 'hd'; } })(),
    get hd() { return this.mode === 'hd'; },
    toggle() {
        this.mode = this.hd ? 'pixel' : 'hd';
        try { localStorage.setItem('chroniques_gfx', this.mode); } catch (e) { /* stockage indisponible */ }
    }
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
        bossKills: {}, // id de boss → nombre de victoires
        purified: {}, // id de biome → true : donjon purifié (4 boss vaincus, récompense remise)
        talentVersion: 2,
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
