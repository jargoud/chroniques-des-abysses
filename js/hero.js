'use strict';

// ==================== 3. GÉNÉRATEUR D'ÉQUIPEMENTS ====================
const ItemGen = {
    bases: {
        // speed : vitesse d'attaque • arc : ouverture du coup (×π) • dmg : multiplicateur de dégâts
        weapon: [
            { name: 'Dague Acérée', icon: '🗡️', range: 50, speed: 1.35, arc: 0.6, dmg: 0.8 },
            { name: 'Épée Longue', icon: '🗡️', range: 60, speed: 1.0, arc: 0.78, dmg: 1.0 },
            { name: 'Hache de Guerre', icon: '🪓', range: 60, speed: 0.85, arc: 1.0, dmg: 1.15 },
            { name: 'Masse d’Armes', icon: '🔨', range: 56, speed: 0.8, arc: 0.7, dmg: 1.3 },
            { name: 'Lance de Guerre', icon: '🔱', range: 84, speed: 0.95, arc: 0.4, dmg: 1.05 },
            { name: 'Espadon Runique', icon: '⚔️', range: 70, speed: 0.7, arc: 1.1, dmg: 1.45 }
        ],
        // projSpeed : vitesse du projectile • pierce : traverse les ennemis
        ranged: [
            { name: 'Arc Court', icon: '🏹', range: 300, speed: 1.25, projSpeed: 600, dmg: 0.7 },
            { name: 'Arc Long', icon: '🏹', range: 420, speed: 0.9, projSpeed: 720, dmg: 0.9 },
            { name: 'Arbalète Lourde', icon: '🎯', range: 380, speed: 0.6, projSpeed: 820, dmg: 1.3, pierce: true },
            { name: 'Javelots de Chasse', icon: '🔱', range: 260, speed: 0.8, projSpeed: 480, dmg: 1.15 }
        ],
        offhand: [
            { name: 'Bouclier de Bois', icon: '🛡️' },
            { name: 'Écu de Fer', icon: '🛡️' },
            { name: 'Pavois Clouté', icon: '🛡️' }
        ],
        helm: [
            { name: 'Casque de Fer', icon: '🖴' },
            { name: 'Capuche de Cuir', icon: '🎓' },
            { name: 'Diadème Astral', icon: '👑' }
        ],
        armor: [
            { name: 'Cuirasse de Mailles', icon: '🦺' },
            { name: 'Manteau de Pisteur', icon: '🧥' },
            { name: 'Robe d’Adepte', icon: '👘' }
        ],
        gloves: [
            { name: 'Gantelets Rivetés', icon: '🧤' },
            { name: 'Mitaines Souples', icon: '🧤' }
        ],
        boots: [
            { name: 'Bottes Ferrées', icon: '🥾' },
            { name: 'Bottes de Marche', icon: '👢' }
        ],
        ring: [
            { name: 'Anneau de Cuivre', icon: '💍' },
            { name: 'Chevalière Gravée', icon: '💍' }
        ],
        amulet: [
            { name: 'Talisman d’Os', icon: '📿' },
            { name: 'Pendentif Runique', icon: '🧿' }
        ]
    },
    prefixes: ['Robuste', 'Vif', 'Arcanique', 'Sanglant', 'Solaire', 'Glacial', 'Ancien', 'Maudit'],

    create(level, forcedRarity, forcedSlot) {
        const slots = Object.keys(this.bases);
        const slot = forcedSlot || slots[Math.floor(Math.random() * slots.length)];
        const pool = this.bases[slot];
        const base = pool[Math.floor(Math.random() * pool.length)];

        let rarityKey = forcedRarity;
        if (!rarityKey) {
            const r = Math.random();
            if (r < 0.64) rarityKey = 'common';
            else if (r < 0.89) rarityKey = 'magic';
            else if (r < 0.985) rarityKey = 'rare';
            else rarityKey = 'legendary';
        }
        const rar = RARITIES[rarityKey];
        const scale = rar.mult * (1 + (level - 1) * 0.14);

        const item = {
            uid: 'itm_' + Math.random().toString(36).slice(2, 10),
            name: (rarityKey !== 'common' ? this.prefixes[Math.floor(Math.random() * this.prefixes.length)] + ' ' : '') + base.name,
            slot,
            icon: base.icon,
            rarity: rarityKey,
            level,
            upgrade: 0,
            socketed: null,
            weaponType: slot === 'ranged' ? 'ranged' : 'melee',
            weaponRange: base.range || 58,
            atkSpeed: base.speed || 1,
            arc: base.arc,
            projSpeed: base.projSpeed,
            pierce: !!base.pierce,
            dmg: 0,
            armor: 0,
            affixes: [],
            price: Math.max(8, Math.round((12 + level * 6) * rar.mult))
        };

        if (slot === 'weapon' || slot === 'ranged') {
            item.dmg = Math.max(3, Math.round((4 + level * 2.5) * scale * base.dmg));
        } else if (['helm', 'armor', 'gloves', 'boots', 'offhand'].includes(slot)) {
            item.armor = Math.max(1, Math.round((2 + level * 1.8) * scale));
            if (slot === 'offhand') item.dmg = Math.round(level * 0.8 * rar.mult);
        } else {
            const v = Math.max(1, Math.round(level * 0.45 * rar.mult));
            item.affixes.push({ stat: 'allStats', val: v, label: '+' + v + ' Tous Attributs' });
        }

        const affixPool = [
            { stat: 'hp', val: Math.max(6, Math.round(10 * scale)), label: (v) => '+' + v + ' Vie Max' },
            { stat: 'mp', val: Math.max(4, Math.round(7 * scale)), label: (v) => '+' + v + ' Rage Max' },
            { stat: 'dmg', val: Math.max(1, Math.round(2 * scale)), label: (v) => '+' + v + ' Dégâts' },
            { stat: 'elemDmg', val: Math.max(1, Math.round(2.4 * scale)), label: (v) => '+' + v + ' Dégâts Élémentaires' },
            { stat: 'crit', val: Math.min(12, Math.max(1, Math.round(1.6 * rar.mult))), label: (v) => '+' + v + '% Critique' },
            { stat: 'armor', val: Math.max(1, Math.round(2.5 * scale)), label: (v) => '+' + v + ' Armure' }
        ];

        const shuffled = affixPool.sort(() => Math.random() - 0.5);
        for (let i = 0; i < rar.affixes; i++) {
            const a = shuffled[i];
            item.affixes.push({ stat: a.stat, val: a.val, label: a.label(a.val) });
        }
        return item;
    }
};

