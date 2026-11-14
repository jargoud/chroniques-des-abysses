'use strict';

// ==================== 7. BOUCLE & RENDU ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const miniCanvas = document.getElementById('minimapCanvas');
const miniCtx = miniCanvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

// ==================== 7b. RENDU PIXEL ART 16-BIT ====================
// Le monde est dessiné sur un canvas basse résolution puis agrandi sans lissage.
const PX = 3; // 1 pixel logique = 3 pixels écran (tuile 48px = 16px)
const lowCanvas = document.createElement('canvas');
const lctx = lowCanvas.getContext('2d');
const lightCanvas = document.createElement('canvas');
const lightCtx = lightCanvas.getContext('2d');

const Pixel = {
    cache: {},

    // f > 0 éclaircit, f < 0 assombrit (hex '#rrggbb' en entrée)
    shade(hex, f) {
        const n = parseInt(hex.slice(1), 16);
        const ch = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f));
        return '#' + ch.map(v => v.toString(16).padStart(2, '0')).join('');
    },

    tiles(key, floor, wall) {
        if (this.cache['tiles' + key]) return this.cache['tiles' + key];
        const look = BIOME_LOOK[key] || {};
        let seed = 7;
        const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const sh = (c, f) => this.shade(c, f);
        const mk = draw => {
            const c = document.createElement('canvas');
            c.width = c.height = 16;
            draw(c.getContext('2d'));
            return c;
        };
        const px = (g, x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
        const rect = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
        const specks = (g, n, base, a, b) => { for (let i = 0; i < n; i++) px(g, rnd() * 16 | 0, rnd() * 16 | 0, sh(base, rnd() < 0.5 ? a : b)); };
        const F = floor, W = wall;

        // ---- Sols ----
        const FLOORS = {
            // Dalles de prison jointoyées
            flag(g) {
                rect(g, 0, 0, 16, 16, sh(F, -0.4));
                [[1, 1, 7, 6], [9, 1, 6, 6], [1, 8, 5, 7], [7, 8, 8, 7]].forEach(([x, y, w, h]) => {
                    const c = sh(F, (rnd() - 0.5) * 0.2);
                    rect(g, x, y, w, h, c);
                    rect(g, x, y, w, 1, sh(c, 0.15));
                });
                specks(g, 10, F, 0.1, -0.3);
                if (rnd() < 0.5) { let x = rnd() * 12 | 0, y = rnd() * 12 | 0; for (let i = 0; i < 5; i++) px(g, x += rnd() < 0.5 ? 1 : 0, y++, sh(F, -0.5)); }
            },
            // Pavés disjoints envahis d'herbe (ruines à ciel ouvert)
            cobble(g) {
                rect(g, 0, 0, 16, 16, sh(F, -0.35));
                for (let y = 0; y < 16; y += 4) for (let x = (y % 8 ? -2 : 0); x < 16; x += 4) {
                    const c = sh(F, (rnd() - 0.5) * 0.3);
                    rect(g, x, y, 3, 3, c);
                    px(g, x, y, sh(c, 0.2));
                }
                for (let i = 0; i < 6; i++) px(g, rnd() * 16 | 0, rnd() * 16 | 0, rnd() < 0.5 ? '#3f6212' : '#4d7c0f');
            },
            // Carrelage funéraire fissuré
            crypt(g) {
                rect(g, 0, 0, 16, 16, F);
                rect(g, 0, 0, 8, 8, sh(F, 0.07));
                rect(g, 8, 8, 8, 8, sh(F, 0.07));
                rect(g, 0, 0, 16, 1, sh(F, -0.45));
                rect(g, 0, 8, 16, 1, sh(F, -0.45));
                rect(g, 0, 0, 1, 16, sh(F, -0.45));
                rect(g, 8, 0, 1, 16, sh(F, -0.45));
                specks(g, 8, F, 0.12, -0.3);
                let x = 2 + rnd() * 12 | 0, y = 2 + rnd() * 12 | 0;
                for (let i = 0; i < 4; i++) px(g, x += rnd() < 0.5 ? -1 : 1, y += 1, sh(F, -0.6));
            },
            // Grands blocs de grès ensablés
            sand(g) {
                rect(g, 0, 0, 16, 16, F);
                for (let row = 0; row < 2; row++) {
                    rect(g, 0, row * 8, 16, 1, sh(F, -0.3));
                    rect(g, 0, row * 8 + 1, 16, 1, sh(F, 0.15));
                    const off = row ? 4 : 12;
                    rect(g, off, row * 8, 1, 8, sh(F, -0.3));
                }
                for (let i = 0; i < 12; i++) px(g, rnd() * 16 | 0, rnd() * 16 | 0, sh(F, rnd() < 0.7 ? 0.35 : -0.2));
            },
            // Dalles polies incrustées d'or
            temple(g) {
                rect(g, 0, 0, 16, 16, F);
                [[0, 0], [8, 0], [0, 8], [8, 8]].forEach(([x, y]) => {
                    rect(g, x, y, 8, 1, sh(F, -0.4));
                    rect(g, x, y, 1, 8, sh(F, -0.4));
                    rect(g, x + 1, y + 1, 6, 1, sh(F, 0.12));
                });
                if (rnd() < 0.6) { px(g, 8, 6, '#a16207'); px(g, 7, 7, '#a16207'); px(g, 9, 7, '#a16207'); px(g, 8, 7, '#facc15'); px(g, 8, 8, '#a16207'); }
                specks(g, 6, F, 0.15, -0.2);
            },
            // Herbe haute de jungle, feuilles et boue
            grass(g) {
                rect(g, 0, 0, 16, 16, F);
                for (let i = 0; i < 34; i++) {
                    const x = rnd() * 16 | 0, y = rnd() * 16 | 0, c = sh(F, rnd() < 0.55 ? 0.22 : -0.2);
                    px(g, x, y, c);
                    if (rnd() < 0.4) px(g, x, y - 1, c);
                }
                if (rnd() < 0.35) { const x = rnd() * 10 | 0, y = rnd() * 10 | 0; rect(g, x, y, 5, 3, '#5b4423'); rect(g, x + 1, y + 3, 3, 1, '#5b4423'); }
                for (let i = 0; i < 2; i++) px(g, rnd() * 16 | 0, rnd() * 16 | 0, '#a3e635');
            },
            // Mousse sombre, feuilles mortes et cailloux
            moss(g) {
                rect(g, 0, 0, 16, 16, F);
                specks(g, 30, F, 0.15, -0.3);
                for (let i = 0; i < 3; i++) px(g, rnd() * 16 | 0, rnd() * 16 | 0, rnd() < 0.5 ? '#7c2d12' : '#a16207');
                if (rnd() < 0.4) px(g, rnd() * 16 | 0, rnd() * 16 | 0, '#57534e');
            },
            // Roche infernale craquelée de lave
            hell(g) {
                rect(g, 0, 0, 16, 16, sh(F, -0.45));
                [[0, 0, 7, 7], [8, 0, 8, 6], [0, 8, 9, 8], [10, 7, 6, 9]].forEach(([x, y, w, h]) => rect(g, x, y, w, h, sh(F, (rnd() - 0.5) * 0.25)));
                specks(g, 8, F, 0.2, -0.3);
                if (rnd() < 0.5) { let x = rnd() * 6 | 0, y = 4 + rnd() * 8 | 0; for (let i = 0; i < 8; i++) { px(g, x++, y, i % 3 ? '#ea580c' : '#fde047'); if (rnd() < 0.3) y += rnd() < 0.5 ? 1 : -1; } }
            }
        };

        // ---- Murs ----
        const brick = g => {
            rect(g, 0, 0, 16, 16, sh(W, -0.45));
            for (let row = 0; row < 4; row++) for (let col = -1; col < 2; col++) {
                const x = col * 8 + (row % 2) * 4, y = row * 4;
                rect(g, x + 1, y + 1, 7, 3, rnd() < 0.3 ? sh(W, -0.12) : W);
                rect(g, x + 1, y + 1, 7, 1, sh(W, 0.25));
            }
        };
        const WALLS = {
            brick: [brick, brick, g => { brick(g); for (let x = 3; x < 14; x += 3) rect(g, x, 3, 1, 11, '#1c1917'); rect(g, 2, 3, 12, 1, '#57534e'); rect(g, 2, 13, 12, 1, '#57534e'); }],
            // Gros blocs de remparts, lierre et fissures
            block: [0, 1, 2].map(v => g => {
                rect(g, 0, 0, 16, 16, sh(W, -0.45));
                for (let row = 0; row < 3; row++) for (let col = -1; col < 2; col++) {
                    const x = col * 8 + (row % 2) * 4, y = row * 5 + 1;
                    rect(g, x + 1, y, 7, 4, sh(W, (rnd() - 0.5) * 0.2));
                    rect(g, x + 1, y, 7, 1, sh(W, 0.25));
                }
                if (v === 1) for (let i = 0; i < 18; i++) { const x = rnd() * 16 | 0; px(g, x, rnd() * (4 + x % 9) | 0, rnd() < 0.5 ? '#3f6212' : '#65a30d'); }
                if (v === 2) { let x = 4 + rnd() * 8 | 0; for (let y = 0; y < 16; y++) px(g, x += rnd() < 0.5 ? (rnd() < 0.5 ? -1 : 1) : 0, y, sh(W, -0.6)); }
            }),
            // Pierre sombre, niches à crânes
            cryptwall: [0, 0, 0, 0, 1].map(v => g => {
                rect(g, 0, 0, 16, 16, sh(W, -0.4));
                for (let row = 0; row < 4; row++) for (let col = -1; col < 2; col++) rect(g, col * 8 + (row % 2) * 4 + 1, row * 4 + 1, 7, 3, sh(W, (rnd() - 0.5) * 0.15));
                if (v) {
                    rect(g, 4, 4, 8, 10, '#0c0a10');
                    rect(g, 5, 3, 6, 1, '#0c0a10');
                    rect(g, 6, 9, 4, 3, '#d6d3d1');
                    rect(g, 7, 12, 2, 1, '#d6d3d1');
                    px(g, 6, 10, '#0c0a10');
                    px(g, 9, 10, '#0c0a10');
                }
            }),
            // Grès gravé de hiéroglyphes
            sandstone: [0, 0, 0, 1].map(v => g => {
                rect(g, 0, 0, 16, 16, W);
                rect(g, 0, 7, 16, 1, sh(W, -0.35));
                rect(g, 0, 15, 16, 1, sh(W, -0.35));
                rect(g, 7, 0, 1, 7, sh(W, -0.35));
                rect(g, 3, 8, 1, 7, sh(W, -0.35));
                rect(g, 11, 8, 1, 7, sh(W, -0.35));
                rect(g, 0, 0, 16, 1, sh(W, 0.2));
                rect(g, 0, 8, 16, 1, sh(W, 0.2));
                specks(g, 8, W, 0.15, -0.2);
                if (v) {
                    const d = sh(W, -0.5);
                    rect(g, 1, 2, 4, 1, d); px(g, 1, 3, d); px(g, 4, 3, d); px(g, 2, 3, '#1e3a8a'); rect(g, 2, 4, 2, 1, d); // œil
                    rect(g, 10, 1, 3, 1, d); px(g, 10, 2, d); px(g, 12, 2, d); rect(g, 9, 3, 5, 1, d); rect(g, 11, 4, 1, 3, d); // ânkh
                    rect(g, 5, 10, 5, 1, d); px(g, 9, 9, d); px(g, 6, 11, d); px(g, 8, 11, d); // oiseau
                }
            }),
            // Pierres taillées en appareil décalé ; variantes : incrustation d'or, pilastre, runes (aucune frise continue)
            templewall: [0, 0, 1, 2, 3].map(v => g => {
                rect(g, 0, 0, 16, 16, sh(W, -0.35));
                [[0, 0, 8], [8, 0, 8], [-4, 5, 8], [4, 5, 8], [12, 5, 8], [0, 10, 8], [8, 10, 8]].forEach(([x, y, w]) => {
                    const c = sh(W, (rnd() - 0.5) * 0.18);
                    rect(g, x + 1, y + 1, w - 1, 4, c);
                    rect(g, x + 1, y + 1, w - 1, 1, sh(c, 0.18));
                });
                rect(g, 0, 15, 16, 1, sh(W, -0.35));
                specks(g, 6, W, 0.12, -0.25);
                if (v === 1) { px(g, 4, 7, '#facc15'); px(g, 3, 8, '#a16207'); px(g, 5, 8, '#a16207'); px(g, 4, 8, '#fde047'); px(g, 4, 9, '#a16207'); }
                if (v === 2) { rect(g, 6, 0, 4, 16, sh(W, 0.12)); rect(g, 6, 0, 1, 16, sh(W, 0.3)); rect(g, 9, 0, 1, 16, sh(W, -0.3)); }
                if (v === 3) { px(g, 3, 6, '#e879f9'); px(g, 4, 7, '#e879f9'); px(g, 3, 8, '#e879f9'); px(g, 12, 11, '#e879f9'); px(g, 11, 12, '#e879f9'); px(g, 12, 13, '#e879f9'); }
            }),
            // Canopée tropicale vue de dessus
            foliage: [0, 0, 1].map(v => g => {
                rect(g, 0, 0, 16, 16, sh(F, -0.25));
                for (let k = 0; k < 6; k++) {
                    const cx = rnd() * 16, cy = rnd() * 16, r = 3 + rnd() * 3, col = ['#166534', '#15803d', '#22c55e', '#14532d'][k % 4];
                    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
                        const d = Math.hypot(x - cx, y - cy);
                        if (d < r) px(g, x, y, d > r - 1 ? sh(col, -0.3) : ((x + y) % 4 === 0 ? sh(col, 0.25) : col));
                    }
                }
                if (v) { px(g, 4, 5, rnd() < 0.5 ? '#f472b6' : '#facc15'); px(g, 11, 10, '#f472b6'); px(g, 5, 5, '#fde047'); }
            }),
            // Sapin noir vu de dessus (étoile à 8 branches)
            pine: [0, 0, 1].map(v => g => {
                rect(g, 0, 0, 16, 16, F);
                specks(g, 12, F, 0.1, -0.3);
                const k = v ? 0.75 : 1;
                for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
                    const dx = x - 7.5, dy = y - 7.5, r = Math.hypot(dx, dy), spike = (5.6 + 1.6 * Math.cos(Math.atan2(dy, dx) * 8)) * k;
                    if (r < spike) px(g, x, y, r > spike - 1.4 ? sh(W, -0.4) : (r < 1.5 ? sh(W, 0.3) : ((x * 3 + y) % 5 === 0 ? sh(W, 0.18) : W)));
                }
                if (v) { rect(g, 12, 12, 3, 2, '#57534e'); px(g, 12, 12, '#78716c'); }
            }),
            // Mur d'ossements : crânes empilés
            bones: [0, 0, 1].map(v => g => {
                rect(g, 0, 0, 16, 16, sh(W, -0.6));
                const bone = v ? '#e7d8c9' : '#cfc3b4';
                [[1, 1], [9, 1], [5, 9], [-3, 9], [13, 9]].forEach(([x, y]) => {
                    rect(g, x, y, 5, 4, bone);
                    rect(g, x + 1, y + 4, 3, 1, bone);
                    px(g, x + 1, y + 1, '#1a0606');
                    px(g, x + 3, y + 1, '#1a0606');
                    px(g, x + 2, y + 3, '#1a0606');
                    rect(g, x, y, 5, 1, sh(bone, 0.2));
                });
                rect(g, 0, 7, 16, 1, sh(bone, -0.3));
                if (v) { px(g, 2, 2, '#ef4444'); px(g, 4, 2, '#ef4444'); }
            })
        };

        const fStyle = look.floor || 'flag';
        const wStyle = look.wall || 'brick';
        const floors = [0, 1, 2, 3, 4, 5, 6, 7].map(() => mk(FLOORS[fStyle]));
        // Usure : traînées sombres, mousse ou sable au pied du mur
        const wear = look.wall === 'sandstone' ? ['#d9b26a', '#c9a35a'] : look.wall === 'bones' ? ['#1c0a06', '#7c2d12'] : ['#3f6212', '#4d7c0f'];
        const weathered = fn => g => {
            fn(g);
            for (let i = 0; i < 2; i++) { const x = rnd() * 14 | 0; rect(g, x, 0, 1, 4 + rnd() * 8 | 0, sh(W, -0.55)); }
            for (let i = 0; i < 9; i++) px(g, rnd() * 16 | 0, 12 + rnd() * 4 | 0, wear[i % 2]);
        };
        // 3 murs simples (masse intérieure), puis variantes spéciales et usées (réservées aux murs bordant un sol)
        const base = WALLS[wStyle];
        const walls = [base[0], base[0], base[0]].concat(base.slice(1), look.outdoor ? [] : [weathered(base[0]), weathered(base[0])]).map(fn => mk(fn));
        return (this.cache['tiles' + key] = { floors, walls, inner: 3 });
    }
};

// Petit décor de sol (tuile 16 px en x, y) ; certains émettent de la lumière
function drawProp(g, kind, x, y, now, light) {
    const R = (dx, dy, w, h, col) => { g.fillStyle = col; g.fillRect(x + dx, y + dy, w, h); };
    const skull = (dx, dy) => { R(dx, dy, 4, 3, '#e7e5e4'); R(dx + 1, dy + 3, 2, 1, '#e7e5e4'); R(dx + 1, dy + 1, 1, 1, '#1c1917'); R(dx + 3, dy + 1, 1, 1, '#1c1917'); };
    const fl = Math.floor(now / 120 + x) % 2;
    switch (kind) {
        case 'bones': R(4, 10, 7, 1, '#d6d3d1'); R(3, 9, 1, 3, '#d6d3d1'); R(11, 9, 1, 3, '#d6d3d1'); R(6, 6, 6, 1, '#a8a29e'); break;
        case 'chain': for (let i = 0; i < 4; i++) R(7 + (i % 2), 3 + i * 3, 2, 2, i % 2 ? '#4b5563' : '#6b7280'); R(6, 14, 4, 1, '#374151'); break;
        case 'puddle': R(4, 9, 8, 3, '#1e3a5f'); R(5, 8, 6, 1, '#1e3a5f'); R(6, 9, 2, 1, '#60a5fa'); break;
        case 'rubble': R(3, 10, 4, 3, '#64748b'); R(8, 11, 3, 2, '#475569'); R(11, 9, 3, 3, '#94a3b8'); R(3, 10, 4, 1, '#94a3b8'); break;
        case 'tuft': R(6, 10, 1, 3, '#4d7c0f'); R(8, 9, 1, 4, '#65a30d'); R(10, 11, 1, 2, '#4d7c0f'); R(7, 11, 1, 2, '#3f6212'); break;
        case 'skull': skull(6, 8); break;
        case 'candle':
            R(7, 9, 2, 4, '#e7e5e4'); R(6, 13, 4, 1, '#a8a29e');
            R(7, 7 - fl, 2, 2, '#c084fc'); R(7, 8, 1, 1, '#f5d0fe');
            light(x + 8, y + 7, 16, '#a855f7', 0.45); break;
        case 'urn': R(6, 7, 4, 6, '#b45309'); R(5, 8, 6, 3, '#c2410c'); R(7, 6, 2, 1, '#78350f'); R(5, 9, 6, 1, '#facc15'); R(6, 13, 4, 1, '#78350f'); break;
        case 'sandpile': R(4, 11, 8, 2, '#c9a86a'); R(6, 10, 4, 1, '#e7c98a'); R(5, 12, 6, 1, '#a8874f'); break;
        case 'brazier':
            R(5, 9, 6, 2, '#a16207'); R(7, 11, 2, 3, '#713f12'); R(5, 14, 6, 1, '#713f12');
            R(6, 6 + fl, 4, 3 - fl, '#e879f9'); R(7, 5 + fl, 2, 1, '#f5d0fe');
            light(x + 8, y + 7, 26, '#e879f9', 0.5); break;
        case 'rune':
            g.globalAlpha = 0.45 + 0.25 * Math.sin(now * 0.003 + x);
            R(4, 7, 8, 1, '#facc15'); R(7, 4, 2, 8, '#facc15'); R(5, 5, 1, 1, '#facc15'); R(10, 10, 1, 1, '#facc15');
            g.globalAlpha = 1;
            light(x + 8, y + 8, 12, '#facc15', 0.25); break;
        case 'fern': R(4, 9, 8, 1, '#22c55e'); R(5, 8, 2, 1, '#16a34a'); R(9, 8, 2, 1, '#16a34a'); R(7, 6, 2, 3, '#15803d'); R(3, 10, 2, 1, '#15803d'); R(11, 10, 2, 1, '#15803d'); break;
        case 'flower': R(7, 8, 1, 4, '#15803d'); R(6, 7, 3, 1, '#f472b6'); R(7, 6, 1, 3, '#f472b6'); R(7, 7, 1, 1, '#fde047'); R(10, 10, 1, 2, '#15803d'); R(10, 9, 1, 1, '#fb923c'); break;
        case 'mushroom':
            R(7, 10, 2, 3, '#e7e5e4'); R(5, 8, 6, 2, '#2dd4bf'); R(6, 7, 4, 1, '#5eead4'); R(6, 8, 1, 1, '#ccfbf1');
            light(x + 8, y + 9, 14, '#2dd4bf', 0.4); break;
        case 'log': R(2, 9, 12, 3, '#5b3a1e'); R(2, 9, 12, 1, '#78502a'); R(13, 9, 1, 3, '#a16207'); R(5, 8, 1, 1, '#4d7c0f'); break;
        case 'lava':
            R(3, 8, 4, 1, '#ea580c'); R(6, 9, 4, 1, fl ? '#f97316' : '#ea580c'); R(9, 10, 4, 1, '#fde047'); R(2, 7, 1, 1, '#ea580c');
            light(x + 8, y + 9, 18 + fl * 2, '#f97316', 0.55); break;
        case 'skullpile': skull(3, 9); skull(9, 9); skull(6, 6); break;
    }
}

