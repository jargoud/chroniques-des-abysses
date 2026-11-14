'use strict';

// ==================== 5. SYSTÈMES DE QUÊTES & MONDES ====================
const Quests = {
    // Deux sortes de quêtes : chasse (tuer N créatures d'un biome) et boss (abattre un boss précis).
    // Les boss d'un biome se débloquent dans l'ordre (rang 0 → 3) ; une quête de boss rapporte l'artefact du biome
    // la première fois : les artefacts ne s'obtiennent plus qu'ainsi.
    generateInitial() {
        State.quests = [];
        this.ensureAvailable();
    },

    bossOf(id) {
        for (const b of BIOMES) {
            const tier = b.bosses.findIndex(x => x.id === id);
            if (tier !== -1) return { biome: b, boss: b.bosses[tier], tier };
        }
        return null;
    },

    unlocked() {
        return BIOMES.filter(b => b.minLvl <= State.hero.level);
    },

    // Prochain boss jamais vaincu d'un biome, s'il est déjà à la portée du héros (rang t : niveau minLvl + t)
    nextBoss(biome) {
        const kills = State.hero.bossKills;
        const tier = biome.bosses.findIndex(x => !kills[x.id]);
        if (tier === -1 || State.hero.level < biome.minLvl + tier) return null;
        return { boss: biome.bosses[tier], tier };
    },

    ensureAvailable() {
        const open = () => State.quests.filter(q => !q.claimed);
        const has = fn => open().some(fn);
        // Quêtes de boss : jusqu'à 2, en commençant par les biomes les moins avancés
        for (const biome of this.unlocked()) {
            if (open().filter(q => q.type === 'boss').length >= 2) break;
            if (has(q => q.type === 'boss' && q.biomeId === biome.id)) continue;
            const next = this.nextBoss(biome);
            if (next) this.addBossQuest(biome, next.boss, next.tier, true);
        }
        // Tous les boss accessibles vaincus : contrat de traque sur un boss déjà tombé (sans artefact)
        if (!has(q => q.type === 'boss')) {
            const pool = [];
            this.unlocked().forEach(b => b.bosses.forEach((bo, t) => { if (State.hero.bossKills[bo.id]) pool.push([b, bo, t]); }));
            if (pool.length) {
                const [b, bo, t] = pool[Math.floor(Math.random() * pool.length)];
                this.addBossQuest(b, bo, t, false);
            }
        }
        // Quêtes de chasse : jusqu'à 2, dans les 3 biomes accessibles les plus avancés
        const top = this.unlocked().slice(-3);
        for (let guard = 0; open().filter(q => q.type === 'kill').length < 2 && guard < 6; guard++) {
            const biome = top[Math.floor(Math.random() * top.length)] || BIOMES[0];
            if (has(q => q.type === 'kill' && q.biomeId === biome.id)) continue;
            const count = 8 + Math.floor(Math.random() * 5);
            State.quests.push({
                id: 'q_' + Date.now() + Math.random(),
                title: 'Chasse : ' + biome.name,
                type: 'kill',
                biomeId: biome.id,
                target: count,
                progress: 0,
                rewardGold: 40 + biome.minLvl * 18,
                rewardXp: 120 + biome.minLvl * 40,
                completed: false,
                claimed: false,
                desc: 'Éliminez ' + count + ' créatures dans ' + biome.name + '.'
            });
        }
    },

    addBossQuest(biome, boss, tier, first) {
        State.quests.push({
            id: 'q_' + Date.now() + Math.random(),
            title: (first ? 'Tête mise à prix : ' : 'Contrat : ') + boss.name,
            type: 'boss',
            biomeId: biome.id,
            bossId: boss.id,
            target: 1,
            progress: 0,
            rewardGold: Math.round((80 + biome.minLvl * 30 + tier * 25) * (first ? 1 : 0.6)),
            rewardXp: Math.round((200 + biome.minLvl * 60 + tier * 40) * (first ? 1 : 0.6)),
            rewardArtifact: first ? biome.artifactId : null,
            completed: false,
            claimed: false,
            desc: (first ? 'Traquez ' : 'Abattez de nouveau ') + boss.name + (boss.title ? ', ' + boss.title + ',' : '') + ' dans ' + biome.name + '.'
        });
    },

    // Boss qui gardera ce donjon : celui d'une quête en cours, sinon un boss déjà vaincu, sinon le gardien (rang 0)
    pickBoss(biome) {
        const q = State.quests.find(x => x.type === 'boss' && !x.completed && !x.claimed && x.biomeId === biome.id);
        if (q) {
            const found = this.bossOf(q.bossId);
            if (found) return found;
        }
        const killed = biome.bosses.map((bo, tier) => ({ biome, boss: bo, tier })).filter(x => State.hero.bossKills[x.boss.id]);
        if (killed.length) return killed[Math.floor(Math.random() * killed.length)];
        return { biome, boss: biome.bosses[0], tier: 0 };
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

    onBossKilled(bossId) {
        if (!bossId) return;
        const kills = State.hero.bossKills;
        kills[bossId] = (kills[bossId] || 0) + 1;
        State.quests.forEach(q => {
            if (q.claimed || q.completed || q.type !== 'boss' || q.bossId !== bossId) return;
            q.progress = 1;
            q.completed = true;
            UI.toast('📜 Quête accomplie : ' + q.title + ' !', 'amber');
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
        let msg = 'Récompense reçue : +' + q.rewardGold + ' Or, +' + q.rewardXp + ' XP';
        if (q.rewardArtifact) {
            const art = ARTIFACTS[q.rewardArtifact];
            State.hero.artifacts[art.id] = (State.hero.artifacts[art.id] || 0) + 1;
            msg += ', ' + art.icon + ' ' + art.name;
        }
        this.ensureAvailable();
        UI.toast(msg, 'amber');
        UI.renderQuestsModal();
        UI.updateHud();
        Game.saveGame();
    }
};

// Plan des donjons par biome (défaut : rooms)
const BIOME_LAYOUT = { pyramid: 'halls', temple: 'halls', jungle: 'caves', forest: 'caves', catacombs: 'caves' };

const World = {
    // Le camp est un menu (UI.openCamp) ; la carte se réduit à une petite clairière derrière le décor peint par le rendu
    enterTown() {
        State.location = 'town';
        Sound.music('town');
        State.currentBiome = null;
        const w = State.world;
        w.cols = 17;
        w.rows = 12;
        w.buildings = [];
        w.grid = Array.from({ length: w.rows }, (_, r) =>
            Array.from({ length: w.cols }, (_, c) => (r === 0 || r === w.rows - 1 || c === 0 || c === w.cols - 1) ? 1 : 0));
        w.explored = Array.from({ length: w.rows }, () => Array(w.cols).fill(true));
        w.npcs = [];
        w.enemies = [];
        w.chests = [];
        w.projectiles = [];
        w.lootDrops = [];
        w.particles = [];
        w.portal = null;
        w.player.x = 8.5 * w.tileSize;
        w.player.y = 6.5 * w.tileSize;

        State.hero.hp = State.hero.maxHp;
        State.hero.mp = 0;
        State.hero.shield = 0;
        this.refreshMerchantStock();
        UI.updateHud();
        UI.openCamp();
        Game.saveGame();
    },

    // Niveau des ennemis et du butin : niveau du héros borné à la plage du biome (+2 par cran de Menace)
    biomeLevel(biome) {
        return Math.min(biome.maxLvl, Math.max(biome.minLvl, State.hero.level)) + (State.difficulty - 1) * 2;
    },

    // Poids de tirage d'un biome pour « Partir en exploration » : les quêtes ouvertes attirent le tirage,
    // un biome déjà dépassé par le héros (au-delà de son niveau max) n'est presque plus tiré
    expeditionWeights() {
        const h = State.hero;
        return Quests.unlocked().map(b => {
            const open = State.quests.filter(q => !q.claimed && !q.completed && q.biomeId === b.id);
            let w = h.level > b.maxLvl ? 0.15 : 1;
            w += open.filter(q => q.type === 'boss').length * 3 + open.filter(q => q.type === 'kill').length * 2;
            return { biome: b, w };
        });
    },

    startExpedition() {
        const list = this.expeditionWeights();
        let r = Math.random() * list.reduce((n, x) => n + x.w, 0);
        const pick = list.find(x => (r -= x.w) <= 0) || list[list.length - 1];
        this.enterDungeon(pick.biome.id);
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
        State.hero.shield = 0;

        const w = State.world;
        w.cols = 54;
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

        // Plan propre au biome : salles et couloirs, grandes salles hypostyles, ou cavernes organiques
        const layout = BIOME_LAYOUT[biome.id] || 'rooms';
        if (layout === 'caves') this.carveCaves();
        else this.carveRooms(layout === 'halls');

        if (w.rooms.length < 2) {
            for (let y = 4; y < 12; y++) for (let x = 4; x < 24; x++) w.grid[y][x] = 0;
            w.rooms = [{ x: 4, y: 4, w: 6, h: 6, cx: 7, cy: 7 }, { x: 18, y: 4, w: 6, h: 6, cx: 21, cy: 7 }];
        }

        const startRoom = w.rooms[0];
        w.player.x = (startRoom.cx + 0.5) * w.tileSize;
        w.player.y = (startRoom.cy + 0.5) * w.tileSize;

        const lvl = this.biomeLevel(biome);

        for (let i = 1; i < w.rooms.length - 1; i++) {
            const room = w.rooms[i];
            const pack = 2 + Math.floor(Math.random() * 3);
            for (let m = 0; m < pack; m++) {
                const pt = this.roomPoint(room);
                this.spawnEnemy(biome, lvl, pt.x, pt.y, false, m === 0 && Math.random() < 0.3);
            }
            if (Math.random() < 0.35) {
                w.chests.push({
                    uid: 'chest_' + i,
                    x: (room.cx + 0.5) * w.tileSize,
                    y: (room.cy + 0.5) * w.tileSize,
                    opened: false,
                    trapped: Math.random() < 0.3,
                    level: lvl
                });
            }
        }

        const bossRoom = w.rooms[w.rooms.length - 1];
        const pick = Quests.pickBoss(biome);
        const boss = this.spawnEnemy(biome, lvl + 1 + pick.tier, (bossRoom.cx + 0.5) * w.tileSize, (bossRoom.cy + 0.5) * w.tileSize, true, true, pick.boss);
        boss.tier = pick.tier;
        const guard = this.roomPoint(bossRoom);
        this.spawnEnemy(biome, lvl, guard.x, guard.y, false, false);

        UI.toast('Exploration : ' + biome.name + ' (Niv. ' + lvl + ') • Boss : ' + pick.boss.name, 'amber');
        UI.updateHud();
    },

    // Point praticable au hasard dans une salle (centre en dernier recours)
    roomPoint(room) {
        const T = State.world.tileSize;
        for (let i = 0; i < 12; i++) {
            const x = (room.x + 1 + Math.random() * Math.max(1, room.w - 2)) * T;
            const y = (room.y + 1 + Math.random() * Math.max(1, room.h - 2)) * T;
            if (this.isWalkable(x, y)) return { x, y };
        }
        return { x: (room.cx + 0.5) * T, y: (room.cy + 0.5) * T };
    },

    // Salles rectangulaires reliées en chaîne ; halls = salles plus vastes et moins nombreuses, couloirs larges
    carveRooms(halls) {
        const w = State.world;
        const max = halls ? 9 : 14;
        for (let attempt = 0; attempt < 200 && w.rooms.length < max; attempt++) {
            const rw = halls ? 7 + Math.floor(Math.random() * 5) : 5 + Math.floor(Math.random() * 4);
            const rh = halls ? 6 + Math.floor(Math.random() * 4) : 5 + Math.floor(Math.random() * 4);
            const rx = 2 + Math.floor(Math.random() * (w.cols - rw - 4));
            const ry = 2 + Math.floor(Math.random() * (w.rows - rh - 4));
            if (w.rooms.some(r => rx < r.x + r.w + 1 && rx + rw + 1 > r.x && ry < r.y + r.h + 1 && ry + rh + 1 > r.y)) continue;
            const room = { x: rx, y: ry, w: rw, h: rh, cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2) };
            for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) w.grid[y][x] = 0;
            // Halls : rangées de piliers
            if (halls && rw >= 8 && rh >= 7) {
                for (let y = ry + 2; y < ry + rh - 2; y += 3) for (let x = rx + 2; x < rx + rw - 2; x += 4) {
                    if (Math.abs(x - room.cx) > 1 || Math.abs(y - room.cy) > 1) w.grid[y][x] = 1;
                }
            }
            if (w.rooms.length > 0) {
                const prev = w.rooms[w.rooms.length - 1];
                this.carveCorridor(prev.cx, prev.cy, room.cx, room.cy);
                if (halls) this.carveCorridor(prev.cx + 1, prev.cy + 1, room.cx + 1, room.cy + 1);
            }
            w.rooms.push(room);
        }
    },

    // Cavernes : clairières aux bords irréguliers reliées par des tunnels sinueux, puis lissage
    carveCaves() {
        const w = State.world, g = w.grid;
        const dig = (cx, cy, r) => {
            for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
                if (y < 1 || x < 1 || y >= w.rows - 1 || x >= w.cols - 1) continue;
                if (Math.hypot(x - cx, (y - cy) * 1.15) <= r + (Math.random() - 0.5) * 1.4) g[y][x] = 0;
            }
        };
        for (let attempt = 0; attempt < 200 && w.rooms.length < 13; attempt++) {
            const r = 3 + Math.random() * 2;
            const cx = Math.round(5 + Math.random() * (w.cols - 10));
            const cy = Math.round(5 + Math.random() * (w.rows - 10));
            if (w.rooms.some(o => Math.hypot(o.cx - cx, o.cy - cy) < r + 6)) continue;
            dig(cx, cy, r);
            if (w.rooms.length) {
                const prev = w.rooms[w.rooms.length - 1];
                let x = prev.cx, y = prev.cy;
                for (let i = 0; i < 400 && (Math.abs(x - cx) > 1 || Math.abs(y - cy) > 1); i++) {
                    if (Math.random() < 0.7) { x += Math.sign(cx - x); y += Math.sign(cy - y) * (Math.random() < 0.5 ? 1 : 0); }
                    else { x += Math.random() < 0.5 ? 1 : -1; y += Math.random() < 0.5 ? 1 : -1; }
                    x = Math.max(2, Math.min(w.cols - 3, x));
                    y = Math.max(2, Math.min(w.rows - 3, y));
                    dig(x, y, 1.3);
                }
            }
            const rr = Math.ceil(r);
            w.rooms.push({ x: cx - rr, y: cy - rr, w: rr * 2 + 1, h: rr * 2 + 1, cx, cy });
        }
        // Lissage : bouche les murs isolés et ouvre les recoins d'une tuile
        for (let y = 1; y < w.rows - 1; y++) for (let x = 1; x < w.cols - 1; x++) {
            let walls = 0;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && g[y + dy][x + dx]) walls++;
            if (g[y][x] && walls <= 2) g[y][x] = 0;
            else if (!g[y][x] && walls >= 7) g[y][x] = 1;
        }
        w.rooms.forEach(r => { g[r.cy][r.cx] = 0; });
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
        const tier = isBoss ? Math.max(0, biome.bosses.indexOf(def)) : 0;
        const hpMult = (isBoss ? 7.0 + tier * 1.5 : (isElite ? 2.3 : (isEarlyGame ? 0.75 : 1.1)) * k.hp) * diffScale;
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
            look: def.look,
            bossId: def.id,
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

    // Stock du marchand : objets un niveau sous le héros, rarement rares, vendus 1,5× leur valeur
    refreshMerchantStock() {
        const lvl = Math.max(1, State.hero.level - 1);
        State.shopStock = ['weapon', 'ranged', 'armor', 'helm', 'gloves', 'boots', 'ring', 'offhand'].map(sl => {
            const it = ItemGen.create(lvl, Math.random() < 0.12 ? 'rare' : (Math.random() < 0.5 ? 'magic' : 'common'), sl);
            it.price = Math.round(it.price * 1.5);
            return it;
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
