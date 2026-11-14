'use strict';

// ==================== ART PROCÉDURAL DES CRÉATURES ====================
// Une seule description vectorielle par créature (look), rendue de deux façons :
//  • HD (Gfx.hd) : tracés lissés, dégradés et contours fins sur un canvas 6× la résolution logique ;
//  • pixel : même tracé à 1×, alpha seuillé puis contour sombre d'1 px → pixel art net.
// look = { form, head, scale, bulk, robe, thin, hunch, ghost, skin, hair, cloth, eye, horn, orb, rune, tabard, acc: [...] }
// Chaque canvas renvoyé porte lw / lh = taille en pixels logiques, pieds en bas au centre.
const Art = {
    cache: {},
    RES: 6,

    // Boîte (pixels logiques) de chaque silhouette, marge comprise pour cornes, couronnes et armes
    BOX: {
        biped: [18, 22], quad: [22, 16], flyer: [18, 13], blob: [14, 13], orb: [12, 13], wisp: [12, 14],
        skullhead: [12, 12], ghost: [16, 20], spider: [20, 12], insect: [14, 10], scorpion: [22, 15],
        serpent: [18, 22], tree: [20, 24]
    },

    shade(hex, f) {
        const n = parseInt(hex.slice(1), 16);
        const ch = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f));
        return '#' + ch.map(v => v.toString(16).padStart(2, '0')).join('');
    },

    // ---------- API ----------
    enemy(en, frame) {
        const look = en.look || this.legacyLook(en.body);
        return this.build('en' + JSON.stringify(look) + en.color + (en.glow || ''), look, en.color, en.glow, frame);
    },

    hero(frame) {
        const look = {
            form: 'biped', head: 'human', skin: '#e0b38a', hair: '#9ca3af', tabard: CLASSES.warrior.color,
            cloth: '#7f1d1d', leg: '#475569', acc: ['cape', 'pauldrons', 'helmOpen']
        };
        return this.build('hero', look, '#94a3b8', null, frame);
    },

    chest(opened) {
        return this.render('chest' + opened, 14, 11, null, (d, g) => {
            const wood = opened ? '#3f3a36' : '#92400e', band = opened ? '#6b7280' : '#facc15';
            if (opened) {
                d.rr(1.5, 0.6, 11, 3.6, 0.8, '#57534e');
                d.rr(2, 4, 10, 2, 0.4, '#0c0a09', { noEdge: true });
            } else {
                d.path(() => { g.moveTo(1.5, 5); g.quadraticCurveTo(7, 0.6, 12.5, 5); g.closePath(); }, wood, [1.5, 1, 12.5, 5]);
            }
            d.rr(1.5, 5, 11, 5.4, 0.6, wood);
            d.rr(1.5, 5, 11, 1, 0.3, band);
            [3.5, 10.5].forEach(x => d.rr(x - 0.6, opened ? 5 : 2.4, 1.2, opened ? 5.4 : 8, 0.3, band));
            if (!opened) { d.rr(6.2, 5.6, 1.6, 2, 0.3, '#fde68a'); d.dot(7, 6.8, 0.35, '#1c1917'); }
        });
    },

    // ---------- Équipement : une image 16×16 par type d'objet (nom de base, préfixe de rareté ignoré) ----------
    // Canvas mis en cache par Art.render (un par mode graphique) ; l'URL est mémorisée sur le canvas
    url(cv) { return cv._url || (cv._url = cv.toDataURL()); },

    itemIcon(it) {
        const pool = ItemGen.bases[it.slot];
        const base = pool.find(b => it.name.endsWith(b.name)) || pool[0];
        return this.render('item' + base.name, 16, 16, null, (d, g) => this.ITEMS[base.name].call(this, d, g));
    },
    itemUrl(it) { return this.url(this.itemIcon(it)); },

    // Icônes d'interface (Art.ICONS, js/icons.js) ; un alias renvoie au dessin d'objet du même nom
    icon(id) {
        const alias = this.ICON_ALIAS[id];
        return this.render('icon' + id, 16, 16, null, (d, g) => (alias ? this.ITEMS[alias] : this.ICONS[id]).call(this, d, g));
    },
    iconUrl(id) { return this.url(this.icon(id)); },

    ICONS: {
        // Portail : anneaux de pierre et tourbillon violet
        expeditions(d, g) {
            d.ell(8, 8, 7, 7, '#57534e');
            d.ell(8, 8, 5.4, 5.4, '#4c1d95');
            d.ell(8, 8, 3.6, 3.6, '#7c3aed');
            d.line(8, 3.6, 11.5, 8.5, 0.8, '#c4b5fd', 12, 4);
            d.line(8, 12.4, 4.5, 7.5, 0.8, '#c4b5fd', 4, 12);
            d.dot(8, 8, 1, '#ede9fe', true);
        },
        // Parchemin enroulé
        quests(d) {
            d.rr(3, 3, 10, 10, 0.5, '#e7d3a8');
            d.rr(2, 1.5, 12, 2.6, 1.3, '#c8a96a');
            d.rr(2, 11.9, 12, 2.6, 1.3, '#c8a96a');
            [5.6, 7.6, 9.6].forEach(y => d.line(4.5, y, 11.5, y, 0.45, '#78350f'));
            d.ell(11, 12, 1.3, 1.3, '#b91c1c');
        },
        // Sac à dos de cuir
        inventory(d) {
            d.rr(5.5, 1, 5, 3.5, 2, '#78350f');
            d.rr(2.5, 3.5, 11, 11.5, 3, '#a16207');
            d.rr(3.5, 4, 9, 4.5, 2, '#854d0e');
            d.rr(4.5, 9.5, 7, 4.5, 1.2, '#78350f');
            d.rr(7.2, 7, 1.6, 2.6, 0.4, '#facc15');
        },
        // Balance du marchand
        merchant(d) {
            d.rr(7.3, 2.5, 1.4, 11, 0.5, '#a16207');
            d.rr(4.5, 13, 7, 2, 0.8, '#78350f');
            d.rr(1.5, 3, 13, 1.2, 0.5, '#facc15');
            [3.5, 12.5].forEach(x => {
                d.line(x, 4, x - 2, 9, 0.35, '#d4d4d8');
                d.line(x, 4, x + 2, 9, 0.35, '#d4d4d8');
                d.ell(x, 9.3, 2.6, 1.1, '#eab308');
            });
            d.ell(8, 2.4, 1, 1, '#fde68a');
        },
        // Marteau sur enclume
        forge(d, g) {
            d.poly([[1.5, 9], [14.5, 9], [12.5, 11], [10, 11], [11, 14.5], [5, 14.5], [6, 11], [3.5, 11]], '#52525b');
            d.rr(1.5, 8.5, 13, 1.2, 0.4, '#a1a1aa');
            this.diag(g, () => {
                g.translate(-1.5, -2);
                d.rr(-0.6, -2, 1.2, 8, 0.5, '#7c4a1e');
                d.rr(-2.8, -5, 5.6, 3, 0.6, '#9ca3af');
            });
            d.dot(11.5, 7, 0.5, '#fb923c', true);
        },
        // Cible et flèche plantée
        training(d) {
            d.ell(7, 9, 6, 6, '#e7e5e4');
            d.ell(7, 9, 4.3, 4.3, '#dc2626');
            d.ell(7, 9, 2.6, 2.6, '#e7e5e4');
            d.ell(7, 9, 1.1, 1.1, '#dc2626');
            d.line(7, 9, 14, 2, 0.7, '#7c4a1e');
            d.poly([[12.2, 1.2], [15, 1], [14.8, 3.8], [13.6, 2.4]], '#4ade80');
        },
        // Livre ouvert
        learning(d, g) {
            const page = (x0, x1) => d.path(() => {
                g.moveTo(8, 4); g.quadraticCurveTo((8 + x0) / 2, 2, x0, 3); g.lineTo(x0, 13);
                g.quadraticCurveTo((8 + x0) / 2, 12, 8, 14); g.closePath();
            }, '#f5f0e1', [Math.min(x0, 8), 2, Math.max(x0, 8), 14]);
            d.rr(1, 4, 14, 11, 1, '#7f1d1d');
            page(1.8); page(14.2);
            [6, 8, 10].forEach(y => { d.line(3.5, y, 6.5, y + 0.3, 0.35, '#a8a29e'); d.line(9.5, y + 0.3, 12.5, y, 0.35, '#a8a29e'); });
            d.line(8, 4, 8, 14, 0.4, '#a8a29e');
        }
    },

    // Arme en diagonale : dessinée verticale (pointe en haut) autour de (0, 0), pivotée de 45°
    diag(g, fn) {
        g.save();
        g.translate(8, 8);
        g.rotate(Math.PI / 4);
        fn();
        g.restore();
    },

    // Épée verticale : lame de top à 2, garde, poignée, pommeau
    sword(d, top, w, guard, steel) {
        d.poly([[-w / 2, 2], [-w / 2, top + w], [0, top], [w / 2, top + w], [w / 2, 2]], steel || '#d4d4d8');
        d.line(0, top + w, 0, 1.5, 0.35, 'rgba(255,255,255,0.5)');
        d.rr(-guard / 2, 2, guard, 1.3, 0.5, '#a16207');
        d.rr(-0.75, 3.3, 1.5, 3.8, 0.4, '#5b3716');
        d.ell(0, 7.8, 1.1, 1.1, '#ca8a04');
    },

    bow(d, half, bend, tips) {
        d.line(0, -half, 0, half, 1.4, '#8b5a2b', -bend, 0);
        d.line(0, -half, 0, half, 0.3, '#e7e5e4');
        d.rr(-bend / 2 - 0.9, -1.3, 1.8, 2.6, 0.5, '#3f2a1d');
        if (tips) [-half, half].forEach(y => d.ell(0, y, 0.7, 0.7, '#facc15'));
    },

    hole(g, x, y, rx, ry) {
        g.save();
        g.globalCompositeOperation = 'destination-out';
        g.beginPath();
        g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
    },

    torso(d, g, col) {
        d.path(() => {
            [[4, 2], [12, 2], [15, 4.5], [13, 7], [12.5, 14.5], [3.5, 14.5], [3, 7], [1, 4.5]]
                .forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
            g.closePath();
        }, col, [1, 2, 15, 14.5]);
    },

    ITEMS: {
        'Dague Acérée'(d, g) { this.diag(g, () => { g.translate(0, -2.5); this.sword(d, -4.5, 2.4, 4.6); }); },
        'Épée Longue'(d, g) { this.diag(g, () => this.sword(d, -9.5, 2, 6)); },
        'Espadon Runique'(d, g) {
            this.diag(g, () => {
                this.sword(d, -10, 3, 7.5, '#cbd5e1');
                [-6, -3.5, -1].forEach(y => d.dot(0, y, 0.45, '#c084fc', true));
            });
        },
        'Hache de Guerre'(d, g) {
            this.diag(g, () => {
                d.rr(-0.7, -8.5, 1.4, 17.5, 0.6, '#7c4a1e');
                d.rr(-0.9, 5, 1.8, 3.5, 0.5, '#3f2a1d');
                d.poly([[0.5, -7], [4, -8], [6.4, -9.6], [6.4, -0.4], [4, -2], [0.5, -3]], '#9ca3af');
                d.line(6.2, -9.2, 6.2, -0.8, 0.5, '#f4f4f5');
                d.poly([[-0.5, -6], [-3.2, -5], [-0.5, -4]], '#71717a');
            });
        },
        'Masse d’Armes'(d, g) {
            this.diag(g, () => {
                d.rr(-0.7, -4, 1.4, 13, 0.6, '#7c4a1e');
                d.rr(-0.9, 4.5, 1.8, 4, 0.5, '#3f2a1d');
                for (let i = 0; i < 6; i++) {
                    const a = i * Math.PI / 3, c = Math.cos(a), s = Math.sin(a);
                    d.poly([[c * 4.8, -6 + s * 4.8], [-s * 1.1 + c * 2.5, -6 + c * 1.1 + s * 2.5], [s * 1.1 + c * 2.5, -6 - c * 1.1 + s * 2.5]], '#a1a1aa');
                }
                d.ell(0, -6, 3, 3, '#71717a');
                d.rr(-1.6, -3.4, 3.2, 1, 0.4, '#a16207');
            });
        },
        'Lance de Guerre'(d, g) {
            this.diag(g, () => {
                d.rr(-0.6, -5, 1.2, 15, 0.5, '#7c4a1e');
                d.poly([[0, -10.5], [1.7, -7], [0, -4.6], [-1.7, -7]], '#d4d4d8');
                d.rr(-1, -5, 2, 1.1, 0.4, '#a16207');
                d.ell(-1.2, -3.4, 0.8, 1.5, '#b91c1c');
            });
        },
        'Arc Court'(d, g) { this.diag(g, () => this.bow(d, 6.5, 5, false)); },
        'Arc Long'(d, g) { this.diag(g, () => this.bow(d, 9.2, 6, true)); },
        'Arbalète Lourde'(d, g) {
            this.diag(g, () => {
                d.rr(-1.2, -4, 2.4, 13, 0.6, '#7c4a1e');
                d.line(-6.8, -3.5, 6.8, -3.5, 1.4, '#52525b', 0, -7.5);
                d.line(-6.8, -3.5, 0, -0.5, 0.3, '#e7e5e4');
                d.line(6.8, -3.5, 0, -0.5, 0.3, '#e7e5e4');
                d.rr(-0.4, -9, 0.8, 8.5, 0.3, '#d4d4d8');
                d.poly([[0, -10.4], [1, -8.6], [-1, -8.6]], '#e5e7eb');
                d.rr(-0.5, 3, 1, 2, 0.4, '#18181b');
            });
        },
        'Javelots de Chasse'(d, g) {
            [-0.38, 0, 0.38].forEach(a => {
                g.save();
                g.translate(8, 15);
                g.rotate(a);
                d.rr(-0.5, -11, 1, 11, 0.4, '#8b5a2b');
                d.poly([[0, -14.6], [1.2, -11.8], [0, -10.6], [-1.2, -11.8]], '#d4d4d8');
                g.restore();
            });
        },
        'Bouclier de Bois'(d, g) {
            d.ell(8, 8, 7.3, 7.3, '#71717a');
            d.ell(8, 8, 6.2, 6.2, '#8b5a2b');
            d.over(() => [5, 8, 11].forEach(x => d.line(x, 1.5, x, 14.5, 0.4, '#5b3716')));
            d.ell(8, 8, 2, 2, '#a1a1aa');
        },
        'Écu de Fer'(d, g) {
            const heater = (x0, x1, y0, yb, col) => d.path(() => {
                g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1, 7);
                g.quadraticCurveTo(x1, 12.5, 8, yb); g.quadraticCurveTo(x0, 12.5, x0, 7); g.closePath();
            }, col, [x0, y0, x1, yb]);
            heater(1.5, 14.5, 1.2, 15.4, '#94a3b8');
            heater(3, 13, 2.6, 13.6, '#1e3a8a');
            d.rr(7.3, 3.5, 1.4, 8.5, 0.3, '#facc15');
            d.rr(4.5, 6, 7, 1.4, 0.3, '#facc15');
        },
        'Pavois Clouté'(d) {
            d.rr(2.5, 0.5, 11, 15, 2.5, '#57534e');
            d.rr(3.5, 1.5, 9, 13, 1.8, '#991b1b');
            d.rr(7.2, 1.5, 1.6, 13, 0.3, '#57534e');
            [[5, 3.5], [11, 3.5], [5, 8], [11, 8], [5, 12.5], [11, 12.5], [8, 8]].forEach(([x, y]) => d.ell(x, y, 0.75, 0.75, '#e5e7eb'));
        },
        'Casque de Fer'(d, g) {
            d.path(() => {
                g.moveTo(2.5, 11.5); g.lineTo(2.5, 7);
                g.quadraticCurveTo(2.5, 1.5, 8, 1.5); g.quadraticCurveTo(13.5, 1.5, 13.5, 7);
                g.lineTo(13.5, 11.5); g.closePath();
            }, '#9ca3af', [2.5, 1.5, 13.5, 11.5]);
            d.rr(3.6, 6.6, 8.8, 1.4, 0.4, '#111827');
            d.rr(7.3, 5.6, 1.4, 7, 0.4, '#6b7280');
            d.rr(2, 11, 12, 2, 0.8, '#6b7280');
            d.line(8, 1.8, 8, 5.4, 0.6, '#e5e7eb');
        },
        'Capuche de Cuir'(d, g) {
            d.path(() => {
                g.moveTo(1.5, 14.5); g.quadraticCurveTo(0.8, 3, 8, 1.2);
                g.quadraticCurveTo(15.2, 3, 14.5, 14.5); g.closePath();
            }, '#78350f', [1, 1.2, 15, 14.5]);
            d.ell(8, 9.2, 3.6, 4.3, '#1c1917', { noEdge: true });
            d.dot(6.6, 8.6, 0.4, '#fbbf24', true);
            d.dot(9.4, 8.6, 0.4, '#fbbf24', true);
        },
        'Diadème Astral'(d) {
            d.poly([[1.5, 9], [3, 5], [5.2, 7.6], [8, 2.5], [10.8, 7.6], [13, 5], [14.5, 9]], '#eab308');
            d.rr(1.5, 8.5, 13, 2.8, 1, '#facc15');
            d.ell(8, 7.6, 1.3, 1.6, '#60a5fa');
            d.dot(8, 7.2, 0.5, '#e0f2fe', true);
            [4, 12].forEach(x => d.ell(x, 9.9, 0.8, 0.8, '#c084fc'));
        },
        'Cuirasse de Mailles'(d, g) {
            this.torso(d, g, '#9ca3af');
            d.over(() => {
                for (let y = 3; y < 15; y += 1.5) for (let x = 1.5 + (y % 3 ? 0.75 : 0); x < 15; x += 1.5) d.ell(x, y, 0.42, 0.42, '#52525b', { noEdge: true });
            });
            d.ell(8, 2, 2, 1.3, '#1c1917', { noEdge: true });
            d.rr(3.3, 10.3, 9.4, 1.6, 0.4, '#78350f');
            d.rr(7.2, 10.1, 1.6, 2, 0.3, '#facc15');
        },
        'Manteau de Pisteur'(d, g) {
            d.path(() => { g.moveTo(5, 1.5); g.lineTo(11, 1.5); g.lineTo(15, 15); g.lineTo(1, 15); g.closePath(); }, '#4d7c0f', [1, 1.5, 15, 15]);
            d.over(() => {
                d.line(6.5, 4, 4, 14.5, 0.5, '#365314');
                d.line(9.5, 4, 12, 14.5, 0.5, '#365314');
            });
            d.ell(8, 2.6, 3.6, 1.9, '#3f6212');
            d.ell(8, 4, 0.9, 0.9, '#facc15');
        },
        'Robe d’Adepte'(d, g) {
            d.path(() => {
                [[5, 1.5], [11, 1.5], [12.5, 6], [14, 15], [2, 15], [3.5, 6]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
                g.closePath();
            }, '#6d28d9', [2, 1.5, 14, 15]);
            d.over(() => {
                d.rr(7.2, 1.5, 1.6, 14, 0.2, '#facc15');
                d.rr(1, 13.6, 14, 1.4, 0.2, '#facc15');
            });
            d.rr(3.4, 6.6, 9.2, 1.4, 0.5, '#a21caf');
        },
        'Gantelets Rivetés'(d) {
            d.rr(4, 9.5, 7, 5.5, 1, '#71717a');
            d.rr(10, 5.6, 3.8, 2, 1, '#a1a1aa');
            [4, 5.8, 7.6, 9.4].forEach(x => d.rr(x, 1.5, 1.6, 4, 0.8, '#d4d4d8'));
            d.rr(4, 4, 7, 6.5, 1.8, '#a1a1aa');
            [[5, 12.5], [8, 12.5], [10, 12.5]].forEach(([x, y]) => d.ell(x, y, 0.55, 0.55, '#facc15'));
        },
        'Mitaines Souples'(d) {
            d.rr(10, 6, 3.6, 2, 1, '#a16207');
            [4, 5.8, 7.6, 9.4].forEach(x => d.rr(x, 2.5, 1.6, 3, 0.8, '#e0b38a'));
            d.rr(4, 4.5, 7, 6.5, 2, '#a16207');
            d.rr(4, 10, 7, 4.5, 1, '#78350f');
            d.line(4.5, 11.2, 10.5, 11.2, 0.35, '#fcd34d');
        },
        'Bottes Ferrées'(d) {
            d.rr(4, 1.5, 6, 10, 1, '#7c2d12');
            d.rr(4, 9, 10, 4.5, 2, '#7c2d12');
            d.rr(3.8, 13, 10.6, 1.6, 0.6, '#1c1917');
            d.rr(3.6, 1.5, 6.8, 2.2, 0.6, '#a1a1aa');
            d.ell(12.2, 11, 2, 2, '#a1a1aa');
            d.rr(4, 7, 6, 1.3, 0.4, '#a1a1aa');
        },
        'Bottes de Marche'(d) {
            d.rr(4, 2, 6, 10, 1, '#92400e');
            d.rr(4, 9, 9.6, 4.5, 2, '#92400e');
            d.rr(3.8, 13, 10.2, 1.6, 0.6, '#3f2a1d');
            d.rr(3.5, 1.5, 7, 2.4, 0.8, '#78350f');
            [5.5, 7.2, 8.9].forEach(y => d.line(5.5, y, 8.5, y + 0.8, 0.4, '#fde68a'));
        },
        'Anneau de Cuivre'(d, g) {
            d.ell(8, 9.5, 5, 5, '#c2410c');
            this.hole(g, 8, 9.5, 3.2, 3.2);
            d.ell(8, 4.5, 1.9, 1.7, '#22c55e');
            d.dot(7.5, 4, 0.4, '#bbf7d0', true);
        },
        'Chevalière Gravée'(d, g) {
            d.ell(8, 10, 5, 4.6, '#eab308');
            this.hole(g, 8, 10.6, 3.2, 2.9);
            d.rr(4.5, 2.4, 7, 4.8, 1.5, '#facc15');
            d.line(6.5, 3.6, 9.5, 6, 0.5, '#854d0e');
            d.line(9.5, 3.6, 6.5, 6, 0.5, '#854d0e');
        },
        'Talisman d’Os'(d, g) {
            d.line(2, 1, 8, 8.5, 0.6, '#a16207', 2.5, 7);
            d.line(14, 1, 8, 8.5, 0.6, '#a16207', 13.5, 7);
            [[4.4, 6], [11.6, 6]].forEach(([x, y]) => d.ell(x, y, 0.9, 1.2, '#ece6da'));
            d.path(() => { g.moveTo(6.3, 8.4); g.quadraticCurveTo(8, 9.4, 9.7, 8.4); g.quadraticCurveTo(9.4, 12.5, 8, 15.2); g.quadraticCurveTo(6.6, 12.5, 6.3, 8.4); }, '#ece6da', [6.3, 8.4, 9.7, 15.2]);
        },
        'Pendentif Runique'(d) {
            d.line(2, 1, 8, 7.4, 0.5, '#facc15', 2.5, 6);
            d.line(14, 1, 8, 7.4, 0.5, '#facc15', 13.5, 6);
            d.ell(8, 10.5, 3.8, 3.8, '#a1a1aa');
            d.ell(8, 10.5, 2.7, 2.7, '#1e40af');
            d.line(8, 8.6, 8, 12.4, 0.5, '#7dd3fc');
            d.line(8, 10, 9.4, 9, 0.5, '#7dd3fc');
            d.dot(8, 10.5, 0.5, '#e0f2fe', true);
        }
    },

    white(spr) {
        if (spr._white) return spr._white;
        const c = document.createElement('canvas');
        c.width = spr.width;
        c.height = spr.height;
        const g = c.getContext('2d');
        g.drawImage(spr, 0, 0);
        g.globalCompositeOperation = 'source-in';
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, c.width, c.height);
        c.lw = spr.lw;
        c.lh = spr.lh;
        return (spr._white = c);
    },

    // Anciennes définitions (body sans look)
    legacyLook(body) {
        return body === 'mon' ? { form: 'quad', head: 'beast' }
            : body === 'swarm' ? { form: 'flyer', head: 'bat' }
            : body === 'bomb' ? { form: 'blob' }
            : { form: 'biped', head: 'human' };
    },

    // ---------- Construction ----------
    build(key, look, color, glow, frame) {
        const f = frame ? 1 : 0;
        const box = this.BOX[look.form] || this.BOX.biped;
        const sc = look.scale || 1;
        const lw = Math.ceil(box[0] * sc), lh = Math.ceil(box[1] * sc);
        return this.render(key + '|' + f, lw, lh, glow, (d, g) => {
            g.scale(sc, sc);
            const P = this.palette(look, color);
            const c = { d, g, L: look, P, f, W: box[0], H: box[1], wx: box[0] / 2, wy: box[1] / 2, acc: look.acc || [] };
            (this.FORMS[look.form] || this.FORMS.biped).call(this, c);
        }, look.ghost);
    },

    // Rend une fonction de dessin (unités logiques) dans le mode courant, avec cache et halo éventuel
    render(key, lw, lh, glow, draw, ghost) {
        const hd = Gfx.hd, s = hd ? this.RES : 1;
        const ck = (hd ? 'H' : 'P') + key;
        if (this.cache[ck]) return this.cache[ck];
        let cv = document.createElement('canvas');
        cv.width = lw * s;
        cv.height = lh * s;
        const g = cv.getContext('2d');
        g.scale(s, s);
        draw(this.pen(g, hd, s), g);
        if (!hd) this.pixelize(cv, ghost);
        if (glow) cv = this.halo(cv, glow, hd, s);
        cv.lw = cv.width / s;
        cv.lh = cv.height / s;
        return (this.cache[ck] = cv);
    },

    // Seuil d'alpha + contour sombre d'1 px (mode pixel) ; getImageData rend des couleurs non prémultipliées, gardées telles quelles
    pixelize(cv, ghost) {
        const g = cv.getContext('2d');
        const img = g.getImageData(0, 0, cv.width, cv.height), px = img.data, W = cv.width, H = cv.height;
        const solid = new Uint8Array(W * H);
        for (let i = 0; i < W * H; i++) {
            const a = px[i * 4 + 3];
            solid[i] = a >= 110 ? 1 : 0;
            px[i * 4 + 3] = solid[i] ? (ghost ? 190 : 255) : 0;
        }
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const i = y * W + x;
            if (solid[i]) continue;
            if ((x > 0 && solid[i - 1]) || (x < W - 1 && solid[i + 1]) || (y > 0 && solid[i - W]) || (y < H - 1 && solid[i + W])) {
                px.set([20, 13, 18, ghost ? 160 : 255], i * 4);
            }
        }
        g.putImageData(img, 0, 0);
    },

    // Halo des boss et élites : lueur douce (HD) ou contour coloré (pixel) ; marge en haut et sur les côtés
    halo(spr, col, hd, s) {
        const pad = hd ? 2 : 1;
        const c = document.createElement('canvas');
        c.width = spr.width + pad * 2 * s;
        c.height = spr.height + pad * s;
        const g = c.getContext('2d');
        if (hd) {
            g.shadowColor = col;
            g.shadowBlur = 1.6 * s;
            g.drawImage(spr, pad * s, pad * s);
            g.drawImage(spr, pad * s, pad * s);
            g.shadowBlur = 0;
            g.drawImage(spr, pad * s, pad * s);
            return c;
        }
        const tint = document.createElement('canvas');
        tint.width = spr.width;
        tint.height = spr.height;
        const t = tint.getContext('2d');
        t.drawImage(spr, 0, 0);
        t.globalCompositeOperation = 'source-in';
        t.fillStyle = col;
        t.fillRect(0, 0, tint.width, tint.height);
        [[0, 1], [2, 1], [1, 0], [1, 2]].forEach(([dx, dy]) => g.drawImage(tint, dx, dy));
        g.drawImage(spr, 1, 1);
        return c;
    },

    palette(L, color) {
        const sh = (c, f) => this.shade(c, f);
        const humanish = ['human', 'ghoul'].includes(L.head);
        return {
            main: color, dark: sh(color, -0.35), light: sh(color, 0.3),
            skin: L.skin || (humanish ? '#d9a77c' : color),
            hair: L.hair || '#3f2a1d',
            cloth: L.cloth || sh(color, -0.22),
            leg: L.leg || sh(color, -0.3),
            boot: sh(L.leg || color, -0.55),
            wing: L.wing || sh(color, -0.3),
            eye: L.eye || '#fde047',
            horn: L.horn || '#e7e5e4',
            rune: L.rune || '#e879f9',
            orb: L.orb || '#a78bfa',
            metal: '#a1a1aa', steel: '#e5e7eb', bone: '#ece6da', gold: '#facc15', wood: '#7c4a1e', dk: '#0c0a09'
        };
    },

    // Outils de tracé en unités logiques ; dégradé + contour en HD, aplat en pixel
    pen(g, hd, s) {
        const sh = (c, f) => this.shade(c, f);
        const paint = (col, x0, y0, x1, y1) => {
            if (!hd || col[0] !== '#') { g.fillStyle = col; return; }
            const gr = g.createLinearGradient(x0, y0, x1, y1);
            gr.addColorStop(0, sh(col, 0.3));
            gr.addColorStop(0.5, col);
            gr.addColorStop(1, sh(col, -0.38));
            g.fillStyle = gr;
        };
        const edge = (col, o) => {
            if (!hd || (o && o.noEdge) || col[0] !== '#') return;
            g.strokeStyle = sh(col, -0.65);
            g.lineWidth = 0.28;
            g.lineJoin = 'round';
            g.stroke();
        };
        const d = {
            hd,
            ell(x, y, rx, ry, col, o) {
                g.beginPath();
                g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), (o && o.rot) || 0, 0, Math.PI * 2);
                paint(col, x - rx, y - ry, x + rx * 0.6, y + ry);
                g.fill();
                edge(col, o);
            },
            rr(x, y, w, h, r, col, o) {
                g.beginPath();
                g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
                paint(col, x, y, x + w, y + h);
                g.fill();
                edge(col, o);
            },
            poly(pts, col, o) {
                g.beginPath();
                pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
                g.closePath();
                const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
                paint(col, Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
                g.fill();
                edge(col, o);
            },
            // Chemin libre : build() trace, bb = [x0, y0, x1, y1] pour le dégradé
            path(build, col, bb, o) {
                g.beginPath();
                build();
                paint(col, bb[0], bb[1], bb[2], bb[3]);
                g.fill();
                edge(col, o);
            },
            line(x1, y1, x2, y2, w, col, cx, cy) {
                g.beginPath();
                g.moveTo(x1, y1);
                if (cx !== undefined) g.quadraticCurveTo(cx, cy, x2, y2);
                else g.lineTo(x2, y2);
                g.strokeStyle = col;
                g.lineWidth = hd ? w : Math.max(w, 0.9);
                g.lineCap = 'round';
                g.stroke();
            },
            // Point lumineux (yeux) : halo en HD, pixel plein en mode pixel
            dot(x, y, r, col, glow) {
                if (!hd) { g.fillStyle = col; g.fillRect(Math.floor(x), Math.floor(y), 1, 1); return; }
                g.beginPath();
                g.arc(x, y, r, 0, Math.PI * 2);
                g.fillStyle = col;
                if (glow) { g.shadowColor = col; g.shadowBlur = 0.9 * s; }
                g.fill();
                g.shadowBlur = 0;
            },
            // Recouvre ce qui est déjà dessiné (bandelettes, fissures)
            over(fn) {
                g.save();
                g.globalCompositeOperation = 'source-atop';
                fn();
                g.restore();
            },
            alpha(a, fn) {
                const prev = g.globalAlpha;
                g.globalAlpha = a;
                fn();
                g.globalAlpha = prev;
            }
        };
        return d;
    },

    // Accessoires d'une phase donnée (back, body, prehead, head, hand)
    accs(c, phase) {
        c.acc.forEach(name => {
            const a = this.ACC[name];
            if (a && a.phase === phase) a.fn.call(this, c);
        });
    },

    // ---------- Têtes ----------
    head(c, type, x, y, r) {
        const { d, P, L } = c;
        const eyes = (dx, dy, col, glow, rr) => [-1, 1].forEach(s => d.dot(x + s * r * dx, y + dy, rr || r * 0.17, col, glow));
        switch (type) {
            case 'none': return;
            case 'skull':
                d.ell(x, y - r * 0.15, r, r * 0.9, P.bone);
                d.rr(x - r * 0.55, y + r * 0.4, r * 1.1, r * 0.6, r * 0.2, P.bone);
                [-1, 1].forEach(s => d.ell(x + s * r * 0.4, y - r * 0.05, r * 0.3, r * 0.32, P.dk, { noEdge: true }));
                eyes(0.4, -r * 0.05, P.eye, true, r * 0.13);
                d.line(x - r * 0.3, y + r * 0.62, x + r * 0.3, y + r * 0.62, 0.25, P.dk);
                return;
            case 'hollow':
                d.ell(x, y, r * 0.9, r * 0.85, P.dk, { noEdge: true });
                eyes(0.35, 0, P.eye, true);
                return;
            case 'ghoul':
                d.ell(x, y, r * 0.9, r * 1.05, P.skin);
                [-1, 1].forEach(s => d.ell(x + s * r * 0.36, y - r * 0.1, r * 0.26, r * 0.22, P.dk, { noEdge: true }));
                eyes(0.36, -r * 0.1, P.eye, true, r * 0.12);
                d.rr(x - r * 0.4, y + r * 0.45, r * 0.8, r * 0.3, 0.1, P.dk, { noEdge: true });
                d.line(x - r * 0.3, y + r * 0.6, x + r * 0.3, y + r * 0.6, 0.2, P.bone);
                return;
            case 'beast':
                d.ell(x, y, r * 1.1, r * 0.95, P.skin);
                d.rr(x - r * 0.85, y - r * 0.45, r * 1.7, r * 0.35, r * 0.15, this.shade(P.skin, -0.35), { noEdge: true });
                eyes(0.38, -r * 0.05, P.eye, true);
                d.line(x - r * 0.45, y + r * 0.5, x + r * 0.45, y + r * 0.5, 0.3, P.dk);
                return;
            case 'wolf':
            case 'jackal': {
                const tall = type === 'jackal' ? 1.9 : 1.2;
                [-1, 1].forEach(s => d.poly([[x + s * r * 0.25, y - r * 0.5], [x + s * r * 0.75, y - r * (0.5 + tall)], [x + s * r * 0.95, y - r * 0.2]], P.main));
                d.ell(x, y, r * 0.95, r * 0.85, P.main);
                d.ell(x + r * 0.15, y + r * 0.45, r * 0.55, r * 0.4, P.light);
                d.dot(x + r * 0.15, y + r * 0.3, r * 0.18, P.dk);
                eyes(0.42, -r * 0.15, P.eye, true);
                return;
            }
            case 'lizard':
                [-0.6, 0, 0.6].forEach(o => d.poly([[x + o * r - 0.5, y - r * 0.7], [x + o * r, y - r * 1.5], [x + o * r + 0.5, y - r * 0.7]], P.dark));
                d.ell(x, y, r * 0.95, r * 0.9, P.main);
                d.ell(x, y + r * 0.45, r * 0.6, r * 0.38, P.light, { noEdge: true });
                eyes(0.45, -r * 0.15, P.eye, true);
                return;
            case 'ape':
                d.ell(x, y, r * 1.05, r, P.main);
                d.ell(x, y + r * 0.2, r * 0.72, r * 0.68, P.skin);
                d.rr(x - r * 0.7, y - r * 0.4, r * 1.4, r * 0.3, 0.2, P.dark, { noEdge: true });
                eyes(0.3, -r * 0.1, P.eye, true);
                d.ell(x, y + r * 0.5, r * 0.35, r * 0.15, P.dk, { noEdge: true });
                return;
            case 'bat':
                [-1, 1].forEach(s => d.poly([[x + s * r * 0.2, y - r * 0.5], [x + s * r * 1.1, y - r * 1.6], [x + s * r * 0.95, y - r * 0.1]], P.main));
                d.ell(x, y, r * 0.9, r * 0.85, P.main);
                eyes(0.38, -r * 0.1, P.eye, true);
                [-1, 1].forEach(s => d.poly([[x + s * 0.35, y + r * 0.45], [x + s * 0.15, y + r * 0.95], [x + s * 0.05, y + r * 0.45]], '#ffffff', { noEdge: true }));
                return;
            case 'imp':
                [-1, 1].forEach(s => d.poly([[x + s * r * 0.3, y - r * 0.6], [x + s * r * 0.9, y - r * 1.5], [x + s * r * 0.75, y - r * 0.4]], P.horn));
                d.ell(x, y, r, r * 0.9, P.main);
                eyes(0.38, -r * 0.1, P.eye, true);
                d.line(x - r * 0.45, y + r * 0.35, x + r * 0.45, y + r * 0.35, 0.3, P.dk, x, y + r * 0.75);
                return;
            default: // human
                d.ell(x, y, r * 0.9, r, P.skin);
                d.path(() => { c.g.ellipse(x, y - r * 0.15, r * 0.95, r * 0.9, 0, Math.PI, Math.PI * 2); }, P.hair, [x - r, y - r, x + r, y]);
                eyes(0.35, r * 0.05, '#1c1917', false, r * 0.13);
        }
    },

    // Tête des quadrupèdes (de profil, tournée vers la droite)
    quadHead(c, type, x, y, r) {
        const { d, P } = c;
        const eye = (ex, ey) => d.dot(ex, ey, r * 0.17, P.eye, true);
        switch (type) {
            case 'rat':
                d.ell(x - r * 0.4, y - r * 0.75, r * 0.45, r * 0.5, '#f9a8d4');
                d.poly([[x - r * 0.6, y - r * 0.6], [x + r * 1.7, y + r * 0.15], [x - r * 0.4, y + r * 0.75]], P.main);
                d.ell(x - r * 0.2, y, r * 0.8, r * 0.7, P.main);
                d.dot(x + r * 1.6, y + r * 0.1, r * 0.2, '#f9a8d4');
                eye(x + r * 0.25, y - r * 0.2);
                return;
            case 'rhino':
                d.ell(x, y, r * 1.3, r * 0.95, P.main);
                d.poly([[x + r * 0.7, y - r * 0.2], [x + r * 1.5, y - r * 1.6], [x + r * 1.35, y + r * 0.1]], P.horn);
                d.poly([[x + r * 0.2, y - r * 0.4], [x + r * 0.5, y - r * 1.0], [x + r * 0.7, y - r * 0.4]], P.horn);
                d.ell(x - r * 0.75, y - r * 0.7, r * 0.3, r * 0.45, P.dark);
                eye(x + r * 0.1, y - r * 0.1);
                return;
            case 'stag':
                d.ell(x, y, r * 0.85, r * 0.75, P.main);
                d.ell(x + r * 0.85, y + r * 0.25, r * 0.6, r * 0.4, P.light);
                eye(x + r * 0.15, y - r * 0.2);
                return;
            case 'human':
                this.head(c, 'human', x, y, r);
                return;
            case 'skull':
                d.ell(x, y, r * 1.05, r * 0.85, P.bone);
                d.rr(x, y + r * 0.1, r * 1.5, r * 0.55, r * 0.2, P.bone);
                d.rr(x + r * 0.1, y + r * 0.75, r * 1.2, r * 0.35, r * 0.15, P.bone);
                d.ell(x + r * 0.15, y - r * 0.15, r * 0.32, r * 0.3, P.dk, { noEdge: true });
                eye(x + r * 0.15, y - r * 0.15);
                return;
            case 'beast':
                d.ell(x, y, r, r * 0.9, P.main);
                d.ell(x + r * 0.7, y + r * 0.3, r * 0.55, r * 0.42, P.light);
                eye(x + r * 0.2, y - r * 0.25);
                [0.35, 0.75].forEach(o => d.poly([[x + r * o, y + r * 0.55], [x + r * (o + 0.1), y + r * 0.95], [x + r * (o + 0.2), y + r * 0.55]], '#ffffff', { noEdge: true }));
                return;
            default: { // wolf, hound, jackal
                const tall = type === 'jackal' ? 1.8 : 1.1;
                d.poly([[x - r * 0.65, y - r * 0.4], [x - r * 0.35, y - r * (0.5 + tall)], [x + r * 0.05, y - r * 0.5]], P.dark);
                d.ell(x, y, r * 0.9, r * 0.8, P.main);
                d.rr(x + r * 0.2, y - r * 0.1, r * 1.45, r * 0.75, r * 0.3, P.main);
                d.dot(x + r * 1.6, y + r * 0.05, r * 0.2, P.dk);
                d.line(x + r * 0.5, y + r * 0.62, x + r * 1.4, y + r * 0.62, 0.25, '#ffffff');
                eye(x + r * 0.2, y - r * 0.2);
            }
        }
    },

    // ---------- Silhouettes ----------
    FORMS: {
        biped(c) {
            const { d, L, P, f } = c;
            const cx = 9, gy = 21.4;
            const tw = L.bulk ? 8.6 : L.thin ? 5 : 6.6;
            const ty = L.hunch ? 10.4 : 9;
            const th = L.robe ? 5.6 : 6.8;
            const hr = L.bulk ? 2.7 : 3;
            const hx = cx + (L.hunch ? 1.6 : 0), hy = ty - hr + (L.hunch ? 1.3 : 0.4);
            const aw = L.thin ? 1.1 : L.bulk ? 2.4 : 1.8;
            const armLen = L.hunch ? 7 : 5.8;
            const sway = f ? 0.6 : 0;
            Object.assign(c, {
                cx, gy, tw, ty, th, hx, hy, hr,
                hand: { x: cx + tw / 2 + 0.7, y: ty + armLen + 0.6 - sway },
                off: { x: cx - tw / 2 - 0.7, y: ty + armLen + 0.6 + sway },
                wx: cx, wy: ty + 2
            });
            this.accs(c, 'back');
            if (L.robe) {
                const flare = f ? 0.5 : 0;
                d.poly([[cx - tw / 2, ty + 2], [cx + tw / 2, ty + 2], [cx + tw / 2 + 2.2 + flare, gy], [cx - tw / 2 - 2.2 + flare, gy]], P.cloth);
                d.rr(cx - tw / 2 - 2.2 + flare, gy - 1, tw + 4.4, 1, 0.4, this.shade(P.cloth, -0.35));
            } else {
                const legW = L.thin ? 1.2 : L.bulk ? 2.5 : 2;
                [-1, 1].forEach(s => {
                    const lx = cx + s * tw * 0.24, lift = (s < 0) === !!f ? 0.9 : 0;
                    d.rr(lx - legW / 2, ty + th - 1, legW, gy - (ty + th - 1) - lift, legW * 0.4, L.thin ? P.bone : P.leg);
                    d.ell(lx + 0.4, gy - lift - 0.4, legW * 0.72, 0.62, P.boot);
                });
            }
            const arm = (s, hand) => {
                const ax = cx + s * (tw / 2 + 0.7);
                d.rr(ax - aw / 2, ty + 0.4, aw, hand.y - ty - 0.8, aw * 0.45, L.thin ? P.bone : (L.sleeve || P.main));
                d.ell(ax, hand.y, aw * 0.55, aw * 0.55, P.skin);
            };
            arm(-1, c.off);
            d.rr(cx - tw / 2, ty, tw, th, L.bulk ? 2.2 : 1.6, P.main);
            if (L.thin) {
                d.line(cx, ty + 0.5, cx, ty + th - 0.3, 0.6, P.dark);
                for (let i = 0; i < 3; i++) d.line(cx - tw / 2 + 0.8, ty + 1.4 + i * 1.6, cx + tw / 2 - 0.8, ty + 1.4 + i * 1.6, 0.45, P.dark, cx, ty + 2 + i * 1.6);
            }
            if (L.tabard) d.rr(cx - tw * 0.26, ty + 0.8, tw * 0.52, th + (L.robe ? 0 : 2.2), 0.6, L.tabard);
            if (!L.robe && !L.thin) d.rr(cx - tw / 2, ty + th - 1.7, tw, 1.1, 0.3, '#5b3a1e');
            this.accs(c, 'body');
            this.accs(c, 'offhand');
            this.accs(c, 'prehead');
            const hood = c.acc.includes('hood');
            if (hood) d.ell(hx, hy + 0.3, hr * 0.9, hr * 0.85, P.dk, { noEdge: true });
            this.head(c, L.head || 'human', hx, hy + (hood ? 0.4 : 0), hood ? hr * 0.75 : hr);
            this.accs(c, 'head');
            arm(1, c.hand);
            this.accs(c, 'hand');
        },

        quad(c) {
            const { d, L, P, f } = c;
            const bx = 10, by = 9, gy = 15.4, bw = 6.3 * (L.bulk ? 1.12 : 1);
            const hr = L.bulk ? 2.6 : 2.2;
            Object.assign(c, { cx: bx, gy, tw: bw * 1.6, ty: by - 3.4, th: 6.8, hx: bx + bw + 1.3, hy: by - 2.6, hr, wx: bx - 1, wy: by - 2.5, quad: true });
            this.accs(c, 'back');
            const leg = (x, far, lift) => {
                const col = far ? P.dark : P.main;
                d.rr(x - 0.85, by + 0.8, 1.7, gy - by - 0.8 - lift, 0.7, col);
                d.ell(x + 0.3, gy - lift - 0.3, 1.05, 0.55, this.shade(col, -0.4));
            };
            leg(bx - bw * 0.55 + 1, true, f ? 0.8 : 0);
            leg(bx + bw * 0.55 + 1, true, f ? 0 : 0.8);
            d.ell(bx, by, bw, 3.6, P.main);
            d.ell(bx + 0.5, by + 1.7, bw * 0.75, 1.4, P.light, { noEdge: true });
            leg(bx - bw * 0.55, false, f ? 0 : 0.8);
            leg(bx + bw * 0.55, false, f ? 0.8 : 0);
            this.accs(c, 'body');
            d.ell(bx + bw - 0.3, by - 1.4, 2.1, 2.2, P.main);
            this.accs(c, 'prehead');
            this.quadHead(c, L.head || 'wolf', c.hx, c.hy, hr);
            this.accs(c, 'head');
        },

        flyer(c) {
            const { d, L, P, f } = c;
            const x = 9, y = 8.2;
            Object.assign(c, { cx: x, gy: 12.5, tw: 5, ty: y - 2.4, th: 4.8, hx: x, hy: y - 3.2, hr: 2.2 });
            const up = f ? 3.2 : 0;
            [-1, 1].forEach(s => d.poly([[x + s * 1.2, y - 1], [x + s * 6.5, y - 5.5 + up], [x + s * 8.3, y - 2 + up],
                [x + s * 7, y - 0.2 + up * 0.6], [x + s * 5.4, y + 2], [x + s * 3.6, y + 1], [x + s * 2, y + 2.6]], P.wing));
            this.accs(c, 'back');
            d.ell(x, y, 2.5, 2.6, P.main);
            [-1, 1].forEach(s => d.line(x + s * 0.8, y + 2.2, x + s * 1.1, y + 3.6, 0.5, P.dark));
            this.accs(c, 'body');
            this.head(c, L.head || 'bat', x, c.hy, c.hr);
            this.accs(c, 'head');
        },

        blob(c) {
            const { d, g, P, f } = c;
            const sq = f ? 1.06 : 1;
            Object.assign(c, { cx: 7, gy: 12.4, tw: 9, ty: 5.5, th: 6, hx: 7, hy: 4.2, hr: 2.6 });
            this.accs(c, 'back');
            const top = 3.6 + (f ? 0.5 : 0), half = 5.6 * sq;
            d.path(() => {
                g.moveTo(7 - half, 12.4);
                g.bezierCurveTo(7 - half - 0.8, 6, 7 - half * 0.6, top, 7, top);
                g.bezierCurveTo(7 + half * 0.6, top, 7 + half + 0.8, 6, 7 + half, 12.4);
                g.closePath();
            }, P.main, [1, top, 13, 12.4]);
            d.ell(5, top + 2.2, 1.5, 0.9, 'rgba(255,255,255,0.45)', { noEdge: true });
            [-1, 1].forEach(s => {
                d.ell(7 + s * 1.8, 8, 1.05, 1.15, '#ffffff', { noEdge: true });
                d.dot(7 + s * 1.8 + 0.3, 8.2, 0.5, '#1c1917');
            });
            d.line(5.6, 10.4, 8.4, 10.4, 0.35, P.dk, 7, 11.2);
            this.accs(c, 'body');
            this.accs(c, 'head');
        },

        orb(c) {
            const { d, g, P, f } = c;
            const x = 6, y = 6.6, r = 4.2 + (f ? 0.25 : 0);
            Object.assign(c, { cx: x, gy: 12.5, tw: 7, ty: 3, th: 7, hx: x, hy: 3, hr: 2 });
            if (d.hd) {
                const gr = g.createRadialGradient(x - 1.4, y - 1.6, 0.3, x, y, r);
                gr.addColorStop(0, '#ffffff');
                gr.addColorStop(0.35, P.light);
                gr.addColorStop(1, P.dark);
                g.beginPath();
                g.arc(x, y, r, 0, Math.PI * 2);
                g.fillStyle = gr;
                g.shadowColor = P.main;
                g.shadowBlur = 1.5 * Art.RES;
                g.fill();
                g.shadowBlur = 0;
            } else d.ell(x, y, r, r, P.main);
            d.ell(x, y, 1.4, 1.4, P.dk, { noEdge: true });
            d.dot(x, y, 0.7, P.eye, true);
            c.g.save();
            c.g.globalAlpha = 0.9;
            d.line(x - r - 0.8, y + 0.3, x + r + 0.8, y - 0.3, 0.35, P.rune, x, y + 2.2);
            c.g.restore();
            this.accs(c, 'body');
            this.accs(c, 'head');
        },

        wisp(c) {
            const { d, g, P, f } = c;
            const x = 6;
            Object.assign(c, { cx: x, gy: 13.5, tw: 6, ty: 5, th: 6, hx: x, hy: 7, hr: 2 });
            const fl = f ? 0.8 : -0.8;
            d.path(() => {
                g.moveTo(x + fl, 0.8);
                g.quadraticCurveTo(x + 5.2, 6, x + 3.6, 10);
                g.quadraticCurveTo(x, 13, x - 3.6, 10);
                g.quadraticCurveTo(x - 5.2, 6, x + fl, 0.8);
            }, P.main, [1, 1, 11, 13]);
            d.path(() => {
                g.moveTo(x - fl * 0.5, 4);
                g.quadraticCurveTo(x + 2.8, 8, x + 1.8, 10);
                g.quadraticCurveTo(x, 11.4, x - 1.8, 10);
                g.quadraticCurveTo(x - 2.8, 8, x - fl * 0.5, 4);
            }, P.light, [3, 4, 9, 11], { noEdge: true });
            [-1, 1].forEach(s => d.dot(x + s * 1.1, 8.3, 0.55, P.dk));
            d.dot(x + 3 * (f ? -1 : 1), 12.6, 0.4, P.light, true);
            this.accs(c, 'body');
        },

        skullhead(c) {
            const { d, f } = c;
            Object.assign(c, { cx: 6, gy: 11.5, tw: 6, ty: 4, th: 6, hx: 6, hy: 6.3, hr: 3.6 });
            const up = f ? 1.6 : 0;
            if (c.acc.includes('wings')) [-1, 1].forEach(s => d.poly([[6 + s * 2.5, 6], [6 + s * 6, 2.5 + up], [6 + s * 5, 6.5 + up * 0.5], [6 + s * 3, 7.6]], c.P.wing));
            this.head(c, 'skull', 6, 6.3 - (f ? 0.3 : 0), 3.6);
            this.accs(c, 'head');
        },

        ghost(c) {
            const { d, g, L, P, f } = c;
            Object.assign(c, { cx: 8, gy: 19.5, tw: 9, ty: 9, th: 7, hx: 8, hy: 6.6, hr: 2.9, hand: { x: 13.6, y: 12.2 }, off: { x: 2.4, y: 12.2 } });
            this.accs(c, 'back');
            const body = () => {
                d.path(() => {
                    g.moveTo(2.3, 18.4);
                    g.lineTo(2.3, 8);
                    g.quadraticCurveTo(2.3, 1.2, 8, 1.2);
                    g.quadraticCurveTo(13.7, 1.2, 13.7, 8);
                    g.lineTo(13.7, 18.4);
                    for (let i = 0; i < 4; i++) {
                        const x0 = 13.7 - i * 2.85;
                        g.quadraticCurveTo(x0 - 1.4, f ? 16.2 : 20.4, x0 - 2.85, 18.4);
                    }
                    g.closePath();
                }, P.main, [2, 1, 14, 19]);
                [-1, 1].forEach(s => d.ell(8 + s * 5.4, 11.5, 1.2, 2.6, P.main, { rot: s * 0.4 }));
            };
            if (d.hd) d.alpha(0.82, body); else body();
            this.accs(c, 'body');
            this.accs(c, 'prehead');
            this.head(c, L.head || 'hollow', 8, 6.6, 2.9);
            this.accs(c, 'head');
            this.accs(c, 'hand');
        },

        spider(c) {
            const { d, L, P, f } = c;
            Object.assign(c, { cx: 9, gy: 11.6, tw: 9, ty: 3, th: 6, hx: 14.6, hy: 6.9, hr: 1.6 });
            const tx = 12, ty = 7;
            for (let i = 0; i < 4; i++) {
                [1, 0].forEach(far => {
                    const lift = ((i + far + f) % 2) * 0.8;
                    const fx = tx - 6 + i * 3.6 + (far ? -1 : 0), kx = tx - 3 + i * 2 + (far ? -0.6 : 0);
                    d.line(tx, ty, kx, 2.4 + far * 0.6, 0.55, far ? P.dark : P.main);
                    d.line(kx, 2.4 + far * 0.6, fx, 11.4 - lift, 0.5, far ? P.dark : P.main);
                });
            }
            d.ell(6.4, 6.2, 4.4, 3.6, P.main);
            d.poly([[6.4, 4.6], [7.2, 6.2], [6.4, 7.8], [5.6, 6.2]], L.mark || '#dc2626', { noEdge: true });
            d.ell(tx, ty, 2.5, 2.1, P.dark);
            d.ell(14.4, 7.2, 1.7, 1.45, P.main);
            [[14.6, 6.5], [15.4, 6.8], [15.2, 7.6], [14.2, 7.2]].forEach(([x, y]) => d.dot(x, y, 0.3, P.eye, true));
            d.line(15.5, 8.2, 15.9, 9.3, 0.4, '#ffffff');
            this.accs(c, 'body');
            this.accs(c, 'head');
        },

        insect(c) {
            const { d, P, f } = c;
            Object.assign(c, { cx: 7, gy: 9.6, tw: 8, ty: 2.5, th: 6, hx: 11.6, hy: 5.6, hr: 1.7 });
            for (let i = 0; i < 3; i++) [0, 1].forEach(far => {
                const lift = ((i + far + f) % 2) * 0.6;
                d.line(4.5 + i * 2.5, 6.5, 3.2 + i * 2.9 + far * 0.5, 9.4 - lift, 0.5, far ? P.dark : P.dk);
            });
            d.ell(11.6, 6.2, 1.9, 1.6, P.dark);
            d.line(12.6, 5.4, 13.6, 2.6, 0.7, P.dark, 13.9, 4.2);
            d.ell(6.6, 5.4, 5, 3.4, P.main);
            d.line(6.6, 2.1, 6.6, 8.7, 0.35, P.dk);
            d.ell(4.8, 4, 1.5, 0.8, 'rgba(255,255,255,0.4)', { noEdge: true });
            d.dot(12.4, 5.9, 0.35, P.eye, true);
            this.accs(c, 'body');
        },

        scorpion(c) {
            const { d, P, f } = c;
            Object.assign(c, { cx: 10, gy: 14.5, tw: 10, ty: 6.5, th: 5, hx: 16, hy: 9, hr: 1.8 });
            for (let i = 0; i < 4; i++) d.line(8 + i * 2, 10, 6.6 + i * 2.4, 14.2 - ((i + f) % 2) * 0.7, 0.55, P.dark);
            const seg = [[5.6, 9.6, 1.9], [3.6, 7.6, 1.7], [3.1, 5, 1.55], [4, 2.8, 1.4], [6, 1.6, 1.25]];
            seg.forEach(([x, y, r]) => d.ell(x + (f ? 0.3 : 0), y, r, r, P.main));
            d.poly([[7, 1.2], [9.2, 2.2], [7.2, 2.6]], P.eye);
            d.ell(10, 10, 4.3, 2.4, P.main);
            [9, 11].forEach(x => d.line(x, 8, x, 12, 0.3, P.dark));
            d.ell(15.4, 10.4, 1.8, 1.5, P.main);
            [[0, 1], [1, -1]].forEach(([k, s]) => {
                const y = 11.6 + k * 0.5;
                d.line(15.4, y, 18.4, y - 1.2 * s - 1.6, 0.8, P.dark);
                d.ell(19.4, y - 1.2 * s - 1.8, 1.6, 0.9, P.main, { rot: -0.4 });
            });
            [-0.4, 0.4].forEach(o => d.dot(16 + o, 9.6, 0.3, P.eye, true));
            this.accs(c, 'body');
            this.accs(c, 'head');
        },

        serpent(c) {
            const { d, L, P, f } = c;
            const sway = f ? 0.5 : 0;
            Object.assign(c, {
                cx: 9 + sway, gy: 21.4, tw: 5.2, ty: 8, th: 8, hx: 9 + sway, hy: 5.2, hr: 2.8, wx: 9, wy: 9,
                hand: { x: 13.4 + sway, y: 12.6 }, off: { x: 4.6 + sway, y: 12.6 }
            });
            this.accs(c, 'back');
            d.ell(9, 19.6, 7.6, 2.3, P.dark);
            d.ell(14.8, 18.2, 2.2, 1.2, P.main);
            d.ell(8.2, 17, 5.6, 2.2, P.main);
            d.rr(6.4 + sway, 7.8, 5.2, 9.6, 2.5, P.main);
            for (let i = 0; i < 4; i++) d.rr(7.7 + sway, 9.2 + i * 2, 2.6, 1.1, 0.4, P.light, { noEdge: true });
            [-1, 1].forEach(s => {
                const h = s < 0 ? c.off : c.hand;
                d.line(9 + sway + s * 2.3, 9, h.x, h.y, 1.6, L.sleeve || P.main);
                d.ell(h.x, h.y, 0.9, 0.9, P.skin);
            });
            this.accs(c, 'body');
            this.accs(c, 'prehead');
            this.head(c, L.head || 'lizard', c.hx, c.hy, c.hr);
            this.accs(c, 'head');
            this.accs(c, 'hand');
        },

        tree(c) {
            const { d, g, L, P, f } = c;
            const bark = L.bark || '#5b3a1e', leaf = P.main, sway = f ? 0.7 : -0.3;
            Object.assign(c, { cx: 10, gy: 23.5, tw: 7, ty: 9, th: 10, hx: 10, hy: 4, hr: 3 });
            [[-1, 4.5], [1, 4.5], [-0.3, 2.5]].forEach(([s, w]) => d.line(10 + s * 1.5, 20, 10 + s * w + s, 23.4, 1.3, this.shade(bark, -0.2)));
            d.path(() => {
                g.moveTo(6.4, 23);
                g.quadraticCurveTo(7.6, 15, 7.8, 9);
                g.lineTo(12.2, 9);
                g.quadraticCurveTo(12.4, 15, 13.6, 23);
                g.closePath();
            }, bark, [6, 9, 14, 23]);
            [-1, 1].forEach(s => {
                const ex = 10 + s * 7.5, ey = 9.5 + s * sway;
                d.line(10 + s * 1.8, 12, ex, ey, 1.2, bark, 10 + s * 5, 13.5);
                d.line(ex, ey, ex + s * 1.2, ey - 1.6, 0.6, bark);
                d.ell(ex, ey - 0.6, 1.8, 1.3, leaf);
            });
            [[6, 6.5, 3.6], [14, 6.5, 3.6], [10, 4, 4.4], [8, 8.5, 2.6], [12.5, 8.5, 2.6]].forEach(([x, y, r]) => d.ell(x + sway * 0.3, y, r, r * 0.85, leaf));
            d.ell(10, 13.6, 2.2, 1, P.dk, { noEdge: true });
            [-1, 1].forEach(s => d.dot(10 + s * 1, 13.5, 0.45, P.eye, true));
            d.path(() => { g.ellipse(10, 17, 1.4, 0.8, 0, 0, Math.PI * 2); }, P.dk, [8, 16, 12, 18], { noEdge: true });
            this.accs(c, 'body');
            this.accs(c, 'head');
        }
    },

    // ---------- Accessoires ----------
    ACC: {
        // Dos
        wings: { phase: 'back', fn(c) {
            const { d, P, f } = c, x = c.wx, y = c.wy, up = f ? 1.6 : 0;
            [-1, 1].forEach(s => d.poly([[x + s * 1, y], [x + s * 6.5, y - 6 + up], [x + s * 8.4, y - 2.5 + up], [x + s * 7, y - 0.5 + up],
                [x + s * 5.6, y + 2.6], [x + s * 3.8, y + 1.6], [x + s * 2, y + 3.6]], P.wing));
        } },
        featherwings: { phase: 'back', fn(c) {
            const { d, P, f } = c, x = c.wx, y = c.wy, up = f ? 1.4 : 0;
            [-1, 1].forEach(s => {
                d.poly([[x + s * 1, y - 1], [x + s * 8, y - 6.5 + up], [x + s * 8.6, y - 3 + up], [x + s * 4, y + 3]], P.wing);
                for (let i = 0; i < 3; i++) d.line(x + s * (3 + i * 1.7), y + 1 - i * 1.4, x + s * (5 + i * 1.6), y - 2.4 - i * 1.4 + up, 0.55, P.light);
            });
        } },
        cape: { phase: 'back', fn(c) {
            const { d, L, P, cx, ty, tw, gy, f } = c, fl = f ? 0.7 : 0;
            d.poly([[cx - tw / 2 + 0.3, ty + 0.4], [cx + tw / 2 - 0.3, ty + 0.4], [cx + tw / 2 + 1.4 - fl, gy - 1], [cx - tw / 2 - 1.8 - fl, gy - 0.6]], L.tabard ? Art.shade(L.tabard, -0.3) : Art.shade(P.cloth, -0.25));
        } },
        tail: { phase: 'back', fn(c) {
            const { d, P, f } = c;
            if (c.quad) d.line(c.cx - 6, c.ty + 3.5, c.cx - 9.5, c.ty + (f ? 0.5 : 1.8), 1.1, P.main, c.cx - 9, c.ty + 4.6);
            else d.line(c.cx - c.tw / 2 + 0.5, c.ty + c.th - 0.5, c.cx - c.tw / 2 - 4, c.gy - 0.6, 1.6, P.main, c.cx - c.tw / 2 - 3.5, c.ty + c.th + 1);
        } },
        quiver: { phase: 'back', fn(c) {
            const { d, cx, ty, tw } = c;
            d.rr(cx - tw / 2 - 0.4, ty - 1.4, 1.8, 5.2, 0.5, '#78350f');
            [0, 0.8].forEach(o => d.line(cx - tw / 2 + o, ty - 1.4, cx - tw / 2 + o - 0.3, ty - 2.8, 0.4, '#e5e7eb'));
        } },
        spikes: { phase: 'back', fn(c) {
            const { d, P, cx, ty, tw } = c;
            const col = Art.shade(P.horn, -0.1);
            if (c.quad) for (let i = 0; i < 5; i++) { const x = cx - 4 + i * 2; d.poly([[x - 0.8, ty + 0.8], [x, ty - 1.2], [x + 0.8, ty + 0.8]], col); }
            else [-1, 1].forEach(s => [0, 1].forEach(k => { const x = cx + s * (tw / 2 - 0.4 - k * 1.5); d.poly([[x - 0.7, ty + 0.6], [x + s * 0.4, ty - 1.6 + k * 0.5], [x + 0.7, ty + 0.6]], col); }));
        } },
        // Corps
        chains: { phase: 'body', fn(c) {
            const { d, cx, ty, tw, th } = c;
            for (let i = 0; i <= 5; i++) d.ell(cx - tw / 2 + 0.6 + (tw - 1.2) * i / 5, ty + 1 + (th - 2) * i / 5, 0.55, 0.4, i % 2 ? '#6b7280' : '#9ca3af', { rot: 0.8 });
            if (c.hand) for (let i = 1; i <= 3; i++) d.ell(c.off.x, c.off.y + i * 0.9, 0.4, 0.5, '#9ca3af');
        } },
        shackles: { phase: 'body', fn(c) {
            if (!c.hand) return;
            [c.hand, c.off].forEach(h => c.d.rr(h.x - 1.1, h.y - 1.5, 2.2, 0.9, 0.3, '#6b7280'));
        } },
        stitches: { phase: 'body', fn(c) {
            const { d, cx, ty, tw, th } = c;
            d.line(cx - tw / 2 + 0.8, ty + th * 0.35, cx + tw / 2 - 0.8, ty + th * 0.6, 0.35, '#1c1917');
            for (let i = 0; i < 4; i++) {
                const x = cx - tw / 2 + 1.4 + i * (tw - 2.8) / 3, y = ty + th * (0.38 + i * 0.07);
                d.line(x - 0.4, y - 0.6, x + 0.4, y + 0.6, 0.3, '#1c1917');
            }
        } },
        runes: { phase: 'body', fn(c) {
            const { d, P, cx, ty, th, f } = c, y = ty + th * 0.45;
            d.alpha(f ? 0.75 : 1, () => {
                d.line(cx - 1.1, y, cx, y - 1.2, 0.35, P.rune);
                d.line(cx, y - 1.2, cx + 1.1, y, 0.35, P.rune);
                d.line(cx + 1.1, y, cx, y + 1.2, 0.35, P.rune);
                d.line(cx, y + 1.2, cx - 1.1, y, 0.35, P.rune);
                d.dot(cx, y, 0.45, P.rune, true);
            });
        } },
        bandage: { phase: 'body', fn(c) {
            const { d, W, H } = c;
            d.over(() => { for (let y = 0; y < H; y += 1.4) d.line(0, y, W, y + 0.7, 0.5, 'rgba(239,230,207,0.8)'); });
        } },
        stone: { phase: 'body', fn(c) {
            const { d, cx, ty, tw, th } = c;
            d.over(() => {
                d.line(cx - tw / 2 + 1, ty + 1, cx - 0.4, ty + th * 0.5, 0.35, 'rgba(0,0,0,0.55)');
                d.line(cx - 0.4, ty + th * 0.5, cx + 0.6, ty + th - 0.8, 0.3, 'rgba(0,0,0,0.55)');
                d.line(cx + tw / 2 - 1, ty + 1.4, cx + 1.4, ty + th * 0.35, 0.3, 'rgba(0,0,0,0.55)');
            });
        } },
        pauldrons: { phase: 'body', fn(c) {
            const { d, cx, ty, tw } = c;
            [-1, 1].forEach(s => d.ell(cx + s * (tw / 2 + 0.3), ty + 0.8, 1.9, 1.35, '#cbd5e1'));
        } },
        leaves: { phase: 'body', fn(c) {
            const { d, cx, ty, tw } = c;
            [-1, 1].forEach(s => { d.ell(cx + s * (tw / 2), ty + 0.6, 1.6, 1.1, '#4d7c0f'); d.ell(cx + s * (tw / 2 - 1), ty + 1.4, 1.1, 0.8, '#84cc16'); });
        } },
        keys: { phase: 'body', fn(c) {
            const { d, cx, ty, tw, th } = c, x = cx - tw / 2 + 1.4, y = ty + th - 0.6;
            d.ell(x, y, 0.8, 0.8, '#ca8a04', { noEdge: true });
            d.line(x, y + 0.6, x - 0.2, y + 2, 0.4, '#facc15');
            d.line(x + 0.5, y + 0.5, x + 0.8, y + 1.8, 0.4, '#facc15');
        } },
        arms4: { phase: 'body', fn(c) {
            const { d, P, cx, ty, tw } = c;
            [-1, 1].forEach(s => {
                const x = cx + s * (tw / 2 + 1.6);
                d.line(cx + s * tw / 2, ty + 3, x, ty + 6.5, 1.6, P.main);
                d.ell(x, ty + 6.8, 0.9, 0.9, P.skin);
            });
        } },
        armor: { phase: 'body', fn(c) {
            const { d, cx, ty, tw } = c;
            for (let i = 0; i < 3; i++) d.ell(cx - 3 + i * 3, ty + 1.5, 1.7, 1.2, '#a8a29e');
        } },
        heads3: { phase: 'prehead', fn(c) {
            const { hx, hy, hr } = c;
            [[-1.6, -1.8], [-2.6, 0.8]].forEach(([dx, dy]) => Art.quadHead(c, c.L.head || 'wolf', hx + dx, hy + dy, hr * 0.85));
        } },
        // Avant la tête
        hair: { phase: 'prehead', fn(c) {
            const { d, P, hx, hy, hr, f } = c;
            d.poly([[hx - hr, hy - hr * 0.3], [hx + hr, hy - hr * 0.3], [hx + hr * 1.5 + (f ? 0.6 : 0), hy + hr * 2.6], [hx - hr * 1.5 - (f ? 0.6 : 0), hy + hr * 2.6]], P.hair);
        } },
        cobra: { phase: 'prehead', fn(c) {
            const { d, P, hx, hy, hr } = c;
            d.ell(hx, hy + 0.6, hr * 1.8, hr * 1.5, P.dark);
            d.ell(hx, hy + 0.6, hr * 1.2, hr * 1.1, P.light, { noEdge: true });
        } },
        nemes: { phase: 'prehead', fn(c) {
            const { d, hx, hy, hr } = c;
            d.poly([[hx - hr * 1.05, hy - hr * 0.5], [hx + hr * 1.05, hy - hr * 0.5], [hx + hr * 1.5, hy + hr * 1.8], [hx - hr * 1.5, hy + hr * 1.8]], '#facc15');
            [-1, 1].forEach(s => [0.5, 1.1].forEach(k => d.line(hx + s * hr * 1.05, hy + hr * k, hx + s * hr * 1.45, hy + hr * k, 0.4, '#1d4ed8')));
        } },
        feathers: { phase: 'prehead', fn(c) {
            const { d, hx, hy, hr } = c;
            ['#dc2626', '#facc15', '#16a34a', '#facc15', '#dc2626'].forEach((col, i) => {
                const a = -Math.PI / 2 + (i - 2) * 0.38;
                d.line(hx, hy - hr * 0.3, hx + Math.cos(a) * hr * 2.3, hy - hr * 0.3 + Math.sin(a) * hr * 2.3, 0.9, col);
            });
        } },
        // Tête
        hood: { phase: 'head', fn(c) {
            const { d, P, hx, hy, hr } = c;
            d.path(() => {
                c.g.ellipse(hx, hy + 0.2, hr * 1.25, hr * 1.2, 0, Math.PI * 1.02, Math.PI * 1.98);
                c.g.lineTo(hx + hr * 0.9, hy + hr * 0.9);
                c.g.quadraticCurveTo(hx + hr * 0.75, hy - hr * 0.4, hx, hy - hr * 0.55);
                c.g.quadraticCurveTo(hx - hr * 0.75, hy - hr * 0.4, hx - hr * 0.9, hy + hr * 0.9);
                c.g.closePath();
            }, P.cloth, [hx - hr, hy - hr, hx + hr, hy + hr]);
        } },
        helm: { phase: 'head', fn(c) {
            const { d, P, hx, hy, hr } = c;
            d.ell(hx, hy, hr * 1.05, hr * 1.05, '#94a3b8');
            d.rr(hx - hr * 0.75, hy - 0.2, hr * 1.5, 0.6, 0.2, P.dk, { noEdge: true });
            [-1, 1].forEach(s => d.dot(hx + s * hr * 0.35, hy + 0.1, 0.3, P.eye, true));
            d.line(hx, hy - hr * 1.05, hx, hy - hr * 0.3, 0.5, '#cbd5e1');
        } },
        helmOpen: { phase: 'head', fn(c) {
            const { d, hx, hy, hr } = c;
            d.path(() => { c.g.ellipse(hx, hy - hr * 0.05, hr * 1.02, hr * 1.02, 0, Math.PI, Math.PI * 2); c.g.closePath(); }, '#94a3b8', [hx - hr, hy - hr, hx + hr, hy]);
            d.rr(hx - hr * 1.05, hy - hr * 0.2, hr * 2.1, 0.7, 0.3, '#64748b');
            d.line(hx, hy - hr * 0.2, hx, hy + hr * 0.35, 0.45, '#64748b');
        } },
        plume: { phase: 'head', fn(c) {
            const { d, hx, hy, hr, f } = c;
            d.line(hx, hy - hr, hx - hr * 1.2, hy - hr * 2 + (f ? 0.4 : 0), 1, '#dc2626', hx - hr * 0.2, hy - hr * 2.2);
        } },
        wizard: { phase: 'head', fn(c) {
            const { d, P, hx, hy, hr } = c;
            d.ell(hx, hy - hr * 0.6, hr * 1.4, hr * 0.35, P.cloth);
            d.poly([[hx - hr * 1.0, hy - hr * 0.65], [hx + hr * 1.0, hy - hr * 0.65], [hx + hr * 0.6, hy - hr * 3.1]], P.cloth);
            d.rr(hx - hr * 0.95, hy - hr * 1.05, hr * 1.9, 0.6, 0.2, P.gold);
        } },
        mask: { phase: 'head', fn(c) {
            const { d, P, hx, hy, hr } = c;
            d.ell(hx, hy + hr * 0.1, hr * 0.85, hr * 0.85, '#eab308');
            [-1, 1].forEach(s => { d.ell(hx + s * hr * 0.35, hy, hr * 0.2, hr * 0.14, P.dk, { noEdge: true }); d.dot(hx + s * hr * 0.35, hy, 0.25, P.eye, true); });
            d.line(hx - hr * 0.3, hy + hr * 0.5, hx + hr * 0.3, hy + hr * 0.5, 0.3, '#78350f');
        } },
        crown: { phase: 'head', fn(c) {
            const { d, hx, hy, hr } = c, b = hy - hr * 0.7, w = hr * 0.85;
            d.poly([[hx - w, b], [hx - w, b - 1.7], [hx - w * 0.5, b - 0.8], [hx, b - 2.2], [hx + w * 0.5, b - 0.8], [hx + w, b - 1.7], [hx + w, b]], '#facc15');
            d.dot(hx, b - 0.6, 0.4, '#dc2626', true);
        } },
        horns: { phase: 'head', fn(c) {
            const { d, P, hx, hy, hr } = c;
            [-1, 1].forEach(s => d.path(() => {
                c.g.moveTo(hx + s * hr * 0.35, hy - hr * 0.7);
                c.g.quadraticCurveTo(hx + s * hr * 1.7, hy - hr * 0.9, hx + s * hr * 1.4, hy - hr * 2.1);
                c.g.quadraticCurveTo(hx + s * hr * 1.2, hy - hr * 1.2, hx + s * hr * 0.85, hy - hr * 0.35);
                c.g.closePath();
            }, P.horn, [hx - hr * 2, hy - hr * 2, hx + hr * 2, hy]));
        } },
        antlers: { phase: 'head', fn(c) {
            const { d, hx, hy, hr } = c, col = c.L.antler || '#d6c7a1';
            [-1, 1].forEach(s => {
                const bx = hx + s * hr * 0.4, by = hy - hr * 0.7;
                d.line(bx, by, bx + s * hr * 1.6, by - hr * 1.8, 0.55, col);
                d.line(bx + s * hr * 0.6, by - hr * 0.7, bx + s * hr * 0.2, by - hr * 1.6, 0.45, col);
                d.line(bx + s * hr * 1.1, by - hr * 1.2, bx + s * hr * 1.9, by - hr * 1.0, 0.45, col);
                d.line(bx + s * hr * 1.3, by - hr * 1.5, bx + s * hr * 1.1, by - hr * 2.4, 0.4, col);
            });
        } },
        ears: { phase: 'head', fn(c) {
            const { d, P, hx, hy, hr } = c;
            [-1, 1].forEach(s => d.poly([[hx + s * hr * 0.4, hy - hr * 0.7], [hx + s * hr * 1.2, hy - hr * 1.6], [hx + s * hr * 0.95, hy - hr * 0.3]], P.main));
        } },
        tusks: { phase: 'head', fn(c) {
            const { d, hx, hy, hr } = c;
            [-1, 1].forEach(s => d.poly([[hx + s * hr * 0.35, hy + hr * 0.45], [hx + s * hr * 0.6, hy - hr * 0.15], [hx + s * hr * 0.6, hy + hr * 0.55]], '#f5f5f4'));
        } },
        halo: { phase: 'head', fn(c) {
            const { g, d, hx, hy, hr } = c;
            g.beginPath();
            g.ellipse(hx, hy - hr * 1.5, hr * 1.1, hr * 0.35, 0, 0, Math.PI * 2);
            g.strokeStyle = '#fde047';
            g.lineWidth = d.hd ? 0.5 : 1;
            if (d.hd) { g.shadowColor = '#fde047'; g.shadowBlur = 0.8 * Art.RES; }
            g.stroke();
            g.shadowBlur = 0;
        } },
        eyes3: { phase: 'head', fn(c) {
            const { d, P, hx, hy, hr } = c;
            d.dot(hx, hy - hr * 0.5, hr * 0.2, P.eye, true);
        } },
        fire: { phase: 'head', fn(c) {
            const { d, g, hx, hy, hr, f } = c, top = hy - hr * (c.quad ? 1 : 0.8), fl = f ? 0.6 : -0.6;
            const flame = (col, k) => d.path(() => {
                g.moveTo(hx - hr * 0.8 * k, top + 0.6);
                g.quadraticCurveTo(hx - hr * 0.6 * k, top - hr * 1.2 * k, hx + fl * k, top - hr * 2 * k);
                g.quadraticCurveTo(hx + hr * 0.6 * k, top - hr * 1.2 * k, hx + hr * 0.8 * k, top + 0.6);
                g.closePath();
            }, col, [hx - hr, top - hr * 2, hx + hr, top], { noEdge: true });
            flame('#f97316', 1);
            flame('#fde047', 0.55);
        } },
        // Main gauche
        shield: { phase: 'offhand', fn(c) {
            const { d, L, off } = c, col = L.shield || '#64748b';
            d.path(() => {
                c.g.moveTo(off.x - 2, off.y - 3.2);
                c.g.lineTo(off.x + 2, off.y - 3.2);
                c.g.lineTo(off.x + 2, off.y - 0.2);
                c.g.quadraticCurveTo(off.x + 1.6, off.y + 2.2, off.x, off.y + 3);
                c.g.quadraticCurveTo(off.x - 1.6, off.y + 2.2, off.x - 2, off.y - 0.2);
                c.g.closePath();
            }, col, [off.x - 2, off.y - 3, off.x + 2, off.y + 3]);
            d.ell(off.x, off.y - 0.4, 0.8, 0.8, '#facc15');
        } },
        // Main droite (armes)
        sword: { phase: 'hand', fn(c) { Art.blade(c, 7, 0.9); } },
        greatsword: { phase: 'hand', fn(c) { Art.blade(c, 10, 1.3); } },
        dagger: { phase: 'hand', fn(c) { Art.blade(c, 3.6, 0.7); } },
        axe: { phase: 'hand', fn(c) {
            const { d, hand: h } = c;
            d.line(h.x, h.y + 1, h.x + 0.8, h.y - 7, 0.7, '#7c4a1e');
            d.path(() => { c.g.moveTo(h.x + 0.6, h.y - 6.6); c.g.quadraticCurveTo(h.x + 4.4, h.y - 7.4, h.x + 3.6, h.y - 3.6); c.g.lineTo(h.x + 0.7, h.y - 4.4); c.g.closePath(); }, '#cbd5e1', [h.x, h.y - 7, h.x + 4, h.y - 3]);
        } },
        cleaver: { phase: 'hand', fn(c) {
            const { d, hand: h } = c;
            d.line(h.x, h.y + 0.6, h.x, h.y - 1.4, 0.7, '#7c4a1e');
            d.rr(h.x - 0.6, h.y - 6.6, 3, 5.4, 0.4, '#cbd5e1');
            d.line(h.x + 2.3, h.y - 6.2, h.x + 2.3, h.y - 1.6, 0.3, '#7f1d1d');
        } },
        club: { phase: 'hand', fn(c) {
            const { d, hand: h } = c;
            d.line(h.x, h.y + 0.8, h.x + 1.2, h.y - 6, 1.6, '#78350f');
            [[0.4, -4], [1.6, -5.2], [0.6, -6]].forEach(([dx, dy]) => d.dot(h.x + dx, h.y + dy, 0.35, '#d6d3d1'));
        } },
        spear: { phase: 'hand', fn(c) {
            const { d, hand: h } = c;
            d.line(h.x - 0.4, h.y + 4, h.x + 1.6, h.y - 10, 0.6, '#7c4a1e');
            d.poly([[h.x + 1.1, h.y - 9.6], [h.x + 2.3, h.y - 12.4], [h.x + 2.2, h.y - 9.4]], '#e5e7eb');
        } },
        scythe: { phase: 'hand', fn(c) {
            const { d, hand: h } = c;
            d.line(h.x, h.y + 4, h.x + 0.6, h.y - 10, 0.6, '#3f3a36');
            d.path(() => { c.g.moveTo(h.x + 0.6, h.y - 10); c.g.quadraticCurveTo(h.x - 3, h.y - 11.6, h.x - 5.6, h.y - 8); c.g.quadraticCurveTo(h.x - 2.4, h.y - 9.6, h.x + 0.4, h.y - 8.8); c.g.closePath(); }, '#d4d4d8', [h.x - 6, h.y - 11, h.x + 1, h.y - 8]);
        } },
        staff: { phase: 'hand', fn(c) { Art.staff(c, 'orb'); } },
        skullstaff: { phase: 'hand', fn(c) { Art.staff(c, 'skull'); } },
        ankh: { phase: 'hand', fn(c) { Art.staff(c, 'ankh'); } },
        orb: { phase: 'hand', fn(c) {
            const { d, P, hand: h } = c;
            d.ell(h.x + 0.4, h.y - 1.6, 1.3, 1.3, P.orb);
            d.dot(h.x + 0.4, h.y - 1.6, 0.6, '#ffffff', true);
        } },
        bow: { phase: 'hand', fn(c) {
            const { g, d, hand: h } = c;
            g.beginPath();
            g.arc(h.x - 1.6, h.y - 1, 4.6, -1.05, 1.05);
            g.strokeStyle = '#a16207';
            g.lineWidth = d.hd ? 0.6 : 1;
            g.stroke();
            d.line(h.x - 1.6 + 4.6 * Math.cos(-1.05), h.y - 1 + 4.6 * Math.sin(-1.05), h.x - 1.6 + 4.6 * Math.cos(1.05), h.y - 1 + 4.6 * Math.sin(1.05), 0.2, '#e5e7eb');
        } },
        crossbow: { phase: 'hand', fn(c) {
            const { d, hand: h } = c;
            d.rr(h.x - 1, h.y - 1.6, 5.4, 1.1, 0.3, '#78350f');
            d.line(h.x + 3.6, h.y - 3.8, h.x + 3.6, h.y + 0.8, 0.6, '#57534e', h.x + 4.8, h.y - 1.5);
        } },
        blowgun: { phase: 'hand', fn(c) {
            const { d, hand: h } = c;
            d.line(h.x - 2, h.y - 0.4, h.x + 6, h.y - 2.4, 0.6, '#65a30d');
        } },
        claws: { phase: 'hand', fn(c) {
            const { d, hand: h, off } = c;
            [h, off].forEach(p => [-0.6, 0, 0.6].forEach(o => d.line(p.x + o, p.y + 0.4, p.x + o + 0.5, p.y + 1.8, 0.3, '#f5f5f4')));
        } }
    },

    blade(c, len, w) {
        const { d, hand: h } = c;
        d.line(h.x, h.y - 0.6, h.x + len * 0.18, h.y - len, w, '#e5e7eb');
        d.line(h.x - 1.3, h.y - 0.8, h.x + 1.3, h.y - 0.6, 0.6, '#a16207');
        d.line(h.x, h.y + 0.9, h.x, h.y - 0.4, 0.6, '#5b3a1e');
    },

    staff(c, top) {
        const { d, P, hand: h } = c;
        d.line(h.x, h.y + 4.5, h.x + 0.4, h.y - 8, 0.6, top === 'ankh' ? '#ca8a04' : '#7c4a1e');
        const x = h.x + 0.5, y = h.y - 9;
        if (top === 'skull') { d.ell(x, y, 1.2, 1.1, P.bone); [-1, 1].forEach(s => d.dot(x + s * 0.45, y, 0.25, P.eye, true)); }
        else if (top === 'ankh') { c.g.beginPath(); c.g.ellipse(x, y - 0.4, 0.8, 1.1, 0, 0, Math.PI * 2); c.g.strokeStyle = '#facc15'; c.g.lineWidth = d.hd ? 0.45 : 1; c.g.stroke(); d.line(x - 1.2, y + 0.9, x + 1.2, y + 0.9, 0.45, '#facc15'); }
        else { d.ell(x, y, 1.15, 1.15, P.orb); d.dot(x, y, 0.55, '#ffffff', true); }
    }
};