// ==================== 7c. RENDU MODERNE « HD » ====================
// Même repère logique que le pixel art (1 unité = PX pixels écran), mais tracé en pleine résolution avec des formes lissées.
const HD = {
    cache: {},

    // '#rrggbb' → 'rgba(r,g,b,a)' (dégradés vers la transparence sans virer au noir)
    rgba(hex, a) {
        const n = parseInt(hex.slice(1), 16);
        return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    },

    // Canevas de w × h unités logiques à s pixels par unité ; lw / lh = taille logique pour drawSprite
    canvas(w, h, s) {
        const c = document.createElement('canvas');
        c.width = Math.ceil(w * s);
        c.height = Math.ceil(h * s);
        c.lw = w;
        c.lh = h;
        const g = c.getContext('2d');
        g.scale(s, s);
        g.lineCap = g.lineJoin = 'round';
        return [c, g];
    },

    // Halo doux réutilisable (lueurs, brumes, fumées)
    blob(col) {
        const k = 'blob' + col;
        if (this.cache[k]) return this.cache[k];
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        gr.addColorStop(0, this.rgba(col, 1));
        gr.addColorStop(0.45, this.rgba(col, 0.45));
        gr.addColorStop(1, this.rgba(col, 0));
        g.fillStyle = gr;
        g.fillRect(0, 0, 64, 64);
        return (this.cache[k] = c);
    },

    // Flamme en goutte (3 couches : couleur, cœur clair, noyau blanc), pied en (x, y)
    flame(g, x, y, w, h, col, now, seed) {
        const f = Math.sin(now * 0.018 + seed) * 0.12 + Math.sin(now * 0.031 + seed * 2) * 0.08;
        const hh = h * (1 + f), sway = Math.sin(now * 0.011 + seed) * w * 0.25;
        const path = s => {
            g.beginPath();
            g.moveTo(x - w / 2 * s, y);
            g.bezierCurveTo(x - w * 0.62 * s, y - hh * 0.35 * s, x + sway * s - w * 0.25 * s, y - hh * 0.8 * s, x + sway * s, y - hh * s);
            g.bezierCurveTo(x + sway * s + w * 0.25 * s, y - hh * 0.8 * s, x + w * 0.62 * s, y - hh * 0.35 * s, x + w / 2 * s, y);
            g.quadraticCurveTo(x, y + w * 0.4 * s, x - w / 2 * s, y);
            g.fill();
        };
        g.globalAlpha = 0.9;
        g.fillStyle = col;
        path(1);
        g.fillStyle = Pixel.shade(col, 0.5);
        path(0.65);
        g.globalAlpha = 0.75;
        g.fillStyle = '#fff7d6';
        path(0.32);
        g.globalAlpha = 1;
    },

    torch(g, x, y, col, now) {
        g.fillStyle = '#3f2a1d';
        g.beginPath();
        g.roundRect(x - 0.8, y - 0.5, 1.6, 3.5, 0.4);
        g.fill();
        g.fillStyle = '#57534e';
        g.fillRect(x - 1.4, y - 1, 2.8, 0.9);
        this.flame(g, x, y - 1, 2.4, 4.2, col, now, x);
    },

    // Tuiles 16 × 16 en pleine résolution : 3 sols, murs variés, et calques de profondeur (face, liseré, ombre)
    tiles(key, floor, wall) {
        const ck = 'tiles' + key;
        if (this.cache[ck]) return this.cache[ck];
        const look = BIOME_LOOK[key] || {};
        let seed = 11;
        const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const sh = (c, f) => Pixel.shade(c, f);
        const F = floor, W = wall, P = Math.PI * 2;
        const mk = draw => { const [c, g] = this.canvas(16, 16, PX); draw(g); return c; };
        const fill = (g, col) => { g.fillStyle = col; g.fillRect(0, 0, 16, 16); };
        const vgrad = (g, a, b) => {
            const gr = g.createLinearGradient(0, 0, 0, 16);
            gr.addColorStop(0, a);
            gr.addColorStop(1, b);
            g.fillStyle = gr;
            g.fillRect(0, 0, 16, 16);
        };
        const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
        const grain = (g, n, base, amp, size = 0.45) => {
            for (let i = 0; i < n; i++) {
                g.globalAlpha = 0.25 + rnd() * 0.4;
                g.fillStyle = sh(base, (rnd() - 0.5) * 2 * amp);
                g.beginPath();
                g.arc(0.5 + rnd() * 15, 0.5 + rnd() * 15, 0.12 + rnd() * size, 0, P);
                g.fill();
            }
            g.globalAlpha = 1;
        };
        // Pierre arrondie : ombre portée, dégradé, liseré lumineux en haut
        const stone = (g, x, y, w, h, col, r = 1) => {
            g.fillStyle = 'rgba(0,0,0,0.4)';
            rr(g, x + 0.25, y + 0.45, w, h, r);
            g.fill();
            const gr = g.createLinearGradient(x, y, x + w * 0.3, y + h);
            gr.addColorStop(0, sh(col, 0.16));
            gr.addColorStop(1, sh(col, -0.16));
            g.fillStyle = gr;
            rr(g, x, y, w, h, r);
            g.fill();
            g.strokeStyle = sh(col, 0.4);
            g.globalAlpha = 0.55;
            g.lineWidth = 0.3;
            g.beginPath();
            g.moveTo(x + r, y + 0.2);
            g.lineTo(x + w - r, y + 0.2);
            g.stroke();
            g.globalAlpha = 1;
        };
        const crack = (g, col, wid = 0.28) => {
            g.strokeStyle = col;
            g.lineWidth = wid;
            let x = 3 + rnd() * 10, y = 1 + rnd() * 6;
            g.beginPath();
            g.moveTo(x, y);
            for (let i = 0; i < 4; i++) { x += (rnd() - 0.5) * 4; y += 1 + rnd() * 2.5; g.lineTo(x, y); }
            g.stroke();
        };
        const blade = (g, x, y, h, col, lean) => {
            g.strokeStyle = col;
            g.lineWidth = 0.32;
            g.beginPath();
            g.moveTo(x, y);
            g.quadraticCurveTo(x + lean * 0.3, y - h * 0.6, x + lean, y - h);
            g.stroke();
        };
        const leaf = (g, x, y, r, a, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, r, r * 0.45, a, 0, P); g.fill(); };
        const disc = (g, x, y, r, inner, outer) => {
            const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
            gr.addColorStop(0, inner);
            gr.addColorStop(1, outer);
            g.fillStyle = gr;
            g.beginPath();
            g.arc(x, y, r, 0, P);
            g.fill();
        };
        const skull = (g, x, y, s, bone, eye) => {
            g.fillStyle = 'rgba(0,0,0,0.45)';
            g.beginPath();
            g.ellipse(x + 0.3, y + 0.5, 2.3 * s, 2.1 * s, 0, 0, P);
            g.fill();
            disc(g, x, y, 2.2 * s, sh(bone, 0.2), sh(bone, -0.25));
            g.fillStyle = sh(bone, -0.1);
            rr(g, x - 1.2 * s, y + 1.2 * s, 2.4 * s, 1.5 * s, 0.4 * s);
            g.fill();
            g.fillStyle = eye;
            [-1, 1].forEach(d => { g.beginPath(); g.ellipse(x + d * 0.85 * s, y + 0.1 * s, 0.6 * s, 0.7 * s, 0, 0, P); g.fill(); });
            g.beginPath();
            g.moveTo(x, y + 0.8 * s);
            g.lineTo(x - 0.35 * s, y + 1.3 * s);
            g.lineTo(x + 0.35 * s, y + 1.3 * s);
            g.fill();
        };

        // ---- Sols ----
        const FLOORS = {
            // Dalles de prison jointoyées
            flag(g) {
                fill(g, sh(F, -0.5));
                [[0.5, 0.5, 7.2, 6.6], [8.3, 0.5, 7.2, 6.6], [0.5, 7.7, 5.2, 7.8], [6.3, 7.7, 9.2, 7.8]]
                    .forEach(([x, y, w, h]) => stone(g, x, y, w, h, sh(F, (rnd() - 0.5) * 0.22), 0.9));
                grain(g, 16, F, 0.3);
                if (rnd() < 0.5) crack(g, sh(F, -0.6));
            },
            // Pavés disjoints envahis d'herbe
            cobble(g) {
                fill(g, sh(F, -0.45));
                for (let y = 0; y < 16; y += 4) for (let x = (y % 8 ? -2 : 0); x < 16; x += 4) {
                    stone(g, x + 0.35, y + 0.35, 3.3, 3.3, sh(F, (rnd() - 0.5) * 0.32), 1.3);
                }
                for (let i = 0; i < 7; i++) blade(g, rnd() * 16, rnd() * 16, 1.5 + rnd() * 1.5, rnd() < 0.5 ? '#4d7c0f' : '#65a30d', (rnd() - 0.5) * 1.5);
            },
            // Carrelage funéraire en damier, fissuré
            crypt(g) {
                fill(g, sh(F, -0.5));
                [[0, 0], [8, 0], [0, 8], [8, 8]].forEach(([x, y], i) => stone(g, x + 0.4, y + 0.4, 7.2, 7.2, sh(F, (i === 0 || i === 3) ? 0.1 : -0.02), 0.5));
                grain(g, 10, F, 0.3);
                crack(g, sh(F, -0.65));
            },
            // Grands blocs de grès, rides de sable
            sand(g) {
                vgrad(g, sh(F, 0.08), sh(F, -0.08));
                g.strokeStyle = sh(F, -0.32);
                g.lineWidth = 0.35;
                [[0, 8, 16, 8], [12, 0, 12, 8], [4, 8, 4, 16]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
                g.strokeStyle = sh(F, 0.25);
                g.lineWidth = 0.4;
                g.globalAlpha = 0.6;
                for (let i = 0; i < 3; i++) {
                    const y = 2 + i * 5 + rnd() * 2;
                    g.beginPath();
                    g.moveTo(0, y);
                    g.bezierCurveTo(5, y - 1.2, 10, y + 1.2, 16, y);
                    g.stroke();
                }
                g.globalAlpha = 1;
                grain(g, 22, F, 0.35, 0.3);
            },
            // Dalles polies à filet d'or, reflet
            temple(g) {
                fill(g, sh(F, -0.45));
                [[0, 0], [8, 0], [0, 8], [8, 8]].forEach(([x, y]) => {
                    const gr = g.createLinearGradient(x, y, x + 8, y + 8);
                    gr.addColorStop(0, sh(F, 0.2));
                    gr.addColorStop(0.5, F);
                    gr.addColorStop(1, sh(F, -0.15));
                    g.fillStyle = gr;
                    rr(g, x + 0.35, y + 0.35, 7.3, 7.3, 0.4);
                    g.fill();
                    g.strokeStyle = 'rgba(250,204,21,0.35)';
                    g.lineWidth = 0.25;
                    rr(g, x + 1.1, y + 1.1, 5.8, 5.8, 0.3);
                    g.stroke();
                });
                if (rnd() < 0.25) {
                    g.fillStyle = '#facc15';
                    g.beginPath();
                    g.moveTo(8, 6.3); g.lineTo(9.7, 8); g.lineTo(8, 9.7); g.lineTo(6.3, 8);
                    g.closePath();
                    g.fill();
                    g.fillStyle = '#a16207';
                    g.beginPath();
                    g.arc(8, 8, 0.6, 0, P);
                    g.fill();
                }
                g.fillStyle = 'rgba(255,255,255,0.06)';
                g.beginPath();
                g.moveTo(0, 6); g.lineTo(6, 0); g.lineTo(9, 0); g.lineTo(0, 9);
                g.fill();
            },
            // Herbe haute, boue et fleurs
            grass(g) {
                fill(g, F);
                for (let i = 0; i < 5; i++) { g.globalAlpha = 0.25; disc(g, rnd() * 16, rnd() * 16, 2 + rnd() * 3, sh(F, 0.2), sh(F, -0.1)); }
                g.globalAlpha = 1;
                if (rnd() < 0.3) { g.fillStyle = '#5b4423'; g.beginPath(); g.ellipse(4 + rnd() * 8, 4 + rnd() * 8, 2.6, 1.6, rnd(), 0, P); g.fill(); }
                for (let i = 0; i < 46; i++) blade(g, rnd() * 16, 1.5 + rnd() * 15, 1 + rnd() * 2.2, sh(F, rnd() < 0.55 ? 0.15 + rnd() * 0.25 : -0.25), (rnd() - 0.5) * 1.6);
                if (rnd() < 0.5) { g.fillStyle = rnd() < 0.5 ? '#f472b6' : '#fde047'; g.beginPath(); g.arc(2 + rnd() * 12, 2 + rnd() * 12, 0.45, 0, P); g.fill(); }
            },
            // Mousse sombre, feuilles mortes, cailloux
            moss(g) {
                fill(g, F);
                for (let i = 0; i < 8; i++) { g.globalAlpha = 0.35; disc(g, rnd() * 16, rnd() * 16, 1.2 + rnd() * 2.5, sh(F, 0.25), sh(F, -0.2)); }
                g.globalAlpha = 1;
                grain(g, 18, F, 0.3);
                for (let i = 0; i < 3; i++) leaf(g, rnd() * 16, rnd() * 16, 0.9, rnd() * 3, rnd() < 0.5 ? '#7c2d12' : '#a16207');
                if (rnd() < 0.4) disc(g, 1 + rnd() * 14, 1 + rnd() * 14, 0.8, '#a8a29e', '#44403c');
            },
            // Roche infernale, failles de lave
            hell(g) {
                fill(g, sh(F, -0.55));
                [[0.3, 0.3, 7.2, 7], [8, 0.3, 7.7, 6], [0.3, 8, 8.6, 7.7], [9.6, 6.9, 6.1, 8.8]]
                    .forEach(([x, y, w, h]) => stone(g, x, y, w, h, sh(F, (rnd() - 0.5) * 0.25), 1.6));
                if (rnd() < 0.6) {
                    let x = rnd() * 4, y = 4 + rnd() * 8;
                    const pts = [[x, y]];
                    for (let i = 0; i < 5; i++) { x += 2.5 + rnd() * 1.5; y += (rnd() - 0.5) * 3; pts.push([x, y]); }
                    [[1.6, 'rgba(234,88,12,0.35)'], [0.7, '#f97316'], [0.28, '#fde047']].forEach(([wid, col]) => {
                        g.strokeStyle = col;
                        g.lineWidth = wid;
                        g.beginPath();
                        pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b)));
                        g.stroke();
                    });
                }
                grain(g, 8, F, 0.3);
            }
        };

        // ---- Murs ----
        const bricks = (g, rows, vary) => {
            fill(g, sh(W, -0.55));
            const bh = 16 / rows;
            for (let row = 0; row < rows; row++) for (let col = -1; col < 2; col++) {
                stone(g, col * 8 + (row % 2) * 4 + 0.35, row * bh + 0.35, 7.3, bh - 0.7, sh(W, (rnd() - 0.5) * vary), 0.6);
            }
        };
        const WALLS = {
            // Briques ; variante : grille de cellule
            brick: [0, 0, 0, 0].map(() => g => bricks(g, 4, 0.22)).concat(g => {
                bricks(g, 4, 0.22);
                g.fillStyle = 'rgba(8,6,6,0.92)';
                rr(g, 2, 2.5, 12, 11, 0.8);
                g.fill();
                for (let x = 3.5; x < 14; x += 2.5) {
                    const gr = g.createLinearGradient(x - 0.5, 0, x + 0.5, 0);
                    gr.addColorStop(0, '#374151');
                    gr.addColorStop(0.5, '#9ca3af');
                    gr.addColorStop(1, '#374151');
                    g.fillStyle = gr;
                    g.fillRect(x - 0.45, 2.5, 0.9, 11);
                }
                g.fillStyle = '#6b7280';
                g.fillRect(2, 2.3, 12, 0.9);
                g.fillRect(2, 12.8, 12, 0.9);
            }),
            // Remparts : gros blocs, lierre, fissure
            block: [0, 1, 2].map(v => g => {
                bricks(g, 3, 0.2);
                if (v === 1) for (let i = 0; i < 16; i++) { const x = rnd() * 16; leaf(g, x, rnd() * (4 + (x | 0) % 9), 0.8 + rnd() * 0.5, rnd() * 3, rnd() < 0.5 ? '#3f6212' : '#65a30d'); }
                if (v === 2) crack(g, sh(W, -0.7), 0.4);
            }),
            // Pierre sombre ; variante : niche à crâne
            cryptwall: [0, 0, 1].map(v => g => {
                bricks(g, 4, 0.15);
                if (v) {
                    g.fillStyle = '#0c0a10';
                    g.beginPath();
                    g.moveTo(3.5, 14);
                    g.lineTo(3.5, 6);
                    g.arc(8, 6, 4.5, Math.PI, 0);
                    g.lineTo(12.5, 14);
                    g.closePath();
                    g.fill();
                    skull(g, 8, 10, 0.9, '#d6d3d1', '#0c0a10');
                }
            }),
            // Grès ; variante : hiéroglyphes gravés
            sandstone: [0, 0, 1].map(v => g => {
                fill(g, sh(W, -0.4));
                stone(g, 0.3, 0.3, 7, 7.2, sh(W, 0.03), 0.4);
                stone(g, 7.6, 0.3, 8.1, 7.2, sh(W, -0.04), 0.4);
                stone(g, -4, 8.2, 7.6, 7.5, W, 0.4);
                stone(g, 3.9, 8.2, 7.8, 7.5, sh(W, 0.05), 0.4);
                stone(g, 12, 8.2, 7.6, 7.5, sh(W, -0.03), 0.4);
                grain(g, 10, W, 0.25);
                if (v) {
                    g.strokeStyle = sh(W, -0.55);
                    g.lineWidth = 0.45;
                    g.beginPath(); g.ellipse(3.6, 3.6, 1.9, 1, 0, 0, P); g.stroke(); // œil
                    g.beginPath(); g.moveTo(3, 4.6); g.lineTo(2.6, 6); g.stroke();
                    g.fillStyle = '#1e3a8a';
                    g.beginPath(); g.arc(3.6, 3.6, 0.6, 0, P); g.fill();
                    g.beginPath(); g.ellipse(11.6, 2.2, 0.9, 1.1, 0, 0, P); // ânkh
                    g.moveTo(9.8, 3.9); g.lineTo(13.4, 3.9);
                    g.moveTo(11.6, 3.3); g.lineTo(11.6, 6.6);
                    g.stroke();
                    g.beginPath(); g.moveTo(5.5, 12); g.quadraticCurveTo(7.5, 10, 9.5, 11.2); g.lineTo(10.5, 10.4); // oiseau
                    g.moveTo(6.5, 11.6); g.lineTo(6.2, 13);
                    g.moveTo(8, 11.2); g.lineTo(8.2, 13);
                    g.stroke();
                }
            }),
            // Pierres taillées en appareil décalé ; variantes : incrustation d'or, pilastre, runes luminescentes
            templewall: [0, 0, 1, 2, 3].map(v => g => {
                fill(g, sh(W, -0.45));
                [[0, 0, 8], [8, 0, 8], [-4, 5.33, 8], [4, 5.33, 8], [12, 5.33, 8], [0, 10.66, 8], [8, 10.66, 8]].forEach(([x, y, w]) => {
                    const c = sh(W, (rnd() - 0.5) * 0.22);
                    const gr = g.createLinearGradient(0, y, 0, y + 5.3);
                    gr.addColorStop(0, sh(c, 0.18));
                    gr.addColorStop(1, sh(c, -0.18));
                    g.fillStyle = gr;
                    g.beginPath();
                    g.roundRect(x + 0.45, y + 0.45, w - 0.9, 4.45, 0.6);
                    g.fill();
                    g.fillStyle = 'rgba(255,255,255,0.08)';
                    g.fillRect(x + 0.9, y + 0.6, w - 1.8, 0.4);
                });
                grain(g, 8, W, 0.2);
                if (v === 1) { // médaillon d'or incrusté
                    g.fillStyle = '#a16207';
                    g.beginPath(); g.arc(4, 8, 1.5, 0, P); g.fill();
                    disc(g, 4, 8, 1.1, '#fde047', '#ca8a04');
                }
                if (v === 2) { // pilastre
                    const gr = g.createLinearGradient(5.5, 0, 10.5, 0);
                    gr.addColorStop(0, sh(W, -0.2));
                    gr.addColorStop(0.35, sh(W, 0.3));
                    gr.addColorStop(1, sh(W, -0.3));
                    g.fillStyle = gr;
                    g.fillRect(5.5, 0, 5, 16);
                }
                if (v === 3) { // runes luminescentes
                    g.strokeStyle = '#f0abfc';
                    g.lineWidth = 0.4;
                    g.shadowColor = '#e879f9';
                    g.shadowBlur = 4;
                    [[3, 6, 1], [12, 11.3, -1]].forEach(([x, y, d]) => {
                        g.beginPath();
                        g.moveTo(x, y); g.lineTo(x + d, y + 1.5); g.lineTo(x, y + 3);
                        g.moveTo(x - d * 0.2, y + 1.5); g.lineTo(x + d * 1.4, y + 1.5);
                        g.stroke();
                    });
                    g.shadowBlur = 0;
                }
            }),
            // Canopée tropicale ; variante : fleurs
            foliage: [0, 0, 1].map(v => g => {
                fill(g, sh(F, -0.35));
                for (let k = 0; k < 7; k++) {
                    const col = ['#14532d', '#166534', '#15803d', '#22c55e'][k % 4];
                    const x = rnd() * 16, y = rnd() * 16, r = 3 + rnd() * 3;
                    g.fillStyle = 'rgba(0,0,0,0.3)';
                    g.beginPath(); g.arc(x + 0.6, y + 0.9, r, 0, P); g.fill();
                    disc(g, x, y, r, sh(col, 0.3), sh(col, -0.35));
                }
                for (let i = 0; i < 10; i++) leaf(g, rnd() * 16, rnd() * 16, 0.9, rnd() * 3, 'rgba(190,242,100,0.35)');
                if (v) [['#f472b6', 4, 5], ['#facc15', 11, 10], ['#fb7185', 8, 13]].forEach(([c, x, y]) => {
                    g.fillStyle = c;
                    for (let a = 0; a < 5; a++) { g.beginPath(); g.arc(x + Math.cos(a * 1.257) * 0.6, y + Math.sin(a * 1.257) * 0.6, 0.45, 0, P); g.fill(); }
                    g.fillStyle = '#fef08a';
                    g.beginPath(); g.arc(x, y, 0.3, 0, P); g.fill();
                });
            }),
            // Sapin noir vu de dessus ; variante : rocher
            pine: [0, 0, 1].map(v => g => {
                fill(g, F);
                grain(g, 14, F, 0.3);
                const k = v ? 0.78 : 1;
                const star = (ox, oy, s) => {
                    g.beginPath();
                    for (let i = 0; i <= 48; i++) {
                        const a = i / 48 * P, r = (5.6 + 1.7 * Math.cos(a * 8)) * k * s;
                        const px = 7.5 + ox + Math.cos(a) * r, py = 7.5 + oy + Math.sin(a) * r;
                        if (i) g.lineTo(px, py); else g.moveTo(px, py);
                    }
                    g.closePath();
                };
                g.fillStyle = 'rgba(0,0,0,0.4)';
                star(0.7, 1, 1);
                g.fill();
                const gr = g.createRadialGradient(6.5, 6.5, 0.5, 7.5, 7.5, 7.5 * k);
                gr.addColorStop(0, sh(W, 0.35));
                gr.addColorStop(1, sh(W, -0.45));
                g.fillStyle = gr;
                star(0, 0, 1);
                g.fill();
                g.globalAlpha = 0.5;
                g.fillStyle = sh(W, 0.15);
                star(0, 0, 0.55);
                g.fill();
                g.globalAlpha = 1;
                if (v) disc(g, 13, 13, 1.6, '#a8a29e', '#44403c');
            }),
            // Mur de crânes empilés ; variante : yeux rougeoyants
            bones: [0, 0, 1].map(v => g => {
                fill(g, sh(W, -0.65));
                const bone = v ? '#e7d8c9' : '#cfc3b4';
                // Crânes de tailles et teintes variées, parfois remplacés par des tibias entassés
                [[3.5, 3.5], [11.5, 3.5], [7.5, 11.5], [-0.5, 11.5], [15.5, 11.5]].forEach(([x, y]) => {
                    const b = sh(bone, (rnd() - 0.5) * 0.35);
                    if (rnd() < 0.22) {
                        g.strokeStyle = b; g.lineWidth = 1;
                        for (let i = 0; i < 3; i++) { const yy = y - 1.5 + i * 1.4; g.beginPath(); g.moveTo(x - 2.4, yy + (rnd() - 0.5)); g.lineTo(x + 2.4, yy + (rnd() - 0.5)); g.stroke(); }
                    } else skull(g, x + (rnd() - 0.5) * 0.8, y + (rnd() - 0.5) * 0.8, 1 + rnd() * 0.3, b, '#1a0606');
                });
                if (v) {
                    g.fillStyle = '#ef4444';
                    g.shadowColor = '#ef4444';
                    g.shadowBlur = 5;
                    [2.5, 4.5].forEach(x => { g.beginPath(); g.arc(x, 3.6, 0.4, 0, P); g.fill(); });
                    g.shadowBlur = 0;
                }
            })
        };

        const floors = [0, 1, 2, 3, 4, 5, 6, 7].map(() => mk(FLOORS[look.floor] || FLOORS.flag));
        // Usure des murs selon le biome : humidité, lierre, poussière, sable, taches, suie
        const WEATHER = {
            brick(g) {
                for (let i = 0; i < 3; i++) {
                    const x = 1 + rnd() * 13, h = 5 + rnd() * 9, gr = g.createLinearGradient(0, 0, 0, h);
                    gr.addColorStop(0, 'rgba(0,0,0,0.4)');
                    gr.addColorStop(1, 'rgba(0,0,0,0)');
                    g.fillStyle = gr;
                    g.fillRect(x, 0, 0.8 + rnd() * 1.4, h);
                }
                for (let i = 0; i < 14; i++) { g.globalAlpha = 0.8; disc(g, rnd() * 16, 13 + rnd() * 3, 0.5 + rnd() * 1.1, '#65a30d', '#365314'); }
                g.globalAlpha = 0.45;
                disc(g, 3 + rnd() * 10, 3 + rnd() * 8, 1.2 + rnd(), '#b45309', '#7c2d12');
                g.globalAlpha = 1;
            },
            block(g) {
                crack(g, sh(W, -0.7), 0.35);
                const x0 = rnd() < 0.5 ? 1 : 12;
                g.strokeStyle = '#365314'; g.lineWidth = 0.4;
                g.beginPath(); g.moveTo(x0 + 1.5, 0); g.quadraticCurveTo(x0 - 1, 6, x0 + 1.5, 12); g.stroke();
                for (let i = 0; i < 12; i++) leaf(g, x0 + 1 + (rnd() - 0.5) * 4, rnd() * 12, 0.7 + rnd() * 0.5, rnd() * 3, rnd() < 0.5 ? '#3f6212' : '#65a30d');
            },
            cryptwall(g) {
                g.strokeStyle = 'rgba(231,229,228,0.35)'; g.lineWidth = 0.12;
                for (let i = 0; i < 5; i++) { const a = i / 4 * Math.PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 7, Math.sin(a) * 7); g.stroke(); }
                [2.5, 4.5, 6.5].forEach(r => { g.beginPath(); g.arc(0, 0, r, 0, Math.PI / 2); g.stroke(); });
                grain(g, 20, '#a8a29e', 0.2, 0.6);
            },
            sandstone(g) {
                const gr = g.createLinearGradient(0, 10, 0, 16);
                gr.addColorStop(0, '#e2bf78');
                gr.addColorStop(1, '#b8914f');
                g.fillStyle = gr;
                g.beginPath(); g.moveTo(0, 16); g.lineTo(0, 13 + rnd() * 2); g.quadraticCurveTo(8, 9.5 + rnd() * 3, 16, 13 + rnd() * 2); g.lineTo(16, 16); g.fill();
                for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(rnd() * 16, rnd() * 10, 0.3 + rnd() * 0.5, 0, P); g.fill(); }
            },
            templewall(g) {
                for (let i = 0; i < 3; i++) { g.globalAlpha = 0.3; disc(g, rnd() * 16, rnd() * 16, 1.5 + rnd() * 2.5, '#1c1917', '#000000'); }
                g.globalAlpha = 1;
                crack(g, sh(W, -0.65));
                for (let i = 0; i < 6; i++) { g.fillStyle = '#facc15'; g.beginPath(); g.arc(rnd() * 16, rnd() * 16, 0.2, 0, P); g.fill(); }
            },
            bones(g) {
                const gr = g.createLinearGradient(0, 0, 0, 10);
                gr.addColorStop(0, 'rgba(0,0,0,0.5)');
                gr.addColorStop(1, 'rgba(0,0,0,0)');
                g.fillStyle = gr;
                g.fillRect(0, 0, 16, 10);
                let x = 2 + rnd() * 4, y = 10 + rnd() * 4;
                const pts = [[x, y]];
                for (let i = 0; i < 4; i++) { x += 2 + rnd() * 1.5; y += (rnd() - 0.5) * 2; pts.push([x, y]); }
                [[1, 'rgba(234,88,12,0.4)'], [0.35, '#fb923c']].forEach(([wid, col]) => { g.strokeStyle = col; g.lineWidth = wid; g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.stroke(); });
            }
        };
        const wallBase = WALLS[look.wall] || WALLS.brick, wear = WEATHER[look.wall];
        // Extérieur : sous-bois sombre en tuile, et cimes d'arbres plus grandes que la tuile, posées par-dessus pour un couvert continu
        const walls = look.outdoor
            ? [0, 1, 2].map(() => mk(g => { fill(g, sh(F, -0.5)); grain(g, 20, sh(F, -0.5), 0.3); }))
            : [wallBase[0], wallBase[0], wallBase[0]].concat(wallBase.slice(1), wear ? [0, 1, 2].map(() => g => { wallBase[0](g); wear(g); }) : []).map(fn => mk(fn));
        const crown = v => {
            const [c, g] = this.canvas(26, 26, PX);
            const cx = 13, cy = 13;
            if (look.wall === 'pine') {
                const star = (r0, amp, n, rot) => {
                    g.beginPath();
                    for (let i = 0; i <= 64; i++) {
                        const a = i / 64 * P, r = r0 + amp * Math.cos(a * n + rot);
                        if (i) g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); else g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
                    }
                    g.closePath();
                };
                if (v < 4) { g.save(); g.translate(1.2, 1.8); g.fillStyle = 'rgba(0,0,0,0.45)'; star(9.5 * [1, 0.88, 0.8, 0.95][v], 2, 9, 0); g.fill(); g.restore(); }
                else { g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(cx + 1.2, cy + 1.8, v === 4 ? 7.5 : 10.5, v === 4 ? 6.5 : 10, 0, 0, P); g.fill(); }
                if (v === 4) {
                    // Rocher moussu
                    disc(g, cx, cy, 6.5, '#78716c', '#292524');
                    disc(g, cx - 1.5, cy - 2, 4.2, '#4d7c0f', '#1a2e05');
                    for (let i = 0; i < 8; i++) { g.fillStyle = '#84cc16'; g.beginPath(); g.arc(cx - 3 + rnd() * 5, cy - 4 + rnd() * 4, 0.3, 0, P); g.fill(); }
                    return c;
                }
                if (v === 5) {
                    // Feuillu sombre (chêne)
                    disc(g, cx, cy, 10, '#3f6212', '#1a2e05');
                    for (let k = 0; k < 9; k++) { const a = rnd() * P, d = 2 + rnd() * 5; disc(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2.5 + rnd() * 2, sh('#4d7c0f', 0.15), sh('#365314', -0.3)); }
                    return c;
                }
                const sz = [1, 0.88, 0.8, 0.95][v], hue = [0, 0.08, -0.08, 0.15][v];
                [[9.5, 2, 0.5, -0.45], [7, 1.6, 0.9, -0.2], [4.6, 1.2, 1.4, 0.05], [2.4, 0.8, 1.9, 0.3]].forEach(([r0, amp, rot, f]) => {
                    const gr = g.createRadialGradient(cx - 3, cy - 3, 0.5, cx, cy, (r0 + amp) * sz);
                    gr.addColorStop(0, sh(W, f + 0.25 + hue));
                    gr.addColorStop(1, sh(W, f - 0.15 + hue));
                    g.fillStyle = gr;
                    star(r0 * sz, amp * sz, 9, rot + v);
                    g.fill();
                });
            } else if (v === 4) {
                // Palmier : palmes rayonnantes
                g.fillStyle = 'rgba(0,0,0,0.4)';
                g.beginPath(); g.ellipse(cx + 1.5, cy + 2, 10, 9, 0, 0, P); g.fill();
                for (let i = 0; i < 9; i++) {
                    const a = i / 9 * P + rnd() * 0.3, len = 9 + rnd() * 2.5;
                    g.save();
                    g.translate(cx, cy);
                    g.rotate(a);
                    const gr = g.createLinearGradient(0, 0, len, 0);
                    gr.addColorStop(0, '#166534');
                    gr.addColorStop(1, '#4ade80');
                    g.fillStyle = gr;
                    g.beginPath(); g.ellipse(len / 2, 0, len / 2, 1.8, 0, 0, P); g.fill();
                    g.strokeStyle = '#14532d'; g.lineWidth = 0.3;
                    g.beginPath(); g.moveTo(0, 0); g.lineTo(len, 0); g.stroke();
                    g.restore();
                }
                disc(g, cx, cy, 1.8, '#a16207', '#422006');
            } else {
                g.fillStyle = 'rgba(0,0,0,0.4)';
                g.beginPath(); g.ellipse(cx + 1.5, cy + 2, 10.5, 10, 0, 0, P); g.fill();
                const dark = v === 5 ? -0.25 : 0;
                disc(g, cx, cy, 10, sh('#15803d', dark), '#0f3d1e');
                for (let k = 0; k < 10; k++) {
                    const a = rnd() * P, d = 2 + rnd() * 6, r = 2.6 + rnd() * 2.4;
                    const col = sh(['#166534', '#15803d', '#16a34a', '#22c55e', '#65a30d'][(k + v) % 5], dark);
                    disc(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d, r, sh(col, 0.35), sh(col, -0.3));
                }
                for (let i = 0; i < 12; i++) leaf(g, cx + (rnd() - 0.5) * 16, cy + (rnd() - 0.5) * 16, 0.9, rnd() * 3, 'rgba(217,249,157,0.35)');
                if (v === 5) for (let i = 0; i < 3; i++) { g.strokeStyle = '#3f6212'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(cx - 6 + i * 5, cy - 6); g.quadraticCurveTo(cx - 4 + i * 5, cy + 2, cx - 6 + i * 5, cy + 9); g.stroke(); }
                if (v === 2 || v === 3) [['#f472b6', -4, -3], ['#facc15', 3, 2], ['#fb7185', -1, 5]].forEach(([col, dx, dy]) => {
                    g.fillStyle = col;
                    for (let a = 0; a < 5; a++) { g.beginPath(); g.arc(cx + dx + Math.cos(a * 1.257) * 0.7, cy + dy + Math.sin(a * 1.257) * 0.7, 0.5, 0, P); g.fill(); }
                });
            }
            return c;
        };
        const crowns = look.outdoor ? [0, 1, 2, 3, 4, 5].map(crown) : null;
        // Profondeur : face avant d'un mur (sol en dessous), liseré du haut, ombre portée sur le sol
        const face = mk(g => {
            const gr = g.createLinearGradient(0, 9, 0, 16);
            gr.addColorStop(0, 'rgba(0,0,0,0)');
            gr.addColorStop(1, 'rgba(0,0,0,0.55)');
            g.fillStyle = gr;
            g.fillRect(0, 9, 16, 7);
            g.fillStyle = 'rgba(0,0,0,0.6)';
            g.fillRect(0, 15.4, 16, 0.6);
        });
        const rim = mk(g => {
            const c = sh(W, 0.5), gr = g.createLinearGradient(0, 0, 0, 2.5);
            gr.addColorStop(0, this.rgba(c, 0.75));
            gr.addColorStop(1, this.rgba(c, 0));
            g.fillStyle = gr;
            g.fillRect(0, 0, 16, 2.5);
        });
        const shade = mk(g => {
            const gr = g.createLinearGradient(0, 0, 0, 6);
            gr.addColorStop(0, 'rgba(0,0,0,0.55)');
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            g.fillStyle = gr;
            g.fillRect(0, 0, 16, 6);
        });
        return (this.cache[ck] = { floors, walls, inner: look.outdoor ? walls.length : 3, crowns, face, rim, shade });
    }
};

