'use strict';

// ==================== 6. COMBAT & LOOTS ====================
const Combat = {
    getAimPoint() {
        const p = State.world.player;
        if (State.mouse.active) return { x: State.mouse.worldX, y: State.mouse.worldY };
        return { x: p.x + Math.cos(p.lastMoveAngle) * 180, y: p.y + Math.sin(p.lastMoveAngle) * 180 };
    },

    castSlot(slotIdx) {
        if (State.activeModal || State.screen !== 'playing') return;
        const h = State.hero;
        const skillId = h.skillBar[slotIdx];
        const stats = computeHeroStats();
        const p = State.world.player;
        const aim = this.getAimPoint();
        const angle = Math.atan2(aim.y - p.y, aim.x - p.x);
        p.facing = angle;

        if (!skillId) {
            if (p.attackCd > 0) return;
            p.attackCd = 0.6 / stats.atkSpeed;
            p.swingAnim = 0.22;

            if (stats.weaponType === 'ranged') {
                State.world.projectiles.push({
                    x: p.x, y: p.y, vx: Math.cos(angle) * stats.projSpeed, vy: Math.sin(angle) * stats.projSpeed,
                    dmg: stats.physDmg, color: '#fde68a', radius: 5, life: stats.weaponRange / stats.projSpeed,
                    fromHero: true, basic: true, pierce: stats.pierce, hitList: []
                });
                Sound.play('bow');
            } else {
                if (this.meleeArc(p.x, p.y, angle, stats.weaponRange + 14, Math.PI * stats.weaponArc, stats.physDmg, '#f3f4f6')) this.gainRage(8);
                Sound.play('swing');
            }
            return;
        }

        const def = findSkillDef(skillId);
        const rank = h.skills[skillId] || 0;
        if (!def || rank <= 0 || def.passive) return;
        if (def.weapon && def.weapon !== stats.weaponType) {
            UI.toast(def.name + ' exige une arme ' + (def.weapon === 'ranged' ? 'à distance' : 'de mêlée') + ' [Tab]', 'red');
            return;
        }
        if ((State.cooldowns[skillId] || 0) > 0) return;

        if (h.mp < def.rage) {
            UI.toast('Rage insuffisante ! Frappez ou encaissez pour la remplir.', 'red');
            return;
        }

        h.mp -= def.rage;
        State.cooldowns[skillId] = def.cd;
        p.swingAnim = 0.24;
        Sound.play('skill');
        const power = stats.physDmg + stats.elemPower;

        switch (skillId) {
            case 'war_bash':
                this.meleeArc(p.x, p.y, angle, 72, Math.PI * 0.8, Math.round(power * (0.85 + 0.25 * rank)), '#60a5fa', { stun: 1.2 });
                break;
            case 'war_rally':
                h.shield = Math.round(h.maxHp * (0.1 + 0.1 * rank));
                h.shieldT = 6;
                this.spawnParticles(p.x, p.y, '#93c5fd', 24);
                FX.rings.push({ x: p.x, y: p.y, radius: 60, color: '#60a5fa', life: 0.4, max: 0.4 });
                this.floatingText(p.x, p.y - 34, '+' + h.shield, '#93c5fd', true, Art.icon('shield'));
                break;
            case 'war_cleave':
                this.meleeArc(p.x, p.y, angle, 88, Math.PI * 1.1, Math.round(power * (1.2 + 0.25 * rank)), '#ef4444');
                break;
            case 'war_whirlwind':
                this.aoe(p.x, p.y, 118, Math.round(power * (1.3 + 0.35 * rank)), '#f87171');
                break;
            case 'war_earthquake':
                this.aoe(p.x, p.y, 185, Math.round(power * (2.1 + 0.6 * rank)), '#ea580c', { stun: 2.0 });
                break;
            case 'war_pierce':
                State.world.projectiles.push({
                    x: p.x, y: p.y, vx: Math.cos(angle) * 760, vy: Math.sin(angle) * 760,
                    dmg: Math.round(power * (1.05 + 0.25 * rank)), color: '#4ade80', radius: 7, life: 0.6,
                    fromHero: true, pierce: true, hitList: []
                });
                Sound.play('bow');
                break;
            case 'war_charge': {
                const dist = Math.min(230, Math.hypot(aim.x - p.x, aim.y - p.y));
                const nx = p.x + Math.cos(angle) * dist;
                const ny = p.y + Math.sin(angle) * dist;
                if (World.isWalkable(nx, ny)) { p.x = nx; p.y = ny; }
                this.aoe(p.x, p.y, 92, Math.round(power * (1.05 + 0.3 * rank)), '#f97316', { stun: 1.5 });
                break;
            }
            case 'war_arrows': {
                // Zone visée, à 320 px au plus du héros
                const d = Math.min(320, Math.hypot(aim.x - p.x, aim.y - p.y));
                const ax = p.x + Math.cos(angle) * d, ay = p.y + Math.sin(angle) * d;
                for (let i = 0; i < 18; i++) {
                    const a = Math.random() * Math.PI * 2, r = Math.random() * 100;
                    this.spawnParticles(ax + Math.cos(a) * r, ay + Math.sin(a) * r, '#bbf7d0', 2);
                }
                this.aoe(ax, ay, 115, Math.round(power * (1.7 + 0.5 * rank)), '#4ade80');
                break;
            }
        }
    },

    // Rage : +n (× bonus d'Intelligence), plafonnée à la jauge max
    gainRage(n) {
        const h = State.hero;
        h.mp = Math.min(h.maxMp, h.mp + n * computeHeroStats().rageGain);
    },

    // Renvoie le nombre d'ennemis touchés
    meleeArc(x, y, angle, radius, arcWidth, dmg, color, effects) {
        this.spawnParticles(x + Math.cos(angle) * (radius * 0.6), y + Math.sin(angle) * (radius * 0.6), color, 10);
        let hits = 0;
        State.world.enemies.slice().forEach(en => {
            const d = Math.hypot(en.x - x, en.y - y);
            if (d <= radius + en.radius) {
                const aToEn = Math.atan2(en.y - y, en.x - x);
                let diff = Math.abs(aToEn - angle);
                if (diff > Math.PI) diff = Math.PI * 2 - diff;
                if (en.hp > 0 && diff <= arcWidth / 2 && World.hasLineOfSight(x, y, en.x, en.y)) {
                    if (effects && effects.stun) en.stunTimer = Math.max(en.stunTimer, effects.stun);
                    this.damageEnemy(en, dmg, false, color);
                    hits++;
                }
            }
        });
        return hits;
    },

    aoe(x, y, radius, dmg, color, effects) {
        this.spawnParticles(x, y, color, 22);
        FX.rings.push({ x, y, radius, color, life: 0.35, max: 0.35 });
        FX.shake = Math.max(FX.shake, 2);
        Sound.play('boom');
        State.world.enemies.slice().forEach(en => {
            if (Math.hypot(en.x - x, en.y - y) <= radius + en.radius && World.hasLineOfSight(x, y, en.x, en.y)) {
                if (effects && effects.stun) en.stunTimer = Math.max(en.stunTimer, effects.stun);
                this.damageEnemy(en, dmg, false, color, 1 / 3);
            }
        });
    },

    // lifeMult : part du vol de vie appliquée (1/3 en zone, sinon un Séisme sur 8 ennemis soigne 8 fois ; 0 pour Représailles)
    damageEnemy(en, rawDmg, forceCrit, color, lifeMult = 1) {
        if (!en || en.hp <= 0) return;
        const h = State.hero;
        const stats = computeHeroStats();
        const isCrit = forceCrit || (Math.random() * 100 < stats.critChance);

        let dmg = Math.round(rawDmg * (0.9 + Math.random() * 0.2));
        if (isCrit) dmg = Math.round(dmg * stats.critMult);
        if (en.affix && en.affix.id === 'shielded') dmg = Math.max(1, Math.round(dmg * 0.7));


        en.hp -= dmg;
        en.aggro = true;
        en.hitFlash = 0.12;
        Sound.play(isCrit ? 'crit' : 'hit');
        if (isCrit) FX.shake = Math.max(FX.shake, 2);
        if (stats.lifesteal > 0 && lifeMult > 0) {
            h.hp = Math.min(h.maxHp, h.hp + Math.max(1, Math.round(dmg * stats.lifesteal * lifeMult / 100)));
        }

        this.spawnParticles(en.x, en.y, color || '#facc15', isCrit ? 12 : 6);
        this.floatingText(en.x, en.y - en.radius - 6, String(dmg), isCrit ? '#facc15' : '#ffffff', isCrit, isCrit ? Art.icon('burst') : null);

        if (en.hp <= 0) this.onEnemyDeath(en);
    },

    // Dégâts d'explosion sur les autres ennemis de la zone (sans bonus du héros) ; réactions en chaîne possibles
    blastEnemies(src, R, dmg) {
        State.world.enemies.filter(o => o !== src && o.hp > 0
            && Math.hypot(o.x - src.x, o.y - src.y) <= R + o.radius
            && World.hasLineOfSight(src.x, src.y, o.x, o.y)).forEach(o => {
            if (o.hp <= 0) return; // déjà tué par une détonation en chaîne
            o.hp -= dmg;
            o.hitFlash = 0.12;
            this.floatingText(o.x, o.y - o.radius - 6, String(dmg), '#f97316');
            if (o.hp <= 0) this.onEnemyDeath(o);
        });
    },

    onEnemyDeath(en) {
        const w = State.world;
        const idx = w.enemies.indexOf(en);
        if (idx !== -1) w.enemies.splice(idx, 1);
        FX.rings.push({ x: en.x, y: en.y, radius: en.radius * 2.5, color: en.color, life: 0.3, max: 0.3 });
        this.spawnParticles(en.x, en.y, en.color, en.isBoss ? 40 : 14);
        Sound.play(en.isBoss ? 'boom' : 'death');
        if (en.isBoss) FX.shake = 6;

        if (en.affix && en.affix.id === 'explosive') {
            this.spawnParticles(en.x, en.y, '#f97316', 24);
            this.floatingText(en.x, en.y - 24, 'Détonation !', '#f97316', true, Art.icon('burst'));
            if (Math.hypot(w.player.x - en.x, w.player.y - en.y) <= 88 && World.hasLineOfSight(en.x, en.y, w.player.x, w.player.y)) {
                this.damagePlayer(Math.round(en.dmg * 1.3), null, en.level);
            }
            this.blastEnemies(en, 88, Math.round(en.dmg * 1.3));
        }

        if (en.minion || en.selfDestruct) return;

        const biome = State.currentBiome;
        // XP réduite de 20 % par niveau d'écart quand le héros dépasse l'ennemi (plancher 10 %)
        const gap = Math.max(0, State.hero.level - en.level);
        const baseXp = (10 + Math.floor(Math.random() * 6) + en.level * 3) * Math.max(0.1, 1 - 0.2 * gap);
        this.gainXp(Math.max(1, Math.round(baseXp * (en.isBoss ? 10 : (en.isElite ? 3 : 1)))));

        if (biome) Quests.onEnemyKilled(biome.id);
        if (en.isBoss) Quests.onBossKilled(en.bossId);

        // Or rare en exploration : l'essentiel vient des récompenses de quêtes
        if (en.isBoss || en.isElite || Math.random() < 0.3) {
            const gold = Math.round((2 + en.level) * (en.isBoss ? 10 : (en.isElite ? 3 : 1)));
            w.lootDrops.push({
                uid: 'drop_' + Math.random(), type: 'gold', amount: gold,
                x: en.x + (Math.random() - 0.5) * 18, y: en.y + (Math.random() - 0.5) * 18,
                color: '#facc15', label: gold + ' Or'
            });
        }

        if (Math.random() < (en.isBoss ? 0.85 : (en.isElite ? 0.22 : 0.06))) {
            const isHp = Math.random() < 0.65;
            w.lootDrops.push({
                uid: 'drop_' + Math.random(), type: isHp ? 'potion_hp' : 'potion_mp',
                x: en.x + (Math.random() - 0.5) * 24, y: en.y + (Math.random() - 0.5) * 24,
                color: isHp ? '#ef4444' : '#f97316', label: isHp ? 'Potion Vie' : 'Potion Fureur'
            });
        }

        // Objets : légendaires réservés aux boss, d'autant plus probables que le boss est de haut rang
        const itemChance = en.isBoss ? 1.0 : (en.isElite ? 0.3 : 0.04);
        if (Math.random() < itemChance) {
            const legChance = 0.1 + 0.1 * (en.tier || 0);
            const forcedRar = en.isBoss ? (Math.random() < legChance ? 'legendary' : 'rare') : (en.isElite ? (Math.random() < 0.3 ? 'rare' : 'magic') : null);
            const item = ItemGen.create(en.level, forcedRar);
            w.lootDrops.push({
                uid: 'drop_' + Math.random(), type: 'item', item,
                x: en.x + (Math.random() - 0.5) * 28, y: en.y + (Math.random() - 0.5) * 28,
                color: RARITIES[item.rarity].color, label: item.name
            });
        }

        if (en.isBoss) {
            w.portal = { x: en.x, y: en.y - 45 };
            UI.toast(en.name + ' vaincu ! Portail vers le camp ouvert.', 'amber', 'trophy');
        }
    },

    // source : ennemi au corps-à-corps (déclenche Représailles) • lvl : niveau de l'attaquant (potions de secours à la mort)
    damagePlayer(rawDmg, source, lvl) {
        const h = State.hero;
        const stats = computeHeroStats();

        if (Math.random() * 100 < stats.dodge) {
            this.floatingText(State.world.player.x, State.world.player.y - 22, 'Esquive !', '#93c5fd');
            Sound.play('dodge');
            return 0;
        }

        // Seuil calé sur le niveau de l'attaquant (comme ses dégâts) et sur la croissance de l'équipement (×(1+0,14/niv)) :
        // sans ça la réduction file vers 90 % en fin de partie
        const attackerLvl = source ? source.level : (lvl || h.level);
        const reduction = Math.min(0.75, stats.armor / (stats.armor + (55 + attackerLvl * 10) * (1 + (attackerLvl - 1) * 0.14)));
        let dmg = Math.max(1, Math.round(rawDmg * (1 - reduction) * (1 - this.assist(attackerLvl))));
        if (h.skills.war_bulwark && h.hp < h.maxHp * 0.4) dmg = Math.max(1, Math.round(dmg * (1 - 0.12 * h.skills.war_bulwark)));
        if (source && h.skills.war_thorns && source.hp > 0) {
            this.damageEnemy(source, Math.max(1, Math.round(dmg * 0.25 * (1 + h.skills.war_thorns))), false, '#a3e635', 0);
        }
        if (h.shield > 0) {
            const absorbed = Math.min(h.shield, dmg);
            h.shield -= absorbed;
            dmg -= absorbed;
            if (dmg <= 0) {
                this.floatingText(State.world.player.x, State.world.player.y - 22, 'Absorbé', '#93c5fd');
                return 0;
            }
        }
        h.hp = Math.max(0, h.hp - dmg);
        State.world.player.hitFlash = 0.18;
        Sound.play('hurt');
        FX.shake = Math.max(FX.shake, 3);
        this.floatingText(State.world.player.x, State.world.player.y - 22, '-' + dmg, '#ef4444');
        this.gainRage(4 + 40 * dmg / h.maxHp);

        if (h.hp <= 0) {
            const lost = Math.floor(h.gold * 0.12);
            h.gold = Math.max(0, h.gold - lost);
            const gift = this.deathPotions(source ? source.level : lvl);
            h.potionsHp += gift;
            World.enterTown();
            UI.showDeath(lost, gift);
        }
        return dmg;
    },

    // Niveau d'équipement : moyenne des emplacements portés (arme rangée exclue, vide = 0),
    // pondérée par la rareté et les améliorations
    gearLevel() {
        const h = State.hero;
        const inactive = h.activeWeapon === 'ranged' && h.equipment.ranged ? 'weapon' : 'ranged';
        const slots = Object.keys(h.equipment).filter(sl => sl !== inactive);
        return slots.reduce((sum, sl) => {
            const it = h.equipment[sl];
            return sum + (it ? it.level * RARITIES[it.rarity].mult * (1 + it.upgrade * UPGRADE_STEP) : 0);
        }, 0) / slots.length;
    },

    // Protection du débutant : réduction des dégâts subis (20 % max) tant que le héros n'est pas plus fort que l'ennemi.
    // Début de partie : 15 % au niveau 1, nulle au niveau 6. Sous-équipement : 3 % par niveau d'écart entre l'ennemi
    // et le niveau d'équipement, 12 % max. Disparaît dès que l'équipement égale le niveau de l'ennemi, après le niveau 6.
    assist(attackerLvl) {
        const early = Math.max(0, 0.15 * (1 - (State.hero.level - 1) / 5));
        const gear = Math.min(0.12, Math.max(0, 0.03 * (attackerLvl - this.gearLevel())));
        return Math.min(0.2, early + gear);
    },

    // Potions de secours à la mort (1 à 3) : +1 si le coup fatal vient d'un ennemi plus fort que le héros,
    // +1 si la bourse ne permet pas d'acheter 2 potions
    deathPotions(killerLvl) {
        let n = 1;
        if ((killerLvl || 0) > State.hero.level) n++;
        if (State.hero.gold < potionPrice() * 2) n++;
        return n;
    },

    gainXp(amount) {
        const h = State.hero;
        h.xp += amount;
        while (h.xp >= h.xpNext) {
            h.xp -= h.xpNext;
            h.level++;
            Sound.play('levelup');
            // Courbe d'XP progressive et saine (un peu plus douce au début)
            h.xpNext = Math.floor(200 * Math.pow(h.level, 1.68));
            h.attrPoints += 4;
            h.skillPoints += 1;
            computeHeroStats();
            h.hp = h.maxHp;
            h.mp = h.maxMp;
            this.spawnParticles(State.world.player.x, State.world.player.y, '#facc15', 30);
            this.floatingText(State.world.player.x, State.world.player.y - 34, 'NIVEAU ' + h.level + ' !', '#facc15', true);
            UI.toast('Niveau ' + h.level + ' atteint ! (+4 Attributs, +1 Talent)', 'amber');
        }
        UI.updateHud();
    },

    usePotion(type) {
        const h = State.hero;
        if (h.potionCd > 0) {
            UI.toast('Potion en recharge (' + h.potionCd.toFixed(1) + 's)', 'amber');
            return;
        }
        if (type === 'hp' && h.potionsHp > 0 && h.hp < h.maxHp) {
            h.potionsHp--;
            h.potionCd = 3.0; // Temps de recharge réduit à 3s
            Sound.play('potion');
            h.hp = Math.min(h.maxHp, h.hp + Math.round(h.maxHp * 0.42));
            this.spawnParticles(State.world.player.x, State.world.player.y, '#ef4444', 12);
        } else if (type === 'mp' && h.potionsMp > 0 && h.mp < h.maxMp) {
            h.potionsMp--;
            h.potionCd = 3.0; // Temps de recharge réduit à 3s
            Sound.play('potion');
            h.mp = Math.min(h.maxMp, h.mp + Math.round(h.maxMp * 0.5));
            this.spawnParticles(State.world.player.x, State.world.player.y, '#f97316', 12);
        }
        UI.renderSkillBar();
    },

    pickupDrop(index) {
        const h = State.hero;
        const w = State.world;
        const drop = w.lootDrops[index];
        if (!drop) return;
        Sound.play(drop.type === 'gold' ? 'coin' : 'pickup');

        if (drop.type === 'gold') {
            h.gold += drop.amount;
            this.floatingText(w.player.x, w.player.y - 22, '+' + drop.amount + ' Or', '#facc15');
            w.lootDrops.splice(index, 1);
        } else if (drop.type === 'potion_hp') {
            h.potionsHp++;
            this.floatingText(w.player.x, w.player.y - 22, '+1 Potion Vie', '#f87171');
            w.lootDrops.splice(index, 1);
            UI.renderSkillBar();
        } else if (drop.type === 'potion_mp') {
            h.potionsMp++;
            this.floatingText(w.player.x, w.player.y - 22, '+1 Potion Fureur', '#fb923c');
            w.lootDrops.splice(index, 1);
            UI.renderSkillBar();
        } else if (drop.type === 'item') {
            if (h.inventory.length < 24) {
                h.inventory.push(drop.item);
                this.floatingText(w.player.x, w.player.y - 24, drop.item.name, drop.color);
                w.lootDrops.splice(index, 1);
            } else {
                UI.toast('Sac à dos plein !', 'red');
            }
        }
        UI.updateHud();
    },

    interact() {
        const w = State.world;
        const p = w.player;

        for (let i = w.lootDrops.length - 1; i >= 0; i--) {
            if (Math.hypot(p.x - w.lootDrops[i].x, p.y - w.lootDrops[i].y) < 85) {
                this.pickupDrop(i);
                return;
            }
        }

        const chest = w.chests.find(c => !c.opened && Math.hypot(p.x - c.x, p.y - c.y) < 75);
        if (chest) {
            chest.opened = true;
            Sound.play('chest');
            if (chest.trapped) {
                this.floatingText(chest.x, chest.y - 20, 'Coffre Piégé !', '#f97316', true, Art.icon('burst'));
                this.damagePlayer(Math.round((8 + chest.level * 4) * (1 + (chest.level - 1) * 0.08)), null, chest.level);
            }
            const item = ItemGen.create(chest.level, Math.random() < 0.25 ? 'rare' : 'magic');
            w.lootDrops.push({
                uid: 'drop_' + Math.random(), type: 'item', item,
                x: chest.x, y: chest.y + 18, color: RARITIES[item.rarity].color, label: item.name
            });
            return;
        }

        if (w.portal && Math.hypot(p.x - w.portal.x, p.y - w.portal.y) < 75) {
            World.enterTown();
        }
    },

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 40 + Math.random() * 130;
            State.world.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, color, life: 0.3 + Math.random() * 0.25 });
        }
    },

    // icon : canvas Art (icône dessinée à gauche du texte)
    floatingText(x, y, text, color, big, icon) {
        State.world.floatingTexts.push({ x, y, text, color, big: !!big, icon, life: 0.95 });
    }
};

