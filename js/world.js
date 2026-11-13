'use strict';

// ==================== 5. SYSTÈMES DE QUÊTES & MONDES ====================
const Quests = {
    generateInitial() {
        State.quests = [
            {
                id: 'q_prison',
                title: 'Purger la Prison Souterraine',
                giver: 'Chef Aldebaran',
                type: 'kill',
                biomeId: 'dungeon',
                target: 5,
                progress: 0,
                rewardGold: 85,
                rewardXp: 150,
                completed: false,
                claimed: false,
                desc: 'Éliminez 5 monstres dans la Prison Souterraine pour sécuriser les abords du camp.'
            },
            {
                id: 'q_art_iron',
                title: 'La Rune du Geôlier',
                giver: 'Forgeron Thrain',
                type: 'artifact',
                artifactId: 'art_iron',
                target: 1,
                progress: 0,
                rewardGold: 120,
                rewardXp: 220,
                completed: false,
                claimed: false,
                desc: 'Rapportez une Rune d’Acier Trempé obtenue sur le gardien de la Prison Souterraine.'
            }
        ];
    },

    ensureAvailable() {
        const active = State.quests.filter(q => !q.claimed);
        if (active.length >= 3) return;
        const unlockedBiomes = BIOMES.filter(b => b.minLvl <= State.hero.level);
        const biome = unlockedBiomes[Math.floor(Math.random() * unlockedBiomes.length)] || BIOMES[0];
        const isArt = Math.random() < 0.45;
        if (isArt) {
            const art = ARTIFACTS[biome.artifactId];
            State.quests.push({
                id: 'q_' + Date.now() + Math.random(),
                title: 'Relique : ' + art.name,
                giver: 'Chef Aldebaran',
                type: 'artifact',
                artifactId: art.id,
                target: 1,
                progress: Math.min(1, State.hero.artifacts[art.id] || 0),
                rewardGold: 110 + biome.minLvl * 25,
                rewardXp: 210 + biome.minLvl * 45,
                completed: (State.hero.artifacts[art.id] || 0) >= 1,
                claimed: false,
                desc: 'Trouvez ' + art.name + ' dans ' + biome.name + '.'
            });
        } else {
            const count = 5 + Math.floor(Math.random() * 4);
            State.quests.push({
                id: 'q_' + Date.now() + Math.random(),
                title: 'Chasse : ' + biome.name,
                giver: 'Chef Aldebaran',
                type: 'kill',
                biomeId: biome.id,
                target: count,
                progress: 0,
                rewardGold: 90 + biome.minLvl * 20,
                rewardXp: 180 + biome.minLvl * 35,
                completed: false,
                claimed: false,
                desc: 'Éliminez ' + count + ' créatures dans ' + biome.name + '.'
            });
        }
    },

    onEnemyKilled(biomeId) {
        State.quests.forEach(q => {
            if (q.claimed || q.completed) return;
            if (q.type === 'kill' && q.biomeId === biomeId) {
                q.progress = Math.min(q.target, q.progress + 1);
                if (q.progress >= q.target) {
                    q.completed = true;
                    UI.toast('📜 Quête accomplie : ' + q.title + ' !', 'amber');
                }
            }
        });
        UI.updateHudQuest();
    },

    onArtifactGained(artifactId) {
        State.quests.forEach(q => {
            if (q.claimed || q.completed) return;
            if (q.type === 'artifact' && q.artifactId === artifactId) {
                q.progress = 1;
                q.completed = true;
                UI.toast('📜 Relique trouvée : ' + q.title + ' !', 'amber');
            }
        });
        UI.updateHudQuest();
    },

    claim(questId) {
        const q = State.quests.find(x => x.id === questId);
        if (!q || !q.completed || q.claimed) return;
        if (State.location !== 'town') {
            UI.toast('Retournez au camp pour valider cette quête.', 'red');
            return;
        }
        q.claimed = true;
        State.hero.gold += q.rewardGold;
        Combat.gainXp(q.rewardXp);
        this.ensureAvailable();
        UI.toast('Récompense reçue : +' + q.rewardGold + ' Or, +' + q.rewardXp + ' XP', 'amber');
        UI.renderQuestsModal();
        UI.updateHud();
        Game.saveGame();
    }
};