// Décor de sol en version lissée (tuile 16 unités en x, y) ; mêmes types que drawProp
function drawPropHD(g, kind, x, y, now, light) {
    const P = Math.PI * 2;
    const E = (cx, cy, rx, ry, col, rot = 0) => { g.fillStyle = col; g.beginPath(); g.ellipse(x + cx, y + cy, rx, ry, rot, 0, P); g.fill(); };
    const Ln = (pts, col, wid) => {
        g.strokeStyle = col;
        g.lineWidth = wid;
        g.beginPath();
        pts.forEach(([a, b], i) => (i ? g.lineTo(x + a, y + b) : g.moveTo(x + a, y + b)));
        g.stroke();
    };
    const shadow = (cx, cy, rx) => E(cx, cy, rx, rx * 0.35, 'rgba(0,0,0,0.35)');
    const bone = (x0, y0, x1, y1, col) => {
        Ln([[x0, y0], [x1, y1]], col, 0.9);
        const a = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2, dx = Math.cos(a) * 0.4, dy = Math.sin(a) * 0.4;
        [[x0, y0], [x1, y1]].forEach(([u, v]) => { E(u - dx, v - dy, 0.55, 0.55, col); E(u + dx, v + dy, 0.55, 0.55, col); });
    };
    const skull = (cx, cy, s) => {
        E(cx + 0.3, cy + 1.9 * s, 2 * s, 0.6 * s, 'rgba(0,0,0,0.35)');
        E(cx, cy, 2 * s, 1.8 * s, '#e7e5e4');
        E(cx, cy + 1.3 * s, 1.2 * s, 0.8 * s, '#d6d3d1');
        E(cx - 0.75 * s, cy + 0.1 * s, 0.5 * s, 0.6 * s, '#1c1917');
        E(cx + 0.75 * s, cy + 0.1 * s, 0.5 * s, 0.6 * s, '#1c1917');
        E(cx - 0.6 * s, cy - 0.8 * s, 0.6 * s, 0.35 * s, 'rgba(255,255,255,0.5)');
    };
    const grad = (x0, y0, x1, y1, a, b) => { const gr = g.createLinearGradient(x + x0, y + y0, x + x1, y + y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
    switch (kind) {
        case 'bones': shadow(8, 11.5, 4.5); bone(4, 11, 12, 10, '#d6d3d1'); bone(6, 7.5, 11, 9.5, '#a8a29e'); break;
        case 'chain':
            g.lineWidth = 0.6;
            for (let i = 0; i < 5; i++) {
                g.strokeStyle = i % 2 ? '#4b5563' : '#9ca3af';
                g.beginPath();
                g.ellipse(x + 8, y + 3 + i * 2.3, i % 2 ? 0.5 : 1, 1.3, 0, 0, P);
                g.stroke();
            }
            E(8, 14.5, 2.4, 0.7, '#374151');
            break;
        case 'puddle': {
            E(8, 10.5, 4.6, 2.2, '#16304d');
            E(7.4, 10, 3, 1.2, '#1e4a7a');
            E(6.4, 9.6, 1.3, 0.4, 'rgba(147,197,253,0.6)');
            const t = (now / 1400 + x * 0.1) % 1;
            g.globalAlpha = 1 - t;
            g.strokeStyle = '#93c5fd';
            g.lineWidth = 0.25;
            g.beginPath();
            g.ellipse(x + 8.5, y + 10.6, t * 3.5 + 0.1, t * 1.5 + 0.1, 0, 0, P);
            g.stroke();
            g.globalAlpha = 1;
            break;
        }
        case 'rubble':
            shadow(8, 12.5, 5.5);
            [[5, 11.4, 2.2, 1.6, '#64748b'], [10, 12, 1.6, 1.1, '#475569'], [12, 10.6, 1.7, 1.5, '#94a3b8'], [7.6, 12.6, 1, 0.7, '#94a3b8']]
                .forEach(([a, b, rx, ry, c]) => { E(a, b, rx, ry, c); E(a - rx * 0.3, b - ry * 0.4, rx * 0.5, ry * 0.35, Pixel.shade(c, 0.3)); });
            break;
        case 'tuft':
            g.lineWidth = 0.45;
            [[6, 13, -1, 3, '#4d7c0f'], [8, 13, 0.4, 4, '#65a30d'], [10, 13, 1.2, 2.6, '#4d7c0f'], [7, 13, -0.4, 2.4, '#3f6212'], [9, 13, 0.8, 3.2, '#84cc16']]
                .forEach(([a, b, l, h, c]) => {
                    g.strokeStyle = c;
                    g.beginPath();
                    g.moveTo(x + a, y + b);
                    g.quadraticCurveTo(x + a + l * 0.3, y + b - h * 0.6, x + a + l, y + b - h);
                    g.stroke();
                });
            break;
        case 'skull': skull(8, 9.5, 1.1); break;
        case 'candle':
            E(8, 13.6, 2.4, 0.7, '#a8a29e');
            g.fillStyle = '#e7e5e4';
            g.beginPath(); g.roundRect(x + 7, y + 8.5, 2, 5, 0.5); g.fill();
            E(7.5, 9.6, 0.35, 1, 'rgba(255,255,255,0.6)');
            HD.flame(g, x + 8, y + 8.4, 1.5, 3, '#c084fc', now, x);
            light(x + 8, y + 7, 16, '#a855f7', 0.45);
            break;
        case 'urn': {
            shadow(8, 13.4, 3.2);
            const gr = g.createRadialGradient(x + 6.8, y + 9, 0.3, x + 8, y + 10, 3.4);
            gr.addColorStop(0, '#ea7a35');
            gr.addColorStop(1, '#7c2d12');
            E(8, 10, 3, 3.2, gr);
            g.fillStyle = '#78350f';
            g.fillRect(x + 6.8, y + 5.6, 2.4, 1.6);
            E(8, 5.7, 1.6, 0.5, '#92400e');
            g.fillStyle = '#facc15';
            g.fillRect(x + 5.1, y + 9.2, 5.8, 0.6);
            break;
        }
        case 'sandpile':
            g.fillStyle = grad(0, 9, 0, 13, '#ecd29a', '#a8874f');
            g.beginPath(); g.ellipse(x + 8, y + 12.6, 4.6, 2.6, 0, Math.PI, 0); g.fill();
            break;
        case 'brazier':
            E(8, 14.4, 3, 0.7, 'rgba(0,0,0,0.35)');
            Ln([[6, 14], [7.5, 11]], '#713f12', 0.7);
            Ln([[10, 14], [8.5, 11]], '#713f12', 0.7);
            g.fillStyle = '#a16207';
            g.beginPath(); g.ellipse(x + 8, y + 9.6, 3.2, 1.4, 0, 0, Math.PI); g.fill();
            E(8, 9.6, 3.2, 0.7, '#422006');
            HD.flame(g, x + 8, y + 9.6, 3.6, 5, '#e879f9', now, x);
            light(x + 8, y + 7, 26, '#e879f9', 0.5);
            break;
        case 'rune':
            g.globalAlpha = 0.45 + 0.25 * Math.sin(now * 0.003 + x);
            g.strokeStyle = '#facc15';
            g.lineWidth = 0.45;
            g.beginPath();
            g.arc(x + 8, y + 8, 4, 0, P);
            g.moveTo(x + 4.5, y + 8); g.lineTo(x + 11.5, y + 8);
            g.moveTo(x + 8, y + 4.5); g.lineTo(x + 8, y + 11.5);
            g.moveTo(x + 6, y + 6); g.lineTo(x + 10, y + 10);
            g.stroke();
            g.globalAlpha = 1;
            light(x + 8, y + 8, 12, '#facc15', 0.25);
            break;
        case 'fern':
            g.lineWidth = 0.4;
            [[-1, 4], [1, 4], [-0.5, 6], [0.55, 6], [0, 7]].forEach(([dx, h], i) => {
                const ex = 8 + dx * 5, ey = 12 - h, ang = Math.atan2(ey - 12, ex - 8);
                g.strokeStyle = i % 2 ? '#15803d' : '#16a34a';
                g.beginPath();
                g.moveTo(x + 8, y + 12);
                g.quadraticCurveTo(x + 8 + dx * 1.5, y + ey - 1, x + ex, y + ey);
                g.stroke();
                for (let k = 1; k < 4; k++) {
                    const t = k / 4;
                    E(8 + (ex - 8) * t, 12 + (ey - 12) * t, 1.1 * (1 - t * 0.4), 0.4, '#22c55e', ang + 0.9);
                    E(8 + (ex - 8) * t, 12 + (ey - 12) * t, 1.1 * (1 - t * 0.4), 0.4, '#22c55e', ang - 0.9);
                }
            });
            break;
        case 'flower':
            Ln([[7.5, 13], [7.5, 8]], '#15803d', 0.4);
            Ln([[10.5, 13], [10.5, 10.5]], '#15803d', 0.35);
            E(8.6, 11, 1, 0.4, '#22c55e', -0.5);
            for (let a = 0; a < 5; a++) E(7.5 + Math.cos(a * 1.257) * 0.9, 7.5 + Math.sin(a * 1.257) * 0.9, 0.7, 0.7, '#f472b6');
            E(7.5, 7.5, 0.5, 0.5, '#fde047');
            E(10.5, 10, 0.7, 0.7, '#fb923c');
            break;
        case 'mushroom': {
            E(8, 13.3, 3, 0.6, 'rgba(0,0,0,0.35)');
            g.fillStyle = '#e7e5e4';
            g.fillRect(x + 7.2, y + 9.5, 1.6, 3.8);
            const gr = g.createRadialGradient(x + 7, y + 8, 0.3, x + 8, y + 9, 3.2);
            gr.addColorStop(0, '#99f6e4');
            gr.addColorStop(1, '#0f766e');
            g.fillStyle = gr;
            g.beginPath(); g.ellipse(x + 8, y + 9.6, 3.2, 2.2, 0, Math.PI, 0); g.fill();
            E(6.8, 8.6, 0.4, 0.3, '#ccfbf1');
            E(9.2, 8.2, 0.35, 0.25, '#ccfbf1');
            light(x + 8, y + 9, 14, '#2dd4bf', 0.4);
            break;
        }
        case 'log':
            E(8, 12.2, 6.5, 1, 'rgba(0,0,0,0.35)');
            g.fillStyle = grad(0, 8.5, 0, 12, '#8a5a30', '#3f2412');
            g.beginPath(); g.roundRect(x + 2, y + 8.5, 11.5, 3.4, 1.7); g.fill();
            E(13.2, 10.2, 1.2, 1.7, '#c08a4a');
            g.strokeStyle = '#7c4a1e';
            g.lineWidth = 0.25;
            g.beginPath(); g.ellipse(x + 13.2, y + 10.2, 0.6, 0.9, 0, 0, P); g.stroke();
            E(5, 8.7, 1.4, 0.5, '#4d7c0f');
            break;
        case 'lava': {
            const k = Math.sin(now * 0.004 + x) * 0.5 + 0.5;
            const gr = g.createRadialGradient(x + 8, y + 9.5, 0.4, x + 8, y + 9.5, 5);
            gr.addColorStop(0, '#fef08a');
            gr.addColorStop(0.45, '#f97316');
            gr.addColorStop(1, '#7c2d12');
            E(8, 9.5, 5, 2.6, gr, 0.2);
            E(6 + k * 4, 9 + k, 0.6 * (1 - k) + 0.2, 0.6 * (1 - k) + 0.2, '#fde047');
            light(x + 8, y + 9, 18 + k * 2, '#f97316', 0.55);
            break;
        }
        case 'skullpile': skull(5, 11, 0.95); skull(11, 11, 0.95); skull(8, 8, 1); break;
    }
}

// ==================== 7d. TEXTURES DE BIOME : zones de matière, taches et décals au sol ====================
// Tout est dessiné une seule fois dans les blocs de tuiles en cache : aucun coût par image.
const hash2 = (x, y, s) => { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); };
const smoothstep = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
// Bruit de valeur lissé : zones de matière qui s'étendent sur plusieurs tuiles, aux bords progressifs
function valueNoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), u = smoothstep(0, 1, x - xi), v = smoothstep(0, 1, y - yi);
    const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const zoneNoise = (c, r, s) => 0.65 * valueNoise(c / 6.5, r / 6.5, s) + 0.35 * valueNoise(c / 2.7, r / 2.7, s + 17);