function findSkillDef(skillId) {
    for (const clsId of Object.keys(SKILL_TREES)) {
        const found = SKILL_TREES[clsId].find(s => s.id === skillId);
        if (found) return found;
    }
    return null;
}

// ==================== IA DES ENNEMIS & ATTAQUES SPÉCIALES ====================
// Chaque attaque passe par une « action » télégraphiée (en.action.t = temps restant avant déclenchement).
const EnemyAI = {
    move(en, ang, spd, dt) {
        const nx = en.x + Math.cos(ang) * spd * dt;
        const ny = en.y + Math.sin(ang) * spd * dt;
        if (World.isWalkable(nx, en.y)) en.x = nx;
        if (World.isWalkable(en.x, ny)) en.y = ny;
    },

    shoot(en, angle, speed, dmgMult) {
        State.world.projectiles.push({
            x: en.x, y: en.y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            dmg: Math.round(en.dmg * (dmgMult || 1)), color: en.color, radius: 6, life: 1.8, lvl: en.level, src: en.uid
        });
    },

    start(en, type, time, angle) {
        en.action = { type, t: time, max: time, angle };
    },

    update(en, dt) {
        const p = State.world.player;
        if (en.hitFlash > 0) en.hitFlash -= dt;
        if (en.attackAnim > 0) en.attackAnim -= dt;
        if (en.stunTimer > 0) { en.stunTimer -= dt; en.action = null; return; }
        if (en.attackCd > 0) en.attackCd -= dt;
        if (en.specialCd > 0) en.specialCd -= dt;

        const dToP = Math.hypot(p.x - en.x, p.y - en.y);
        const angleToP = Math.atan2(p.y - en.y, p.x - en.x);
        const los = World.hasLineOfSight(en.x, en.y, p.x, p.y);
        if (!en.aggro && los && dToP < 340 * (1 - computeHeroStats().stealth / 100)) {
            en.aggro = true;
            Combat.floatingText(en.x, en.y - 30, '!', '#facc15');
        }
        if (!en.aggro) return;
        if (en.action) return this.runAction(en, dt, dToP, los);

        const k = ENEMY_KINDS[en.kind] || ENEMY_KINDS.melee;

        // Boss : attaques spéciales en alternance, plus fréquentes sous 50 % de PV
        if (en.isBoss && en.specialCd <= 0 && dToP < 460 && los) {
            const pat = en.patterns[en.patternIdx++ % en.patterns.length];
            en.specialCd = en.hp < en.maxHp * 0.5 ? 2.6 : 4.0;
            return this.start(en, pat, BOSS_WINDUP[pat], angleToP);
        }

        if (k.keepDist) {
            let moveAngle = angleToP;
            if (dToP < 140) moveAngle += Math.PI;
            else if (dToP <= 270) moveAngle += (Math.PI / 2) * en.strafeDir;
            this.move(en, moveAngle, en.speed * 0.85, dt);
            if (k.summon && en.specialCd <= 0 && dToP < 380 && los) {
                en.specialCd = 7;
                return this.start(en, 'summon', 0.8, angleToP);
            }
            if (dToP <= 300 && en.attackCd <= 0 && los) this.start(en, k.spread ? 'volley3' : 'shot', 0.45, angleToP);
            return;
        }

        if (en.kind === 'charger' && en.specialCd <= 0 && dToP > 70 && dToP < 280 && los) {
            en.specialCd = 4;
            return this.start(en, 'charge', 0.55, angleToP);
        }

        const reach = en.radius + p.radius + 10;
        if (dToP > reach || !los) {
            const flank = en.isElite || en.isBoss ? 0 : Math.sin(performance.now() * 0.002 + en.radius) * 0.35 * en.strafeDir;
            this.move(en, angleToP + flank, en.speed, dt);
        } else if (en.kind === 'bomber') {
            this.start(en, 'fuse', 0.6, angleToP);
        } else if (en.attackCd <= 0) {
            en.attackCd = (en.affix && en.affix.id === 'fast') ? 0.8 : 1.15;
            en.attackAnim = 0.25;
            const dealt = Combat.damagePlayer(en.dmg, en);
            if (dealt > 0 && en.affix && en.affix.id === 'vampiric') {
                const heal = Math.round(dealt * 0.4);
                en.hp = Math.min(en.maxHp, en.hp + heal);
                Combat.floatingText(en.x, en.y - en.radius - 10, '+' + heal, '#f43f5e');
            }
        }
    },

    runAction(en, dt, dToP, los) {
        const p = State.world.player;
        const a = en.action;
        a.t -= dt;

        if (a.type === 'dash') {
            this.move(en, a.angle, en.speed * 4, dt);
            if (Math.random() < 0.6) Combat.spawnParticles(en.x, en.y + en.radius * 0.6, '#a8a29e', 1);
            if (!a.hit && dToP < en.radius + p.radius + 6) {
                a.hit = true;
                Combat.damagePlayer(Math.round(en.dmg * 1.2), en);
            }
            if (a.t <= 0) en.action = null;
            return;
        }
        if (a.t > 0) return; // télégraphe en cours

        en.action = null;
        en.attackAnim = 0.25;
        const fast = en.affix && en.affix.id === 'fast';
        switch (a.type) {
            case 'shot':
                this.shoot(en, a.angle, 320);
                en.attackCd = fast ? 1.15 : 1.7;
                Sound.play('shoot');
                break;
            case 'volley3':
                [-0.25, 0, 0.25].forEach(o => this.shoot(en, a.angle + o, 290, 1));
                en.attackCd = fast ? 1.6 : 2.3;
                Sound.play('shoot');
                break;
            case 'volley':
                for (let i = -2; i <= 2; i++) this.shoot(en, a.angle + i * 0.18, 340, 0.6);
                Sound.play('shoot');
                break;
            case 'nova':
                for (let i = 0; i < 14; i++) this.shoot(en, a.angle + i * Math.PI * 2 / 14, 250, 0.5);
                FX.rings.push({ x: en.x, y: en.y, radius: 60, color: en.color, life: 0.3, max: 0.3 });
                Sound.play('boom');
                break;
            case 'charge':
                en.action = { type: 'dash', t: 0.45, angle: a.angle };
                Sound.play('skill');
                break;
            case 'slam': {
                const R = 135;
                FX.rings.push({ x: en.x, y: en.y, radius: R, color: en.color, life: 0.4, max: 0.4 });
                FX.shake = Math.max(FX.shake, 5);
                Sound.play('boom');
                if (dToP <= R + p.radius && los) Combat.damagePlayer(Math.round(en.dmg * 0.8), null, en.level);
                break;
            }
            case 'summon': {
                const w = State.world;
                const cap = en.isBoss ? 6 : 4;
                const count = Math.min(en.isBoss ? 3 : 2, cap - w.enemies.filter(e => e.summonedBy === en.uid).length);
                for (let i = 0; i < count; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    const sx = en.x + Math.cos(ang) * 40, sy = en.y + Math.sin(ang) * 40;
                    if (!World.isWalkable(sx, sy)) continue;
                    World.spawnMinion(en, sx, sy);
                }
                Combat.spawnParticles(en.x, en.y, en.color, 16);
                Sound.play('skill');
                break;
            }
            case 'fuse': {
                const R = 80;
                FX.rings.push({ x: en.x, y: en.y, radius: R, color: '#f97316', life: 0.35, max: 0.35 });
                if (dToP <= R + p.radius && los) Combat.damagePlayer(en.dmg, null, en.level);
                en.selfDestruct = true;
                en.hp = 0; // hors cible des détonations en chaîne
                Combat.blastEnemies(en, R, en.dmg);
                Combat.onEnemyDeath(en);
                break;
            }
        }
    }
};