// ==================== 4. CALCUL DES STATISTIQUES DU HÉROS ====================
function computeHeroStats() {
    const h = State.hero;
    let str = h.stats.str;
    let dex = h.stats.dex;
    let int = h.stats.int;
    let vit = h.stats.vit;

    let weaponDmg = 2;
    let armor = 1;
    let bonusDmg = 0;
    let elemDmg = 0;
    let bonusHp = 0;
    let bonusMp = 0;
    let critChance = 4;
    let critMult = 1.55;
    let atkSpeed = 1.0;
    let moveSpeed = 205;
    let dodge = 0;
    let lifesteal = 0;
    let weaponRange = 58;
    let weaponArc = 0.78;
    let projSpeed = 600;
    let pierce = false;
    const active = h.activeWeapon === 'ranged' && h.equipment.ranged ? 'ranged' : 'weapon';
    const weaponType = active === 'ranged' ? 'ranged' : 'melee';

    Object.entries(h.equipment).forEach(([slot, item]) => {
        if (!item) return;
        if ((slot === 'weapon' || slot === 'ranged') && slot !== active) return; // arme rangée : ignorée
        const upgMult = 1 + item.upgrade * 0.14;
        if (slot === active) {
            weaponDmg = Math.round(item.dmg * upgMult);
            weaponRange = item.weaponRange;
            atkSpeed *= item.atkSpeed || 1;
            weaponArc = item.arc || weaponArc;
            projSpeed = item.projSpeed || projSpeed;
            pierce = !!item.pierce;
        } else {
            weaponDmg += Math.round((item.dmg || 0) * upgMult);
        }
        armor += Math.round((item.armor || 0) * upgMult);

        item.affixes.forEach(af => {
            if (af.stat === 'allStats') { str += af.val; dex += af.val; int += af.val; vit += af.val; }
            else if (af.stat === 'hp') bonusHp += af.val;
            else if (af.stat === 'mp') bonusMp += af.val;
            else if (af.stat === 'dmg') bonusDmg += af.val;
            else if (af.stat === 'elemDmg') elemDmg += af.val;
            else if (af.stat === 'crit') critChance += af.val;
            else if (af.stat === 'armor') armor += af.val;
        });

        if (item.socketed && ARTIFACTS[item.socketed]) {
            const art = ARTIFACTS[item.socketed];
            if (art.bonusStat === 'allStats') { str += art.val; dex += art.val; int += art.val; vit += art.val; }
            else if (art.bonusStat === 'hp') bonusHp += art.val;
            else if (art.bonusStat === 'mp') bonusMp += art.val;
            else if (art.bonusStat === 'dmg') bonusDmg += art.val;
            else if (art.bonusStat === 'elemDmg') elemDmg += art.val;
            else if (art.bonusStat === 'crit') critChance += art.val;
            else if (art.bonusStat === 'armor') armor += art.val;
        }
    });

    if (h.skills.war_ironskin) {
        bonusHp += 15 + 10 * h.skills.war_ironskin;
        armor = Math.round(armor * (1 + 0.12 + 0.06 * h.skills.war_ironskin));
    }
    if (h.skills.war_berserk) {
        bonusDmg += 4 + 3 * h.skills.war_berserk;
        lifesteal += 3;
    }
    // Base PV augmentée légèrement pour fluidifier les premiers combats
    // Bonus de classe pure (+10 % PV, +15 % dégâts), toujours actif depuis que seul le Guerrier existe
    const maxHp = Math.round((55 + vit * 8 + h.level * 8 + bonusHp) * 1.10);
    // Rage : jauge fixe de 100 (+ bonus d'objets) ; l'Intelligence accélère son remplissage
    const maxMp = 100 + bonusMp;
    const rageGain = 1 + int * 0.02;
    const physDmg = Math.round(Math.max(3, Math.round((weaponDmg + bonusDmg) * (1 + str * 0.026 + dex * 0.012))) * 1.15);
    // Puissance élémentaire : dégâts élémentaires des objets / artefacts, amplifiés par l'Intelligence, ajoutés aux talents
    const elemPower = Math.round(elemDmg * (1 + int * 0.04) * 1.15);

    critChance = Math.min(70, Math.round(critChance + dex * 0.25));
    // Esquive : la Dextérité rend le héros insaisissable (plafond 40 %)
    dodge = Math.min(40, Math.round(dodge + dex * 0.35));
    // Furtivité : Dextérité (pas léger) + Intelligence (ruse) réduisent la distance de détection des ennemis (plafond 45 %)
    const stealth = Math.min(45, Math.round(dex * 0.3 + int * 0.3));
    armor = Math.round(armor + str * 0.35);

    h.maxHp = maxHp;
    h.maxMp = maxMp;
    if (h.hp > h.maxHp) h.hp = h.maxHp;
    if (h.mp > h.maxMp) h.mp = h.maxMp;

    return {
        str, dex, int, vit,
        physDmg, elemPower, armor, critChance, critMult,
        atkSpeed, moveSpeed, dodge, stealth, lifesteal, rageGain,
        weaponType, weaponRange, weaponArc, projSpeed, pierce
    };
}

const GameState = State;

// Effets visuels éphémères (non sauvegardés) : tremblement d'écran et ondes de choc
const FX = { shake: 0, rings: [] };