// Par biome : zones [matière, seuil] (une tache douce par tuile au-delà du seuil), décals courants, décals propres à chaque zone, densité
const BIOME_DETAIL = {
    dungeon:   { zones: [['wet', 0.55], ['grime', 0.5], ['rubble', 0.6]], decals: ['crack', 'crack', 'pebbles', 'pebbles', 'grate', 'straw', 'rust', 'bonebits', 'stain', 'stain'], zoneDecals: [['puddlet', 'stain', 'rust'], ['straw', 'bonebits', 'crack'], ['pebbles', 'crack']], density: 0.24 },
    castle:    { zones: [['grassy', 0.52], ['rubble', 0.58]], decals: ['crack', 'shards', 'tuft', 'leaf', 'banner', 'pebbles', 'moss'], zoneDecals: [['tuft', 'moss', 'leaf'], ['shards', 'pebbles', 'crack']], density: 0.22 },
    crypt:     { zones: [['bonebed', 0.56], ['dust', 0.52]], decals: ['crack', 'bonebits', 'cobweb', 'wax', 'stain', 'skullbit'], zoneDecals: [['bonebits', 'skullbit'], ['cobweb', 'crack', 'wax']], density: 0.2 },
    pyramid:   { zones: [['dune', 0.5], ['grime', 0.6]], decals: ['sandheap', 'pottery', 'scarab', 'pebbles', 'crack', 'glyph'], zoneDecals: [['sandheap', 'scarab'], ['pottery', 'crack', 'glyph']], density: 0.2 },
    temple:    { zones: [['mosaic', 0.57], ['goldwork', 0.6]], decals: ['coins', 'petals', 'crack', 'ash', 'stain', 'runelet'], zoneDecals: [['petals', 'coins'], ['runelet', 'coins']], density: 0.18 },
    jungle:    { zones: [['dirt', 0.53], ['mud', 0.6], ['clearing', 0.58]], decals: ['root', 'leaf', 'pebbles', 'shroom', 'tuft', 'petals', 'twigs'], zoneDecals: [['root', 'pebbles', 'twigs'], ['puddlet', 'root'], ['petals', 'tuft']], density: 0.3 },
    forest:    { zones: [['leaves', 0.5], ['mossbed', 0.55]], decals: ['twigs', 'pinecone', 'leaf', 'shroom', 'stonemoss', 'root'], zoneDecals: [['leaf', 'twigs', 'pinecone'], ['shroom', 'stonemoss']], density: 0.3 },
    catacombs: { zones: [['lavaflow', 0.6], ['ash', 0.52]], decals: ['scorch', 'embercrack', 'bonebits', 'obsidian', 'ash', 'skullbit'], zoneDecals: [['embercrack', 'obsidian'], ['scorch', 'ash', 'bonebits']], density: 0.22 }
};

// Outils de dessin partagés par les taches (40 unités) et les décals (16 unités)
function detailKit(g, rnd) {
    const P = Math.PI * 2;
    const k = {
        P, rnd,
        pick: arr => arr[(rnd() * arr.length) | 0],
        fill(col) { g.globalAlpha = 1; g.fillStyle = col; g.fillRect(-50, -50, 200, 200); },
        dot(x, y, r, col, a = 1) { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, P); g.fill(); g.globalAlpha = 1; },
        ell(x, y, rx, ry, rot, col, a = 1) { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, P); g.fill(); g.globalAlpha = 1; },
        line(pts, col, wid, a = 1) {
            g.globalAlpha = a;
            g.strokeStyle = col;
            g.lineWidth = wid;
            g.lineCap = g.lineJoin = 'round';
            g.beginPath();
            pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
            g.stroke();
            g.globalAlpha = 1;
        },
        spots(n, S, cols, r0, r1, a0, a1, m = 0) {
            for (let i = 0; i < n; i++) k.dot(m + rnd() * (S - 2 * m), m + rnd() * (S - 2 * m), r0 + rnd() * (r1 - r0), k.pick(cols), a0 + rnd() * (a1 - a0));
        },
        blades(n, S, cols, h0, h1, m = 0) {
            for (let i = 0; i < n; i++) {
                const x = m + rnd() * (S - 2 * m), y = m + rnd() * (S - 2 * m), h = h0 + rnd() * (h1 - h0), l = (rnd() - 0.5) * h * 0.8;
                g.strokeStyle = k.pick(cols);
                g.lineWidth = 0.32;
                g.lineCap = 'round';
                g.beginPath();
                g.moveTo(x, y);
                g.quadraticCurveTo(x + l * 0.3, y - h * 0.6, x + l, y - h);
                g.stroke();
            }
        },
        // Caillou ombré (lumière en haut à gauche)
        stone(x, y, r, col) {
            k.ell(x + r * 0.25, y + r * 0.35, r, r * 0.75, 0, '#000000', 0.35);
            const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
            gr.addColorStop(0, Pixel.shade(col, 0.35));
            gr.addColorStop(1, Pixel.shade(col, -0.3));
            g.fillStyle = gr;
            g.beginPath();
            g.ellipse(x, y, r, r * 0.75, rnd() * 3, 0, P);
            g.fill();
        },
        stones(n, S, cols, r0, r1, m = 0) { for (let i = 0; i < n; i++) k.stone(m + rnd() * (S - 2 * m), m + rnd() * (S - 2 * m), r0 + rnd() * (r1 - r0), k.pick(cols)); },
        bone(x, y, len, ang, col) {
            const dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2;
            k.line([[x - dx, y - dy], [x + dx, y + dy]], col, len * 0.18);
            const px = -Math.sin(ang) * len * 0.1, py = Math.cos(ang) * len * 0.1;
            [[x - dx, y - dy], [x + dx, y + dy]].forEach(([u, v]) => { k.dot(u + px, v + py, len * 0.13, col); k.dot(u - px, v - py, len * 0.13, col); });
        },
        // Marche aléatoire : fissures, coulées, racines
        walk(x, y, steps, len, ang, turn) {
            const pts = [[x, y]];
            for (let i = 0; i < steps; i++) { ang += (rnd() - 0.5) * turn; x += Math.cos(ang) * len; y += Math.sin(ang) * len; pts.push([x, y]); }
            return pts;
        },
        leaf(x, y, s, col, a = 0.95) {
            const rot = rnd() * P;
            k.ell(x, y, s, s * 0.48, rot, col, a);
            k.line([[x - Math.cos(rot) * s * 0.8, y - Math.sin(rot) * s * 0.8], [x + Math.cos(rot) * s * 0.8, y + Math.sin(rot) * s * 0.8]], Pixel.shade(col, -0.35), 0.12, 0.7);
        },
        skull(x, y, s) {
            k.ell(x + 0.3, y + 0.5, 2 * s, 1.7 * s, 0, '#000000', 0.35);
            k.ell(x, y, 2 * s, 1.8 * s, 0, '#e7e5e4');
            k.ell(x, y + 1.3 * s, 1.2 * s, 0.8 * s, 0, '#d6d3d1');
            k.ell(x - 0.75 * s, y + 0.1 * s, 0.5 * s, 0.6 * s, 0, '#1c1917');
            k.ell(x + 0.75 * s, y + 0.1 * s, 0.5 * s, 0.6 * s, 0, '#1c1917');
        },
        g
    };
    return k;
}

// Taches de matière (canevas 40 × 40), adoucies ensuite par un masque irrégulier
const DETAIL_PATCHES = {
    wet(k, S) {
        k.fill('rgba(8,16,30,0.42)');
        k.spots(40, S, ['#0b1220', '#111827'], 1.5, 4, 0.2, 0.4);
        const x = 14 + k.rnd() * 12, y = 14 + k.rnd() * 12;
        k.ell(x, y, 6, 3, 0.2, '#132a44', 0.75);
        k.ell(x - 1, y - 0.6, 3.5, 1.2, 0.2, '#1e4a7a', 0.6);
        k.ell(x - 2, y - 1, 1.6, 0.4, 0.2, '#93c5fd', 0.45);
        for (let i = 0; i < 14; i++) k.ell(k.rnd() * S, k.rnd() * S, 1 + k.rnd() * 2, 0.25, 0.3, '#93c5fd', 0.12);
    },
    grime(k, S) {
        // Salissures : voile sombre, poussière fine et coulures
        k.fill('rgba(20,12,6,0.2)');
        k.spots(160, S, ['#1c1917', '#292524', '#3f2a1d', '#44403c'], 0.2, 1.1, 0.12, 0.3);
        for (let i = 0; i < 6; i++) k.ell(k.rnd() * S, k.rnd() * S, 2 + k.rnd() * 4, 0.6 + k.rnd(), k.rnd() * 3, '#1c1917', 0.12);
    },
    grassy(k, S) {
        k.fill('rgba(63,98,18,0.32)');
        k.spots(25, S, ['#3f6212', '#4d7c0f', '#365314'], 1.5, 3.5, 0.2, 0.4);
        k.blades(170, S, ['#4d7c0f', '#65a30d', '#3f6212', '#84cc16'], 1.2, 3, 2);
    },
    rubble(k, S) {
        k.fill('rgba(0,0,0,0.12)');
        k.spots(40, S, ['#94a3b8', '#64748b'], 0.2, 0.6, 0.3, 0.6, 4);
        k.stones(34, S, ['#64748b', '#475569', '#94a3b8', '#78716c'], 0.5, 1.7, 4);
    },
    bonebed(k, S) {
        k.fill('rgba(214,211,209,0.07)');
        k.spots(30, S, ['#a8a29e', '#78716c'], 0.5, 2, 0.1, 0.25);
        for (let i = 0; i < 26; i++) k.bone(5 + k.rnd() * 30, 5 + k.rnd() * 30, 1.6 + k.rnd() * 2.4, k.rnd() * 7, k.pick(['#d6d3d1', '#e7e5e4', '#a8a29e']));
        for (let i = 0; i < 2; i++) k.skull(10 + k.rnd() * 20, 10 + k.rnd() * 20, 0.7);
    },
    dust(k, S) {
        k.fill('rgba(196,181,253,0.05)');
        k.spots(60, S, ['#a8a29e', '#c4b5fd', '#57534e'], 1, 4, 0.06, 0.18);
        k.spots(80, S, ['#e7e5e4'], 0.1, 0.25, 0.2, 0.45);
    },
    dune(k, S) {
        const gr = k.g.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
        gr.addColorStop(0, '#e2bf78');
        gr.addColorStop(1, '#c9a35a');
        k.g.fillStyle = gr;
        k.g.fillRect(0, 0, S, S);
        for (let i = 0; i < 9; i++) {
            const y = 3 + i * 4 + k.rnd() * 2;
            k.line([[0, y], [10, y - 1.5], [20, y + 1], [30, y - 1], [40, y]], '#f5dca0', 0.45, 0.55);
            k.line([[0, y + 0.7], [10, y - 0.8], [20, y + 1.7], [30, y - 0.3], [40, y + 0.7]], '#a8834a', 0.3, 0.35);
        }
        k.spots(90, S, ['#f5dca0', '#a8834a'], 0.12, 0.35, 0.3, 0.6);
    },
    // Motifs alignés sur la grille (période 16 = une tuile) : les taches voisines se raccordent sans couture.
    // L'origine de la tache est à -12 unités de sa tuile, d'où le décalage de 12.
    mosaic(k, S) {
        const pal = ['#a16207', '#115e59', '#d6d3d1', '#831843', '#115e59'];
        k.fill('rgba(20,8,24,0.45)');
        for (let y = -4; y < S; y += 1.6) for (let x = -4; x < S; x += 1.6) {
            if (k.rnd() < 0.1) continue; // tesselles manquantes
            const tx = fxWrap(x + 0.8 - 12, 16) - 8, ty = fxWrap(y + 0.8 - 12, 16) - 8;
            const d = Math.max(Math.abs(tx), Math.abs(ty)), diag = Math.abs(Math.abs(tx) - Math.abs(ty)) < 1;
            k.g.globalAlpha = 0.75;
            k.g.fillStyle = Pixel.shade(diag && d > 3 ? '#a16207' : pal[Math.min(4, Math.floor(d / 1.8))], (k.rnd() - 0.5) * 0.25);
            k.g.fillRect(x + 0.1, y + 0.1, 1.4, 1.4);
        }
        k.g.globalAlpha = 1;
    },
    goldwork(k, S) {
        const g = k.g;
        g.strokeStyle = '#facc15';
        g.lineWidth = 0.45;
        g.globalAlpha = 0.5;
        for (let cy = -12; cy < S + 8; cy += 16) for (let cx = -12; cx < S + 8; cx += 16) {
            // Rosace centrée sur chaque tuile, liée aux voisines par des diagonales
            [3, 5.5].forEach(r => { g.beginPath(); g.arc(cx + 8, cy + 8, r, 0, k.P); g.stroke(); });
            g.beginPath();
            g.moveTo(cx, cy); g.lineTo(cx + 16, cy + 16);
            g.moveTo(cx + 16, cy); g.lineTo(cx, cy + 16);
            g.stroke();
            for (let i = 0; i < 8; i++) { const a = i / 8 * k.P; k.dot(cx + 8 + Math.cos(a) * 5.5, cy + 8 + Math.sin(a) * 5.5, 0.45, '#fde68a', 0.7); }
            g.globalAlpha = 0.5;
        }
        g.globalAlpha = 1;
        k.spots(30, S, ['#422006', '#1c1917'], 0.4, 1.6, 0.12, 0.25);
    },
    dirt(k, S) {
        k.fill('rgba(91,68,35,0.85)');
        k.spots(60, S, ['#3f2e17', '#7c5a2e', '#4a3720', '#6b4f2a'], 0.5, 2.5, 0.3, 0.6);
        k.stones(14, S, ['#78716c', '#57534e', '#a8a29e'], 0.4, 1, 3);
        for (let i = 0; i < 3; i++) k.line(k.walk(k.rnd() * S, k.rnd() * S, 8, 2, k.rnd() * 7, 1.2), '#4a2c14', 0.6, 0.8);
    },
    mud(k, S) {
        k.fill('rgba(52,36,18,0.9)');
        k.spots(30, S, ['#2a1c0c', '#4a3420', '#3b2a16'], 1, 4, 0.3, 0.6);
        for (let i = 0; i < 3; i++) k.ell(8 + k.rnd() * 24, 8 + k.rnd() * 24, 2.5 + k.rnd() * 3, 1.2 + k.rnd(), k.rnd(), '#1f2a1a', 0.6);
        for (let i = 0; i < 12; i++) k.ell(k.rnd() * S, k.rnd() * S, 0.8 + k.rnd() * 1.5, 0.25, 0.4, '#ffffff', 0.1);
    },
    clearing(k, S) {
        k.fill('rgba(163,230,53,0.18)');
        k.blades(90, S, ['#84cc16', '#a3e635', '#65a30d'], 1, 2.4, 2);
        for (let i = 0; i < 16; i++) k.dot(3 + k.rnd() * 34, 3 + k.rnd() * 34, 0.45, k.pick(['#f472b6', '#fde047', '#ffffff', '#c084fc']));
    },
    leaves(k, S) {
        k.spots(20, S, ['#3f2a14', '#2a1d0e'], 2, 5, 0.2, 0.35);
        for (let i = 0; i < 180; i++) k.leaf(2 + k.rnd() * 36, 2 + k.rnd() * 36, 0.8 + k.rnd() * 0.7, k.pick(['#9a3412', '#b45309', '#a16207', '#7c2d12', '#ca8a04', '#57534e', '#78350f']));
    },
    mossbed(k, S) {
        k.fill('rgba(63,98,18,0.45)');
        k.spots(70, S, ['#3f6212', '#4d7c0f', '#65a30d', '#1a2e05'], 0.6, 2.6, 0.3, 0.6);
        k.spots(40, S, ['#bef264', '#d9f99d'], 0.15, 0.45, 0.3, 0.6);
    },
    lavaflow(k, S) {
        k.fill('rgba(20,6,4,0.9)');
        k.spots(18, S, ['#2a0f0a', '#1c0806', '#3b130b'], 2, 5, 0.6, 0.9);
        for (let i = 0; i < 6; i++) {
            const pts = k.walk(k.rnd() * S, k.rnd() * S, 10, 2.2, k.rnd() * 7, 1.4);
            k.line(pts, '#ea580c', 2, 0.35);
            k.line(pts, '#f97316', 0.8, 0.95);
            k.line(pts, '#fde047', 0.3, 0.9);
        }
        k.spots(14, S, ['#fb923c', '#fde047'], 0.15, 0.4, 0.6, 1, 3);
    },
    ash(k, S) {
        k.fill('rgba(28,25,23,0.55)');
        k.spots(90, S, ['#44403c', '#57534e', '#78716c', '#1c1917'], 0.3, 1.5, 0.3, 0.6);
        k.spots(6, S, ['#f97316'], 0.15, 0.3, 0.7, 1, 4);
    }
};