function updateSimulation(dt) {
    if (State.screen !== 'playing' || State.activeModal) return;

    const h = State.hero;
    const w = State.world;
    const p = w.player;
    const stats = computeHeroStats();

    if (p.attackCd > 0) p.attackCd -= dt;
    if (p.swingAnim > 0) p.swingAnim -= dt;
    if (p.hitFlash > 0) p.hitFlash -= dt;
    FX.shake = Math.max(0, FX.shake - dt * 18);
    for (let i = FX.rings.length - 1; i >= 0; i--) {
        if ((FX.rings[i].life -= dt) <= 0) FX.rings.splice(i, 1);
    }
    if (h.potionCd > 0) h.potionCd = Math.max(0, h.potionCd - dt);
    if (h.shieldT > 0 && (h.shieldT -= dt) <= 0) h.shield = 0;
    Object.keys(State.cooldowns).forEach(k => {
        if (State.cooldowns[k] > 0) State.cooldowns[k] = Math.max(0, State.cooldowns[k] - dt);
    });

    // La Rage retombe (10/s) quand aucun ennemi en alerte n'est à moins de 500 px
    if (!w.enemies.some(e => e.aggro && Math.hypot(e.x - p.x, e.y - p.y) < 500)) h.mp = Math.max(0, h.mp - 10 * dt);

    // Récupération hors combat plus accessible au camp de base
    if (State.location === 'town') h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.35 * dt);

    let mx = 0, my = 0;
    if (State.keys['KeyW'] || State.keys['KeyZ'] || State.keys['ArrowUp']) my -= 1;
    if (State.keys['KeyS'] || State.keys['ArrowDown']) my += 1;
    if (State.keys['KeyA'] || State.keys['KeyQ'] || State.keys['ArrowLeft']) mx -= 1;
    if (State.keys['KeyD'] || State.keys['ArrowRight']) mx += 1;

    p.moving = mx !== 0 || my !== 0;
    if (mx !== 0 || my !== 0) {
        State.mouse.active = false;
        const len = Math.hypot(mx, my);
        mx /= len; my /= len;
        p.lastMoveAngle = Math.atan2(my, mx);
        const nx = p.x + mx * stats.moveSpeed * dt;
        const ny = p.y + my * stats.moveSpeed * dt;
        if (World.isWalkable(nx, p.y)) p.x = nx;
        if (World.isWalkable(p.x, ny)) p.y = ny;
        p.dustT = (p.dustT || 0) - dt;
        if (p.dustT <= 0) {
            p.dustT = 0.14;
            w.particles.push({ x: p.x - mx * 8, y: p.y + 14, vx: -mx * 20, vy: -12, color: '#a8a29e', life: 0.35, dust: true });
        }
    }

    const pc = Math.floor(p.x / w.tileSize);
    const pr = Math.floor(p.y / w.tileSize);
    for (let r = pr - 5; r <= pr + 5; r++) {
        for (let c = pc - 6; c <= pc + 6; c++) {
            if (r >= 0 && r < w.rows && c >= 0 && c < w.cols) w.explored[r][c] = true;
        }
    }

    // Caméra fluide (téléportations : recentrage immédiat)
    const camTx = p.x - canvas.width / 2, camTy = p.y - canvas.height / 2;
    const camK = Math.hypot(camTx - w.camera.x, camTy - w.camera.y) > 400 ? 1 : Math.min(1, dt * 9);
    w.camera.x += (camTx - w.camera.x) * camK;
    w.camera.y += (camTy - w.camera.y) * camK;
    State.mouse.worldX = State.mouse.x + w.camera.x;
    State.mouse.worldY = State.mouse.y + w.camera.y;

    const aim = Combat.getAimPoint();
    p.facing = Math.atan2(aim.y - p.y, aim.x - p.x);

    if (State.mouse.leftDown || State.keys['Space']) Combat.castSlot(0);

    // Un coup peut tuer le héros et le renvoyer au camp (tableaux remplacés) : on itère sur une copie
    // et on s'arrête si le lieu change
    const loc = State.location;
    const removePrj = prj => { const k = w.projectiles.indexOf(prj); if (k !== -1) w.projectiles.splice(k, 1); };
    for (const prj of w.projectiles.slice()) {
        if (State.location !== loc) break;
        prj.x += prj.vx * dt;
        prj.y += prj.vy * dt;
        prj.life -= dt;

        if (!World.isWalkable(prj.x, prj.y) || prj.life <= 0) {
            removePrj(prj);
            continue;
        }

        if (prj.fromHero) {
            const en = w.enemies.find(e => e.hp > 0 && !prj.hitList.includes(e.uid) && Math.hypot(prj.x - e.x, prj.y - e.y) < prj.radius + e.radius);
            if (en) {
                prj.hitList.push(en.uid);
                if (!prj.pierce) removePrj(prj);
                Combat.damageEnemy(en, prj.dmg, false, prj.color);
                if (prj.basic) Combat.gainRage(6);
            }
        } else if (w.enemies.some(e => e.uid !== prj.src && e.hp > 0 && Math.hypot(prj.x - e.x, prj.y - e.y) < prj.radius + e.radius)) {
            // Un allié du tireur bloque le projectile sans être blessé
            removePrj(prj);
            Combat.spawnParticles(prj.x, prj.y, prj.color, 3);
        } else if (Math.hypot(prj.x - p.x, prj.y - p.y) < prj.radius + p.radius) {
            removePrj(prj);
            Combat.damagePlayer(prj.dmg, null, prj.lvl);
        }
    }
    if (State.location !== loc) return;

    for (const en of w.enemies.slice()) {
        if (State.location !== loc) return;
        EnemyAI.update(en, dt);
    }
    if (State.location !== loc) return;

    for (let i = w.lootDrops.length - 1; i >= 0; i--) {
        if (Math.hypot(w.lootDrops[i].x - p.x, w.lootDrops[i].y - p.y) < 32) {
            Combat.pickupDrop(i);
        }
    }

    for (let i = w.particles.length - 1; i >= 0; i--) {
        const pt = w.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) w.particles.splice(i, 1);
    }
    for (let i = w.floatingTexts.length - 1; i >= 0; i--) {
        const ft = w.floatingTexts[i];
        ft.y -= 28 * dt;
        ft.life -= dt;
        if (ft.life <= 0) w.floatingTexts.splice(i, 1);
    }

    if (State.location === 'dungeon') Sound.music(w.enemies.some(e => e.isBoss && e.aggro) ? 'boss' : State.currentBiome.id);

    UI.updateDynamicBars();
    UI.updateContextPrompt();
}
