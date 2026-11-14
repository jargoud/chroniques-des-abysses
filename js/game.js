'use strict';

// ==================== 9. ACTIONS & SAUVEGARDE ====================
const POTION_PRICE = 30;

const Game = {
    startNewGame() {
        const classKey = 'warrior';
        const cls = CLASSES.warrior;
        const rawName = document.getElementById('heroNameInput').value.trim();

        const h = State.hero;
        h.name = rawName || cls.name;
        h.classId = classKey;
        h.level = 1;
        h.xp = 0;
        h.xpNext = 200;
        h.gold = 65;
        h.attrPoints = 0;
        h.skillPoints = 1;
        h.stats = { ...cls.baseStats };
        h.skills = {};
        h.skillBar = [null, null, null, null, null];
        h.activeWeapon = 'weapon';
        h.equipment = { weapon: null, ranged: null, offhand: null, helm: null, armor: null, gloves: null, boots: null, ring: null, amulet: null };
        h.inventory = [];
        h.artifacts = {};
        h.bossKills = {};
        h.talentVersion = 2;
        h.shield = 0;
        h.potionsHp = 3; // 3 potions de soin de départ
        h.potionsMp = 1;
        h.potionCd = 0;

        h.equipment.weapon = this.trainingSword();
        h.equipment.ranged = this.trainingBow();

        computeHeroStats();
        h.hp = h.maxHp;
        h.mp = 0;

        Quests.generateInitial();
        this.enterGameScreen();
        World.enterTown();
        UI.toast('Bienvenue au Camp d’Oakhaven, ' + h.name + ' !', 'amber');
    },

    trainingBow() {
        return {
            uid: 'itm_start_r', name: 'Arc de Recrue', slot: 'ranged', icon: '🏹',
            rarity: 'common', level: 1, upgrade: 0, socketed: null,
            weaponType: 'ranged', weaponRange: 300, atkSpeed: 1, projSpeed: 600, pierce: false,
            dmg: 5, armor: 0, affixes: [], price: 10
        };
    },

    trainingSword() {
        return {
            uid: 'itm_start_w', name: 'Épée d’Entraînement', slot: 'weapon', icon: '🗡️',
            rarity: 'common', level: 1, upgrade: 0, socketed: null,
            weaponType: 'melee', weaponRange: 58,
            dmg: 7, armor: 0, affixes: [], price: 10
        };
    },

    enterGameScreen() {
        State.screen = 'playing';
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('hudLayer').classList.remove('hidden');
        resizeCanvas();
    },

    returnToTitle() {
        State.screen = 'start';
        UI.closeModals();
        Sound.music(null);
        document.getElementById('hudLayer').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
        UI.renderStartScreen();
    },

    spendAttr(key) {
        if (State.hero.attrPoints <= 0) return;
        State.hero.attrPoints--;
        State.hero.stats[key]++;
        computeHeroStats();
        UI.renderCharacterModal();
        UI.updateHud();
        this.saveGame();
    },

    // Points investis dans une branche de talents
    branchPoints(branchId) {
        return SKILL_TREES.warrior.filter(sk => sk.branch === branchId).reduce((n, sk) => n + (State.hero.skills[sk.id] || 0), 0);
    },

    canLearnSkill(def) {
        const h = State.hero, req = BRANCH_REQ[def.tier];
        return (h.skills[def.id] || 0) < SKILL_MAX_RANK && h.skillPoints > 0 && h.level >= req.lvl && this.branchPoints(def.branch) >= req.pts;
    },

    learnSkill(skillId) {
        const h = State.hero;
        const def = findSkillDef(skillId);
        if (!def || !this.canLearnSkill(def)) return;
        h.skillPoints--;
        h.skills[skillId] = (h.skills[skillId] || 0) + 1;
        if (!def.passive && !h.skillBar.includes(skillId)) {
            const emptySlot = [1, 2, 3, 4, 0].find(s => !h.skillBar[s]);
            if (emptySlot !== undefined) h.skillBar[emptySlot] = skillId;
        }
        computeHeroStats();
        UI.renderSkillsModal();
        UI.updateHud();
        this.saveGame();
    },

    // Remise à zéro des talents (gratuite) : tous les points reviennent
    resetSkills() {
        const h = State.hero;
        h.skillPoints += Object.values(h.skills).reduce((n, r) => n + r, 0);
        h.skills = {};
        h.skillBar = [null, null, null, null, null];
        computeHeroStats();
        UI.renderSkillsModal();
        UI.updateHud();
        this.saveGame();
    },

    assignSkill(skillId, slotIdx) {
        const h = State.hero;
        for (let i = 0; i < 5; i++) {
            if (h.skillBar[i] === skillId) h.skillBar[i] = null;
        }
        h.skillBar[slotIdx] = skillId;
        UI.renderSkillsModal();
        UI.renderSkillBar();
        this.saveGame();
    },

    equipFromBag(bagIdx) {
        const h = State.hero;
        const item = h.inventory[bagIdx];
        if (!item) return;
        const prev = h.equipment[item.slot];
        h.equipment[item.slot] = item;
        h.inventory.splice(bagIdx, 1);
        if (prev) h.inventory.push(prev);
        computeHeroStats();
        UI.renderInventoryModal();
        UI.updateHud();
        this.saveGame();
    },

    unequipSlot(slotKey) {
        const h = State.hero;
        const item = h.equipment[slotKey];
        if (!item) return;
        if (h.inventory.length >= 24) {
            UI.toast('Sac à dos plein !', 'red');
            return;
        }
        h.equipment[slotKey] = null;
        h.inventory.push(item);
        computeHeroStats();
        UI.renderInventoryModal();
        UI.updateHud();
        this.saveGame();
    },

    swapWeapon() {
        if (State.screen !== 'playing') return;
        const h = State.hero;
        const next = h.activeWeapon === 'ranged' ? 'weapon' : 'ranged';
        if (!h.equipment[next]) {
            UI.toast('Aucune ' + SLOT_LABELS[next].toLowerCase() + ' équipée', 'red');
            return;
        }
        h.activeWeapon = next;
        computeHeroStats();
        Sound.play('swap');
        const p = State.world.player;
        Combat.floatingText(p.x, p.y - 30, h.equipment[next].icon + ' ' + SLOT_LABELS[next], '#fde68a');
        UI.renderSkillBar();
        if (State.activeModal === 'inventoryModal') UI.renderInventoryModal();
    },

    // Coût d'amélioration : 1,5× puis 3× la valeur de l'objet
    upgradeCost(item) {
        return Math.round(item.price * (item.upgrade === 0 ? 1.5 : 3));
    },

    upgradeItem(uid) {
        const h = State.hero;
        const item = Object.values(h.equipment).find(x => x && x.uid === uid) || h.inventory.find(x => x.uid === uid);
        if (!item || item.upgrade >= MAX_UPGRADE) return;
        const cost = this.upgradeCost(item);
        if (h.gold < cost) return;
        h.gold -= cost;
        item.upgrade++;
        computeHeroStats();
        UI.toast('⚒️ ' + item.name + ' amélioré (+' + item.upgrade + ') !', 'amber');
        UI.renderBlacksmithModal();
        UI.updateHud();
        this.saveGame();
    },

    socketArtifact(uid, artId) {
        const h = State.hero;
        if ((h.artifacts[artId] || 0) <= 0) return;
        const item = Object.values(h.equipment).find(x => x && x.uid === uid) || h.inventory.find(x => x.uid === uid);
        if (!item || item.socketed) return;
        h.artifacts[artId]--;
        item.socketed = artId;
        computeHeroStats();
        UI.toast('💎 Artefact serti sur ' + item.name + ' !', 'amber');
        UI.renderBlacksmithModal();
        UI.updateHud();
        this.saveGame();
    },

    buyItem(shopIdx) {
        const h = State.hero;
        const it = State.shopStock[shopIdx];
        if (!it || h.gold < it.price || h.inventory.length >= 24) return;
        h.gold -= it.price;
        h.inventory.push(it);
        State.shopStock.splice(shopIdx, 1);
        UI.renderMerchantModal();
        UI.updateHud();
        this.saveGame();
    },

    sellItem(bagIdx) {
        const h = State.hero;
        const it = h.inventory[bagIdx];
        if (!it) return;
        const val = this.sellValue(it);
        h.gold += val;
        h.inventory.splice(bagIdx, 1);
        UI.toast('Vendu pour +' + val + ' Or', 'amber');
        UI.renderMerchantModal();
        UI.updateHud();
        this.saveGame();
    },

    sellValue(it) {
        return Math.max(2, Math.floor(it.price * 0.25));
    },

    buyPotion(type) {
        const h = State.hero;
        if (h.gold < POTION_PRICE) return;
        h.gold -= POTION_PRICE;
        if (type === 'hp') h.potionsHp++;
        else h.potionsMp++;
        UI.renderMerchantModal();
        UI.updateHud();
        this.saveGame();
    },

    saveGame() {
        try {
            localStorage.setItem('chroniques_abysses_save_v3', JSON.stringify({
                hero: State.hero,
                quests: State.quests,
                difficulty: State.difficulty
            }));
        } catch (e) { /* Ignore quota errors */ }
    },

    // Anciennes sauvegardes : classe forcée en Guerrier, talents hors Guerrier remboursés, armes à distance rangées dans leur emplacement, bâtons retirés
    migrateToWarrior() {
        const h = State.hero;
        const warriorIds = SKILL_TREES.warrior.map(sk => sk.id);
        Object.keys(h.skills).forEach(id => {
            if (warriorIds.includes(id)) return;
            h.skillPoints += (h.skills[id] || 0) * (h.classId === 'warrior' ? 2 : 1);
            delete h.skills[id];
        });
        h.skillBar = h.skillBar.map(id => (id && warriorIds.includes(id) ? id : null));
        h.classId = 'warrior';
        h.activeWeapon = h.activeWeapon || 'weapon';
        h.equipment.ranged = h.equipment.ranged || null;
        const toRanged = it => {
            if (it && it.slot === 'weapon' && it.weaponType === 'ranged') it.slot = 'ranged';
            return it;
        };
        h.inventory = h.inventory.map(toRanged).filter(it => it.weaponType !== 'magic');
        const eq = toRanged(h.equipment.weapon);
        if (eq && eq.slot === 'ranged') {
            if (!h.equipment.ranged) h.equipment.ranged = eq;
            else h.inventory.push(eq);
            h.equipment.weapon = this.trainingSword();
        } else if (eq && eq.weaponType === 'magic') {
            h.equipment.weapon = this.trainingSword();
        }
    },

    // v0.4 : nouvel arbre de talents (points remboursés), 2 crans d'amélioration max,
    // artefacts réservés aux quêtes (anciennes quêtes de relique retirées)
    migrateV4() {
        const h = State.hero;
        h.bossKills = h.bossKills || {};
        h.shield = 0;
        if (h.talentVersion !== 2) {
            h.skills = {};
            h.skillBar = [null, null, null, null, null];
            h.skillPoints = h.level;
            h.talentVersion = 2;
        }
        [...Object.values(h.equipment), ...h.inventory].forEach(it => { if (it && it.upgrade > MAX_UPGRADE) it.upgrade = MAX_UPGRADE; });
        State.quests = State.quests.filter(q => q.type !== 'artifact');
        Quests.ensureAvailable();
    },

    loadSavedGame() {
        try {
            const raw = localStorage.getItem('chroniques_abysses_save_v3');
            if (!raw) return;
            const data = JSON.parse(raw.replaceAll('Mana Max', 'Rage Max'));
            // Champs absents des anciennes sauvegardes : valeurs neutres, pas celles de la partie en mémoire
            Object.assign(State.hero, { talentVersion: 0, bossKills: {}, shield: 0 }, data.hero);
            this.migrateToWarrior();
            State.quests = data.quests || [];
            State.difficulty = data.difficulty || 1;
            this.migrateV4();
            computeHeroStats();
            this.enterGameScreen();
            World.enterTown();
            UI.toast('Partie restaurée : ' + State.hero.name, 'amber');
        } catch (e) {
            UI.toast('Sauvegarde corrompue, nouvelle partie requise.', 'red');
        }
    }
};