// Décals (canevas 16 × 16, centrés en 8, 8)
const DETAIL_DECALS = {
    crack(k) {
        for (let b = 0; b < 3; b++) {
            const pts = k.walk(8, 8, 4 + (k.rnd() * 3 | 0), 1.4, k.rnd() * 7, 1.3);
            k.line(pts, '#000000', 0.35, 0.55);
            k.line(pts.map(([x, y]) => [x + 0.25, y + 0.25]), '#ffffff', 0.15, 0.08);
        }
    },
    pebbles(k) { for (let i = 0; i < 3 + (k.rnd() * 4 | 0); i++) k.stone(4 + k.rnd() * 8, 4 + k.rnd() * 8, 0.6 + k.rnd() * 0.9, k.pick(['#78716c', '#a8a29e', '#57534e', '#64748b'])); },
    grate(k) {
        const g = k.g;
        g.fillStyle = '#4b5563'; g.beginPath(); g.roundRect(3.5, 3.5, 9, 9, 1); g.fill();
        g.fillStyle = '#0c0a09'; g.beginPath(); g.roundRect(4.3, 4.3, 7.4, 7.4, 0.6); g.fill();
        for (let x = 5.6; x < 11.5; x += 1.6) k.line([[x, 4.4], [x, 11.6]], '#6b7280', 0.5);
        k.ell(9, 10, 1.5, 0.6, 0, '#7c2d12', 0.5);
    },
    straw(k) { for (let i = 0; i < 16; i++) { const x = 5 + k.rnd() * 6, y = 5 + k.rnd() * 6, a = k.rnd() * 7, l = 1.5 + k.rnd() * 2.5; k.line([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], k.pick(['#ca8a04', '#a16207', '#facc15', '#854d0e']), 0.25, 0.85); } },
    rust(k) { k.spots(7, 16, ['#9a3412', '#7c2d12', '#b45309'], 0.8, 2.6, 0.2, 0.45, 4); },
    stain(k) { k.spots(6, 16, ['#000000', '#1c1917'], 1.5, 3.5, 0.15, 0.3, 4); },
    bonebits(k) { for (let i = 0; i < 2 + (k.rnd() * 2 | 0); i++) k.bone(5 + k.rnd() * 6, 5 + k.rnd() * 6, 2.5 + k.rnd() * 2, k.rnd() * 7, k.pick(['#d6d3d1', '#e7e5e4', '#a8a29e'])); },
    skullbit(k) { k.skull(8, 7.5, 1); k.bone(9, 11, 3, 0.3, '#d6d3d1'); },
    puddlet(k) {
        k.ell(8, 8.5, 4.5, 2.2, 0.1, '#132a44', 0.8);
        k.ell(7.3, 8, 2.6, 1, 0.1, '#1e4a7a', 0.7);
        k.ell(6.5, 7.6, 1.2, 0.3, 0.1, '#bfdbfe', 0.5);
    },
    shards(k) {
        for (let i = 0; i < 3 + (k.rnd() * 2 | 0); i++) {
            const x = 4 + k.rnd() * 8, y = 4 + k.rnd() * 8, s = 1 + k.rnd() * 1.5, col = k.pick(['#64748b', '#94a3b8', '#475569']);
            const g = k.g;
            g.fillStyle = col;
            g.beginPath();
            g.moveTo(x, y - s); g.lineTo(x + s * 1.2, y + s * 0.2); g.lineTo(x + s * 0.2, y + s); g.lineTo(x - s, y + s * 0.3);
            g.closePath();
            g.fill();
            k.line([[x, y - s], [x + s * 1.2, y + s * 0.2]], '#cbd5e1', 0.2, 0.6);
        }
    },
    tuft(k) { k.blades(12, 16, ['#4d7c0f', '#65a30d', '#84cc16', '#3f6212'], 1.5, 3.5, 5); },
    leaf(k) { for (let i = 0; i < 3 + (k.rnd() * 4 | 0); i++) k.leaf(5 + k.rnd() * 6, 5 + k.rnd() * 6, 0.9 + k.rnd() * 0.6, k.pick(['#9a3412', '#b45309', '#4d7c0f', '#a16207', '#65a30d'])); },
    banner(k) {
        const g = k.g;
        g.fillStyle = '#7f1d1d';
        g.beginPath(); g.moveTo(3, 6); g.lineTo(12, 4.5); g.lineTo(13, 10); g.lineTo(9, 9.5); g.lineTo(5, 11.5); g.closePath(); g.fill();
        k.line([[3, 6], [12, 4.5]], '#facc15', 0.4, 0.8);
        k.line([[6, 6], [7, 10.5]], '#450a0a', 0.3, 0.6);
        k.line([[9.5, 5], [10, 9.6]], '#450a0a', 0.3, 0.6);
    },
    moss(k) { k.spots(14, 16, ['#3f6212', '#4d7c0f', '#65a30d'], 0.6, 1.8, 0.4, 0.75, 4); },
    cobweb(k) {
        const g = k.g;
        g.strokeStyle = '#e7e5e4';
        g.lineWidth = 0.15;
        g.globalAlpha = 0.4;
        for (let i = 0; i < 7; i++) { const a = i / 7 * k.P; g.beginPath(); g.moveTo(8, 8); g.lineTo(8 + Math.cos(a) * 7, 8 + Math.sin(a) * 7); g.stroke(); }
        [2, 4, 6].forEach(r => { g.beginPath(); for (let i = 0; i <= 7; i++) { const a = i / 7 * k.P; const rr = r * (0.85 + 0.15 * Math.sin(i * 2)); i ? g.lineTo(8 + Math.cos(a) * rr, 8 + Math.sin(a) * rr) : g.moveTo(8 + rr, 8); } g.stroke(); });
        g.globalAlpha = 1;
    },
    wax(k) {
        for (let i = 0; i < 5; i++) k.ell(6 + k.rnd() * 4, 7 + k.rnd() * 3, 0.8 + k.rnd() * 1.2, 0.5 + k.rnd() * 0.6, k.rnd(), '#f5f5f4', 0.85);
        k.g.fillStyle = '#e7e5e4'; k.g.fillRect(7.3, 5, 1.4, 3);
        k.dot(8, 4.8, 0.3, '#1c1917');
    },
    sandheap(k) {
        const gr = k.g.createRadialGradient(7, 7.5, 0.5, 8, 8.5, 5);
        gr.addColorStop(0, '#f0d49a');
        gr.addColorStop(1, 'rgba(201,163,90,0)');
        k.g.fillStyle = gr;
        k.g.beginPath(); k.g.ellipse(8, 8.5, 5.5, 3.5, 0, 0, k.P); k.g.fill();
        k.spots(20, 16, ['#f5dca0', '#a8834a'], 0.1, 0.3, 0.4, 0.7, 4);
    },
    pottery(k) {
        for (let i = 0; i < 3; i++) {
            const x = 5 + k.rnd() * 6, y = 5 + k.rnd() * 6, a = k.rnd() * 7, col = k.pick(['#c2410c', '#9a3412', '#b45309']);
            const g = k.g;
            g.strokeStyle = col; g.lineWidth = 1.1; g.lineCap = 'butt';
            g.beginPath(); g.arc(x, y, 1.6, a, a + 1.4); g.stroke();
            g.strokeStyle = '#fdba74'; g.lineWidth = 0.25;
            g.beginPath(); g.arc(x, y, 2.05, a, a + 1.4); g.stroke();
        }
    },
    scarab(k) {
        k.ell(8.3, 8.4, 2, 1.4, 0, '#000000', 0.3);
        for (let i = -1; i <= 1; i++) { k.line([[6.5, 8 + i], [5, 7.6 + i * 1.6]], '#1c1917', 0.25); k.line([[9.5, 8 + i], [11, 7.6 + i * 1.6]], '#1c1917', 0.25); }
        k.ell(8, 8, 1.6, 2, 0, '#0f766e');
        k.ell(8, 5.8, 0.9, 0.6, 0, '#134e4a');
        k.line([[8, 6.3], [8, 9.8]], '#042f2e', 0.2);
        k.ell(7.4, 7.2, 0.4, 0.8, 0.3, '#5eead4', 0.6);
    },
    glyph(k) {
        const g = k.g;
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.roundRect(4, 4, 8, 8, 0.6); g.fill();
        g.strokeStyle = '#6b4f2a'; g.lineWidth = 0.4;
        g.beginPath(); g.ellipse(8, 7, 2, 1, 0, 0, k.P); g.moveTo(6, 10); g.lineTo(10, 10); g.moveTo(8, 8); g.lineTo(8, 11); g.stroke();
    },
    coins(k) {
        for (let i = 0; i < 3 + (k.rnd() * 4 | 0); i++) {
            const x = 5 + k.rnd() * 6, y = 5 + k.rnd() * 6;
            k.ell(x, y, 0.95, 0.75, 0, '#a16207');
            k.ell(x - 0.1, y - 0.1, 0.7, 0.52, 0, '#facc15');
            k.dot(x - 0.3, y - 0.25, 0.2, '#fef9c3', 0.9);
        }
    },
    petals(k) { for (let i = 0; i < 9; i++) k.ell(4 + k.rnd() * 8, 4 + k.rnd() * 8, 0.55, 0.32, k.rnd() * 7, k.pick(['#f9a8d4', '#f472b6', '#fbcfe8', '#fde68a'])); },
    ash(k) { k.spots(22, 16, ['#57534e', '#78716c', '#a8a29e', '#292524'], 0.2, 0.8, 0.4, 0.75, 4); },
    runelet(k) {
        const g = k.g;
        g.strokeStyle = '#e879f9'; g.lineWidth = 0.35; g.globalAlpha = 0.55;
        g.beginPath(); g.arc(8, 8, 3.2, 0, k.P); g.moveTo(8, 5.2); g.lineTo(9.8, 9.5); g.lineTo(6.2, 9.5); g.closePath(); g.stroke();
        g.globalAlpha = 1;
    },
    root(k) {
        for (let i = 0; i < 2 + (k.rnd() * 2 | 0); i++) {
            const pts = k.walk(3 + k.rnd() * 3, 4 + k.rnd() * 8, 6, 1.8, k.rnd() - 0.5, 1);
            k.line(pts, '#3b2412', 1, 0.9);
            k.line(pts.map(([x, y]) => [x - 0.2, y - 0.25]), '#7c4a1e', 0.35, 0.8);
        }
    },
    shroom(k) {
        for (let i = 0; i < 2 + (k.rnd() * 2 | 0); i++) {
            const x = 5 + k.rnd() * 6, y = 6 + k.rnd() * 5, s = 0.8 + k.rnd() * 0.6, col = k.pick(['#b91c1c', '#a16207', '#78350f']);
            k.g.fillStyle = '#e7e5e4'; k.g.fillRect(x - 0.3 * s, y, 0.6 * s, 1.5 * s);
            k.ell(x, y, 1.3 * s, 0.8 * s, 0, col);
            k.dot(x - 0.4 * s, y - 0.2 * s, 0.2 * s, '#fef3c7');
        }
    },
    twigs(k) {
        for (let i = 0; i < 4; i++) {
            const x = 4 + k.rnd() * 8, y = 4 + k.rnd() * 8, a = k.rnd() * 7, l = 2 + k.rnd() * 3;
            const ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l;
            k.line([[x, y], [ex, ey]], '#57391c', 0.3);
            k.line([[(x + ex) / 2, (y + ey) / 2], [(x + ex) / 2 + Math.cos(a + 0.7) * 1.2, (y + ey) / 2 + Math.sin(a + 0.7) * 1.2]], '#57391c', 0.2);
        }
    },
    pinecone(k) {
        k.ell(8.4, 8.6, 1.4, 2.2, 0.6, '#000000', 0.3);
        k.ell(8, 8, 1.3, 2.1, 0.6, '#78350f');
        for (let i = -1; i <= 1; i++) k.line([[7 + i * 0.6, 6.6 + i * 0.9], [9 + i * 0.6, 7.6 + i * 0.9]], '#451a03', 0.25);
    },
    stonemoss(k) {
        k.stone(8, 8.5, 2.6, '#78716c');
        k.ell(7.6, 7.2, 1.9, 0.9, 0.2, '#4d7c0f', 0.9);
        k.spots(6, 16, ['#65a30d', '#84cc16'], 0.2, 0.4, 0.8, 1, 6);
    },
    scorch(k) {
        const gr = k.g.createRadialGradient(8, 8, 0.5, 8, 8, 6);
        gr.addColorStop(0, 'rgba(0,0,0,0.6)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        k.g.fillStyle = gr;
        k.g.fillRect(0, 0, 16, 16);
    },
    embercrack(k) {
        for (let b = 0; b < 3; b++) {
            const pts = k.walk(8, 8, 4, 1.5, k.rnd() * 7, 1.2);
            k.line(pts, '#ea580c', 1, 0.35);
            k.line(pts, '#fb923c', 0.35, 0.95);
        }
    },
    obsidian(k) {
        for (let i = 0; i < 3; i++) {
            const x = 5 + k.rnd() * 6, y = 5 + k.rnd() * 6, s = 1 + k.rnd() * 1.2, g = k.g;
            g.fillStyle = k.pick(['#0c0a09', '#1e1b4b', '#18181b']);
            g.beginPath(); g.moveTo(x, y - s * 1.3); g.lineTo(x + s, y + s * 0.6); g.lineTo(x - s * 0.8, y + s * 0.7); g.closePath(); g.fill();
            k.line([[x, y - s * 1.3], [x + s, y + s * 0.6]], '#a78bfa', 0.2, 0.7);
        }
    }
};

// Sprite de tache ou de décal, mis en cache par mode ; en pixel, bords tramés (Bayer 4 × 4) pour rester net
const Detail = {
    cache: {},
    sprite(kind, v, hd) {
        const key = kind + v + (hd ? 'h' : 'p');
        if (this.cache[key]) return this.cache[key];
        const patch = !!DETAIL_PATCHES[kind];
        const S = patch ? 40 : 16, s = hd ? PX : 1;
        const [c, g] = HD.canvas(S, S, s);
        let seed = 1 + v * 977 + [...kind].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 100000, 7);
        const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const k = detailKit(g, rnd);
        if (patch) {
            DETAIL_PATCHES[kind](k, S);
            // Masque irrégulier : union de halos décalés, pour une tache aux bords doux et organiques
            const [m, mg] = HD.canvas(S, S, s);
            for (let i = 0; i < 6; i++) {
                const x = S / 2 + (rnd() - 0.5) * S * 0.4, y = S / 2 + (rnd() - 0.5) * S * 0.4, r = S * (0.2 + rnd() * 0.16);
                const gr = mg.createRadialGradient(x, y, 0, x, y, r);
                gr.addColorStop(0, 'rgba(0,0,0,1)');
                gr.addColorStop(0.5, 'rgba(0,0,0,0.85)');
                gr.addColorStop(1, 'rgba(0,0,0,0)');
                mg.fillStyle = gr;
                mg.fillRect(0, 0, S, S);
            }
            g.setTransform(1, 0, 0, 1, 0, 0);
            g.globalAlpha = 1;
            g.globalCompositeOperation = 'destination-in';
            g.drawImage(m, 0, 0);
            g.globalCompositeOperation = 'source-over';
        } else DETAIL_DECALS[kind](k);
        if (!hd) {
            const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
            const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
            for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
                const i = (y * c.width + x) * 4 + 3;
                d[i] = d[i] / 255 > (BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16 ? 255 : 0;
            }
            g.putImageData(img, 0, 0);
        }
        return (this.cache[key] = c);
    }
};

// Petites fonctions pseudo-aléatoires stables pour les effets d'ambiance (pas d'état à mémoriser)
const fxHash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const fxWrap = (v, m) => ((v % m) + m) % m;

// Étalonnage colorimétrique par biome (fusion « soft-light » plein écran)
const BIOME_GRADE = {
    dungeon: ['#1e3a8a', 0.22], castle: ['#1e40af', 0.2], crypt: ['#6b21a8', 0.24], pyramid: ['#f59e0b', 0.2],
    temple: ['#a21caf', 0.18], jungle: ['#facc15', 0.12], forest: ['#0f766e', 0.24], catacombs: ['#b91c1c', 0.24]
};