const World = {
    enterTown() {
        State.location = 'town';
        Sound.music('town');
        State.currentBiome = null;
        const w = State.world;
        // Camp compact : 15 × 10 tuiles praticables ; 2 = bâtiment (bloque le passage, dessiné à part)
        w.cols = 17;
        w.rows = 12;
        w.buildings = [
            { kind: 'hut', c: 2 },    // Chef Aldebaran : hutte au toit de chaume
            { kind: 'forge', c: 7 },  // Forgeron Thrain : forge en pierre
            { kind: 'stall', c: 12 }  // Marchand Barnabé : étal sous auvent
        ];
        w.grid = Array.from({ length: w.rows }, (_, r) =>
            Array.from({ length: w.cols }, (_, c) => (r === 0 || r === w.rows - 1 || c === 0 || c === w.cols - 1) ? 1
                : (r <= 2 && w.buildings.some(b => c >= b.c && c < b.c + 3)) ? 2 : 0)
        );
        w.explored = Array.from({ length: w.rows }, () => Array(w.cols).fill(true));
        w.enemies = [];
        w.chests = [];
        w.projectiles = [];
        w.lootDrops = [];
        w.particles = [];
        w.portal = null;

        w.player.x = 8.5 * w.tileSize;
        w.player.y = 6.5 * w.tileSize;

        // Chaque PNJ se tient devant son bâtiment
        w.npcs = [
            { id: 'npc_chief', role: 'quests', name: 'Chef Aldebaran', icon: '📜', x: 3.5 * w.tileSize, y: 3.6 * w.tileSize, color: '#facc15' },
            { id: 'npc_smith', role: 'blacksmith', name: 'Forgeron Thrain', icon: '⚒️', x: 8.5 * w.tileSize, y: 3.6 * w.tileSize, color: '#fb923c' },
            { id: 'npc_merch', role: 'merchant', name: 'Marchand Barnabé', icon: '⚖️', x: 13.5 * w.tileSize, y: 3.6 * w.tileSize, color: '#4ade80' },
            { id: 'npc_portal', role: 'portal', name: 'Portail des Donjons', icon: '🌀', x: 13.5 * w.tileSize, y: 8.5 * w.tileSize, color: '#38bdf8' }
        ];

        // Camp d'entraînement : mannequins qui encaissent sans riposter
        [[2.5, 8], [4.5, 8], [3.5, 9.8]].forEach(([c, r]) => {
            const d = this.spawnEnemy(BIOMES[0], 1, c * w.tileSize, r * w.tileSize, false, false,
                { name: 'Mannequin d’entraînement', kind: 'melee', body: 'dummy', color: '#d4a64a' });
            d.dummy = true;
            d.hp = d.maxHp = computeHeroStats().physDmg * 10; // ~10 coups pour le briser
        });

        State.hero.hp = State.hero.maxHp;
        State.hero.mp = 0;
        this.refreshMerchantStock();
        UI.updateHud();
        Game.saveGame();
    },

    enterDungeon(biomeId) {
        const biome = BIOMES.find(b => b.id === biomeId) || BIOMES[0];
        if (State.hero.level < biome.minLvl) {
            UI.toast('🔒 ' + biome.name + ' : niveau ' + biome.minLvl + ' requis', 'red');
            return;
        }
        State.location = 'dungeon';
        Sound.music(biome.id);
        State.currentBiome = biome;

        const w = State.world;
        w.cols = 54; // surface ×2 par rapport à la v0.1 (38 × 30)
        w.rows = 42;
        w.grid = Array.from({ length: w.rows }, () => Array(w.cols).fill(1));
        w.explored = Array.from({ length: w.rows }, () => Array(w.cols).fill(false));
        w.rooms = [];
        w.npcs = [];
        w.enemies = [];
        w.chests = [];
        w.projectiles = [];
        w.lootDrops = [];
        w.particles = [];
        w.portal = null;
        w.buildings = [];

        for (let attempt = 0; attempt < 150 && w.rooms.length < 14; attempt++) {
            const rw = 5 + Math.floor(Math.random() * 4);
            const rh = 5 + Math.floor(Math.random() * 4);
            const rx = 2 + Math.floor(Math.random() * (w.cols - rw - 4));
            const ry = 2 + Math.floor(Math.random() * (w.rows - rh - 4));

            const overlaps = w.rooms.some(r =>
                rx < r.x + r.w + 1 && rx + rw + 1 > r.x &&
                ry < r.y + r.h + 1 && ry + rh + 1 > r.y
            );
            if (overlaps) continue;

            const room = { x: rx, y: ry, w: rw, h: rh, cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2) };
            for (let y = ry; y < ry + rh; y++) {
                for (let x = rx; x < rx + rw; x++) {
                    w.grid[y][x] = 0;
                }
            }

            if (w.rooms.length > 0) {
                const prev = w.rooms[w.rooms.length - 1];
                this.carveCorridor(prev.cx, prev.cy, room.cx, room.cy);
            }
            w.rooms.push(room);
        }

        if (w.rooms.length < 2) {
            for (let y = 4; y < 12; y++) for (let x = 4; x < 24; x++) w.grid[y][x] = 0;
            w.rooms = [{ x: 4, y: 4, w: 6, h: 6, cx: 7, cy: 7 }, { x: 18, y: 4, w: 6, h: 6, cx: 21, cy: 7 }];
        }

        const startRoom = w.rooms[0];
        w.player.x = (startRoom.cx + 0.5) * w.tileSize;
        w.player.y = (startRoom.cy + 0.5) * w.tileSize;

        const scaledLvl = Math.max(biome.minLvl, State.hero.level) + (State.difficulty - 1) * 3;

        for (let i = 1; i < w.rooms.length - 1; i++) {
            const room = w.rooms[i];
            const pack = 2 + Math.floor(Math.random() * 3);
            for (let m = 0; m < pack; m++) {
                const ex = (room.x + 1 + Math.random() * (room.w - 2)) * w.tileSize;
                const ey = (room.y + 1 + Math.random() * (room.h - 2)) * w.tileSize;
                const isElite = m === 0 && Math.random() < 0.4;
                this.spawnEnemy(biome, scaledLvl, ex, ey, false, isElite);
            }
            if (Math.random() < 0.45) {
                w.chests.push({
                    uid: 'chest_' + i,
                    x: (room.cx + 0.5) * w.tileSize,
                    y: (room.cy + 0.5) * w.tileSize,
                    opened: false,
                    trapped: Math.random() < 0.3,
                    level: scaledLvl
                });
            }
        }

        const bossRoom = w.rooms[w.rooms.length - 1];
        this.spawnEnemy(biome, scaledLvl + 1, (bossRoom.cx + 0.5) * w.tileSize, (bossRoom.cy + 0.5) * w.tileSize, true, true);
        this.spawnEnemy(biome, scaledLvl, (bossRoom.x + 1.5) * w.tileSize, (bossRoom.y + 1.5) * w.tileSize, false, false);

        UI.toast('Exploration : ' + biome.name + ' (Menace ' + State.difficulty + ')', 'amber');
        UI.updateHud();
    },

    carveCorridor(x1, y1, x2, y2) {
        const g = State.world.grid;
        let x = x1, y = y1;
        while (x !== x2) {
            g[y][x] = 0;
            if (y + 1 < g.length - 1) g[y + 1][x] = 0;
            x += x < x2 ? 1 : -1;
        }
        while (y !== y2) {
            g[y][x] = 0;
            if (x + 1 < g[0].length - 1) g[y][x + 1] = 0;
            y += y < y2 ? 1 : -1;
        }
    },

    spawnEnemy(biome, level, x, y, isBoss, isElite, forcedDef) {
        const pool = isBoss ? biome.bosses : biome.enemies;
        const def = forcedDef || pool[Math.floor(Math.random() * pool.length)];
        const kind = isBoss ? 'melee' : def.kind;
        const k = ENEMY_KINDS[kind];
        const diffScale = 1 + (State.difficulty - 1) * 0.4;

        // Ajustement de la difficulté du premier combat (Niveau 1-2 plus clément)
        const isEarlyGame = level <= 2;
        const hpMult = (isBoss ? 7.0 : (isElite ? 2.3 : (isEarlyGame ? 0.75 : 1.1)) * k.hp) * diffScale;
        const dmgMult = (isBoss ? 2.0 : (isElite ? 1.35 : (isEarlyGame ? 0.7 : 1.05)) * k.dmg) * (1 + (State.difficulty - 1) * 0.25);

        // Croissance avec le niveau calquée sur celle du héros (équipement ×(1+0,14/niv), attributs ≈ +5 %/niv) :
        // un donjon refait à plus haut niveau garde le même nombre de coups pour tuer / être tué.
        // ponytail: courbes fixes, à recalibrer si l'équilibrage du héros change
        const hpGrowth = (1 + (level - 1) * 0.14) * (1 + (level - 1) * 0.05);
        const dmgGrowth = 1 + (level - 1) * 0.08;
        const maxHp = Math.round((42 + level * 22) * hpMult * hpGrowth);
        const dmg = Math.round((8 + level * 4.0) * dmgMult * dmgGrowth);
        const affix = (isElite && !isBoss) ? ELITE_AFFIXES[Math.floor(Math.random() * ELITE_AFFIXES.length)] : null;

        let speed = isBoss ? 110 : 128 * k.speed + Math.random() * 15;
        if (affix && affix.id === 'fast') speed *= 1.38;

        const enemy = {
            uid: 'en_' + Math.random().toString(36).slice(2, 10),
            name: affix ? def.name + ' [' + affix.label + ']' : (isElite && !isBoss ? 'Champion ' + def.name : def.name),
            x, y,
            radius: isBoss ? 26 : Math.round(k.radius * (isElite ? 1.25 : 1)),
            level,
            hp: maxHp,
            maxHp,
            dmg,
            speed,
            kind,
            body: def.body,
            patterns: def.patterns || [],
            patternIdx: 0,
            specialCd: kind === 'charger' ? 0.3 : 1.5 + Math.random() * 1.5,
            action: null,
            isBoss,
            isElite,
            isRanged: !!k.keepDist,
            affix,
            strafeDir: Math.random() < 0.5 ? 1 : -1,
            attackCd: 0.6 + Math.random() * 0.7,
            stunTimer: 0,
            aggro: false,
            color: def.color,
            deco: def.deco || [],
            // Halo des boss et mini-boss : le corps garde la couleur du biome
            glow: isBoss ? Pixel.shade(def.color, 0.5) : (affix ? affix.color : (isElite ? '#facc15' : null))
        };
        State.world.enemies.push(enemy);

        // Les nuées arrivent en meute
        if (k.group && !isElite && !isBoss && !forcedDef) {
            for (let i = 1; i < k.group; i++) {
                const gx = x + (Math.random() - 0.5) * 50, gy = y + (Math.random() - 0.5) * 50;
                this.spawnEnemy(biome, level, this.isWalkable(gx, gy) ? gx : x, this.isWalkable(gx, gy) ? gy : y, false, false, def);
            }
        }
        return enemy;
    },

    // Créature invoquée par un invocateur ou un boss (ni butin ni expérience)
    spawnMinion(parent, x, y) {
        const biome = State.currentBiome || BIOMES[0];
        const def = biome.enemies.find(e => e.kind === 'swarm') || { name: 'Larve Abyssale', kind: 'swarm', body: 'swarm', color: '#a3e635' };
        const en = this.spawnEnemy(biome, parent.level, x, y, false, false, def);
        en.summonedBy = parent.uid;
        en.minion = true;
        en.aggro = true;
    },

    refreshMerchantStock() {
        const lvl = State.hero.level;
        State.shopStock = [];
        const slots = ['weapon', 'ranged', 'armor', 'helm', 'boots', 'ring', 'offhand'];
        slots.forEach(sl => {
            const rar = Math.random() < 0.22 ? 'rare' : (Math.random() < 0.58 ? 'magic' : 'common');
            State.shopStock.push(ItemGen.create(lvl, rar, sl));
        });
    },

    // Ligne de vue : aucun mur entre les deux points (échantillonnage tous les 8 px)
    hasLineOfSight(x1, y1, x2, y2) {
        const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 8);
        for (let i = 1; i < steps; i++) {
            if (!this.isWalkable(x1 + (x2 - x1) * i / steps, y1 + (y2 - y1) * i / steps)) return false;
        }
        return true;
    },

    isWalkable(px, py) {
        const w = State.world;
        const c = Math.floor(px / w.tileSize);
        const r = Math.floor(py / w.tileSize);
        if (r < 0 || r >= w.rows || c < 0 || c >= w.cols) return false;
        return w.grid[r][c] === 0;
    }
};
