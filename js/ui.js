'use strict';

// ==================== 8. INTERFACE UTILISATEUR (UI) ====================
const UI = {
    // Icône générée en ligne (Art.ICONS / alias d'objets), à la taille du texte par défaut
    ic(id, cls) {
        return '<img src="' + Art.iconUrl(id) + '" alt="" class="ic ' + (Gfx.hd ? '' : 'px ') + (cls || '') + '">';
    },

    // Icônes du HTML statique : <img data-icon="clé">, repeintes au changement de graphismes
    paintIcons() {
        document.querySelectorAll('img[data-icon]').forEach(img => {
            img.src = Art.iconUrl(img.dataset.icon);
            img.classList.toggle('px', !Gfx.hd);
        });
    },

    toast(msg, tone, icon) {
        const box = document.getElementById('toastContainer');
        const el = document.createElement('div');
        const colors = {
            amber: 'border-amber-400/80 text-amber-200 bg-stone-950/95',
            red: 'border-red-500/80 text-red-200 bg-red-950/95',
            blue: 'border-blue-400/80 text-blue-200 bg-slate-950/95'
        };
        el.className = 'px-4 py-1.5 rounded-full border text-xs font-semibold shadow-xl transition-opacity duration-300 ' + (colors[tone] || colors.amber);
        el.className += ' flex items-center gap-1.5';
        el.textContent = msg;
        if (icon) el.insertAdjacentHTML('afterbegin', this.ic(icon, 'w-4 h-4'));
        box.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 320); }, 2600);
    },

    renderStartScreen() {
        document.getElementById('startGfxBtn').innerHTML = this.ic('palette', 'mr-1') + 'Graphismes : ' + (Gfx.hd ? 'Modernes' : 'Pixel art 16-bit') + ' (changer)';
        this.paintIcons();
        const sel = CLASSES.warrior;
        document.getElementById('classDetailBox').innerHTML =
            '<div class="flex-1">' +
                '<div class="flex items-center gap-2 mb-1">' +
                    this.ic(sel.icon, 'w-7 h-7') +
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
        document.getElementById('hudClassIcon').innerHTML = this.ic(cls.icon, 'w-7 h-7');
        document.getElementById('hudHeroName').textContent = h.name;
        document.getElementById('hudLevelBadge').textContent = 'Niv. ' + h.level;
        document.getElementById('hudGold').textContent = h.gold;
        document.getElementById('hudLocationName').innerHTML = State.location === 'town'
            ? this.ic('camp') + ' Camp d’Oakhaven'
            : (this.ic(State.currentBiome.icon) + ' ' + State.currentBiome.name + ' (Menace ' + State.difficulty + ')');

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
        document.getElementById('hudQuestText').innerHTML = active.title + ' (' + active.progress + '/' + active.target + ')' + (active.completed ? ' ' + this.ic('check') : '');
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
            (wpn ? this.itemImg(wpn, 'w-7 h-7') : this.ic('gauntlet', 'w-6 h-6 opacity-40')) +
            '<span class="absolute top-0.5 left-1 text-[9px] font-bold text-amber-300">Tab</span></div>';

        for (let i = 0; i < 5; i++) {
            const skId = h.skillBar[i];
            const def = skId ? findSkillDef(skId) : null;
            const off = def && def.weapon && def.weapon !== (wpn && wpn.slot === 'ranged' ? 'ranged' : 'melee');
            html += '<div onclick="Combat.castSlot(' + i + ')"' + (off ? ' title="Indisponible : exige une arme ' + (def.weapon === 'ranged' ? 'à distance' : 'de mêlée') + '"' : '') +
                ' class="relative w-10 h-10 rounded-lg bg-black/80 border ' +
                (off ? 'border-gray-700 opacity-40 grayscale' : def ? 'border-amber-500/70' : 'border-gray-700') + ' flex items-center justify-center cursor-pointer hover:border-amber-300">' +
                (def ? this.ic(def.icon, 'w-7 h-7') : i === 0 ? this.ic('warrior', 'w-7 h-7') : '<span class="text-lg">·</span>') +
                '<span class="absolute top-0.5 left-1 text-[9px] font-bold text-amber-300">' + labels[i] + '</span>' +
                '<div id="skillCd_' + i + '" class="hidden absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center text-[11px] font-bold text-amber-300"></div>' +
                '</div>';
        }

        html += '<div onclick="Combat.usePotion(\'hp\')" class="relative w-10 h-10 rounded-lg bg-red-950/60 border border-red-500/60 flex items-center justify-center cursor-pointer">' +
            this.ic('potionHp', 'w-6 h-6') + '<span class="absolute top-0.5 left-1 text-[9px] font-bold text-red-300">R</span>' +
            '<span class="absolute bottom-0.5 right-1 text-[10px] font-bold text-white">' + h.potionsHp + '</span></div>';

        html += '<div onclick="Combat.usePotion(\'mp\')" title="Potion de Fureur : +50 % de Rage" class="relative w-10 h-10 rounded-lg bg-orange-950/60 border border-orange-500/60 flex items-center justify-center cursor-pointer">' +
            this.ic('potionRage', 'w-6 h-6') + '<span class="absolute top-0.5 left-1 text-[9px] font-bold text-orange-300">F</span>' +
            '<span class="absolute bottom-0.5 right-1 text-[10px] font-bold text-white">' + h.potionsMp + '</span></div>';

        bar.innerHTML = html;
    },

    // Mort : popin avant le camp ; le bouton reste désactivé 1,5 s pour que les touches du combat ne déclenchent rien
    showDeath(lost, gift) {
        this.hideModals();
        State.activeModal = 'deathModal';
        State.modalFocusIdx = 0;
        this.showBackdrop(false);
        document.getElementById('deathModal').classList.remove('hidden');
        document.getElementById('deathModalBody').innerHTML =
            '<p>Vous reprenez connaissance au <strong class="text-amber-300">Camp d’Oakhaven</strong>.</p>' +
            '<p>Le guérisseur panse vos blessures : <strong class="text-emerald-300">vie restaurée</strong>.</p>' +
            '<p>Il vous confie <strong class="text-red-300">' + this.ic('potionHp') + ' ' + gift + ' potion' + (gift > 1 ? 's' : '') + ' de vie</strong> pour la suite.</p>' +
            (lost ? '<p class="text-xs text-yellow-500/80">Bourse allégée de ' + lost + ' Or.</p>' : '');
        const btn = document.getElementById('deathOkBtn');
        btn.disabled = true;
        setTimeout(() => {
            btn.disabled = false;
            if (State.activeModal === 'deathModal') this.applyModalFocus();
        }, 1500);
    },

    showPurified(rewards) {
        this.hideModals();
        State.activeModal = 'purifiedModal';
        State.modalFocusIdx = 0;
        this.showBackdrop(false);
        document.getElementById('purifiedModal').classList.remove('hidden');
        const n = Object.keys(State.hero.purified).length;
        document.getElementById('purifiedModalBody').innerHTML = rewards.map(({ biome, item }) =>
            '<p>Les 4 maîtres de <strong class="text-amber-200">' + this.ic(biome.icon) + ' ' + biome.name + '</strong> sont tombés.</p>' +
            '<div class="flex items-center gap-3 text-left bg-black/50 rounded-xl p-3 border" style="border-color:' + RARITIES[item.rarity].color + '80">' +
                this.itemImg(item, 'w-12 h-12 shrink-0') +
                '<div class="min-w-0"><div class="font-bold truncate" style="color:' + RARITIES[item.rarity].color + '">' + item.name + '</div>' +
                '<div class="text-[11px] text-gray-400">' + RARITIES[item.rarity].name + ' • Niv.' + item.level + ' • ajouté au sac</div></div>' +
            '</div>'
        ).join('') +
            '<p>Trophée : <strong class="text-emerald-300">+2 % de dégâts</strong>, définitivement (total : +' + n * 2 + ' %).</p>';
        setTimeout(() => this.applyModalFocus(), 20);
    },

    // Au camp, fiche, talents et sac sont des onglets du menu, plus des fenêtres
    CAMP_EQUIV: { characterModal: 'training', skillsModal: 'learning', inventoryModal: 'inventory' },

    toggleModal(modalId) {
        if (State.screen === 'playing' && State.location === 'town' && this.CAMP_EQUIV[modalId]) {
            this.openCamp(this.CAMP_EQUIV[modalId]);
            return;
        }
        if (State.activeModal === modalId) {
            this.closeModals();
            return;
        }
        this.hideModals();
        State.activeModal = modalId;
        Sound.play('ui');
        State.modalFocusIdx = 0;
        this.showBackdrop(false);
        document.getElementById(modalId).classList.remove('hidden');

        if (modalId === 'characterModal') this.renderCharacterModal();
        else if (modalId === 'skillsModal') this.renderSkillsModal();
        else if (modalId === 'inventoryModal') this.renderInventoryModal();
        else if (modalId === 'questsModal') this.renderQuestsModal();
        else if (modalId === 'pauseModal') this.renderPauseModal();

        setTimeout(() => this.applyModalFocus(), 20);
    },

    MODALS: ['characterModal', 'skillsModal', 'inventoryModal', 'questsModal', 'campModal', 'deathModal', 'purifiedModal', 'pauseModal'],

    hideModals() {
        State.activeModal = null;
        this.hideCompare();
        document.getElementById('modalBackdrop').classList.add('hidden');
        this.MODALS.forEach(id => document.getElementById(id).classList.add('hidden'));
    },

    // Fond léger au camp pour laisser voir le décor peint derrière le menu
    showBackdrop(camp) {
        const bd = document.getElementById('modalBackdrop');
        bd.classList.remove('hidden');
        bd.style.background = camp ? 'rgba(0,0,0,0.2)' : '';
        bd.style.backdropFilter = camp ? 'none' : '';
    },

    // Au camp, fermer une fenêtre ramène toujours au menu du camp
    closeModals() {
        this.hideModals();
        if (State.screen === 'playing' && State.location === 'town') this.openCamp();
    },

    campTab: 'quests',

    openCamp(tab) {
        this.hideModals();
        if (tab) this.campTab = tab;
        State.activeModal = 'campModal';
        State.modalFocusIdx = 0;
        this.showBackdrop(true);
        document.getElementById('campModal').classList.remove('hidden');
        this.renderCampModal();
        setTimeout(() => this.applyModalFocus(), 20);
    },

    setCampTab(tab) {
        this.campTab = tab;
        State.modalFocusIdx = 0;
        Sound.play('ui');
        this.renderCampModal();
        setTimeout(() => this.applyModalFocus(), 20);
    },

    // Ordre d'un retour au camp : valider, vendre, renforcer, équiper, progresser, repartir
    // [id (icône Art.ICONS), libellé, générateur du contenu]
    CAMP_TABS: [
        ['quests', 'Quêtes', 'questsHtml'],
        ['merchant', 'Marchand', 'merchantHtml'],
        ['forge', 'Forge', 'forgeHtml'],
        ['inventory', 'Inventaire', 'inventoryHtml'],
        ['training', 'Entraînement', 'characterHtml'],
        ['learning', 'Sanctuaire', 'skillsHtml'],
        ['expeditions', 'Expéditions', 'expeditionsHtml']
    ],

    renderCampModal() {
        const h = State.hero;
        // Pastille : nombre de points à dépenser dans le lieu
        const pts = { training: [h.attrPoints, 'd’attribut'], learning: [h.skillPoints, 'de talent'] };
        const tabs = this.CAMP_TABS.map(([id, label]) => {
            const [n, kind] = pts[id] || [0];
            return '<button onclick="UI.setCampTab(\'' + id + '\')"' + (n > 0 ? ' title="' + n + ' point' + (n > 1 ? 's' : '') + ' ' + kind + ' à dépenser"' : '') + ' class="rpg-btn px-2.5 py-2 rounded-lg text-sm font-cinzel whitespace-nowrap font-bold ' + (this.campTab === id ? 'border-amber-400 text-amber-300 bg-amber-950/60' : 'text-gray-400') + ' inline-flex items-center gap-1">' + '<img src="' + Art.iconUrl(id) + '" alt="" class="item-img w-5 h-5' + (Gfx.hd ? '' : ' px') + '">' + label +
            (n > 0 ? '<span class="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-black text-[11px] font-sans font-bold leading-[18px] text-center">' + n + '</span>' : '') + '</button>';
        }).join('');
        const ready = State.quests.filter(q => q.completed && !q.claimed).length;
        document.getElementById('campTabs').innerHTML = tabs;
        document.getElementById('campGold').textContent = h.gold;
        document.getElementById('campQuestBadge').textContent = ready ? ready + ' quête' + (ready > 1 ? 's' : '') + ' à valider' : '';
        const tab = this.CAMP_TABS.find(t => t[0] === this.campTab) || this.CAMP_TABS[0];
        this.hideCompare();
        document.getElementById('campModalBody').innerHTML = this[tab[2]]();
    },

    // Rafraîchit le contenu : onglet du camp si le camp est ouvert, sinon la fenêtre
    fill(modalId, html) {
        if (State.activeModal === 'campModal') return this.renderCampModal();
        document.getElementById(modalId + 'Body').innerHTML = html();
    },

    renderPauseModal() {
        document.getElementById('gfxToggleBtn').innerHTML = this.ic('palette', 'mr-1') + 'Graphismes : ' + (Gfx.hd ? 'Modernes' : 'Pixel art 16-bit');
    },

    toggleGfx() {
        Gfx.toggle();
        this.renderPauseModal();
        this.renderStartScreen();
        UI.toast('Graphismes : ' + (Gfx.hd ? 'modernes' : 'pixel art 16-bit'), 'amber');
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

    renderCharacterModal() { this.fill('characterModal', () => this.characterHtml()); },
    renderSkillsModal() { this.fill('skillsModal', () => this.skillsHtml()); },
    renderInventoryModal() { this.fill('inventoryModal', () => this.inventoryHtml()); },

    // Points d'attributs et de talents : à dépenser seulement dans les lieux du camp
    campOnlyNote(points, place) {
        return points > 0 && State.location !== 'town'
            ? '<div class="mb-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">' + points + ' point' + (points > 1 ? 's' : '') + ' à dépenser au camp, ' + place + '.</div>'
            : '';
    },

    characterHtml() {
        const h = State.hero;
        const atCamp = State.location === 'town';
        const s = computeHeroStats();
        const attrDefs = [
            { key: 'str', label: 'Force', desc: '+2.6% Dégâts Physiques & +0.35 Armure' },
            { key: 'dex', label: 'Dextérité', desc: '+0.25% Critique, +0.35% Esquive, +0.3% Furtivité & +1.2% Dégâts' },
            { key: 'int', label: 'Intelligence', desc: '+4% Puissance élémentaire, +2% Rage générée & +0.3% Furtivité' },
            { key: 'vit', label: 'Vitalité', desc: '+8 Santé Max' }
        ];

        return this.campOnlyNote(h.attrPoints, 'à l’Entraînement') +
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
                            (atCamp ? '<button onclick="Game.spendAttr(\'' + a.key + '\')" ' + (h.attrPoints <= 0 ? 'disabled' : '') + ' class="rpg-btn px-3 py-1 rounded font-bold text-emerald-300">+1</button>' : '') +
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
                    '<div class="flex justify-between" title="Réduit les dégâts subis en début de partie et quand votre équipement est en retard sur les ennemis"><span>Protection du débutant :</span><strong class="text-sky-300">−' + Math.round(Combat.assist(h.level) * 100) + '% dégâts</strong></div>' +
                    '<div class="flex justify-between" title="Moyenne des objets portés, pondérée par la rareté et les améliorations"><span>Niveau d’équipement :</span><strong>' + Combat.gearLevel().toFixed(1) + '</strong></div>' +
                    '<div class="flex justify-between" title="Réduit la distance à laquelle les ennemis vous repèrent"><span>Furtivité :</span><strong class="text-emerald-300">' + s.stealth + '%</strong></div>' +
                    '<div class="flex justify-between" title="+2 % de dégâts par donjon purifié (ses 4 boss vaincus)"><span>Trophées de donjon :</span><strong class="text-emerald-300">' + Object.keys(h.purified).length + ' • +' + Math.round((s.trophy - 1) * 100) + ' % dégâts</strong></div>' +
                    '<div class="flex justify-between"><span>Expérience :</span><strong>' + h.xp + ' / ' + h.xpNext + '</strong></div>' +
                '</div>' +
            '</div>';
    },

    skillsHtml() {
        const h = State.hero;
        const atCamp = State.location === 'town';
        const spent = Object.values(h.skills).reduce((n, r) => n + r, 0);
        let html = this.campOnlyNote(h.skillPoints, 'au Sanctuaire') +
            '<div class="flex flex-wrap justify-between items-center gap-2 bg-black/50 p-3 rounded-xl border border-gray-800 mb-4 text-xs">' +
            '<span>Points de Talent : <strong class="text-amber-300 text-sm">' + h.skillPoints + '</strong> <span class="text-gray-500">(1 par niveau • rang max ' + SKILL_MAX_RANK + ')</span></span>' +
            (atCamp ? '<button onclick="Game.resetSkills()" ' + (spent ? '' : 'disabled') + ' class="rpg-btn px-3 py-1 rounded text-[11px] text-gray-300">↺ Réinitialiser (gratuit)</button>' : '') +
            '</div><div class="grid grid-cols-1 lg:grid-cols-3 gap-3">';

        SKILL_BRANCHES.forEach(br => {
            const pts = Game.branchPoints(br.id);
            html += '<div class="bg-black/40 p-3 rounded-xl border border-gray-800" style="border-top:3px solid ' + br.color + '">' +
                '<div class="flex items-center justify-between mb-1">' +
                    '<span class="font-cinzel font-bold text-sm" style="color:' + br.color + '">' + this.ic(br.icon) + ' ' + br.name + '</span>' +
                    '<span class="text-[11px] text-gray-400">' + pts + ' pts</span>' +
                '</div>' +
                '<p class="text-[11px] text-gray-500 mb-2.5">' + br.desc + '</p><div class="space-y-2">';

            SKILL_TREES.warrior.filter(sk => sk.branch === br.id).forEach(sk => {
                const rank = h.skills[sk.id] || 0;
                const req = BRANCH_REQ[sk.tier];
                const reqOk = h.level >= req.lvl && pts >= req.pts;
                const canLearn = Game.canLearnSkill(sk);
                const reqTxt = 'Niv. ' + req.lvl + (req.pts ? ' • ' + req.pts + ' pts ' + br.name : '');
                html += '<div class="p-2.5 rounded-lg bg-black/60 border ' + (rank > 0 ? 'border-amber-500/40' : 'border-gray-800') + (reqOk || rank ? '' : ' opacity-50') + '">' +
                    '<div class="flex justify-between items-center gap-2">' +
                        '<span class="text-xs font-bold text-gray-100">' + this.ic(sk.icon, 'w-5 h-5') + ' ' + sk.name +
                            (sk.weapon ? ' <span class="ml-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ' + (sk.weapon === 'ranged' ? 'bg-emerald-950/70 text-emerald-300' : 'bg-red-950/70 text-red-300') + '">' + (sk.weapon === 'ranged' ? 'Distance' : 'Mêlée') + '</span>' : '') +
                        '</span>' +
                        '<span class="text-xs font-bold text-amber-300 shrink-0">' + rank + '/' + SKILL_MAX_RANK + '</span>' +
                    '</div>' +
                    '<p class="text-[11px] text-gray-400 mt-1">' + sk.desc + (sk.rage ? ' <span class="text-orange-300">' + this.ic('flame') + ' ' + sk.rage + ' Rage • ' + sk.cd + 's</span>' : '') + '</p>' +
                    '<div class="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 mt-1.5 border-t border-gray-800/80">' +
                        (!atCamp ? '<span></span>'
                            : reqOk
                            ? '<button onclick="Game.learnSkill(\'' + sk.id + '\')" ' + (!canLearn ? 'disabled' : '') + ' class="rpg-btn px-2.5 py-1 rounded text-[11px] text-amber-200">' + (rank ? 'Améliorer' : 'Apprendre') + '</button>'
                            : '<span class="text-[10px] text-red-400">' + this.ic('lock') + ' ' + reqTxt + '</span>') +
                        (!sk.passive && rank > 0
                            ? '<div class="flex items-center gap-1 text-[10px]">' +
                              [0, 1, 2, 3, 4].map(sl =>
                                '<button onclick="Game.assignSkill(\'' + sk.id + '\', ' + sl + ')" class="px-1.5 py-0.5 rounded border ' +
                                (h.skillBar[sl] === sk.id ? 'bg-amber-400 text-black font-bold border-amber-300' : 'bg-gray-900 border-gray-700 text-gray-300') + '">' +
                                (sl === 0 ? 'Esp' : (sl === 4 ? '4' : sl)) + '</button>'
                              ).join('') + '</div>'
                            : '<span class="text-[10px] text-gray-500">' + (sk.passive ? 'Passif' : '') + '</span>') +
                    '</div>' +
                '</div>';
            });
            html += '</div></div>';
        });

        return html + '</div>';
    },

    inventoryHtml() {
        const h = State.hero;
        // Poupée d'équipement : emplacements disposés autour du héros
        const activeSlot = h.activeWeapon === 'ranged' && h.equipment.ranged ? 'ranged' : 'weapon';
        const tile = sl => {
            const it = h.equipment[sl];
            return '<div data-kb-item="1" data-slot="' + sl + '" onclick="Game.unequipSlot(\'' + sl + '\')"' +
                ' onmouseenter="UI.showEquippedTooltip(\'' + sl + '\', event.clientX, event.clientY)" onmousemove="UI.moveTooltip(event.clientX, event.clientY)" onmouseleave="UI.hideCompare()"' +
                ' class="doll-slot" style="grid-area:' + sl + (it ? ';--rar:' + RARITIES[it.rarity].color : '') + '">' +
                (it
                    ? this.itemImg(it, 'w-12 h-12') +
                      (it.upgrade > 0 ? '<span class="doll-upg">+' + it.upgrade + '</span>' : '') +
                      (it.socketed ? '<span class="doll-gem">' + this.ic('gem', 'w-3.5 h-3.5') + '</span>' : '') +
                      (sl === activeSlot ? '<span class="doll-hand">En main</span>' : '')
                    : '<span class="doll-empty">' + SLOT_LABELS[sl] + '</span>') +
            '</div>';
        };
        const heroImg = Art.hero(0).toDataURL();
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
                    ' class="p-2.5 rounded-lg bg-black/60 border border-gray-800 hover:border-amber-400 cursor-pointer flex gap-2.5 items-start">' +
                    this.itemImg(it, 'w-11 h-11 shrink-0 rounded-md border', 'border-color:' + rar.color + '66;background:' + rar.color + '1a') +
                    '<div class="min-w-0">' +
                        '<div class="text-xs font-bold truncate" style="color:' + rar.color + '">' + it.name + (it.upgrade > 0 ? ' +' + it.upgrade : '') + '</div>' +
                        '<div class="text-[10px] text-gray-400">' + SLOT_LABELS[it.slot] + ' • Niv.' + it.level + '</div>' +
                        '<div class="text-[10px] text-gray-300 mt-1">' + this.formatItemStats(it) + '</div>' +
                    '</div>' +
                '</div>';
            }).join('');

        const artKeys = Object.keys(h.artifacts).filter(k => h.artifacts[k] > 0);
        const artHtml = artKeys.length === 0
            ? '<span class="text-xs text-gray-500">Aucun artefact récolté.</span>'
            : artKeys.map(k => {
                const a = ARTIFACTS[k];
                return '<span class="px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-500/40 text-xs text-amber-200">' +
                    this.ic(a.icon) + ' ' + a.name + ' x' + h.artifacts[k] + ' (' + a.label + ')</span>';
            }).join('');

        return '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">' +
                '<div class="bg-black/40 p-3.5 rounded-xl border border-gray-800">' +
                    '<div class="flex justify-between items-baseline mb-3"><span class="text-xs font-bold uppercase text-amber-300">Équipement Porté</span><span class="text-[10px] text-gray-500">Clic : retirer</span></div>' + slotsHtml +
                '</div>' +
                '<div class="md:col-span-2 flex flex-col gap-4">' +
                    '<div class="bg-black/40 p-3.5 rounded-xl border border-gray-800">' +
                        '<div class="flex justify-between text-xs font-bold uppercase text-amber-300 mb-2"><span>Sac à Dos (' + h.inventory.length + '/24) • trié par niveau</span><span class="text-gray-400 font-normal">[Entrée] Équiper • [X] Jeter</span></div>' +
                        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">' + bagHtml + '</div>' +
                    '</div>' +
                    '<div class="bg-black/40 p-3.5 rounded-xl border border-gray-800">' +
                        '<div class="text-xs font-bold uppercase text-amber-300 mb-2">' + this.ic('gem') + ' Artefacts & Runes (Forgeron Thrain)</div>' +
                        '<div class="flex flex-wrap gap-2">' + artHtml + '</div>' +
                    '</div>' +
                    '<div class="bg-black/40 p-3.5 rounded-xl border border-gray-800">' +
                        '<div class="text-xs font-bold uppercase text-amber-300 mb-2">' + this.ic('potionHp') + ' Potions</div>' +
                        '<div class="flex flex-wrap gap-2">' +
                            '<span class="px-2.5 py-1 rounded-lg bg-red-950/50 border border-red-500/40 text-xs text-red-200">' + this.ic('potionHp') + ' Potion de Vie x' + h.potionsHp + '</span>' +
                            '<span class="px-2.5 py-1 rounded-lg bg-orange-950/50 border border-orange-500/40 text-xs text-orange-200">' + this.ic('potionRage') + ' Potion de Fureur x' + h.potionsMp + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    },

    // Image générée du type d'objet (Art.item), nette en pixel art comme en HD
    itemImg(it, cls, style) {
        return '<img src="' + Art.itemUrl(it) + '" alt="" class="item-img ' + (Gfx.hd ? '' : 'px ') + (cls || '') + '"' + (style ? ' style="' + style + '"' : '') + '>';
    },

    formatItemStats(it) {
        const upg = 1 + it.upgrade * UPGRADE_STEP;
        const parts = [];
        if (it.dmg > 0) parts.push('+' + Math.round(it.dmg * upg) + ' Dégâts');
        if (it.slot === 'weapon' || it.slot === 'ranged') {
            parts.push('Vitesse ×' + (it.atkSpeed || 1).toFixed(2) + ' • Portée ' + it.weaponRange);
            if (it.pierce) parts.push('Perforant');
        }
        if (it.armor > 0) parts.push('+' + Math.round(it.armor * upg) + ' Armure');
        it.affixes.forEach(a => parts.push(a.label));
        if (it.socketed && ARTIFACTS[it.socketed]) parts.push(this.ic('gem') + ' ' + ARTIFACTS[it.socketed].label);
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
            '<div class="font-bold truncate flex items-center gap-1.5" style="color:' + rar.color + '">' + this.itemImg(it, 'w-7 h-7 shrink-0') + '<span class="truncate">' + it.name + (it.upgrade > 0 ? ' +' + it.upgrade : '') + '</span></div>' +
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

    // Journal [J] hors du camp ; au camp, l'onglet Quêtes
    renderQuestsModal() {
        if (State.activeModal === 'campModal') return this.renderCampModal();
        document.getElementById('questsModalBody').innerHTML = this.questsHtml();
    },

    renderBlacksmithModal() { if (State.activeModal === 'campModal') this.renderCampModal(); },
    renderMerchantModal() { if (State.activeModal === 'campModal') this.renderCampModal(); },
    renderPortalModal() { if (State.activeModal === 'campModal') this.renderCampModal(); },

    questsHtml() {
        Quests.ensureAvailable();
        const biomeOf = q => BIOMES.find(b => b.id === q.biomeId) || BIOMES[0];
        const active = State.quests.filter(q => !q.claimed)
            .sort((a, b) => (b.completed - a.completed) || BIOMES.indexOf(biomeOf(a)) - BIOMES.indexOf(biomeOf(b)));
        if (!active.length) return '<p class="text-xs text-gray-400 text-center py-6">Aucune quête pour le moment.</p>';
        return '<div class="space-y-3">' + active.map(q => {
            const b = biomeOf(q);
            const locked = State.hero.level < b.minLvl;
            const art = q.rewardArtifact ? ARTIFACTS[q.rewardArtifact] : null;
            return '<div class="bg-black/50 p-4 rounded-xl border ' + (q.completed ? 'border-emerald-500/60' : q.type === 'boss' ? 'border-orange-500/40' : 'border-gray-800') + ' flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">' +
                '<div>' +
                    '<div class="flex flex-wrap items-center gap-2">' +
                        '<span class="text-[10px] px-2 py-0.5 rounded ' + (locked ? 'bg-red-950 text-red-300' : 'bg-gray-900 text-gray-300') + '">' + (locked ? this.ic('lock') + ' ' : '') + this.ic(b.icon) + ' ' + b.name + ' • Niv. ' + b.minLvl + '-' + b.maxLvl + '</span>' +
                        '<span class="text-sm font-bold ' + (q.type === 'boss' ? 'text-orange-300' : 'text-amber-200') + '">' + this.ic(q.type === 'boss' ? 'skull' : 'dagger') + ' ' + q.title + '</span>' +
                    '</div>' +
                    '<p class="text-xs text-gray-300 mt-0.5">' + q.desc + '</p>' +
                    '<div class="text-[11px] text-amber-400 mt-1">Progression : ' + q.progress + ' / ' + q.target + ' • Récompense : ' + q.rewardGold + ' Or, ' + q.rewardXp + ' XP' +
                        (art ? ' • <span class="text-cyan-300">' + this.ic(art.icon) + ' ' + art.name + '</span>' : '') + '</div>' +
                '</div>' +
                (q.completed && State.location !== 'town'
                    ? '<span class="text-xs text-emerald-300 px-3 py-1.5 rounded bg-black/50 shrink-0">Terminée • à valider au camp</span>'
                    : q.completed
                    ? '<button onclick="Quests.claim(\'' + q.id + '\')" class="rpg-btn px-4 py-2 rounded-lg text-xs font-bold text-emerald-300 border-emerald-500 shrink-0">Valider la Quête</button>'
                    : '<span class="text-xs text-gray-500 px-3 py-1.5 rounded bg-black/50 shrink-0">En cours</span>') +
            '</div>';
        }).join('') + '</div>';
    },

    forgeHtml() {
        const h = State.hero;
        const allItems = [
            ...Object.keys(h.equipment).filter(k => h.equipment[k]).map(k => ({ item: h.equipment[k], source: 'Porté' })),
            ...h.inventory.map(it => ({ item: it, source: 'Sac' }))
        ];
        const artKeys = Object.keys(h.artifacts).filter(k => h.artifacts[k] > 0);
        const intro = '<p class="text-xs text-gray-400 mb-3">Deux crans de renfort par objet (+' + Math.round(UPGRADE_STEP * 100) + ' % dégâts / armure chacun). ' +
            'Un artefact, gagné en récompense de quête de boss, se sertit une seule fois par objet.</p>' +
            '<div class="flex flex-wrap gap-2 mb-3">' + (artKeys.length
                ? artKeys.map(k => '<span class="px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-500/40 text-xs text-amber-200">' + this.ic(ARTIFACTS[k].icon) + ' ' + ARTIFACTS[k].name + ' ×' + h.artifacts[k] + ' <span class="text-gray-400">(' + ARTIFACTS[k].label + ')</span></span>').join('')
                : '<span class="text-xs text-gray-500">Aucun artefact en réserve.</span>') + '</div>';
        if (!allItems.length) return intro + '<p class="text-xs text-gray-400 text-center py-6">Aucun équipement.</p>';
        return intro + '<div class="space-y-2.5">' + allItems.map(({ item: it, source }) => {
            const maxed = it.upgrade >= MAX_UPGRADE;
            const cost = Game.upgradeCost(it);
            return '<div class="bg-black/50 p-3 rounded-xl border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">' +
                '<div class="min-w-0">' +
                    '<div class="text-xs font-bold" style="color:' + RARITIES[it.rarity].color + '">' + this.itemImg(it, 'w-6 h-6 inline-block align-middle mr-1') + it.name + ' <span class="text-amber-300">' + '★'.repeat(it.upgrade) + '☆'.repeat(MAX_UPGRADE - it.upgrade) + '</span> <span class="text-gray-400">[' + source + ']</span></div>' +
                    '<div class="text-[11px] text-gray-300 mt-0.5">' + this.formatItemStats(it) + '</div>' +
                '</div>' +
                '<div class="flex flex-wrap items-center gap-2 shrink-0">' +
                    (maxed ? '<span class="text-[11px] text-amber-300">Renfort maximal</span>'
                        : '<button onclick="Game.upgradeItem(\'' + it.uid + '\')" ' + (h.gold < cost ? 'disabled' : '') + ' class="rpg-btn px-3 py-1.5 rounded-lg text-xs text-amber-200">' + this.ic('forge') + ' Renforcer (' + cost + ' Or)</button>') +
                    (it.socketed ? '' : artKeys.map(k =>
                        '<button onclick="Game.socketArtifact(\'' + it.uid + '\', \'' + k + '\')" title="' + ARTIFACTS[k].label + '" class="rpg-btn px-2.5 py-1.5 rounded-lg text-xs text-cyan-300">' + this.ic('gem') + ' ' + this.ic(ARTIFACTS[k].icon) + '</button>').join('')) +
                '</div>' +
            '</div>';
        }).join('') + '</div>';
    },

    merchantHtml() {
        const h = State.hero;
        this.hideCompare();
        const hover = (fn, idx) => ' onmouseenter="UI.' + fn + '(' + idx + ', event.clientX, event.clientY)" onmousemove="UI.moveTooltip(event.clientX, event.clientY)" onmouseleave="UI.hideCompare()"';
        const buyHtml = State.shopStock.length ? State.shopStock.map((it, idx) => {
            const rar = RARITIES[it.rarity];
            const canBuy = h.gold >= it.price && h.inventory.length < 24;
            return '<div' + hover('showShopCompare', idx) + ' class="bg-black/50 p-2.5 rounded-lg border border-gray-800 hover:border-amber-400 flex justify-between items-center gap-2">' +
                '<div class="min-w-0">' +
                    '<div class="text-xs font-bold truncate" style="color:' + rar.color + '">' + this.itemImg(it, 'w-6 h-6 inline-block align-middle mr-1') + it.name + ' <span class="text-gray-500">Niv.' + it.level + '</span></div>' +
                    '<div class="text-[10px] text-gray-400">' + this.formatItemStats(it) + '</div>' +
                '</div>' +
                '<button data-shop-idx="' + idx + '" onclick="Game.buyItem(' + idx + ')" ' + (!canBuy ? 'disabled' : '') + ' class="rpg-btn px-2.5 py-1 rounded text-xs text-yellow-300 shrink-0">' + it.price + ' Or</button>' +
            '</div>';
        }).join('') : '<div class="text-xs text-gray-500 text-center py-6">Stock épuisé : revenez après votre prochaine expédition.</div>';

        const sellHtml = h.inventory.length === 0
            ? '<div class="text-xs text-gray-500 text-center py-6">Rien à vendre dans le sac.</div>'
            : h.inventory.map((it, idx) =>
                '<div data-kb-item="1" data-sell-idx="' + idx + '" onclick="Game.sellItem(' + idx + ')"' + hover('showCompare', idx) + ' class="bg-black/50 p-2.5 rounded-lg border border-gray-800 hover:border-amber-400 cursor-pointer flex justify-between items-center gap-2">' +
                    '<span class="text-xs font-bold truncate" style="color:' + RARITIES[it.rarity].color + '">' + this.itemImg(it, 'w-6 h-6 inline-block align-middle mr-1') + it.name + '</span>' +
                    '<span class="text-xs text-emerald-300 shrink-0">+' + Game.sellValue(it) + ' Or</span>' +
                '</div>').join('');

        return '<div class="flex flex-wrap gap-2 mb-4 items-center justify-between">' +
                '<span class="text-xs text-gray-400">Le stock se renouvelle à chaque retour d’expédition. [Entrée] Acheter • [X] Vendre</span>' +
                '<div class="flex gap-2">' +
                    '<button onclick="Game.buyPotion(\'hp\')" ' + (h.gold < POTION_PRICE ? 'disabled' : '') + ' class="rpg-btn px-3 py-1.5 rounded-lg text-xs text-red-300">+' + this.ic('potionHp') + ' Potion Vie (' + POTION_PRICE + ' Or)</button>' +
                    '<button onclick="Game.buyPotion(\'mp\')" ' + (h.gold < POTION_PRICE ? 'disabled' : '') + ' class="rpg-btn px-3 py-1.5 rounded-lg text-xs text-orange-300">+' + this.ic('potionRage') + ' Potion Fureur (' + POTION_PRICE + ' Or)</button>' +
                '</div>' +
            '</div>' +
            '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' +
                '<div><div class="text-xs font-bold uppercase text-amber-300 mb-2">À vendre</div><div class="space-y-2">' + buyHtml + '</div></div>' +
                '<div><div class="text-xs font-bold uppercase text-amber-300 mb-2">Votre sac (' + h.inventory.length + '/24)</div><div class="space-y-2 max-h-80 overflow-y-auto">' + sellHtml + '</div></div>' +
            '</div>';
    },

    // Effets de la Menace, d'après World.biomeLevel et World.spawnEnemy
    menaceText(d) {
        if (d === 1) return 'Menace 1 : difficulté normale. Chaque cran ajoute 2 niveaux aux ennemis et au butin, et rend les ennemis plus coriaces, contre plus d’XP, d’or et de meilleurs objets.';
        return 'Menace ' + d + ' : ennemis et butin <strong class="text-amber-200">+' + (d - 1) * 2 + ' niveaux</strong>, vie des ennemis <strong class="text-red-300">+' + (d - 1) * 40 + ' %</strong>, dégâts des ennemis <strong class="text-red-300">+' + (d - 1) * 25 + ' %</strong>. En échange : plus d’XP, d’or et des objets de plus haut niveau.';
    },

    expeditionsHtml() {
        const h = State.hero;
        const diffBtns = [1, 2, 3, 4, 5].map(d =>
            '<button onclick="State.difficulty=' + d + '; UI.renderCampModal();" class="rpg-btn px-3 py-1 rounded text-xs ' +
            (State.difficulty === d ? 'border-amber-400 text-amber-300 font-bold' : 'text-gray-400') + '">Menace ' + d + '</button>'
        ).join('');

        const weights = World.expeditionWeights();
        const total = weights.reduce((n, x) => n + x.w, 0);
        const biomesHtml = BIOMES.map(b => {
            const locked = h.level < b.minLvl;
            const entry = weights.find(x => x.biome === b);
            const pct = entry ? Math.round(entry.w / total * 100) : 0;
            const quest = State.quests.find(q => q.type === 'boss' && !q.claimed && !q.completed && q.biomeId === b.id);
            const bosses = b.bosses.map(bo => {
                const killed = h.bossKills[bo.id];
                const hunted = quest && quest.bossId === bo.id;
                return '<span class="' + (hunted ? 'text-orange-300 font-bold' : killed ? 'text-emerald-300' : 'text-gray-600') + '">' +
                    (hunted ? this.ic('training') + ' ' + bo.name : killed ? this.ic('check') + ' ' + bo.name : '？') + '</span>';
            }).join('<span class="text-gray-700"> • </span>');
            return '<div class="bg-black/55 p-3 rounded-xl border ' + (quest ? 'border-orange-500/50' : 'border-gray-800') + (locked ? ' opacity-40' : '') + '">' +
                '<div class="flex justify-between items-center gap-2">' +
                    '<span class="font-cinzel font-bold text-sm text-amber-200">' + this.ic(b.icon, 'w-5 h-5') + ' ' + b.name + '</span>' +
                    '<span class="text-[10px] px-2 py-0.5 rounded shrink-0 ' + (locked ? 'bg-red-950 text-red-300' : 'bg-gray-900 text-gray-300') + '">' +
                        (locked ? this.ic('lock') + ' Niv. ' + b.minLvl : pct + ' % • Niv. ' + b.minLvl + '-' + b.maxLvl) + '</span>' +
                '</div>' +
                '<div class="text-[11px] mt-1.5 leading-relaxed">' + bosses + '</div>' +
                (h.purified[b.id] ? '<div class="text-[11px] mt-1 text-emerald-300 font-semibold">' + this.ic('trophy') + ' Purifié • +2 % dégâts</div>' : '') +
            '</div>';
        }).join('');

        return '<div class="flex flex-col items-center gap-2 mb-4">' +
                '<button onclick="World.startExpedition(); UI.closeModals();" class="px-8 py-3 rounded-xl font-cinzel font-bold text-base text-black bg-gradient-to-b from-amber-300 to-amber-600 hover:from-amber-200 hover:to-amber-500 shadow-lg shadow-amber-900/40">' + this.ic('expeditions', 'w-5 h-5 mr-1') + ' Partir en exploration</button>' +
                '<p class="text-[11px] text-gray-400 text-center max-w-xl">Le portail choisit un donjon au hasard parmi ceux accessibles : ceux de vos quêtes en cours sont bien plus probables, ceux que vous avez dépassés presque jamais. Le boss est celui de votre quête (' + this.ic('training') + '), sinon l’un de ceux déjà vaincus (' + this.ic('check') + ').</p>' +
                '<div class="flex flex-wrap items-center justify-center gap-2"><span class="text-xs font-bold text-amber-300 mr-1">Menace :</span>' + diffBtns + '</div>' +
                '<p class="text-[11px] text-gray-400 text-center max-w-xl">' + this.menaceText(State.difficulty) + '</p>' +
            '</div>' +
            '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">' + biomesHtml + '</div>';
    }
};