// Météo et ambiance propres à chaque biome, en coordonnées écran logiques (W × H), avec un peu de parallaxe
// layer 'mist' : brumes dessinées dans le voile d'obscurité (basse résolution, peu coûteux) ; layer 'fx' : le reste, par-dessus
function drawAmbience(g, layer, id, W, H, now, hd, camX, camY) {
    const isMist = layer === 'mist';
    const t = now / 1000, P = Math.PI * 2;
    const ox = -camX * 0.6, oy = -camY * 0.6;
    const dot = (x, y, r, col) => {
        g.fillStyle = col;
        if (hd) { g.beginPath(); g.arc(x, y, r, 0, P); g.fill(); } else g.fillRect(Math.round(x), Math.round(y), 1, 1);
    };
    const streak = (x, y, dx, dy, col, wid) => {
        g.strokeStyle = col;
        g.lineWidth = hd ? wid : 1;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + dx, y + dy);
        g.stroke();
    };
    const blob = (x, y, r, col, a) => { g.globalAlpha = a; g.drawImage(HD.blob(col), x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; };
    const fog = (n, col, a, rmin, rmax, sp, s0 = 0) => {
        if (!isMist) return;
        for (let i = s0; i < s0 + n; i++) {
            const r = rmin + fxHash(i + 11) * (rmax - rmin);
            blob(fxWrap(fxHash(i) * (W + 2 * r) + t * sp * (0.5 + fxHash(i + 2)) + ox * 0.5, W + 2 * r) - r,
                fxWrap(fxHash(i + 1) * (H + 2 * r) + Math.sin(t * 0.2 + i) * 10 + oy * 0.5, H + 2 * r) - r, r, col, a);
        }
    };
    const rain = (n, col, len, vx, vy, wid) => {
        const m = Math.hypot(vx, vy);
        for (let i = 0; i < n; i++) {
            const x = fxWrap(fxHash(i) * W + t * vx + ox * 1.2, W);
            const y = fxWrap(fxHash(i + 1) * H + t * vy * (0.8 + fxHash(i + 2) * 0.4) + oy * 1.2, H);
            streak(x, y, vx / m * len, vy / m * len, col, wid);
        }
    };
    const shafts = (n, col, a0) => {
        g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
            const x = fxWrap(fxHash(i + 20) * W + ox * 0.3, W + 160) - 80, a = a0 + 0.03 * Math.sin(t * 0.5 + i * 2);
            const gr = g.createLinearGradient(x, 0, x - 80, H);
            gr.addColorStop(0, HD.rgba(col, a));
            gr.addColorStop(1, HD.rgba(col, 0));
            g.fillStyle = gr;
            g.beginPath();
            g.moveTo(x, 0); g.lineTo(x + 26, 0); g.lineTo(x - 50, H); g.lineTo(x - 90, H);
            g.closePath();
            g.fill();
        }
        g.globalCompositeOperation = 'source-over';
    };
    g.lineCap = 'round';
    if (isMist && id === 'temple') {
        // Fumée d'encens qui monte
        for (let i = 0; i < 7; i++) {
            const k = fxWrap(t * 0.06 + fxHash(i), 1);
            blob(fxWrap(fxHash(i + 1) * W + ox * 0.5, W) + Math.sin(t * 0.7 + i) * 12, H + 40 - k * (H + 80), 20 + k * 30, '#f5d0fe', 0.08 * Math.sin(k * Math.PI));
        }
    }
    if (isMist) {
        switch (id) {
            case 'dungeon': fog(5, '#93c5fd', 0.06, 60, 110, 4); break;
            case 'crypt': fog(6, '#a855f7', 0.1, 50, 120, 6); fog(3, '#4c1d95', 0.15, 80, 140, -3, 30); break;
            case 'pyramid': fog(4, '#fbbf24', 0.06, 70, 120, 25); break;
            case 'forest': fog(7, '#94a3b8', 0.08, 70, 130, 5); break;
        }
        return;
    }
    switch (id) {
        case 'dungeon':
            // Brume froide et gouttes qui tombent du plafond puis éclaboussent
            for (let i = 0; i < 9; i++) {
                const per = 1.6 + fxHash(i + 4) * 1.8, k = fxWrap(t / per + fxHash(i + 6), 1);
                const x = fxWrap(fxHash(i) * W + ox, W), y0 = fxWrap(fxHash(i + 3) * H + oy, H);
                if (k < 0.7) streak(x, y0 + (k / 0.7) ** 2 * 26 - 2, 0, 2, 'rgba(147,197,253,0.7)', 0.45);
                else {
                    const s = (k - 0.7) / 0.3;
                    g.globalAlpha = 1 - s;
                    g.strokeStyle = '#93c5fd';
                    g.lineWidth = hd ? 0.35 : 1;
                    g.beginPath();
                    g.ellipse(x, y0 + 26, 1 + s * 4, 0.5 + s * 1.6, 0, 0, P);
                    g.stroke();
                    g.globalAlpha = 1;
                }
            }
            break;
        case 'castle': {
            // Rayons de lune, pluie battante, éclairs lointains
            shafts(3, '#bfdbfe', 0.05);
            rain(80, 'rgba(186,206,255,0.32)', 7, -60, 420, 0.3);
            const fl = fxWrap(t, 11);
            if (fl < 0.25 && Math.sin(fl * 60) > 0) {
                g.fillStyle = 'rgba(219,234,254,' + (0.16 * (1 - fl / 0.25)) + ')';
                g.fillRect(0, 0, W, H);
            }
            break;
        }
        case 'crypt':
            // Brume violette qui serpente au ras du sol
            break;
        case 'pyramid':
            // Vent de sable et chaleur
            for (let i = 0; i < 60; i++) {
                const x = fxWrap(fxHash(i) * W + t * (160 + fxHash(i + 1) * 120) + ox, W + 20) - 10;
                const y = fxWrap(fxHash(i + 2) * H + Math.sin(t * 1.5 + i) * 6 + oy, H);
                streak(x, y, 3 + fxHash(i + 3) * 7, 0.4, 'rgba(253,230,138,0.35)', 0.35);
            }
            break;
        case 'temple':
            // Runes flottantes
            g.globalCompositeOperation = 'lighter';
            g.strokeStyle = '#f0abfc';
            g.lineWidth = hd ? 0.5 : 1;
            for (let i = 0; i < 10; i++) {
                const k = fxWrap(t * (0.04 + fxHash(i) * 0.03) + fxHash(i + 5), 1);
                const x = fxWrap(fxHash(i + 1) * W + ox, W) + Math.sin(t + i) * 6, y = H * (1 - k), s = 2 + fxHash(i + 2) * 2;
                g.globalAlpha = Math.sin(k * Math.PI) * 0.7;
                g.beginPath();
                g.moveTo(x, y - s); g.lineTo(x + s * 0.7, y); g.lineTo(x, y + s); g.lineTo(x - s * 0.7, y); g.closePath();
                g.moveTo(x - s, y); g.lineTo(x + s, y);
                g.stroke();
            }
            g.globalAlpha = 1;
            g.globalCompositeOperation = 'source-over';
            break;
        case 'jungle':
            // Rais de soleil, feuilles qui tombent, averse légère
            shafts(4, '#fef08a', 0.07);
            for (let i = 0; i < 16; i++) {
                const k = fxWrap(t * 0.08 * (0.6 + fxHash(i)) + fxHash(i + 3), 1);
                const x = fxWrap(fxHash(i) * W + Math.sin(t * 0.9 + i) * 20 + ox, W), y = fxWrap(k * (H + 20) + oy, H + 20) - 10;
                g.fillStyle = i % 3 ? '#4ade80' : '#a3e635';
                g.beginPath();
                g.ellipse(x, y, hd ? 1.6 : 2, hd ? 0.7 : 1, t * 2 + i, 0, P);
                g.fill();
            }
            rain(35, 'rgba(220,252,231,0.22)', 5, 30, 380, 0.25);
            break;
        case 'forest':
            // Brouillard nocturne et lucioles clignotantes
            g.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 24; i++) {
                const a = Math.max(0, Math.sin(t * (1.2 + fxHash(i + 2)) + i * 2));
                if (!a) continue;
                const x = fxWrap(fxHash(i) * W + Math.sin(t * 0.5 + i * 1.7) * 30 + ox, W), y = fxWrap(fxHash(i + 1) * H + Math.cos(t * 0.4 + i) * 20 + oy, H);
                blob(x, y, 6, '#bef264', 0.35 * a);
                g.globalAlpha = a;
                dot(x, y, 0.6, '#ecfccb');
                g.globalAlpha = 1;
            }
            g.globalCompositeOperation = 'source-over';
            break;
        case 'catacombs': {
            // Chaleur qui monte du sol et braises
            g.globalCompositeOperation = 'lighter';
            const gr = g.createLinearGradient(0, H * 0.55, 0, H);
            gr.addColorStop(0, 'rgba(220,38,38,0)');
            gr.addColorStop(1, 'rgba(220,38,38,' + (0.12 + 0.05 * Math.sin(t * 1.7)) + ')');
            g.fillStyle = gr;
            g.fillRect(0, H * 0.55, W, H * 0.45);
            for (let i = 0; i < 40; i++) {
                const k = fxWrap(t * (0.12 + fxHash(i) * 0.15) + fxHash(i + 4), 1);
                g.globalAlpha = 1 - k;
                dot(fxWrap(fxHash(i) * W + Math.sin(t * 1.3 + i) * 10 + ox, W), fxWrap(H - k * (H + 20) + oy, H), 0.5 + fxHash(i + 7) * 0.5, k < 0.5 ? '#fde047' : '#f97316');
            }
            g.globalAlpha = 1;
            g.globalCompositeOperation = 'source-over';
            break;
        }
    }
}

// Camp de base (le camp est un menu) : décor de nuit plein écran avec feu de camp, en coordonnées écran logiques.
// La partie fixe est mise en cache à la taille de l'écran ; seuls le feu, la fumée et les étoiles sont redessinés.
function drawCampBackdrop(g, W, H, now, hd) {
    const P = Math.PI * 2, t = now / 1000, horizon = H * 0.6;
    const fx = W * 0.5, fy = H * 0.8, fgx = W * 0.68, fgy = horizon + 30;
    const key = (hd ? 'hd' : 'px') + W + 'x' + H;
    if (HD.cache.campKey !== key) {
        const [cv, cg] = HD.canvas(W, H, hd ? PX : 1);
        drawCampStatic(cg, W, H, hd);
        HD.cache.camp = cv;
        HD.cache.campKey = key;
    }
    g.imageSmoothingEnabled = hd;
    g.drawImage(HD.cache.camp, 0, 0, W, H);

    // Étoiles qui scintillent
    for (let i = 0; i < 24; i++) {
        g.globalAlpha = Math.max(0, Math.sin(t * (0.6 + fxHash(i + 5)) + i)) * 0.9;
        g.fillStyle = '#f8fafc';
        const sx = fxHash(i) * W, sy = fxHash(i + 50) * horizon * 0.85;
        if (hd) { g.beginPath(); g.arc(sx, sy, 0.6, 0, P); g.fill(); } else g.fillRect(Math.round(sx), Math.round(sy), 1, 1);
    }
    g.globalAlpha = 1;

    // Fumée de la forge et foyer rougeoyant
    for (let i = 0; i < 6; i++) {
        const k = fxWrap(t * 0.25 + i / 6, 1), r = 6 + k * 14;
        g.globalAlpha = 0.3 * (1 - k);
        g.drawImage(HD.blob('#9ca3af'), fgx + 20 + Math.sin(t + i) * 3 + k * 10 - r, fgy - 64 - k * 50 - r, r * 2, r * 2);
    }
    const glow = 0.75 + 0.25 * Math.sin(t * 6);
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(249,115,22,' + (0.9 * glow) + ')';
    g.fillRect(fgx - 22, fgy - 18, 16, 14);
    g.globalAlpha = 0.55 * glow;
    g.drawImage(HD.blob('#f97316'), fgx - 44, fgy - 40, 60, 50);

    // Feu de camp : lueur au sol, flammes, étincelles, halo additif
    const flick = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 5.3 + 1);
    g.globalAlpha = 0.35 * flick;
    g.drawImage(HD.blob('#f97316'), fx - 160, fy - 60, 320, 120);
    g.globalAlpha = 1;
    HD.flame(g, fx - 5, fy + 1, 9, 18, '#ea580c', now, 1);
    HD.flame(g, fx + 5, fy + 1, 9, 16, '#ea580c', now, 2);
    HD.flame(g, fx, fy + 2, 12, 26, '#f97316', now, 3);
    for (let i = 0; i < 18; i++) {
        const k = fxWrap(t * (0.35 + fxHash(i) * 0.3) + fxHash(i + 3), 1);
        const ex = fx + (fxHash(i + 7) - 0.5) * 14 + Math.sin(t * 2 + i) * 6 * k, ey = fy - 8 - k * 70;
        g.globalAlpha = 1 - k;
        g.fillStyle = k < 0.4 ? '#fde047' : '#f97316';
        if (hd) { g.beginPath(); g.arc(ex, ey, 0.6, 0, P); g.fill(); } else g.fillRect(Math.round(ex), Math.round(ey), 1, 1);
    }
    g.globalAlpha = 0.35 * flick;
    g.globalCompositeOperation = 'lighter';
    g.drawImage(HD.blob('#fb923c'), fx - 90, fy - 110, 180, 180);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
}

function drawCampStatic(g, W, H, hd) {
    const P = Math.PI * 2, horizon = H * 0.6;
    let gr = g.createLinearGradient(0, 0, 0, horizon);
    gr.addColorStop(0, '#060818');
    gr.addColorStop(0.6, '#141a3a');
    gr.addColorStop(1, '#3a2a3e');
    g.fillStyle = gr;
    g.fillRect(0, 0, W, horizon + 1);

    for (let i = 0; i < 90; i++) {
        g.globalAlpha = 0.3 + 0.4 * fxHash(i + 31);
        g.fillStyle = i % 7 ? '#e0e7ff' : '#fde68a';
        const sx = fxHash(i) * W, sy = fxHash(i + 50) * horizon * 0.85;
        if (hd) { g.beginPath(); g.arc(sx, sy, 0.25 + fxHash(i + 9) * 0.45, 0, P); g.fill(); } else g.fillRect(Math.round(sx), Math.round(sy), 1, 1);
    }
    g.globalAlpha = 1;

    // Lune
    const mx = W * 0.8, my = H * 0.16;
    g.globalAlpha = 0.5;
    g.drawImage(HD.blob('#c7d2fe'), mx - 40, my - 40, 80, 80);
    g.globalAlpha = 1;
    g.fillStyle = '#f1f5f9';
    g.beginPath(); g.arc(mx, my, 11, 0, P); g.fill();
    g.fillStyle = '#cbd5e1';
    [[-3, -2, 2.5], [4, 3, 1.8], [-1, 5, 1.3]].forEach(([dx, dy, r]) => { g.beginPath(); g.arc(mx + dx, my + dy, r, 0, P); g.fill(); });

    // Montagnes sur deux plans
    [['#1a1d3a', 0.56, 40, 0.004], ['#11132a', 0.6, 26, 0.009]].forEach(([col, base, amp, f], k) => {
        g.fillStyle = col;
        g.beginPath();
        g.moveTo(0, horizon + 2);
        for (let x = 0; x <= W + 4; x += 4) g.lineTo(x, H * base - amp * (0.5 + 0.5 * Math.sin(x * f + k * 2)) * (0.6 + 0.4 * Math.sin(x * f * 2.7 + k)));
        g.lineTo(W + 4, horizon + 2);
        g.closePath();
        g.fill();
    });

    // Sol
    gr = g.createLinearGradient(0, horizon, 0, H);
    gr.addColorStop(0, '#1b2417');
    gr.addColorStop(1, '#0a0d08');
    g.fillStyle = gr;
    g.fillRect(0, horizon, W, H - horizon);

    // Sapins en lisière
    const pine = (x, y, h, col) => {
        g.fillStyle = col;
        g.beginPath();
        for (let k = 0; k < 3; k++) {
            const yy = y - h * k * 0.26, ww = h * (0.3 - k * 0.07);
            g.moveTo(x - ww, yy); g.lineTo(x, yy - h * 0.45); g.lineTo(x + ww, yy);
        }
        g.fill();
        g.fillRect(x - h * 0.04, y, h * 0.08, h * 0.1);
    };
    for (let i = 0; i < 14; i++) {
        const x = i < 7 ? fxHash(i + 70) * W * 0.2 : W - fxHash(i + 70) * W * 0.12;
        pine(x, horizon + 4 + fxHash(i + 90) * 10, 34 + fxHash(i + 80) * 26, i % 2 ? '#0b1410' : '#0e1a14');
    }

    // Tentes du chef de camp
    const tent = (x, y, w, h, col) => {
        g.fillStyle = col;
        g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x, y - h); g.lineTo(x + w / 2, y); g.closePath(); g.fill();
        g.fillStyle = '#0a0705';
        g.beginPath(); g.moveTo(x - w * 0.12, y); g.lineTo(x, y - h * 0.55); g.lineTo(x + w * 0.12, y); g.fill();
        g.strokeStyle = 'rgba(245,158,11,0.55)';
        g.lineWidth = hd ? 0.6 : 1;
        g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + w / 2, y); g.stroke();
        g.strokeStyle = '#3b2a1a';
        g.beginPath(); g.moveTo(x, y - h); g.lineTo(x, y - h - 5); g.stroke();
    };
    tent(W * 0.24, horizon + 36, 70, 48, '#5b3a22');
    tent(W * 0.35, horizon + 22, 40, 28, '#4a2f1c');

    // Forge : bâtisse de pierre, cheminée, enclume
    const fgx = W * 0.68, fgy = horizon + 30;
    g.fillStyle = '#2a2624';
    g.fillRect(fgx - 34, fgy - 34, 68, 34);
    g.fillStyle = '#1a1614';
    g.beginPath(); g.moveTo(fgx - 40, fgy - 32); g.lineTo(fgx, fgy - 50); g.lineTo(fgx + 40, fgy - 32); g.fill();
    g.fillStyle = '#2f2a27';
    g.fillRect(fgx + 16, fgy - 62, 9, 22);
    g.fillStyle = '#4b5563';
    g.fillRect(fgx + 6, fgy - 9, 14, 4);
    g.fillRect(fgx + 10, fgy - 5, 6, 5);

    // Étal du marchand sous auvent rayé
    const sx = W * 0.84, sy = horizon + 48;
    g.fillStyle = '#3b2412';
    g.fillRect(sx - 26, sy - 34, 3, 34);
    g.fillRect(sx + 23, sy - 34, 3, 34);
    for (let i = 0; i < 8; i++) {
        const x0 = sx - 30 + i * 7.5;
        g.fillStyle = i % 2 ? '#e7e5e4' : '#15803d';
        g.beginPath();
        g.moveTo(x0, sy - 34); g.lineTo(x0 + 7.5, sy - 34); g.lineTo(x0 + 7.5, sy - 28);
        g.quadraticCurveTo(x0 + 3.75, sy - 25, x0, sy - 28);
        g.fill();
    }
    g.fillStyle = '#5b3413';
    g.fillRect(sx - 26, sy - 12, 52, 12);
    [['#ef4444', -16], ['#f97316', -9], ['#facc15', 0], ['#a3e635', 9]].forEach(([c, dx]) => { g.fillStyle = c; g.beginPath(); g.arc(sx + dx, sy - 14, 2.4, 0, P); g.fill(); });

    // Feu de camp : cercle de pierres et bûches croisées
    const fx = W * 0.5, fy = H * 0.8;
    for (let i = 0; i < 9; i++) {
        const a = i / 9 * P;
        g.fillStyle = i % 2 ? '#57534e' : '#44403c';
        g.beginPath(); g.ellipse(fx + Math.cos(a) * 15, fy + 2 + Math.sin(a) * 6, 3.4, 2.4, 0, 0, P); g.fill();
    }
    g.strokeStyle = '#4a2c14';
    g.lineWidth = 3.5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(fx - 10, fy + 4); g.lineTo(fx + 8, fy - 3);
    g.moveTo(fx + 10, fy + 4); g.lineTo(fx - 8, fy - 3);
    g.stroke();
}

