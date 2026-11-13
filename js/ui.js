'use strict';

// ==================== 8. INTERFACE UTILISATEUR (UI) ====================
const UI = {
    toast(msg, tone) {
        const box = document.getElementById('toastContainer');
        const el = document.createElement('div');
        const colors = {
            amber: 'border-amber-400/80 text-amber-200 bg-stone-950/95',
            red: 'border-red-500/80 text-red-200 bg-red-950/95',
            blue: 'border-blue-400/80 text-blue-200 bg-slate-950/95'
        };
        el.className = 'px-4 py-1.5 rounded-full border text-xs font-semibold shadow-xl transition-opacity duration-300 ' + (colors[tone] || colors.amber);
        el.textContent = msg;
        box.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 320); }, 2600);
    },

    renderStartScreen() {
        const sel = CLASSES.warrior;
        document.getElementById('classDetailBox').innerHTML =
            '<div class="flex-1">' +
                '<div class="flex items-center gap-2 mb-1">' +
                    '<span class="text-xl">' + sel.icon + '</span>' +
                    '<h3 class="font-cinzel font-bold text-base text-amber-300">' + sel.name + ' — ' + sel.role + '</h3>' +
                '</div>' +
                '<p class="text-xs text-gray-300 leading-relaxed">' + sel.desc + '</p>' +
            '</div>' +
            '<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs bg-black/50 px-3.5 py-2 rounded-lg border border-gray-800 shrink-0">' +
                '<span class="text-gray-400">Force : <strong class="text-red-300">' + sel.baseStats.str + '</strong></span>' +
                '<span class="text-gray-400">Dextérité : <strong class="text-emerald-300">' + sel.baseStats.dex + '</strong></span>' +
                '<span class="text-gray-400">Intelligence : <strong class="text-blue-300">' + sel.baseStats.int + '</strong></span>' +
                '<span class="text-gray-400">Vitalité : <strong class="text-amber-300">' + sel.baseStats.vit + '</strong></span>' +
            '</div>';

        const hasSave = !!localStorage.getItem('chroniques_abysses_save_v3');
        document.getElementById('continueGameBtn').classList.toggle('hidden', !hasSave);
    },

    updateHud() {
        const h = State.hero;
        const cls = CLASSES[h.classId];
        document.getElementById('hudClassIcon').textContent = cls.icon;
        document.getElementById('hudHeroName').textContent = h.name;
        document.getElementById('hudLevelBadge').textContent = 'Niv. ' + h.level;
        document.getElementById('hudGold').textContent = h.gold;
        document.getElementById('hudLocationName').textContent = State.location === 'town'
            ? '🏕️ Camp d’Oakhaven'
            : (State.currentBiome.icon + ' ' + State.currentBiome.name + ' (Menace ' + State.difficulty + ')');

        document.getElementById('badgeAttr').classList.toggle('hidden', h.attrPoints <= 0);
        document.getElementById('badgeSkill').classList.toggle('hidden', h.skillPoints <= 0);
        document.getElementById('returnCampBtn').classList.toggle('hidden', State.location === 'town');

        this.updateDynamicBars();
        this.renderSkillBar();
        this.updateHudQuest();
    },

    updateDynamicBars() {
        const h = State.hero;
        document.getElementById('hudHpText').textContent = Math.ceil(h.hp) + ' / ' + h.maxHp;
        document.getElementById('hudHpBar').style.width = Math.max(0, Math.min(100, (h.hp / h.maxHp) * 100)) + '%';
        document.getElementById('hudMpText').textContent = Math.ceil(h.mp) + ' / ' + h.maxMp;
        document.getElementById('hudMpBar').style.width = Math.max(0, Math.min(100, (h.mp / h.maxMp) * 100)) + '%';
        document.getElementById('hudXpBar').style.width = Math.max(0, Math.min(100, (h.xp / h.xpNext) * 100)) + '%';

        for (let i = 0; i < 5; i++) {
            const skId = h.skillBar[i];
            const cdEl = document.getElementById('skillCd_' + i);
            if (!cdEl) continue;
            const rem = skId ? (State.cooldowns[skId] || 0) : 0;
            if (rem > 0) {
                cdEl.classList.remove('hidden');
                cdEl.textContent = rem.toFixed(1);
            } else {
                cdEl.classList.add('hidden');
            }
        }
    },

    updateHudQuest() {
        const active = State.quests.find(q => !q.claimed);
        const box = document.getElementById('hudQuestTracker');
        if (!active) {
            box.classList.add('hidden');
            return;
        }
        box.classList.remove('hidden');
        document.getElementById('hudQuestText').textContent = active.title + ' (' + active.progress + '/' + active.target + ')' + (active.completed ? ' ✅' : '');
    },

    updateContextPrompt() {
        const w = State.world;
        const p = w.player;
        const el = document.getElementById('contextPrompt');
        let msg = '';

        const nearDrop = w.lootDrops.find(d => Math.hypot(p.x - d.x, p.y - d.y) < 85);
        const nearChest = w.chests.find(c => !c.opened && Math.hypot(p.x - c.x, p.y - c.y) < 75);
        const nearNpc = w.npcs.find(n => Math.hypot(p.x - n.x, p.y - n.y) < 85);

        if (nearDrop) msg = '[E] Ramasser : ' + nearDrop.label;
        else if (nearChest) msg = '[E] Ouvrir le Coffre';
        else if (w.portal && Math.hypot(p.x - w.portal.x, p.y - w.portal.y) < 75) msg = '[E] Retourner au Camp d’Oakhaven';
        else if (nearNpc) msg = '[E] Parler à ' + nearNpc.name;

        if (msg) {
            el.textContent = msg;
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    },

    renderSkillBar() {
        const h = State.hero;
        const bar = document.getElementById('skillBarContainer');
        const labels = ['Esp', '1', '2', '3', '4/Clic droit'];
        const wpn = h.equipment[h.activeWeapon === 'ranged' && h.equipment.ranged ? 'ranged' : 'weapon'];
        let html = '<div onclick="Game.swapWeapon()" title="Changer d’arme [Tab]" class="relative w-10 h-10 rounded-lg bg-amber-950/70 border border-amber-400 flex items-center justify-center cursor-pointer hover:border-amber-200">' +
            '<span class="text-lg">' + (wpn ? wpn.icon : '✊') + '</span>' +
            '<span class="absolute top-0.5 left-1 text-[9px] font-bold text-amber-300">Tab</span></div>';

        for (let i = 0; i < 5; i++) {
            const skId = h.skillBar[i];
            const def = skId ? findSkillDef(skId) : null;
            html += '<div onclick="Combat.castSlot(' + i + ')" class="relative w-10 h-10 rounded-lg bg-black/80 border ' +
                (def ? 'border-amber-500/70' : 'border-gray-700') + ' flex items-center justify-center cursor-pointer hover:border-amber-300">' +
                '<span class="text-lg">' + (def ? def.icon : (i === 0 ? '⚔️' : '·')) + '</span>' +
                '<span class="absolute top-0.5 left-1 text-[9px] font-bold text-amber-300">' + labels[i] + '</span>' +
                '<div id="skillCd_' + i + '" class="hidden absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center text-[11px] font-bold text-amber-300"></div>' +
                '</div>';
        }

        html += '<div onclick="Combat.usePotion(\'hp\')" class="relative w-10 h-10 rounded-lg bg-red-950/60 border border-red-500/60 flex items-center justify-center cursor-pointer">' +
            '<span class="text-base">🧪</span><span class="absolute top-0.5 left-1 text-[9px] font-bold text-red-300">R</span>' +
            '<span class="absolute bottom-0.5 right-1 text-[10px] font-bold text-white">' + h.potionsHp + '</span></div>';

        html += '<div onclick="Combat.usePotion(\'mp\')" title="Potion de Fureur : +50 % de Rage" class="relative w-10 h-10 rounded-lg bg-orange-950/60 border border-orange-500/60 flex items-center justify-center cursor-pointer">' +
            '<span class="text-base">🔥</span><span class="absolute top-0.5 left-1 text-[9px] font-bold text-orange-300">F</span>' +
            '<span class="absolute bottom-0.5 right-1 text-[10px] font-bold text-white">' + h.potionsMp + '</span></div>';

        bar.innerHTML = html;
    },

    toggleModal(modalId) {
        if (State.activeModal === modalId) {
            this.closeModals();
            return;
        }
        this.closeModals();
        State.activeModal = modalId;
        Sound.play('ui');
        State.modalFocusIdx = 0;
        document.getElementById('modalBackdrop').classList.remove('hidden');
        document.getElementById(modalId).classList.remove('hidden');

        if (modalId === 'characterModal') this.renderCharacterModal();
        else if (modalId === 'skillsModal') this.renderSkillsModal();
        else if (modalId === 'inventoryModal') this.renderInventoryModal();
        else if (modalId === 'questsModal') this.renderQuestsModal();
        else if (modalId === 'blacksmithModal') this.renderBlacksmithModal();
        else if (modalId === 'merchantModal') this.renderMerchantModal();
        else if (modalId === 'portalModal') this.renderPortalModal();

        setTimeout(() => this.applyModalFocus(), 20);
    },

    closeModals() {
        State.activeModal = null;
        this.hideCompare();
        document.getElementById('modalBackdrop').classList.add('hidden');
        ['characterModal', 'skillsModal', 'inventoryModal', 'questsModal', 'blacksmithModal', 'merchantModal', 'portalModal', 'pauseModal']
            .forEach(id => document.getElementById(id).classList.add('hidden'));
    },

    getFocusableItems() {
        if (!State.activeModal) return [];
        const modal = document.getElementById(State.activeModal);
        return Array.from(modal.querySelectorAll('button:not([disabled]), [data-kb-item]')).filter(el => el.offsetParent !== null);
    },

    applyModalFocus() {
        document.querySelectorAll('.kb-focus').forEach(el => el.classList.remove('kb-focus'));
        const items = this.getFocusableItems();
        if (!items.length) return;
        State.modalFocusIdx = ((State.modalFocusIdx % items.length) + items.length) % items.length;
        const target = items[State.modalFocusIdx];
        target.classList.add('kb-focus');
        target.scrollIntoView({ block: 'nearest' });
        const r = target.getBoundingClientRect();
        if (target.dataset.bagIdx !== undefined) this.showCompare(Number(target.dataset.bagIdx), r.right, r.top);
        else if (target.dataset.sellIdx !== undefined) this.showCompare(Number(target.dataset.sellIdx), r.right, r.top);
        else if (target.dataset.shopIdx !== undefined) this.showShopCompare(Number(target.dataset.shopIdx), r.right, r.top);
        else if (target.dataset.slot !== undefined) this.showEquippedTooltip(target.dataset.slot, r.right, r.top);
        else {
            this.hideCompare();
        }
    },

    renderCharacterModal() {
        const h = State.hero;
        const s = computeHeroStats();
        const attrDefs = [
            { key: 'str', label: 'Force', desc: '+2.6% Dégâts Physiques & +0.35 Armure' },
            { key: 'dex', label: 'Dextérité', desc: '+0.25% Critique, +0.35% Esquive, +0.3% Furtivité & +1.2% Dégâts' },
            { key: 'int', label: 'Intelligence', desc: '+4% Puissance élémentaire, +2% Rage générée & +0.3% Furtivité' },
            { key: 'vit', label: 'Vitalité', desc: '+8 Santé Max' }
        ];

        document.getElementById('characterModalBody').innerHTML =
            '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' +
                '<div class="bg-black/40 p-4 rounded-xl border border-gray-800">' +
                    '<div class="flex justify-between items-center mb-3">' +
                        '<span class="text-xs font-bold uppercase text-amber-300">Attributs Principaux</span>' +
                        '<span class="text-xs font-bold text-emerald-400">Points dispos : ' + h.attrPoints + '</span>' +
                    '</div>' +
                    '<div class="space-y-2.5">' +
                    attrDefs.map(a =>
                        '<div class="flex items-center justify-between bg-black/50 p-2.5 rounded-lg border border-gray-800">' +
                            '<div><div class="text-sm font-bold text-gray-100">' + a.label + ' : <span class="text-amber-300">' + s[a.key] + '</span></div>' +
                            '<div class="text-[11px] text-gray-400">' + a.desc + '</div></div>' +
                            '<button onclick="Game.spendAttr(\'' + a.key + '\')" ' + (h.attrPoints <= 0 ? 'disabled' : '') + ' class="rpg-btn px-3 py-1 rounded font-bold text-emerald-300">+1</button>' +
                        '</div>'
                    ).join('') +
                    '</div>' +
                '</div>' +
                '<div class="bg-black/40 p-4 rounded-xl border border-gray-800 text-xs space-y-2">' +
                    '<div class="font-bold uppercase text-amber-300 mb-2">Statistiques Calculées</div>' +
                    '<div class="flex justify-between"><span>Classe :</span><strong class="text-amber-200">' + CLASSES[h.classId].name + '</strong></div>' +
                    '<div class="flex justify-between"><span>Dégâts Physiques :</span><strong>' + s.physDmg + '</strong></div>' +
                    '<div class="flex justify-between"><span title="Ajoutée aux dégâts des talents">Puissance élémentaire :</span><strong class="text-cyan-300">' + s.elemPower + '</strong></div>' +
                    '<div class="flex justify-between"><span>Armure :</span><strong>' + s.armor + '</strong></div>' +
                    '<div class="flex justify-between"><span>Chance Critique :</span><strong class="text-yellow-300">' + s.critChance + '% (x' + s.critMult.toFixed(2) + ')</strong></div>' +
                    '<div class="flex justify-between"><span>Esquive :</span><strong>' + s.dodge + '%</strong></div>' +
                    '<div class="flex justify-between" title="Réduit la distance à laquelle les ennemis vous repèrent"><span>Furtivité :</span><strong class="text-emerald-300">' + s.stealth + '%</strong></div>' +
                    '<div class="flex justify-between"><span>Expérience :</span><strong>' + h.xp + ' / ' + h.xpNext + '</strong></div>' +
                '</div>' +
            '</div>';
    },

    renderSkillsModal() {
        const h = State.hero;
        let html = '<div class="flex flex-wrap justify-between items-center bg-black/50 p-3 rounded-xl border border-gray-800 mb-4 text-xs">' +
            '<span>Points de Talent disponibles : <strong class="text-amber-300 text-sm">' + h.skillPoints + '</strong></span>' +
            '<span class="text-gray-400">Coût : 1 pt par rang</span>' +
            '</div><div class="space-y-4">';

        Object.keys(CLASSES).forEach(clsId => {
            const cls = CLASSES[clsId];
            const isMain = clsId === h.classId;
            const skills = SKILL_TREES[clsId];

            html += '<div class="bg-black/40 p-3.5 rounded-xl border ' + (isMain ? 'border-amber-500/50' : 'border-gray-800') + '">' +
                '<div class="flex items-center justify-between mb-2.5">' +
                    '<span class="font-cinzel font-bold text-sm text-amber-200">' + cls.icon + ' ' + cls.name + '' + '</span>' +
                '</div>' +
                '<div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">';

            skills.forEach(sk => {
                const lockedTier3 = !isMain && sk.tier === 3;
                const rank = h.skills[sk.id] || 0;
                const cost = isMain ? 1 : 2;
                const canLearn = !lockedTier3 && rank < 5 && h.level >= sk.reqLvl && h.skillPoints >= cost;

                html += '<div class="p-2.5 rounded-lg bg-black/60 border ' + (rank > 0 ? 'border-amber-500/40' : 'border-gray-800') + ' flex flex-col justify-between gap-2">' +
                    '<div>' +
                        '<div class="flex justify-between items-center">' +
                            '<span class="text-xs font-bold text-gray-100">' + sk.icon + ' ' + sk.name + ' <span class="text-[10px] text-gray-400">(Palier ' + sk.tier + ' • Niv.' + sk.reqLvl + ')</span></span>' +
                            '<span class="text-xs font-bold text-amber-300">' + rank + '/5</span>' +
                        '</div>' +
                        '<p class="text-[11px] text-gray-400 mt-1">' + sk.desc + (sk.rage ? ' <span class="text-orange-300">🔥 ' + sk.rage + ' Rage</span>' : '') + '</p>' +
                    '</div>' +
                    '<div class="flex items-center justify-between pt-1 border-t border-gray-800/80">' +
                        (lockedTier3
                            ? '<span class="text-[10px] text-red-400">Exclusif ' + cls.name + '</span>'
                            : '<button onclick="Game.learnSkill(\'' + sk.id + '\', ' + cost + ')" ' + (!canLearn ? 'disabled' : '') + ' class="rpg-btn px-2.5 py-1 rounded text-[11px] text-amber-200">Améliorer (' + cost + ' pt)</button>') +
                        (!sk.passive && rank > 0
                            ? '<div class="flex items-center gap-1 text-[10px]">' +
                              [0, 1, 2, 3, 4].map(sl =>
                                '<button onclick="Game.assignSkill(\'' + sk.id + '\', ' + sl + ')" class="px-1.5 py-0.5 rounded border ' +
                                (h.skillBar[sl] === sk.id ? 'bg-amber-400 text-black font-bold border-amber-300' : 'bg-gray-900 border-gray-700 text-gray-300') + '">' +
                                (sl === 0 ? 'Esp' : (sl === 4 ? '4/Clic droit' : sl)) + '</button>'
                              ).join('') + '</div>'
                            : '<span class="text-[10px] text-gray-500">' + (sk.passive ? 'Passif' : 'Non appris') + '</span>') +
                    '</div>' +
                '</div>';
            });

            html += '</div></div>';
        });

        html += '</div>';
        document.getElementById('skillsModalBody').innerHTML = html;
    },

    renderInventoryModal() {
        const h = State.hero;
        // Poupée d'équipement : emplacements disposés autour du héros
        const activeSlot = h.activeWeapon === 'ranged' && h.equipment.ranged ? 'ranged' : 'weapon';
        const tile = sl => {
            const it = h.equipment[sl];
            return '<div data-kb-item="1" data-slot="' + sl + '" onclick="Game.unequipSlot(\'' + sl + '\')"' +
                ' onmouseenter="UI.showEquippedTooltip(\'' + sl + '\', event.clientX, event.clientY)" onmousemove="UI.moveTooltip(event.clientX, event.clientY)" onmouseleave="UI.hideCompare()"' +
                ' class="doll-slot" style="grid-area:' + sl + (it ? ';--rar:' + RARITIES[it.rarity].color : '') + '">' +
                (it
                    ? '<span class="text-3xl">' + it.icon + '</span>' +
                      (it.upgrade > 0 ? '<span class="doll-upg">+' + it.upgrade + '</span>' : '') +
                      (it.socketed ? '<span class="doll-gem">💎</span>' : '') +
                      (sl === activeSlot ? '<span class="doll-hand">En main</span>' : '')
                    : '<span class="doll-empty">' + SLOT_LABELS[sl] + '</span>') +
            '</div>';
        };
        const heroImg = Pixel.humanoid(CLASSES[h.classId].color, HERO_HAIR).toDataURL();
        const st = computeHeroStats();
        const statsHtml = [
            ['Force', st.str], ['Dextérité', st.dex], ['Intelligence', st.int], ['Vitalité', st.vit],
            ['Dégâts', st.physDmg], ['Armure', st.armor], ['Vie Max', h.maxHp], ['Critique', st.critChance + '%']
        ].map(([l, v]) => '<div class="flex justify-between"><span class="text-gray-400">' + l + '</span><strong class="text-amber-100">' + v + '</strong></div>').join('');
        const slotsHtml =
            '<div class="doll"><img class="doll-hero" src="' + heroImg + '" alt="">' + Object.keys(SLOT_LABELS).map(tile).join('') + '</div>' +
            '<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-5 pt-3 border-t border-white/10">' + statsHtml + '</div>';

        this.hideCompare();
        const rarOrder = Object.keys(RARITIES);
        const bagHtml = h.inventory.length === 0
            ? '<div class="col-span-full text-center text-xs text-gray-500 py-8">Votre sac à dos est vide.</div>'
            : h.inventory
                .map((it, idx) => ({ it, idx }))
                .sort((a, b) => b.it.level - a.it.level || rarOrder.indexOf(b.it.rarity) - rarOrder.indexOf(a.it.rarity))
                .map(({ it, idx }) => {
                const rar = RARITIES[it.rarity];
                return '<div data-kb-item="1" data-bag-idx="' + idx + '" onclick="Game.equipFromBag(' + idx + ')"' +
                    ' onmouseenter="UI.showCompare(' + idx + ', event.clientX, event.clientY)" onmousemove="UI.moveTooltip(event.clientX, event.clientY)" onmouseleave="UI.hideCompare()"' +
                    ' class="p-2.5 rounded-lg bg-black/60 border border-gray-800 hover:border-amber-400 cursor-pointer">' +
                    '<div class="text-xs font-bold truncate" style="color:' + rar.color + '">' + it.icon + ' ' + it.name + (it.upgrade > 0 ? ' +' + it.upgrade : '') + '</div>' +
                    '<div class="text-[10px] text-gray-400">' + SLOT_LABELS[it.slot] + ' • Niv.' + it.level + '</div>' +
                    '<div class="text-[10px] text-gray-300 mt-1">' + this.formatItemStats(it) + '</div>' +
                '</div>';
            }).join('');

        const artKeys = Object.keys(h.artifacts).filter(k => h.artifacts[k] > 0);
        const artHtml = artKeys.length === 0
            ? '<span class="text-xs text-gray-500">Aucun artefact récolté.</span>'
            : artKeys.map(k => {
                const a = ARTIFACTS[k];
                return '<span class="px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-500/40 text-xs text-amber-200">' +
                    a.icon + ' ' + a.name + ' x' + h.artifacts[k] + ' (' + a.label + ')</span>';
            }).join('');

        document.getElementById('inventoryModalBody').innerHTML =
            '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">' +
                '<div class="bg-black/40 p-3.5 rounded-xl border border-gray-800">' +
                    '<div class="flex justify-between items-baseline mb-3"><span class="text-xs font-bold uppercase text-amber-300">Équipement Porté</span><span class="text-[10px] text-gray-500">Clic : retirer</span></div>' + slotsHtml +
                '</div>' +
                '<div class="md:col-span-2 flex flex-col gap-4">' +
                    '<div class="bg-black/40 p-3.5 rounded-xl border border-gray-800">' +
                        '<div class="flex justify-between text-xs font-bold uppercase text-amber-300 mb-2"><span>Sac à Dos (' + h.inventory.length + '/24) • trié par niveau</span><span class="text-gray-400 font-normal">[Entrée] Équiper • [X] Jeter</span></div>' +
                        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">' + bagHtml + '</div>' +
                    '</div>' +
                    '<div class="bg-black/40 p-3.5 rounded-xl border border-gray-800">' +
                        '<div class="text-xs font-bold uppercase text-amber-300 mb-2">💎 Artefacts & Runes (Forgeron Thrain)</div>' +
                        '<div class="flex flex-wrap gap-2">' + artHtml + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    },

    formatItemStats(it) {
        const upg = 1 + it.upgrade * 0.14;
        const parts = [];
        if (it.dmg > 0) parts.push('+' + Math.round(it.dmg * upg) + ' Dégâts');
        if (it.slot === 'weapon' || it.slot === 'ranged') {
            parts.push('Vitesse ×' + (it.atkSpeed || 1).toFixed(2) + ' • Portée ' + it.weaponRange);
            if (it.pierce) parts.push('Perforant');
        }
        if (it.armor > 0) parts.push('+' + Math.round(it.armor * upg) + ' Armure');
        it.affixes.forEach(a => parts.push(a.label));
        if (it.socketed && ARTIFACTS[it.socketed]) parts.push('💎 ' + ARTIFACTS[it.socketed].label);
        return parts.join(' • ') || 'Équipement de base';
    },

    // Stats du héros avant/après équipement simulé de l'objet (sans modifier l'état)
    compareItem(item) {
        const h = State.hero;
        const keep = { hp: h.hp, mp: h.mp };
        const snap = () => {
            const st = computeHeroStats();
            return { ...st, maxHp: h.maxHp, maxMp: h.maxMp, atkPct: Math.round(st.atkSpeed * 100) };
        };
        // Une arme est comparée comme si elle était l'arme active
        const keepActive = h.activeWeapon;
        if (item.slot === 'weapon' || item.slot === 'ranged') h.activeWeapon = item.slot;
        const before = snap();
        const equipped = h.equipment[item.slot];
        h.equipment[item.slot] = item;
        const after = snap();
        h.equipment[item.slot] = equipped;
        h.activeWeapon = keepActive;
        computeHeroStats();
        h.hp = keep.hp;
        h.mp = keep.mp;
        return { before, after, equipped };
    },

    itemCardHtml(it, title) {
        const head = '<div class="text-[10px] uppercase text-gray-500">' + title + '</div>';
        if (!it) return '<div class="flex-1 bg-black/50 rounded-lg p-2 border border-gray-800">' + head + '<div class="text-gray-600 italic">Emplacement vide</div></div>';
        const rar = RARITIES[it.rarity];
        return '<div class="flex-1 min-w-0 bg-black/50 rounded-lg p-2 border border-gray-800">' + head +
            '<div class="font-bold truncate" style="color:' + rar.color + '">' + it.icon + ' ' + it.name + (it.upgrade > 0 ? ' +' + it.upgrade : '') + '</div>' +
            '<div class="text-[10px] text-gray-400">' + rar.name + ' • Niv.' + it.level + '</div>' +
            '<div class="text-[10px] text-gray-300 mt-1">' + this.formatItemStats(it) + '</div></div>';
    },

    showCompare(bagIdx, x, y) {
        this.showCompareItem(State.hero.inventory[bagIdx], x, y);
    },

    showShopCompare(shopIdx, x, y) {
        this.showCompareItem(State.shopStock[shopIdx], x, y);
    },

    showCompareItem(it, x, y) {
        if (!it) return this.hideCompare();
        const { before, after, equipped } = this.compareItem(it);
        const rows = [
            ['Vie Max', 'maxHp'], ['Rage Max', 'maxMp'], ['Dégâts Physiques', 'physDmg'], ['Puissance élémentaire', 'elemPower'],
            ['Vitesse d’attaque', 'atkPct', '%'], ['Portée', 'weaponRange'],
            ['Armure', 'armor'], ['Chance Critique', 'critChance', '%'], ['Esquive', 'dodge', '%'], ['Furtivité', 'stealth', '%'],
            ['Force', 'str'], ['Dextérité', 'dex'], ['Intelligence', 'int'], ['Vitalité', 'vit']
        ].map(([label, k, u = '']) => {
            const d = after[k] - before[k];
            if (!d) return '';
            return '<div class="flex justify-between gap-2"><span class="text-gray-300">' + label + '</span><span>' +
                '<span class="text-gray-500">' + before[k] + u + ' → </span>' +
                '<strong class="' + (d > 0 ? 'text-emerald-400' : 'text-red-400') + '">' + after[k] + u + ' (' + (d > 0 ? '+' : '') + d + u + ')</strong></span></div>';
        }).join('');
        const tip = document.getElementById('itemTooltip');
        tip.innerHTML = '<div class="flex gap-2 mb-2">' + this.itemCardHtml(it, 'Survolé') + this.itemCardHtml(equipped, 'Équipé') + '</div>' +
            '<div class="text-[10px] uppercase text-amber-300 font-bold mb-1">Si vous équipez cet objet</div>' +
            (rows || '<div class="text-gray-500 italic">Aucun changement de caractéristiques</div>');
        tip.classList.remove('hidden');
        this.moveTooltip(x, y);
    },

    moveTooltip(x, y) {
        const tip = document.getElementById('itemTooltip');
        const r = tip.getBoundingClientRect();
        tip.style.left = Math.max(8, Math.min(x + 16, innerWidth - r.width - 8)) + 'px';
        tip.style.top = Math.max(8, Math.min(y + 16, innerHeight - r.height - 8)) + 'px';
    },

    showEquippedTooltip(slot, x, y) {
        const it = State.hero.equipment[slot];
        if (!it) return this.hideCompare();
        const tip = document.getElementById('itemTooltip');
        tip.innerHTML = this.itemCardHtml(it, SLOT_LABELS[slot] + ' • clic pour retirer');
        tip.classList.remove('hidden');
        this.moveTooltip(x, y);
    },

    hideCompare() {
        document.getElementById('itemTooltip').classList.add('hidden');
    },

    renderQuestsModal() {
        Quests.ensureAvailable();
        // Donjon de la quête (chasse : biomeId, relique : biome qui détient l'artefact)
        const biomeOf = q => BIOMES.find(b => b.id === q.biomeId || b.artifactId === q.artifactId) || BIOMES[0];
        // Tri par niveau requis du donjon (BIOMES est rangé dans cet ordre)
        const active = State.quests.filter(q => !q.claimed)
            .sort((a, b) => BIOMES.indexOf(biomeOf(a)) - BIOMES.indexOf(biomeOf(b)));
        document.getElementById('questsModalBody').innerHTML = '<div class="space-y-3">' +
            active.map(q => {
                const b = biomeOf(q);
                const locked = State.hero.level < b.minLvl;
                return '<div class="bg-black/50 p-4 rounded-xl border ' + (q.completed ? 'border-emerald-500/60' : 'border-gray-800') + ' flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">' +
                    '<div>' +
                        '<div class="flex flex-wrap items-center gap-2">' +
                            '<span class="text-[10px] px-2 py-0.5 rounded ' + (locked ? 'bg-red-950 text-red-300' : 'bg-gray-900 text-gray-300') + '">' + (locked ? '🔒 ' : '') + 'Niv. ' + b.minLvl + '+ • ' + b.icon + ' ' + b.name + '</span>' +
                            '<span class="text-sm font-bold text-amber-200">' + q.title + '</span>' +
                        '</div>' +
                        '<p class="text-xs text-gray-300 mt-0.5">' + q.desc + '</p>' +
                        '<div class="text-[11px] text-amber-400 mt-1">Progression : ' + q.progress + ' / ' + q.target + ' • Récompense : ' + q.rewardGold + ' Or, ' + q.rewardXp + ' XP</div>' +
                    '</div>' +
                    (q.completed && State.location !== 'town'
                        ? '<span class="text-xs text-emerald-300 px-3 py-1.5 rounded bg-black/50">Terminée • à valider au camp</span>'
                        : q.completed
                        ? '<button onclick="Quests.claim(\'' + q.id + '\')" class="rpg-btn px-4 py-2 rounded-lg text-xs font-bold text-emerald-300 border-emerald-500">Valider la Quête</button>'
                        : '<span class="text-xs text-gray-500 px-3 py-1.5 rounded bg-black/50">En cours</span>') +
                '</div>';
            }).join('') + '</div>';
    },

    renderBlacksmithModal() {
        const h = State.hero;
        const allItems = [
            ...Object.keys(h.equipment).filter(k => h.equipment[k]).map(k => ({ item: h.equipment[k], source: 'Porté' })),
            ...h.inventory.map(it => ({ item: it, source: 'Sac' }))
        ];
        const artKeys = Object.keys(h.artifacts).filter(k => h.artifacts[k] > 0);

        if (allItems.length === 0) {
            document.getElementById('blacksmithModalBody').innerHTML = '<p class="text-xs text-gray-400 text-center py-6">Aucun équipement à améliorer.</p>';
            return;
        }

        document.getElementById('blacksmithModalBody').innerHTML = '<div class="space-y-2.5">' +
            allItems.map(entry => {
                const it = entry.item;
                const cost = 35 + it.upgrade * 45 + it.level * 10;
                const canUpg = it.upgrade < 10 && h.gold >= cost;
                return '<div class="bg-black/50 p-3 rounded-xl border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">' +
                    '<div>' +
                        '<div class="text-xs font-bold" style="color:' + RARITIES[it.rarity].color + '">' + it.icon + ' ' + it.name + ' (+' + it.upgrade + '/10) <span class="text-gray-400">[' + entry.source + ']</span></div>' +
                        '<div class="text-[11px] text-gray-300 mt-0.5">' + this.formatItemStats(it) + '</div>' +
                    '</div>' +
                    '<div class="flex flex-wrap items-center gap-2">' +
                        '<button onclick="Game.upgradeItem(\'' + it.uid + '\', ' + cost + ')" ' + (!canUpg ? 'disabled' : '') + ' class="rpg-btn px-3 py-1.5 rounded-lg text-xs text-amber-200">⚒️ Renforcer (' + cost + ' Or)</button>' +
                        (!it.socketed && artKeys.length > 0
                            ? '<button onclick="Game.socketArtifact(\'' + it.uid + '\', \'' + artKeys[0] + '\')" class="rpg-btn px-3 py-1.5 rounded-lg text-xs text-cyan-300">💎 Sertir ' + ARTIFACTS[artKeys[0]].icon + '</button>'
                            : '') +
                    '</div>' +
                '</div>';
            }).join('') + '</div>';
    },

    renderMerchantModal() {
        const h = State.hero;
        this.hideCompare();
        const hover = (fn, idx) => ' onmouseenter="UI.' + fn + '(' + idx + ', event.clientX, event.clientY)" onmousemove="UI.moveTooltip(event.clientX, event.clientY)" onmouseleave="UI.hideCompare()"';
        const buyHtml = State.shopStock.map((it, idx) => {
            const rar = RARITIES[it.rarity];
            const canBuy = h.gold >= it.price && h.inventory.length < 24;
            return '<div' + hover('showShopCompare', idx) + ' class="bg-black/50 p-2.5 rounded-lg border border-gray-800 hover:border-amber-400 flex justify-between items-center gap-2">' +
                '<div>' +
                    '<div class="text-xs font-bold" style="color:' + rar.color + '">' + it.icon + ' ' + it.name + '</div>' +
                    '<div class="text-[10px] text-gray-400">' + this.formatItemStats(it) + '</div>' +
                '</div>' +
                '<button data-shop-idx="' + idx + '" onclick="Game.buyItem(' + idx + ')" ' + (!canBuy ? 'disabled' : '') + ' class="rpg-btn px-2.5 py-1 rounded text-xs text-yellow-300 shrink-0">' + it.price + ' Or</button>' +
            '</div>';
        }).join('');

        const sellHtml = h.inventory.length === 0
            ? '<div class="text-xs text-gray-500 text-center py-6">Rien à vendre dans le sac.</div>'
            : h.inventory.map((it, idx) => {
                const sellVal = Math.max(3, Math.floor(it.price * 0.4));
                return '<div data-kb-item="1" data-sell-idx="' + idx + '" onclick="Game.sellItem(' + idx + ')"' + hover('showCompare', idx) + ' class="bg-black/50 p-2.5 rounded-lg border border-gray-800 hover:border-amber-400 cursor-pointer flex justify-between items-center">' +
                    '<span class="text-xs font-bold truncate" style="color:' + RARITIES[it.rarity].color + '">' + it.icon + ' ' + it.name + '</span>' +
                    '<span class="text-xs text-emerald-300">Vendre +' + sellVal + ' Or</span>' +
                '</div>';
            }).join('');

        document.getElementById('merchantModalBody').innerHTML =
            '<div class="flex flex-wrap gap-2 mb-4 bg-black/50 p-3 rounded-xl border border-gray-800 items-center justify-between">' +
                '<span class="text-xs text-yellow-300 font-bold">Votre Bourse : 🪙 ' + h.gold + ' Or</span>' +
                '<div class="flex gap-2">' +
                    '<button onclick="Game.buyPotion(\'hp\')" ' + (h.gold < 40 ? 'disabled' : '') + ' class="rpg-btn px-3 py-1.5 rounded-lg text-xs text-red-300">+🧪 Potion Vie (40 Or)</button>' +
                    '<button onclick="Game.buyPotion(\'mp\')" ' + (h.gold < 40 ? 'disabled' : '') + ' class="rpg-btn px-3 py-1.5 rounded-lg text-xs text-orange-300">+🔥 Potion Fureur (40 Or)</button>' +
                '</div>' +
            '</div>' +
            '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' +
                '<div><div class="text-xs font-bold uppercase text-amber-300 mb-2">Articles à Acheter</div><div class="space-y-2">' + buyHtml + '</div></div>' +
                '<div><div class="text-xs font-bold uppercase text-amber-300 mb-2">Votre Sac (Cliquer ou [X] pour vendre)</div><div class="space-y-2 max-h-72 overflow-y-auto">' + sellHtml + '</div></div>' +
            '</div>';
    },

    renderPortalModal() {
        const diffBtns = [1, 2, 3, 4, 5].map(d =>
            '<button onclick="State.difficulty=' + d + '; UI.renderPortalModal();" class="rpg-btn px-3 py-1 rounded text-xs ' +
            (State.difficulty === d ? 'border-amber-400 text-amber-300 font-bold' : 'text-gray-400') + '">Menace ' + d + '</button>'
        ).join('');

        const biomesHtml = BIOMES.map(b => {
            const art = ARTIFACTS[b.artifactId];
            const locked = State.hero.level < b.minLvl;
            const btn = locked
                ? '<button disabled class="rpg-btn w-full py-1.5 rounded-lg text-xs font-bold text-gray-500 mt-1 cursor-not-allowed">🔒 Niveau ' + b.minLvl + ' requis</button>'
                : '<button onclick="UI.closeModals(); World.enterDungeon(\'' + b.id + '\');" class="rpg-btn w-full py-1.5 rounded-lg text-xs font-bold text-amber-200 mt-1">Entrer dans le Donjon</button>';
            return '<div class="bg-black/50 p-3.5 rounded-xl border border-gray-800 flex flex-col justify-between gap-2 ' + (locked ? 'opacity-50' : 'hover:border-amber-400') + '">' +
                '<div>' +
                    '<div class="flex justify-between items-center">' +
                        '<span class="font-cinzel font-bold text-sm text-amber-200">' + b.icon + ' ' + b.name + '</span>' +
                        '<span class="text-[10px] px-2 py-0.5 rounded ' + (locked ? 'bg-red-950 text-red-300' : 'bg-gray-900 text-gray-300') + '">Niv. ' + b.minLvl + '+</span>' +
                    '</div>' +
                    '<div class="text-[11px] text-gray-400 mt-1">Boss : <span class="text-orange-300">' + b.bosses.map(bo => bo.name).join(' ou ') + '</span></div>' +
                    '<div class="text-[11px] text-cyan-300/90 mt-0.5">Artefact : ' + art.icon + ' ' + art.name + '</div>' +
                '</div>' + btn +
            '</div>';
        }).join('');

        document.getElementById('portalModalBody').innerHTML =
            '<div class="flex flex-wrap items-center gap-2 mb-4 bg-black/50 p-3 rounded-xl border border-gray-800">' +
                '<span class="text-xs font-bold text-amber-300 mr-2">Niveau de Menace :</span>' + diffBtns +
            '</div>' +
            '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">' + biomesHtml + '</div>';
    }
};