function renderWorld() {
    const hd = Gfx.hd;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#07070a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (State.screen !== 'playing') return;

    const w = State.world;
    const p = w.player;
    const biome = State.currentBiome;
    const town = State.location === 'town' || !biome;
    const now = performance.now();
    const P2 = Math.PI * 2;

    const lw = Math.ceil(canvas.width / PX) + 1;
    const lh = Math.ceil(canvas.height / PX) + 1;
    if (lightCanvas.width !== lw || lightCanvas.height !== lh) {
        lightCanvas.width = lw;
        lightCanvas.height = lh;
    }
    if (!hd && (lowCanvas.width !== lw || lowCanvas.height !== lh)) {
        lowCanvas.width = lw;
        lowCanvas.height = lh;
    }
    // HD : dessin direct à l'écran dans le repère logique (×PX) ; pixel : canevas basse résolution agrandi sans lissage
    const g = hd ? ctx : lctx;
    const screenSpace = () => g.setTransform(hd ? PX : 1, 0, 0, hd ? PX : 1, 0, 0);
    screenSpace();
    g.imageSmoothingEnabled = hd;
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.lineCap = g.lineJoin = 'round';
    if (!hd) {
        g.fillStyle = '#07070a';
        g.fillRect(0, 0, lw, lh);
    }

    // Vignette précalculée à la taille de l'écran logique
    const vignette = (dst = g) => {
        let vc = HD.cache.vignette;
        if (!vc || vc.width !== lw || vc.height !== lh) {
            vc = HD.cache.vignette = document.createElement('canvas');
            vc.width = lw;
            vc.height = lh;
            const vctx = vc.getContext('2d');
            const vg = vctx.createRadialGradient(lw / 2, lh / 2, Math.min(lw, lh) * 0.35, lw / 2, lh / 2, Math.max(lw, lh) * 0.75);
            vg.addColorStop(0, 'rgba(0,0,0,0)');
            vg.addColorStop(1, 'rgba(0,0,0,0.45)');
            vctx.fillStyle = vg;
            vctx.fillRect(0, 0, lw, lh);
        }
        dst.imageSmoothingEnabled = true;
        dst.drawImage(vc, 0, 0);
    };
    const present = () => {
        if (!hd) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(lowCanvas, 0, 0, lw * PX, lh * PX);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    };

    // --- Camp : simple décor animé derrière le menu ---
    if (town) {
        drawCampBackdrop(g, lw, lh, now, hd);
        vignette();
        present();
        miniCtx.fillStyle = '#09090d';
        miniCtx.fillRect(0, 0, miniCanvas.width, miniCanvas.height);
        return;
    }

    const floorCol = biome.floor;
    const wallCol = biome.wall;
    const accentCol = biome.accent;
    const T = w.tileSize / PX;
    const L = hd ? v => v / PX : v => Math.round(v / PX);

    // Caméra : HD arrondie au pixel écran (pas de joints entre tuiles), pixel arrondie au pixel logique
    const shX = (Math.random() - 0.5) * FX.shake, shY = (Math.random() - 0.5) * FX.shake;
    const camX = hd ? Math.round(w.camera.x + shX * PX) / PX : L(w.camera.x) + Math.round(shX);
    const camY = hd ? Math.round(w.camera.y + shY * PX) / PX : L(w.camera.y) + Math.round(shY);
    g.translate(-camX, -camY);

    const labels = [];
    const label = (text, x, y, color, size, icon) => labels.push({ text, x, y, color, size: size || 8, icon });
    const lights = []; // { x, y, r, col, a } en pixels logiques monde
    const light = (x, y, r, col, a) => lights.push({ x, y, r, col, a: a === undefined ? 0.5 : a });
    // Image lissée seulement si elle est en haute définition (lw) ; un sprite pixel reste net
    const img = (spr, x, y, dw, dh) => {
        g.imageSmoothingEnabled = hd && !!spr.lw;
        g.drawImage(spr, x, y, dw, dh);
    };

    // --- Tuiles & torches murales ---
    const tiles = hd ? HD.tiles(biome.id, floorCol, wallCol) : Pixel.tiles(biome.id, floorCol, wallCol);
    const look = BIOME_LOOK[biome.id] || { outdoor: true };
    const isWall = (r, c) => r < 0 || r >= w.rows || c < 0 || c >= w.cols || w.grid[r][c] !== 0;
    const startC = Math.max(0, Math.floor(camX / T) - 1);
    const endC = Math.min(w.cols - 1, Math.ceil((camX + lw) / T) + 1);
    const startR = Math.max(0, Math.floor(camY / T) - 1);
    const endR = Math.min(w.rows - 1, Math.ceil((camY + lh) / T) + 1);
    const torches = [];
    const wallHash = (r, c) => (c * 374761393 + r * 668265263) >>> 0;

    // Sol : variante tirée par hachage stable
    const drawFloor = (dst, r, c) => dst.drawImage(tiles.floors[(hash2(c, r, 5) * tiles.floors.length) | 0], c * T, r * T, T, T);
    // Ombre portée au pied d'un mur, ou mur et ses calques de profondeur
    const drawTile = (dst, r, c) => {
        const x = c * T, y = r * T;
        if (w.grid[r][c] !== 1) {
            if (isWall(r - 1, c)) {
                if (hd) dst.drawImage(tiles.shade, x, y, T, T);
                else {
                    dst.fillStyle = 'rgba(0,0,0,0.35)';
                    dst.fillRect(x, y, T, 3);
                }
            }
            return;
        }
        // Murs intérieurs : variantes simples ; murs bordant un sol : toutes les variantes (grilles, niches, usure)
        const nW = isWall(r + 1, c) ? tiles.inner : tiles.walls.length;
        dst.drawImage(tiles.walls[(hash2(c, r, 9) * nW) | 0], x, y, T, T);
        if (!look.outdoor && !isWall(r - 1, c)) {
            if (hd) dst.drawImage(tiles.rim, x, y, T, T);
            else {
                dst.fillStyle = Pixel.shade(wallCol, 0.35);
                dst.fillRect(x, y, T, 2);
            }
        }
        if (hd && !look.outdoor && !isWall(r + 1, c)) dst.drawImage(tiles.face, x, y, T, T);
    };
    // Cime d'arbre (extérieur HD) : légèrement décalée et plus grande que la tuile
    const drawCrown = (dst, r, c) => {
        const jx = (hash2(c, r, 42) - 0.5) * 4, jy = (hash2(c, r, 43) - 0.5) * 4;
        // Tirage pondéré : rochers et arbres singuliers restent rares
        const pool = look.wall === 'pine' ? [0, 0, 1, 1, 2, 2, 3, 3, 5, 5, 4] : [0, 0, 0, 1, 1, 1, 2, 2, 3, 4, 4, 5, 5];
        dst.drawImage(tiles.crowns[pool[(hash2(c, r, 41) * pool.length) | 0]], c * T - 5 + jx, r * T - 5 + jy, 26, 26);
    };
    // Zones de matière (bruit basse fréquence) : intensité 0..1 de chaque zone sur une case
    const det = BIOME_DETAIL[biome.id];
    const zoneAt = (r, c) => det.zones.map(([, thr], zi) => smoothstep(thr, thr + 0.12, zoneNoise(c, r, zi * 13 + 3)));
    const drawPatches = (dst, r, c) => {
        zoneAt(r, c).forEach((a, zi) => {
            if (a < 0.03) return;
            const h = hash2(c, r, 31 + zi), kind = det.zones[zi][0], aligned = kind === 'mosaic' || kind === 'goldwork';
            dst.save();
            dst.globalAlpha = a * 0.95;
            if (aligned) dst.translate(c * T + 8, r * T + 8);
            else {
                dst.translate(c * T + 8 + (h - 0.5) * 6, r * T + 8 + (hash2(r, c, 7 + zi) - 0.5) * 6);
                dst.rotate(((h * 4) | 0) * Math.PI / 2);
            }
            dst.drawImage(Detail.sprite(kind, (h * 37 | 0) % 3, hd), -20, -20, 40, 40);
            dst.restore();
        });
    };
    // Décals : plus denses dans les zones, avec des motifs propres à chacune
    const drawDecal = (dst, r, c) => {
        const za = zoneAt(r, c);
        let zi = -1, best = 0.5;
        za.forEach((a, i) => { if (a > best) { best = a; zi = i; } });
        if (hash2(c, r, 77) > det.density * (zi >= 0 ? 1.8 : 1)) return;
        const list = zi >= 0 && det.zoneDecals[zi] && hash2(c, r, 78) < 0.75 ? det.zoneDecals[zi] : det.decals;
        dst.save();
        dst.translate(c * T + 8 + (hash2(c, r, 80) - 0.5) * 6, r * T + 8 + (hash2(c, r, 81) - 0.5) * 6);
        dst.rotate((hash2(c, r, 82) - 0.5) * 2);
        dst.drawImage(Detail.sprite(list[(hash2(c, r, 79) * list.length) | 0], (hash2(c, r, 83) * 3) | 0, hd), -8, -8, 16, 16);
        dst.restore();
    };

    // Tuiles regroupées en blocs de CH × CH, dessinés une seule fois en entier (sols, zones, décals, murs, cimes) ;
    // l'exploration est appliquée à chaque image par un simple masque
    const CH = 8, ckey = biome.id + (hd ? 'h' : 'p');
    if (HD.chunkGrid !== w.grid || HD.chunkKey !== ckey) {
        HD.chunks = {};
        HD.chunkGrid = w.grid;
        HD.chunkKey = ckey;
    }
    const buildChunk = (c0, r0) => {
        const [cv, cg] = HD.canvas(CH * T, CH * T, hd ? PX : 1);
        cg.imageSmoothingEnabled = hd;
        cg.translate(-c0 * T, -r0 * T);
        const each = (m, fn) => {
            for (let r = Math.max(0, r0 - m); r < Math.min(w.rows, r0 + CH + m); r++) {
                for (let c = Math.max(0, c0 - m); c < Math.min(w.cols, c0 + CH + m); c++) fn(r, c);
            }
        };
        const floorOnly = fn => (r, c) => { if (w.grid[r][c] !== 1) fn(cg, r, c); };
        each(0, floorOnly(drawFloor));
        if (det) {
            each(2, floorOnly(drawPatches));
            each(1, floorOnly(drawDecal));
        }
        each(0, (r, c) => drawTile(cg, r, c));
        if (tiles.crowns) each(1, (r, c) => { if (w.grid[r][c] === 1) drawCrown(cg, r, c); });
        return cv;
    };
    g.imageSmoothingEnabled = hd;
    for (let cy = Math.floor(startR / CH); cy <= Math.floor(endR / CH); cy++) {
        for (let cx = Math.floor(startC / CH); cx <= Math.floor(endC / CH); cx++) {
            const key = cx + ',' + cy;
            const cv = HD.chunks[key] || (HD.chunks[key] = buildChunk(cx * CH, cy * CH));
            g.drawImage(cv, cx * CH * T, cy * CH * T, CH * T, CH * T);
        }
    }
    // Brouillard d'exploration : cases non découvertes recouvertes par rangées
    g.fillStyle = '#07070a';
    for (let r = startR; r <= endR; r++) {
        let run = -1;
        for (let c = startC; c <= endC + 1; c++) {
            const hidden = c <= endC && !w.explored[r][c];
            if (hidden && run < 0) run = c;
            else if (!hidden && run >= 0) {
                g.fillRect(run * T, r * T, (c - run) * T, T);
                run = -1;
            }
        }
    }

    if (look.torch) {
        for (let r = startR; r <= endR; r++) for (let c = startC; c <= endC; c++) {
            if (!w.explored[r][c] || w.grid[r][c] !== 1 || isWall(r + 1, c)) continue;
            if (wallHash(r, c) % (look.torchRate || 7) === 0) torches.push({ x: c * T + 8, y: r * T + 9 });
        }
    }

    torches.forEach(t => {
        const f = Math.floor(now / 90 + t.x) % 3;
        if (hd) HD.torch(g, t.x, t.y, look.torch, now);
        else {
            g.fillStyle = '#3f2a1d';
            g.fillRect(t.x - 1, t.y, 3, 3);
            g.fillStyle = look.torch;
            g.fillRect(t.x - 1, t.y - 3, 3, 3);
            g.fillStyle = Pixel.shade(look.torch, 0.6);
            g.fillRect(t.x, t.y - 3 - (f === 0 ? 1 : 0), 1, 2 + (f === 2 ? 1 : 0));
        }
        light(t.x, t.y - 2, 34 + f * 2, look.torch, 0.35);
    });

    // --- Décors au sol propres au biome (non bloquants), placés de façon stable sur ~1 tuile sur 9 ---
    if (look.props) {
        const prop = hd ? drawPropHD : drawProp;
        for (let r = startR; r <= endR; r++) for (let c = startC; c <= endC; c++) {
            if (!w.explored[r][c] || w.grid[r][c] !== 0) continue;
            const hash = ((c * 2654435761) ^ (r * 40503)) >>> 0;
            if (hash % 9) continue;
            prop(g, look.props[(hash >>> 4) % look.props.length], c * T, r * T, now, light);
        }
    }

    // --- Helpers de dessin (pixel net ou trait lissé selon le mode) ---
    const shadow = (x, y, rw) => {
        g.fillStyle = 'rgba(0,0,0,0.45)';
        if (hd) {
            g.beginPath();
            g.ellipse(x, y + 0.5, rw, rw * 0.3 + 0.6, 0, 0, P2);
            g.fill();
            return;
        }
        g.fillRect(x - rw, y, rw * 2, 2);
        g.fillRect(x - rw + 1, y - 1, rw * 2 - 2, 4);
    };
    const pxLine = (x0, y0, ang, len, col, wid) => {
        if (hd) {
            g.strokeStyle = col;
            g.lineWidth = wid || 0.7;
            g.beginPath();
            g.moveTo(x0, y0);
            g.lineTo(x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len);
            g.stroke();
            return;
        }
        g.fillStyle = col;
        for (let t = 0; t <= len; t++) g.fillRect(Math.round(x0 + Math.cos(ang) * t), Math.round(y0 + Math.sin(ang) * t), 1, 1);
    };
    const dot = (x, y, r, col) => {
        g.fillStyle = col;
        if (hd) { g.beginPath(); g.arc(x, y, r, 0, P2); g.fill(); } else g.fillRect(Math.round(x), Math.round(y), 1, 1);
    };
    // Sprite pieds au sol (wx, wy en coordonnées monde) ; renvoie l'ordonnée du haut
    const drawSprite = (spr, wx, wy, k, flip, bob, flash) => {
        const sw = (spr.lw || spr.width) * k, sh = (spr.lh || spr.height) * k;
        const x = L(wx), feet = L(wy) + Math.round(sh * 0.35);
        shadow(x, feet - 1, Math.round(sw * 0.4));
        g.save();
        g.translate(x, feet - sh - bob);
        if (flip) g.scale(-1, 1);
        img(spr, -Math.floor(sw / 2), 0, sw, sh);
        if (flash) img(Art.white(spr), -Math.floor(sw / 2), 0, sw, sh);
        g.restore();
        return feet - sh - bob;
    };
    const drawPortal = (wx, wy) => {
        const x = L(wx), y = L(wy);
        if (hd) {
            const gr = g.createRadialGradient(x, y, 0, x, y, 10);
            gr.addColorStop(0, 'rgba(224,242,254,0.9)');
            gr.addColorStop(0.5, 'rgba(56,189,248,0.45)');
            gr.addColorStop(1, 'rgba(12,74,110,0)');
            g.fillStyle = gr;
            g.beginPath(); g.ellipse(x, y, 10, 7, 0, 0, P2); g.fill();
            g.lineWidth = 0.6;
            ['#0ea5e9', '#7dd3fc', '#e0f2fe'].forEach((col, i) => {
                const a0 = now * 0.003 * (i % 2 ? 1 : -1) + i;
                g.strokeStyle = col;
                g.beginPath();
                g.ellipse(x, y, 9 - i * 2.6 + Math.sin(now * 0.006 + i) * 0.6, 6 - i * 1.8, 0, a0, a0 + 4.6);
                g.stroke();
            });
            for (let k = 0; k < 6; k++) {
                const a = now * 0.004 + k * Math.PI / 3;
                dot(x + Math.cos(a) * 8.5, y + Math.sin(a) * 5.5, 0.45, '#bae6fd');
            }
        } else {
            ['#0c4a6e', '#38bdf8', '#e0f2fe'].forEach((col, i) => {
                g.strokeStyle = col;
                g.lineWidth = 1;
                g.beginPath();
                g.ellipse(x, y, 9 - i * 3 + Math.sin(now * 0.006 + i), 6 - i * 2, 0, 0, P2);
                g.stroke();
            });
            g.fillStyle = '#bae6fd';
            for (let k = 0; k < 4; k++) {
                const a = now * 0.004 + k * Math.PI / 2;
                g.fillRect(Math.round(x + Math.cos(a) * 8), Math.round(y + Math.sin(a) * 5), 1, 1);
            }
        }
        light(x, y, 32, '#38bdf8', 0.55);
        return y - 10;
    };

    // --- Objets au sol ---
    w.chests.forEach(ch => {
        const x = L(ch.x), y = L(ch.y);
        const spr = Art.chest(ch.opened), cw = spr.lw || spr.width, chh = spr.lh || spr.height;
        shadow(x, y + 4, 6);
        img(spr, x - cw / 2, y + 5 - chh, cw, chh);
        if (!ch.opened) light(x, y, 14, '#facc15', 0.2);
    });

    w.lootDrops.forEach(drop => {
        const x = L(drop.x), bobY = Math.sin(now * 0.005 + x) * 1.5, y = L(drop.y) - (hd ? bobY : Math.round(bobY));
        if (hd) {
            const gr = g.createLinearGradient(0, y - 16, 0, y);
            gr.addColorStop(0, HD.rgba(drop.color, 0));
            gr.addColorStop(1, HD.rgba(drop.color, 0.45));
            g.fillStyle = gr;
            g.fillRect(x - 0.6, y - 16, 1.2, 16);
            g.fillStyle = drop.color;
            g.beginPath(); g.moveTo(x, y - 2.6); g.lineTo(x + 2, y); g.lineTo(x, y + 2.4); g.lineTo(x - 2, y); g.closePath(); g.fill();
            g.fillStyle = 'rgba(255,255,255,0.55)';
            g.beginPath(); g.moveTo(x, y - 2.6); g.lineTo(x + 0.9, y - 0.2); g.lineTo(x - 0.9, y - 0.2); g.closePath(); g.fill();
            const tw = Math.max(0, Math.sin(now * 0.004 + x));
            if (tw > 0.6) {
                g.globalAlpha = (tw - 0.6) * 2.5;
                g.strokeStyle = '#ffffff';
                g.lineWidth = 0.3;
                g.beginPath(); g.moveTo(x + 1.5, y - 3.5); g.lineTo(x + 1.5, y - 1); g.moveTo(x + 0.25, y - 2.25); g.lineTo(x + 2.75, y - 2.25); g.stroke();
                g.globalAlpha = 1;
            }
        } else {
            g.globalAlpha = 0.3;
            g.fillStyle = drop.color;
            g.fillRect(x, y - 12, 1, 12);
            g.globalAlpha = 1;
            g.fillRect(x - 1, y - 1, 3, 3);
            g.fillRect(x, y - 2, 1, 5);
            g.fillRect(x - 2, y, 5, 1);
            if (Math.floor(now / 250 + x) % 4 === 0) {
                g.fillStyle = '#ffffff';
                g.fillRect(x, y, 1, 1);
            }
        }
        light(x, y, 14, drop.color, 0.45);
        label(drop.label, x, y - 5, drop.color);
    });

    if (w.portal) {
        const top = drawPortal(w.portal.x, w.portal.y);
        label('Portail Camp [E]', L(w.portal.x), top - 1, '#7dd3fc');
    }

    // --- Ennemis (fente / recul / tremblement de charge / flash d'impact) ---
    w.enemies.forEach(en => {
        if (en.hp <= 0) return; // mannequin brisé en attente
        const x = L(en.x), y = L(en.y);
        const aToP = Math.atan2(p.y - en.y, p.x - en.x);
        let ox = 0, oy = 0;
        if (en.attackAnim > 0) {
            const dur = en.isRanged ? 0.2 : 0.25;
            const t = Math.sin((1 - en.attackAnim / dur) * Math.PI);
            const d = en.isRanged ? -2 : 6;
            ox += Math.cos(aToP) * t * d;
            oy += Math.sin(aToP) * t * d;
        }
        if (en.hitFlash > 0) {
            ox -= Math.cos(aToP) * 2;
            oy -= Math.sin(aToP) * 2;
        }
        // Télégraphes des attaques (tremblement + zone/ligne de danger)
        const act = en.action;
        let fuseFlash = false;
        if (act && act.type !== 'dash' && act.t > 0) {
            const prog = 1 - act.t / act.max;
            const pulse = 'rgba(239,68,68,' + (0.35 + 0.35 * Math.sin(now * 0.03)) + ')';
            ox += Math.random() < 0.5 ? -1 : 1;
            if (act.type === 'shot' || act.type === 'volley3' || act.type === 'volley') {
                (act.type === 'shot' ? [0] : act.type === 'volley3' ? [-0.25, 0, 0.25] : [-0.36, 0, 0.36]).forEach(o => pxLine(x, y, act.angle + o, 83, pulse, 0.6));
            } else if (act.type === 'charge') {
                if (hd) {
                    // Couloir de charge : bande translucide qui se remplit
                    g.save();
                    g.translate(x, y);
                    g.rotate(act.angle);
                    g.fillStyle = 'rgba(239,68,68,0.18)';
                    g.beginPath(); g.roundRect(0, -3, 95, 6, 3); g.fill();
                    g.fillStyle = pulse;
                    g.beginPath(); g.roundRect(0, -3, 95 * prog, 6, 3); g.fill();
                    g.restore();
                } else {
                    [-2, 0, 2].forEach(o => pxLine(x + Math.round(Math.sin(act.angle) * o), y - Math.round(Math.cos(act.angle) * o), act.angle, 95, pulse));
                }
            } else if (act.type === 'slam' || act.type === 'fuse') {
                const R = L(act.type === 'slam' ? 135 : 80);
                g.globalAlpha = 0.18 + 0.25 * prog;
                g.fillStyle = '#ef4444';
                g.beginPath();
                g.ellipse(x, y, R * prog, R * prog * 0.7, 0, 0, P2);
                g.fill();
                g.globalAlpha = 0.8;
                g.strokeStyle = '#ef4444';
                g.lineWidth = hd ? 0.6 : 1;
                g.beginPath();
                g.ellipse(x, y, R, R * 0.7, 0, 0, P2);
                g.stroke();
                g.globalAlpha = 1;
                fuseFlash = act.type === 'fuse' && Math.floor(now / 70) % 2 === 0;
            } else {
                // nova / invocation : anneau de particules qui se resserre
                const r = 4 + (1 - prog) * 14;
                for (let i = 0; i < 10; i++) {
                    const a2 = now * 0.006 + i * Math.PI / 5;
                    dot(x + Math.cos(a2) * r, y - 4 + Math.sin(a2) * r * 0.7, 0.6, en.color);
                }
            }
            light(x, y - 3, 10 + prog * 20, en.color, 0.6);
        }
        if (act && act.type === 'dash') {
            g.globalAlpha = 0.35;
            g.fillStyle = en.color;
            for (let i = 1; i <= 3; i++) {
                const ax = x - Math.cos(act.angle) * i * 4, ay = y - Math.sin(act.angle) * i * 4;
                if (hd) { g.beginPath(); g.ellipse(ax, ay - 1, 3, 3.6, 0, 0, P2); g.fill(); } else g.fillRect(Math.round(ax) - 2, Math.round(ay) - 4, 5, 6);
            }
            g.globalAlpha = 1;
        }

        const k = en.isBoss ? 2 : (en.kind === 'tank' ? 1.5 : 1) * (en.isElite ? 1.25 : 1);
        const flap = en.body === 'swarm' ? 70 : 160;
        const bob = (en.aggro && en.stunTimer <= 0 && !(en.attackAnim > 0)) ? Math.floor(now / flap + en.x) % 2 : 0;
        const spr = Art.enemy(en, bob);
        const top = drawSprite(spr, en.x + ox * PX, en.y + oy * PX, k, p.x < en.x, bob, en.hitFlash > 0 || fuseFlash);

        // Griffures sur le héros au moment de l'impact au corps-à-corps
        if (!en.isRanged && en.attackAnim > 0 && en.attackAnim < 0.17) {
            const hx = L(p.x), hy = L(p.y) - 4;
            for (let i = -1; i <= 1; i++) pxLine(hx - 3 + i * 3, hy - 4, Math.PI * 0.35, 8, i ? en.color : '#ffffff', 0.5);
        }

        if (en.stunTimer > 0) {
            for (let i = 0; i < 3; i++) dot(x + Math.cos(now * 0.008 + i * 2.1) * 5, top - 2, 0.6, '#fde047');
        }

        const frac = Math.max(0, en.hp / en.maxHp), barCol = en.isBoss ? '#f97316' : '#ef4444';
        let by;
        if (hd) {
            const bw = en.radius * 2.2 / PX, bx = x - bw / 2;
            by = top - 4;
            g.fillStyle = 'rgba(0,0,0,0.75)';
            g.beginPath(); g.roundRect(bx - 0.5, by - 0.5, bw + 1, 2.2, 1.1); g.fill();
            g.fillStyle = '#450a0a';
            g.beginPath(); g.roundRect(bx, by, bw, 1.2, 0.6); g.fill();
            if (frac > 0) {
                const gr = g.createLinearGradient(0, by, 0, by + 1.2);
                gr.addColorStop(0, Pixel.shade(barCol, 0.35));
                gr.addColorStop(1, barCol);
                g.fillStyle = gr;
                g.beginPath(); g.roundRect(bx, by, Math.max(1.2, bw * frac), 1.2, 0.6); g.fill();
            }
        } else {
            const bw = Math.round(en.radius * 2.2 / PX), bx = x - (bw >> 1);
            by = top - 4;
            g.fillStyle = '#000000';
            g.fillRect(bx - 1, by - 1, bw + 2, 4);
            g.fillStyle = '#450a0a';
            g.fillRect(bx, by, bw, 2);
            g.fillStyle = barCol;
            g.fillRect(bx, by, Math.round(bw * frac), 2);
        }

        if (en.isBoss) light(x, y, 30, en.color, 0.3);
        if (en.isBoss || en.isElite) label(en.name, x, by - 2, en.isBoss ? '#fdba74' : '#fde047');
    });

    // --- Héros : fente + arme active animée (mêlée ou distance) ---
    const prog = p.swingAnim > 0 ? Math.min(1, 1 - p.swingAnim / 0.24) : -1; // 0 → 1 pendant l'attaque
    const attacking = prog >= 0;
    const rangedOn = State.hero.activeWeapon === 'ranged' && !!State.hero.equipment.ranged;
    const lunge = attacking ? Math.sin(prog * Math.PI) * (rangedOn ? -2 : 3) : 0;
    const flip = Math.cos(p.facing) < 0;
    const heroStep = p.moving && !attacking ? Math.floor(now / 120) % 2 : 0;
    const heroTop = drawSprite(
        Art.hero(heroStep),
        p.x + Math.cos(p.facing) * lunge * PX, p.y + Math.sin(p.facing) * lunge * PX,
        1, flip, heroStep, p.hitFlash > 0
    );
    const hxRaw = L(p.x) + Math.cos(p.facing) * (lunge + 3), hyRaw = heroTop + 10 + Math.sin(p.facing) * 2;
    const hx = hd ? hxRaw : Math.round(hxRaw);
    const hy = hd ? hyRaw : Math.round(hyRaw);

    if (rangedOn) {
        // Arc tendu perpendiculaire à la visée ; la corde se relâche au tir
        const perp = p.facing + Math.PI / 2;
        const pull = attacking ? 0 : -2;
        const mx = hx + Math.cos(p.facing) * pull, my = hy + Math.sin(p.facing) * pull;
        if (hd) {
            const e1x = hx + Math.cos(perp) * 4.5, e1y = hy + Math.sin(perp) * 4.5;
            const e2x = hx - Math.cos(perp) * 4.5, e2y = hy - Math.sin(perp) * 4.5;
            g.strokeStyle = '#e5e7eb';
            g.lineWidth = 0.25;
            g.beginPath(); g.moveTo(e1x, e1y); g.lineTo(mx, my); g.lineTo(e2x, e2y); g.stroke();
            g.strokeStyle = '#7c4a1e';
            g.lineWidth = 1;
            g.beginPath(); g.moveTo(e1x, e1y); g.quadraticCurveTo(hx + Math.cos(p.facing) * 4, hy + Math.sin(p.facing) * 4, e2x, e2y); g.stroke();
            g.strokeStyle = '#d97706';
            g.lineWidth = 0.35;
            g.stroke();
            if (!attacking) {
                pxLine(mx, my, p.facing, 6, '#d6d3d1', 0.4);
                const tx = mx + Math.cos(p.facing) * 6.5, ty = my + Math.sin(p.facing) * 6.5;
                g.fillStyle = '#e5e7eb';
                g.beginPath();
                g.moveTo(tx + Math.cos(p.facing) * 1.2, ty + Math.sin(p.facing) * 1.2);
                g.lineTo(tx + Math.cos(perp) * 0.7, ty + Math.sin(perp) * 0.7);
                g.lineTo(tx - Math.cos(perp) * 0.7, ty - Math.sin(perp) * 0.7);
                g.closePath();
                g.fill();
            }
        } else {
            g.fillStyle = '#a16207';
            for (let t = -4; t <= 4; t++) {
                const bend = 2 - (t * t) / 8;
                g.fillRect(Math.round(hx + Math.cos(perp) * t + Math.cos(p.facing) * bend), Math.round(hy + Math.sin(perp) * t + Math.sin(p.facing) * bend), 1, 1);
            }
            g.fillStyle = '#e5e7eb';
            [-4, 4].forEach(t => {
                const ex = hx + Math.cos(perp) * t, ey = hy + Math.sin(perp) * t;
                for (let i = 0; i <= 4; i++) g.fillRect(Math.round(ex + (mx - ex) * i / 4), Math.round(ey + (my - ey) * i / 4), 1, 1);
            });
            if (!attacking) pxLine(Math.round(mx), Math.round(my), p.facing, 5, '#d6d3d1');
        }
        if (attacking && prog < 0.4) light(hx + Math.cos(p.facing) * 4, hy, 12, '#fde68a', 0.6);
    } else {
        const ease = attacking ? 1 - (1 - prog) * (1 - prog) : 0;
        const a = attacking ? p.facing - 1.4 + 2.8 * ease : p.facing + (flip ? -0.7 : 0.7);
        const len = attacking ? 11 : 7;
        if (hd) {
            if (attacking && a > p.facing - 1.4) {
                // Traînée de la lame : croissant lumineux
                g.globalAlpha = 0.28;
                g.strokeStyle = '#fef3c7';
                g.lineWidth = 3.2;
                g.beginPath(); g.arc(hx, hy, 9.5, p.facing - 1.4, a); g.stroke();
                g.globalAlpha = 0.7;
                g.lineWidth = 0.8;
                g.strokeStyle = '#ffffff';
                g.beginPath(); g.arc(hx, hy, 11, Math.max(p.facing - 1.4, a - 1), a); g.stroke();
                g.globalAlpha = 1;
            }
            const ca = Math.cos(a), sa = Math.sin(a);
            g.strokeStyle = '#9ca3af';
            g.lineWidth = 1.3;
            g.beginPath(); g.moveTo(hx + ca * 1.5, hy + sa * 1.5); g.lineTo(hx + ca * len, hy + sa * len); g.stroke();
            g.strokeStyle = attacking ? '#ffffff' : '#e5e7eb';
            g.lineWidth = 0.45;
            g.beginPath(); g.moveTo(hx + ca * 1.8, hy + sa * 1.8); g.lineTo(hx + ca * (len - 0.4), hy + sa * (len - 0.4)); g.stroke();
            g.strokeStyle = '#a16207';
            g.lineWidth = 0.7;
            g.beginPath(); g.moveTo(hx + ca * 1.5 - sa * 1.4, hy + sa * 1.5 + ca * 1.4); g.lineTo(hx + ca * 1.5 + sa * 1.4, hy + sa * 1.5 - ca * 1.4); g.stroke();
            dot(hx, hy, 0.8, '#78350f');
        } else {
            if (attacking) {
                for (let s = p.facing - 1.4; s < a; s += 0.08) {
                    g.globalAlpha = 0.25 + 0.6 * (s - (p.facing - 1.4)) / 2.8;
                    g.fillStyle = '#fef3c7';
                    g.fillRect(Math.round(hx + Math.cos(s) * 11), Math.round(hy + Math.sin(s) * 11), 2, 1);
                    g.fillRect(Math.round(hx + Math.cos(s) * 9), Math.round(hy + Math.sin(s) * 9), 1, 1);
                }
                g.globalAlpha = 1;
            }
            pxLine(hx, hy, a, len, attacking ? '#f8fafc' : '#a1a1aa');
            g.fillStyle = '#78350f';
            g.fillRect(hx - 1, hy - 1, 2, 2);
        }
    }
    g.globalAlpha = 1;
    light(L(p.x), L(p.y), 70, '#fff7ed', 0.12);

    // --- Projectiles ---
    w.projectiles.forEach(prj => {
        const x = L(prj.x), y = L(prj.y), s = Math.max(1, Math.round(prj.radius / PX));
        const ang = Math.atan2(prj.vy, prj.vx);
        if (prj.fromHero) {
            if (hd) {
                const ca = Math.cos(ang), sa = Math.sin(ang);
                g.globalAlpha = 0.35;
                pxLine(x - ca * 14, y - sa * 14, ang, 8, '#fde68a', 0.5);
                g.globalAlpha = 1;
                pxLine(x - ca * 6, y - sa * 6, ang, 5.5, '#a16207', 0.5);
                pxLine(x - ca * 6, y - sa * 6, ang + 2.6, 1.2, '#e5e7eb', 0.4);
                pxLine(x - ca * 6, y - sa * 6, ang - 2.6, 1.2, '#e5e7eb', 0.4);
                g.fillStyle = '#f8fafc';
                g.beginPath();
                g.moveTo(x + ca * 1.4, y + sa * 1.4);
                g.lineTo(x - ca * 0.4 - sa * 0.8, y - sa * 0.4 + ca * 0.8);
                g.lineTo(x - ca * 0.4 + sa * 0.8, y - sa * 0.4 - ca * 0.8);
                g.closePath();
                g.fill();
            } else {
                pxLine(x - Math.round(Math.cos(ang) * 6), y - Math.round(Math.sin(ang) * 6), ang, 6, '#a16207');
                g.fillStyle = '#f8fafc';
                g.fillRect(x, y, 1, 1);
                g.fillRect(x - Math.round(Math.cos(ang)), y - Math.round(Math.sin(ang)), 1, 1);
            }
            light(x, y, 8, prj.color, 0.35);
            return;
        }
        if (hd) {
            for (let i = 1; i <= 4; i++) {
                g.globalAlpha = 0.45 - i * 0.09;
                dot(x - prj.vx * 0.006 * i, y - prj.vy * 0.006 * i, s * (1 - i * 0.15), prj.color);
            }
            g.globalAlpha = 1;
            const gr = g.createRadialGradient(x, y, 0, x, y, s + 1);
            gr.addColorStop(0, '#ffffff');
            gr.addColorStop(0.4, prj.color);
            gr.addColorStop(1, HD.rgba(prj.color, 0));
            g.fillStyle = gr;
            g.beginPath(); g.arc(x, y, s + 1, 0, P2); g.fill();
        } else {
            g.fillStyle = prj.color;
            for (let i = 1; i <= 3; i++) {
                g.globalAlpha = 0.5 - i * 0.13;
                g.fillRect(Math.round(x - prj.vx * 0.006 * i), Math.round(y - prj.vy * 0.006 * i), 1, 1);
            }
            g.globalAlpha = 1;
            g.fillRect(x - s, y - s + 1, 2 * s + 1, 2 * s - 1);
            g.fillRect(x - s + 1, y - s, 2 * s - 1, 2 * s + 1);
            g.fillStyle = '#ffffff';
            g.fillRect(x, y, 1, 1);
        }
        light(x, y, 10 + s * 4, prj.color, 0.7);
    });

    // --- Ondes de choc ---
    FX.rings.forEach(rg => {
        const t = 1 - rg.life / rg.max;
        const rad = Math.max(1, L(rg.radius) * (1 - (1 - t) * (1 - t)));
        g.globalAlpha = 1 - t;
        g.strokeStyle = rg.color;
        g.lineWidth = hd ? 1.4 * (1 - t) + 0.3 : 2;
        g.beginPath();
        g.ellipse(L(rg.x), L(rg.y), rad, rad * 0.7, 0, 0, P2);
        g.stroke();
        light(L(rg.x), L(rg.y), rad + 6, rg.color, 0.5 * (1 - t));
    });
    g.globalAlpha = 1;

    // --- Particules (poussière normale, étincelles additives) ---
    w.particles.forEach(pt => {
        g.globalCompositeOperation = pt.dust ? 'source-over' : 'lighter';
        g.globalAlpha = Math.max(0, Math.min(1, pt.life * (pt.dust ? 1.2 : 2.5)));
        if (hd) dot(L(pt.x), L(pt.y), pt.dust ? 1 : 0.6, pt.color);
        else {
            g.fillStyle = pt.color;
            g.fillRect(L(pt.x), L(pt.y), 1, 1);
        }
    });
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;

    // --- Éclairage dynamique : obscurité trouée par les sources de lumière (canevas logique, lissé en HD) ---
    screenSpace();
    const lc = lightCtx;
    lc.globalCompositeOperation = 'source-over';
    lc.clearRect(0, 0, lw, lh);
    lc.fillStyle = look.dark;
    lc.fillRect(0, 0, lw, lh);
    lc.globalCompositeOperation = 'destination-out';
    const hole = HD.blob('#000000');
    lights.forEach(li => {
        const r = li.r * 1.3;
        lc.drawImage(hole, li.x - camX - r, li.y - camY - r, r * 2, r * 2);
    });
    // Brumes, étalonnage (HD) et vignette composés dans ce voile basse résolution : un seul agrandissement plein écran
    lc.globalCompositeOperation = 'source-over';
    drawAmbience(lc, 'mist', biome.id, lw, lh, now, hd, camX, camY);
    const grade = BIOME_GRADE[biome.id];
    if (grade && hd) {
        lc.globalAlpha = grade[1] * 0.3;
        lc.fillStyle = grade[0];
        lc.fillRect(0, 0, lw, lh);
        lc.globalAlpha = 1;
    }
    vignette(lc);
    g.imageSmoothingEnabled = hd;
    g.drawImage(lightCanvas, 0, 0);

    // --- Lueurs colorées additives ---
    g.globalCompositeOperation = 'lighter';
    // Halos mis en cache par couleur (bien moins coûteux qu'un dégradé recréé à chaque lumière)
    lights.forEach(li => {
        g.globalAlpha = li.a * 0.45;
        g.drawImage(HD.blob(li.col), li.x - camX - li.r, li.y - camY - li.r, li.r * 2, li.r * 2);
    });

    // --- Poussières / lucioles d'ambiance génériques ---
    const moteCol = look.mote || accentCol;
    for (let i = 0; i < 36; i++) {
        const sp = 0.003 * (1 + i % 3);
        const mx = ((i * 97.3 + now * sp * (i % 2 ? 1 : -1)) % lw + lw) % lw;
        const my = ((i * 61.7 - now * sp * (look.rise ? 3 : 0.6) + Math.sin(now * 0.001 + i) * 8) % lh + lh) % lh;
        g.globalAlpha = 0.25 + 0.25 * Math.sin(now * 0.003 + i * 1.7);
        dot(mx, my, 0.5, moteCol);
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;

    // --- Météo / ambiance du biome puis étalonnage colorimétrique ---
    drawAmbience(g, 'fx', biome.id, lw, lh, now, hd, camX, camY);
    if (grade && !hd) {
        // Pixel : fusion soft-light, abordable en basse résolution
        g.globalCompositeOperation = 'soft-light';
        g.globalAlpha = grade[1];
        g.fillStyle = grade[0];
        g.fillRect(0, 0, lw, lh);
        g.globalCompositeOperation = 'source-over';
        g.globalAlpha = 1;
    }

    // Flash rouge quand le héros est touché
    if (p.hitFlash > 0) {
        g.fillStyle = 'rgba(220,38,38,' + (p.hitFlash * 0.9) + ')';
        g.fillRect(0, 0, lw, 2);
        g.fillRect(0, lh - 2, lw, 2);
        g.fillRect(0, 0, 2, lh);
        g.fillRect(lw - 2, 0, 2, lh);
    }

    present();

    // --- Textes à pleine résolution (police lisible avec contour) ---
    w.floatingTexts.forEach(ft => label(ft.text, L(ft.x), L(ft.y), ft.color, ft.big ? 16 : 8, ft.icon));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    labels.forEach(lb => {
        const sx = (lb.x - camX) * PX, sy = (lb.y - camY) * PX;
        ctx.font = (lb.size > 8 ? '800 18px' : '700 12px') + ' Inter, system-ui, sans-serif';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeText(lb.text, sx, sy);
        ctx.fillStyle = lb.color;
        ctx.fillText(lb.text, sx, sy);
        if (lb.icon) {
            const sz = lb.size > 8 ? 20 : 15;
            ctx.imageSmoothingEnabled = Gfx.hd;
            ctx.drawImage(lb.icon, sx - ctx.measureText(lb.text).width / 2 - sz - 2, sy - sz + 3, sz, sz);
        }
    });

    renderMinimap(accentCol);
}

function renderMinimap(accentCol) {
    const w = State.world;
    miniCtx.fillStyle = '#09090d';
    miniCtx.fillRect(0, 0, miniCanvas.width, miniCanvas.height);

    const sx = miniCanvas.width / w.cols;
    const sy = miniCanvas.height / w.rows;

    for (let r = 0; r < w.rows; r++) {
        for (let c = 0; c < w.cols; c++) {
            if (!w.explored[r][c]) continue;
            miniCtx.fillStyle = w.grid[r][c] === 0 ? '#292524' : '#57534e';
            miniCtx.fillRect(c * sx, r * sy, Math.ceil(sx), Math.ceil(sy));
        }
    }

    w.npcs.forEach(n => {
        miniCtx.fillStyle = n.color;
        miniCtx.fillRect((n.x / w.tileSize) * sx - 2, (n.y / w.tileSize) * sy - 2, 4, 4);
    });

    w.enemies.forEach(e => {
        if (e.dummy) return;
        miniCtx.fillStyle = e.isBoss ? '#f97316' : '#ef4444';
        miniCtx.fillRect((e.x / w.tileSize) * sx - 1.5, (e.y / w.tileSize) * sy - 1.5, 3, 3);
    });

    // Portail (camp ou sortie de donjon après le boss) : anneau violet clignotant
    const portal = w.portal || w.npcs.find(n => n.role === 'portal');
    if (portal) {
        miniCtx.strokeStyle = '#c084fc';
        miniCtx.lineWidth = 2;
        miniCtx.beginPath();
        miniCtx.arc((portal.x / w.tileSize) * sx, (portal.y / w.tileSize) * sy, 3.5 + Math.sin(performance.now() * 0.008), 0, Math.PI * 2);
        miniCtx.stroke();
    }

    miniCtx.fillStyle = '#38bdf8';
    miniCtx.beginPath();
    miniCtx.arc((w.player.x / w.tileSize) * sx, (w.player.y / w.tileSize) * sy, 3, 0, Math.PI * 2);
    miniCtx.fill();
}
