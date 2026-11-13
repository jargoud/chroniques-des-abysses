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

const HUMANOID_ROWS = [
    '....oooo....',
    '...ohhhho...',
    '..ohhhhhho..',
    '..ohssssho..',
    '..osesseso..',
    '..osssssso..',
    '...osssso...',
    '..obbBBbbo..',
    '.obbbBBbbbo.',
    '.osbbBBbbso.',
    '.osdbbbbdso.',
    '..oddddddo..',
    '..olloollo..',
    '..olo..olo..',
    '..ofo..ofo..',
    '..ooo..ooo..'
];

const MONSTER_ROWS = [
    '..o........o..',
    '..ok......ko..',
    '...okooooko...',
    '...occCCcco...',
    '..occCCCCcco..',
    '..ocepccepco..',
    '.occcccccccco.',
    '.occwkwkwkcco.',
    '.occcccccccco.',
    '.okccccccccko.',
    '..okkccccckko.',
    '..okko..okko..',
    '..ooo....ooo..'
];

const CHEST_ROWS = [
    '.oooooooooo.',
    'oyyyyyyyyyyo',
    'owwwwwwwwwwo',
    'oggggggggggo',
    'owwwwggwwwwo',
    'owwwwkkwwwwo',
    'owwwwwwwwwwo',
    'oddddddddddo',
    '.oooooooooo.'
];

const SWARM_ROWS = [
    'o..........o',
    'oco......oco',
    'occo.oo.occo',
    '.occcccccco.',
    '..ocepcepco.',
    '..occcccco..',
    '...ok..ko...',
    '...o....o...'
];

const BOMB_ROWS = [
    '.......ff...',
    '......f.....',
    '....oooo....',
    '..ooccCCoo..',
    '.occcccCCco.',
    '.occeccecco.',
    'occcccccccco',
    'occwkwkwkcco',
    'occcccccccco',
    '.okccccccko.',
    '..okkkkkko..',
    '...oooooo...'
];

// Les mannequins ne récompensent (XP, or, potions) que sous ce niveau ; au-delà ils servent juste à s'exercer
const TRAINING_MAX_LVL = 6;

const DUMMY_ROWS = [
    '...oooo...',
    '..oSSSSo..',
    '..oSkSko..',
    '..oSSSSo..',
    '...oSSo...',
    'oooobboooo',
    'obbbbbbbbo',
    'oooSSSSooo',
    '..oSwwSo..',
    '..oSrrSo..',
    '..oSwwSo..',
    '..oSSSSo..',
    '...obbo...',
    '...obbo...',
    '..oobboo..'
];

const HERO_HAIR = '#9ca3af';

// Ornements posés sur les silhouettes de base pour coller au biome : { silhouette: [x, y, lignes] }
// (x, y) en pixels du sprite de base ; y négatif = au-dessus de la tête. Le sprite est agrandi de 4 px en haut, 3 px sur les côtés.
const FLAME_ROWS = ['..F.....', '.fF..F..', '.ff.fFf.', 'fFffffff'];
const WISP_ROWS = ['.C...C..', '.cC.cC.C', 'ccCccCcc'];
const DECOS = {
    skull:    { hum: [3, 3, ['wwwwww', 'wewwew', 'wwxxww', '.xwxw.']], swarm: [3, 2, ['.wwwww.', 'wwwwwww', '.ewwew.', '.wxwxw.']] },
    hood:     { hum: [1, 0, ['..oxxxxo..', '.oxxxxxxo.', 'oxxxxxxxxo', 'oxxXXXXxxo', 'oxxeXXexxo', 'oxxXXXXxxo', '.oxxxxxxo.']] },
    helm:     { hum: [2, 0, ['..ommo..', '.ommmmo.', 'ommmmmmo', 'ommmmmmo', 'oxexxexo', 'ommmmmmo']] },
    plume:    { hum: [6, -3, ['.rr', 'rr.', 'r..']] },
    wizard:   { hum: [2, -4, ['...oo...', '..okko..', '..okko..', '.okggko.', 'okkkkkko']] },
    crown:    { hum: [3, -3, ['g.gg.g', 'gggggg', 'grggrg']], mon: [4, -1, ['g.gg.g', 'gggggg', 'grggrg']] },
    horns:    { hum: [1, -3, ['N........N', 'n........n', 'nn......nn', '.nn....nn.']],
                mon: [1, -3, ['N..........N', 'n..........n', 'nn........nn']],
                bomb: [2, 0, ['n......n', 'nn....nn', '.nn..nn.']] },
    nemes:    { hum: [1, 0, ['..oggggo..', '.ogagagao.', 'ogagagagao', 'oag....gao', 'oga....ago', 'oag....gao', '.og....go.']],
                mon: [2, 2, ['.oggggggo.', 'ogagagagao', 'oga....ago', 'oa......ao', 'og......go', '.a......a.']] },
    mask:     { hum: [3, 3, ['gggggg', 'geggeg', 'gggggg', '.gggg.']] },
    feathers: { hum: [2, -3, ['r..FF..r', '.r.FF.r.', '.rrFFrr.', 'oggggggo']] },
    antlers:  { hum: [1, -4, ['b.b....b.b', '.bb....bb.', '..b....b..', '..bb..bb..']],
                mon: [2, -4, ['b.b....b.b', '.bb....bb.', '..b....b..', '..bb..bb..']] },
    runes:    { hum: [4, 8, ['p..p', '.pp.', 'p..p']], mon: [5, 8, ['p..p', '.pp.', 'p..p']], bomb: [4, 8, ['p..p', '.pp.']] },
    chains:   { hum: [1, 10, ['mMmMmMmMmM', '....M.....', '....m.....']], mon: [1, 8, ['mMmMmMmMmMmM', '.....M......', '.....m......']] },
    stone:    { mon: [3, 3, ['..x.....', '..xx..x.', '...x..x.', '.......x']] },
    wings:    { mon: [-3, 2, ['x..................x', 'xx................xx', 'xkx..............xkx', 'xkkx............xkkx', '.xkk............kkx.', '..xk............kx..']] },
    bones:    { mon: [4, 0, ['w.w.w.w', 'w.w.w.w']] },
    spikes:   { mon: [4, 0, ['x.x.x.x', 'x.x.x.x']] },
    ears:     { mon: [2, -3, ['k........k', 'kk......kk', 'kC......Ck']] },
    stitches: { mon: [4, 8, ['.x.x.x.', 'xxxxxxx', '.x.x.x.']], bomb: [3, 9, ['xxxxxx', '.x.x.x']] },
    tusk:     { mon: [6, 4, ['w.', 'ww', 'ww']] },
    eyes:     { mon: [4, 3, ['r.r.r.r']] },
    leaves:   { mon: [3, 1, ['l.L..L.l', '.LlL.lL.']] },
    fire:     { mon: [3, -2, FLAME_ROWS], swarm: [2, -4, FLAME_ROWS] },
    wisp:     { bomb: [2, 0, WISP_ROWS] },
    beetle:   { swarm: [3, 3, ['..xx..', 'C.xx.C']] },
    spider:   { swarm: [0, 3, ['x..........x', '.x........x.', 'x..........x']] },
    // Bandelettes de momie : rayures sur tout le corps
    bandage:  { fn(px, W, H, i, x, y) { if (y % 2 === 0) px.set([239, 230, 207], i); else if ((x + y) % 4 === 0) px.set([138, 122, 90], i); } },
    // Spectre : translucide, bas du corps effiloché
    ghost:    { fn(px, W, H, i, x, y) { px[i + 3] = (y >= H - 2 || (y >= H - 4 && (x + y) % 2)) ? 0 : 170; }, all: true }
};

const Pixel = {
    cache: {},

    // f > 0 éclaircit, f < 0 assombrit (hex '#rrggbb' en entrée)
    shade(hex, f) {
        const n = parseInt(hex.slice(1), 16);
        const ch = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f));
        return '#' + ch.map(v => v.toString(16).padStart(2, '0')).join('');
    },

    sprite(key, rows, pal) {
        if (this.cache[key]) return this.cache[key];
        const c = document.createElement('canvas');
        c.width = rows[0].length;
        c.height = rows.length;
        const g = c.getContext('2d');
        rows.forEach((row, y) => [...row].forEach((ch, x) => {
            if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); }
        }));
        return (this.cache[key] = c);
    },

    humanoid(base, hair, skin = '#f1c27d') {
        return this.sprite('hum' + base + hair + skin, HUMANOID_ROWS, {
            o: '#140d12', h: hair, s: skin, e: '#1a1a1a',
            b: base, B: this.shade(base, 0.35), d: this.shade(base, -0.4), l: '#3b3437', f: '#2a1d14'
        });
    },

    monster(base) {
        return this.sprite('mon' + base, MONSTER_ROWS, {
            o: '#140d12', c: base, C: this.shade(base, 0.35), k: this.shade(base, -0.45),
            e: '#ffffff', p: '#dc2626', w: '#f5f5f4'
        });
    },

    // Silhouette blanche du sprite (flash d'impact)
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
        return (spr._white = c);
    },

    swarm(base) {
        return this.sprite('swm' + base, SWARM_ROWS, {
            o: '#140d12', c: base, k: this.shade(base, -0.45), e: '#ffffff', p: '#dc2626'
        });
    },

    bomb(base) {
        return this.sprite('bmb' + base, BOMB_ROWS, {
            o: '#140d12', c: base, C: this.shade(base, 0.4), k: this.shade(base, -0.45),
            e: '#ffffff', w: '#f5f5f4', f: '#fde047'
        });
    },

    // Sprite d'un ennemi selon sa silhouette, ses ornements de biome et son halo (boss / élite)
    enemy(en) {
        const key = 'en' + en.body + en.color + (en.deco || []).join() + (en.glow || '');
        if (this.cache[key]) return this.cache[key];
        let spr = en.body === 'dummy' ? this.sprite('dummy', DUMMY_ROWS, { o: '#140d12', S: '#d4a64a', k: '#5b3a1a', b: '#7c4a1e', w: '#f5f5f4', r: '#dc2626' })
            : en.body === 'mon' ? this.monster(en.color)
            : en.body === 'swarm' ? this.swarm(en.color)
            : en.body === 'bomb' ? this.bomb(en.color)
            : this.humanoid(en.color, this.shade(en.color, -0.6), '#d6c7a8');
        if (en.deco && en.deco.length) spr = this.decorate(spr, en);
        if (en.glow) spr = this.outline(spr, en.glow);
        return (this.cache[key] = spr);
    },

    decorate(base, en) {
        const S = 3, P = 4, c = en.color;
        const pal = {
            o: '#140d12', w: '#e7e5e4', x: this.shade(c, -0.6), X: this.shade(c, -0.8), k: this.shade(c, -0.45), c, C: this.shade(c, 0.35),
            e: '#fde047', g: '#facc15', r: '#dc2626', m: '#9ca3af', M: '#4b5563', a: '#1d4ed8', b: '#78350f',
            l: '#3f6212', L: '#84cc16', p: '#e879f9', f: '#f97316', F: '#fde047', n: '#78716c', N: '#f5f5f4'
        };
        const cv = document.createElement('canvas');
        cv.width = base.width + S * 2;
        cv.height = base.height + P;
        const g = cv.getContext('2d');
        g.drawImage(base, S, P);
        en.deco.forEach(name => {
            const d = DECOS[name];
            if (!d) return;
            if (d.fn) {
                const img = g.getImageData(0, 0, cv.width, cv.height), px = img.data;
                for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
                    const i = (y * cv.width + x) * 4;
                    // Ignore le vide, et le contour / les yeux sombres sauf pour les effets globaux
                    if (px[i + 3] && (d.all || px[i] + px[i + 1] + px[i + 2] > 120)) d.fn(px, cv.width, cv.height, i, x, y);
                }
                g.putImageData(img, 0, 0);
                return;
            }
            const spec = d[en.body];
            if (!spec) return;
            const [ox, oy, rows] = spec;
            rows.forEach((row, y) => [...row].forEach((ch, x) => {
                if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(ox + x + S, oy + y + P, 1, 1); }
            }));
        });
        return cv;
    },

    // Contour lumineux d'1 px autour de la silhouette
    outline(spr, col) {
        const tint = document.createElement('canvas');
        tint.width = spr.width;
        tint.height = spr.height;
        const t = tint.getContext('2d');
        t.drawImage(spr, 0, 0);
        t.globalCompositeOperation = 'source-in';
        t.fillStyle = col;
        t.fillRect(0, 0, tint.width, tint.height);
        const c = document.createElement('canvas');
        c.width = spr.width + 2;
        c.height = spr.height + 2;
        const g = c.getContext('2d');
        [[0, 1], [2, 1], [1, 0], [1, 2]].forEach(([dx, dy]) => g.drawImage(tint, dx, dy));
        g.drawImage(spr, 1, 1);
        return c;
    },

    chest(opened) {
        return this.sprite('chest' + opened, CHEST_ROWS, opened
            ? { o: '#111827', y: '#1f2937', w: '#4b5563', g: '#6b7280', k: '#374151', d: '#374151' }
            : { o: '#2a1306', y: '#d97706', w: '#92400e', g: '#facc15', k: '#1c1917', d: '#78350f' });
    },

    // Tuiles 16x16 générées une fois par biome : 3 variantes de sol, plusieurs variantes de mur (la 1re revient le plus souvent)
    tiles(key, floor, wall, town) {
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
            town(g) {
                rect(g, 0, 0, 16, 16, F);
                specks(g, 26, F, 0.12, -0.25);
                for (let i = 0; i < 4; i++) {
                    const x = rnd() * 14 | 0, y = 2 + rnd() * 12 | 0;
                    px(g, x, y, sh(F, 0.3));
                    px(g, x + 1, y - 1, sh(F, 0.3));
                }
            },
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
            town: [g => {
                // Arbre vu de dessus sur fond d'herbe
                rect(g, 0, 0, 16, 16, F);
                rect(g, 7, 11, 3, 5, '#5b3a1e');
                for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
                    const d = (x - 7.5) ** 2 + (y - 6.5) ** 2;
                    if (d >= 42) continue;
                    const lit = (x < 7 && y < 6 && rnd() < 0.45) || (x + y) % 5 === 0;
                    px(g, x, y, d > 30 ? sh(W, -0.35) : (lit ? sh(W, 0.3) : W));
                }
            }],
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
            cryptwall: [0, 0, 1].map(v => g => {
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
            sandstone: [0, 0, 1].map(v => g => {
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
            // Pilastres sculptés et frises d'or
            templewall: [0, 0, 1].map(v => g => {
                rect(g, 0, 0, 16, 16, W);
                rect(g, 6, 0, 4, 16, sh(W, 0.15));
                rect(g, 6, 0, 1, 16, sh(W, 0.3));
                rect(g, 9, 0, 1, 16, sh(W, -0.3));
                [2, 13].forEach(y => { rect(g, 0, y, 16, 1, '#a16207'); for (let x = 0; x < 16; x += 3) px(g, x, y, '#facc15'); });
                specks(g, 6, W, 0.12, -0.25);
                if (v) { px(g, 2, 6, '#e879f9'); px(g, 3, 7, '#e879f9'); px(g, 2, 8, '#e879f9'); px(g, 13, 6, '#e879f9'); px(g, 12, 7, '#e879f9'); px(g, 13, 8, '#e879f9'); }
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

        const fStyle = town ? 'town' : (look.floor || 'flag');
        const wStyle = town ? 'town' : (look.wall || 'brick');
        const floors = [0, 1, 2].map(() => mk(FLOORS[fStyle]));
        const walls = WALLS[wStyle].map(fn => mk(fn));
        return (this.cache['tiles' + key] = { floors, walls });
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

// Décor du camp en pixels logiques (1 tuile = T px) : enclos d'entraînement, hutte, forge, étal
function drawCamp(g, T, now, light, label) {
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };

    // Enclos d'entraînement (tuiles 1 à 6 × 6 à 10) : terre battue + barrière ouverte côté camp
    g.globalAlpha = 0.35;
    R(T + 2, 6 * T + 2, 5.5 * T, 4.8 * T, '#a58a5a');
    g.globalAlpha = 1;
    const fy = 6 * T, fx = 6.6 * T;
    R(T, fy + 1, fx - T, 1, '#8b5a2b');
    R(T, fy + 4, fx - T, 1, '#6b4423');
    for (let x = T; x <= fx; x += 8) R(x, fy - 2, 2, 8, '#5b3413');
    for (let y = fy; y <= 11 * T - 4; y += 8) {
        if (y > 7.4 * T && y < 9 * T) continue; // ouverture
        R(fx, y - 2, 2, 8, '#5b3413');
    }
    R(fx - 1, fy, 1, 7.4 * T - fy, '#8b5a2b');
    R(fx - 1, 9 * T, 1, 2 * T - 4, '#8b5a2b');
    label('Camp d’entraînement', 3.8 * T, fy - 4, '#fcd34d');

    State.world.buildings.forEach(b => {
        const x0 = b.c * T, yb = 3 * T; // pied du bâtiment = haut de la rangée 3
        if (b.kind === 'hut') {
            R(x0 + 4, yb - 22, 40, 22, '#7c4a1e');
            for (let y = yb - 19; y < yb; y += 4) R(x0 + 4, y, 40, 1, '#5b3413');
            for (let k = 0; k <= 12; k++) R(x0 + 22 - k * 2, yb - 36 + k, 4 + k * 4, 1, k % 3 ? '#d4a64a' : '#b8862f');
            R(x0 - 2, yb - 23, 52, 2, '#8a6420');
            R(x0 + 20, yb - 12, 8, 12, '#3b2210');
            R(x0 + 26, yb - 6, 1, 1, '#facc15');
            R(x0 + 8, yb - 16, 6, 5, '#fde68a');
            R(x0 + 10, yb - 16, 1, 5, '#5b3413');
            light(x0 + 11, yb - 13, 14, '#fbbf24', 0.35);
            // Panneau des quêtes
            R(x0 + 33, yb - 17, 9, 8, '#5b3413');
            R(x0 + 34, yb - 16, 7, 6, '#f5e6c8');
            R(x0 + 35, yb - 14, 5, 1, '#78716c');
            R(x0 + 35, yb - 12, 4, 1, '#78716c');
        } else if (b.kind === 'forge') {
            R(x0 + 2, yb - 24, 44, 24, '#57534e');
            for (let y = yb - 24, i = 0; y < yb; y += 4, i++) {
                R(x0 + 2, y, 44, 1, '#44403c');
                for (let x = x0 + 2 + (i % 2) * 4; x < x0 + 46; x += 8) R(x, y, 1, 4, '#44403c');
            }
            R(x0, yb - 30, 48, 6, '#292524');
            R(x0 + 3, yb - 33, 42, 3, '#3f3a36');
            R(x0 + 34, yb - 44, 7, 12, '#44403c');
            R(x0 + 33, yb - 45, 9, 2, '#292524');
            for (let i = 0; i < 3; i++) { // fumée
                const t = (now / 45 + i * 9) % 27;
                g.globalAlpha = 0.5 * (1 - t / 27);
                R(x0 + 35 + Math.sin(now * 0.002 + i) * 2, yb - 47 - t, 4, 4, '#a8a29e');
            }
            g.globalAlpha = 1;
            R(x0 + 7, yb - 15, 14, 12, '#1c1917');
            const fl = Math.floor(now / 110) % 2;
            R(x0 + 9, yb - 10, 10, 7, fl ? '#f97316' : '#ea580c');
            R(x0 + 11, yb - 8 - fl, 6, 4, '#fde047');
            light(x0 + 14, yb - 8, 34, '#f97316', 0.55);
            // Enclume
            R(x0 + 28, yb - 7, 11, 3, '#9ca3af');
            R(x0 + 31, yb - 4, 5, 4, '#4b5563');
        } else {
            R(x0 + 7, yb - 28, 34, 16, '#78350f');
            R(x0 + 5, yb - 30, 2, 30, '#5b3413');
            R(x0 + 41, yb - 30, 2, 30, '#5b3413');
            for (let i = 0; i < 12; i++) {
                R(x0 + i * 4, yb - 36, 4, 7, i % 2 ? '#f5f5f4' : '#16a34a');
                R(x0 + i * 4 + 1, yb - 29, 2, 1, i % 2 ? '#d6d3d1' : '#15803d');
            }
            R(x0 + 4, yb - 12, 40, 12, '#92400e');
            R(x0 + 3, yb - 13, 42, 2, '#b45309');
            [['#ef4444', 10], ['#f97316', 14], ['#ef4444', 18]].forEach(([c, x]) => { R(x0 + x, yb - 17, 3, 4, c); R(x0 + x + 1, yb - 18, 1, 1, '#e7e5e4'); });
            R(x0 + 26, yb - 19, 7, 6, '#a16207');
            R(x0 + 26, yb - 17, 7, 1, '#78350f');
            R(x0 + 35, yb - 18, 6, 5, '#d6c7a1');
            R(x0 + 37, yb - 19, 2, 1, '#a8a29e');
            light(x0 + 24, yb - 20, 20, '#fde68a', 0.2);
        }
    });
}

function renderWorld() {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#07070a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (State.screen !== 'playing') return;

    const w = State.world;
    const p = w.player;
    const biome = State.currentBiome;
    const town = !biome;
    const floorCol = biome ? biome.floor : '#3f6b2a';
    const wallCol = biome ? biome.wall : '#2f5d1f';
    const accentCol = biome ? biome.accent : '#d97706';
    const T = w.tileSize / PX;
    const now = performance.now();
    const L = v => Math.round(v / PX);

    const lw = Math.ceil(canvas.width / PX) + 1;
    const lh = Math.ceil(canvas.height / PX) + 1;
    if (lowCanvas.width !== lw || lowCanvas.height !== lh) {
        lowCanvas.width = lightCanvas.width = lw;
        lowCanvas.height = lightCanvas.height = lh;
    }
    const camX = L(w.camera.x) + Math.round((Math.random() - 0.5) * FX.shake);
    const camY = L(w.camera.y) + Math.round((Math.random() - 0.5) * FX.shake);
    const g = lctx;
    g.imageSmoothingEnabled = false;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#07070a';
    g.fillRect(0, 0, lw, lh);
    g.translate(-camX, -camY);

    const labels = [];
    const label = (text, x, y, color, size) => labels.push({ text, x, y, color, size: size || 8 });
    const lights = []; // { x, y, r, col, a } en pixels logiques monde
    const light = (x, y, r, col, a) => lights.push({ x, y, r, col, a: a === undefined ? 0.5 : a });

    // --- Tuiles & torches murales ---
    const tiles = Pixel.tiles(biome ? biome.id : 'town', floorCol, wallCol, town);
    const look = (biome && BIOME_LOOK[biome.id]) || { outdoor: true };
    const isWall = (r, c) => r < 0 || r >= w.rows || c < 0 || c >= w.cols || w.grid[r][c] !== 0;
    const startC = Math.max(0, Math.floor(camX / T) - 1);
    const endC = Math.min(w.cols - 1, Math.ceil((camX + lw) / T) + 1);
    const startR = Math.max(0, Math.floor(camY / T) - 1);
    const endR = Math.min(w.rows - 1, Math.ceil((camY + lh) / T) + 1);
    const torches = [];

    for (let r = startR; r <= endR; r++) {
        for (let c = startC; c <= endC; c++) {
            if (!w.explored[r][c]) continue;
            const x = c * T, y = r * T;
            if (w.grid[r][c] !== 1) {
                g.drawImage(tiles.floors[((c * 7 + r * 13) ^ (c * r)) % 3], x, y);
                if (isWall(r - 1, c)) {
                    g.fillStyle = 'rgba(0,0,0,0.35)';
                    g.fillRect(x, y, T, 3);
                }
            } else {
                const hash = (c * 374761393 + r * 668265263) >>> 0;
                g.drawImage(tiles.walls[(hash >>> 3) % tiles.walls.length], x, y);
                if (!look.outdoor && !isWall(r - 1, c)) {
                    g.fillStyle = Pixel.shade(wallCol, 0.35);
                    g.fillRect(x, y, T, 2);
                }
                if (look.torch && !isWall(r + 1, c) && hash % (look.torchRate || 7) === 0) torches.push({ x: x + 8, y: y + 9 });
            }
        }
    }

    torches.forEach(t => {
        const f = Math.floor(now / 90 + t.x) % 3;
        g.fillStyle = '#3f2a1d';
        g.fillRect(t.x - 1, t.y, 3, 3);
        g.fillStyle = look.torch;
        g.fillRect(t.x - 1, t.y - 3, 3, 3);
        g.fillStyle = Pixel.shade(look.torch, 0.6);
        g.fillRect(t.x, t.y - 3 - (f === 0 ? 1 : 0), 1, 2 + (f === 2 ? 1 : 0));
        light(t.x, t.y - 2, 34 + f * 2, look.torch, 0.35);
    });

    // --- Décors au sol propres au biome (non bloquants), placés de façon stable sur ~1 tuile sur 9 ---
    if (look.props) {
        for (let r = startR; r <= endR; r++) for (let c = startC; c <= endC; c++) {
            if (!w.explored[r][c] || w.grid[r][c] !== 0) continue;
            const hash = ((c * 2654435761) ^ (r * 40503)) >>> 0;
            if (hash % 9) continue;
            drawProp(g, look.props[(hash >>> 4) % look.props.length], c * T, r * T, now, light);
        }
    }

    // --- Helpers de dessin pixel ---
    const shadow = (x, y, rw) => {
        g.fillStyle = 'rgba(0,0,0,0.45)';
        g.fillRect(x - rw, y, rw * 2, 2);
        g.fillRect(x - rw + 1, y - 1, rw * 2 - 2, 4);
    };
    const pxLine = (x0, y0, ang, len, col) => {
        g.fillStyle = col;
        for (let t = 0; t <= len; t++) g.fillRect(Math.round(x0 + Math.cos(ang) * t), Math.round(y0 + Math.sin(ang) * t), 1, 1);
    };
    // Sprite pieds au sol (wx, wy en coordonnées monde) ; renvoie l'ordonnée du haut
    const drawSprite = (spr, wx, wy, k, flip, bob, flash) => {
        const sw = spr.width * k, sh = spr.height * k;
        const x = L(wx), feet = L(wy) + Math.round(sh * 0.35);
        shadow(x, feet - 1, Math.round(sw * 0.4));
        g.save();
        g.translate(x, feet - sh - bob);
        if (flip) g.scale(-1, 1);
        g.drawImage(spr, -Math.floor(sw / 2), 0, sw, sh);
        if (flash) g.drawImage(Pixel.white(spr), -Math.floor(sw / 2), 0, sw, sh);
        g.restore();
        return feet - sh - bob;
    };
    const drawPortal = (wx, wy) => {
        const x = L(wx), y = L(wy);
        ['#0c4a6e', '#38bdf8', '#e0f2fe'].forEach((col, i) => {
            g.strokeStyle = col;
            g.lineWidth = 1;
            g.beginPath();
            g.ellipse(x, y, 9 - i * 3 + Math.sin(now * 0.006 + i), 6 - i * 2, 0, 0, Math.PI * 2);
            g.stroke();
        });
        g.fillStyle = '#bae6fd';
        for (let k = 0; k < 4; k++) {
            const a = now * 0.004 + k * Math.PI / 2;
            g.fillRect(Math.round(x + Math.cos(a) * 8), Math.round(y + Math.sin(a) * 5), 1, 1);
        }
        light(x, y, 32, '#38bdf8', 0.55);
        return y - 10;
    };

    // --- Objets au sol ---
    w.chests.forEach(ch => {
        const x = L(ch.x), y = L(ch.y);
        shadow(x, y + 4, 6);
        g.drawImage(Pixel.chest(ch.opened), x - 6, y - 4);
        if (!ch.opened) light(x, y, 14, '#facc15', 0.2);
    });

    w.lootDrops.forEach(drop => {
        const x = L(drop.x), y = L(drop.y) - Math.round(Math.sin(now * 0.005 + x) * 1.5);
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
        light(x, y, 14, drop.color, 0.45);
        label(drop.label, x, y - 5, drop.color);
    });

    if (w.portal) {
        const top = drawPortal(w.portal.x, w.portal.y);
        label('Portail Camp [E]', L(w.portal.x), top - 1, '#7dd3fc');
    }

    // --- Camp : enclos d'entraînement et bâtiments des PNJ ---
    if (town) drawCamp(g, T, now, light, label);

    // --- PNJ ---
    w.npcs.forEach(npc => {
        const top = npc.role === 'portal'
            ? drawPortal(npc.x, npc.y)
            : drawSprite(Pixel.humanoid(npc.color, Pixel.shade(npc.color, -0.6)), npc.x, npc.y, 1, npc.x > p.x, Math.floor(now / 600 + npc.x) % 2);
        label(npc.name, L(npc.x), top - 2, '#fde68a');
    });

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
                (act.type === 'shot' ? [0] : act.type === 'volley3' ? [-0.25, 0, 0.25] : [-0.36, 0, 0.36]).forEach(o => pxLine(x, y, act.angle + o, 83, pulse));
            } else if (act.type === 'charge') {
                [-2, 0, 2].forEach(o => pxLine(x + Math.round(Math.sin(act.angle) * o), y - Math.round(Math.cos(act.angle) * o), act.angle, 95, pulse));
            } else if (act.type === 'slam' || act.type === 'fuse') {
                const R = L(act.type === 'slam' ? 135 : 80);
                g.globalAlpha = 0.18 + 0.25 * prog;
                g.fillStyle = '#ef4444';
                g.beginPath();
                g.ellipse(x, y, R * prog, R * prog * 0.7, 0, 0, Math.PI * 2);
                g.fill();
                g.globalAlpha = 0.8;
                g.strokeStyle = '#ef4444';
                g.lineWidth = 1;
                g.beginPath();
                g.ellipse(x, y, R, R * 0.7, 0, 0, Math.PI * 2);
                g.stroke();
                g.globalAlpha = 1;
                fuseFlash = act.type === 'fuse' && Math.floor(now / 70) % 2 === 0;
            } else {
                // nova / invocation : anneau de particules qui se resserre
                g.fillStyle = en.color;
                const r = 4 + (1 - prog) * 14;
                for (let i = 0; i < 10; i++) {
                    const a2 = now * 0.006 + i * Math.PI / 5;
                    g.fillRect(Math.round(x + Math.cos(a2) * r), Math.round(y - 4 + Math.sin(a2) * r * 0.7), 1, 1);
                }
            }
            light(x, y - 3, 10 + prog * 20, en.color, 0.6);
        }
        if (act && act.type === 'dash') {
            g.globalAlpha = 0.35;
            g.fillStyle = en.color;
            for (let i = 1; i <= 3; i++) g.fillRect(Math.round(x - Math.cos(act.angle) * i * 4) - 2, Math.round(y - Math.sin(act.angle) * i * 4) - 4, 5, 6);
            g.globalAlpha = 1;
        }

        const k = en.isBoss ? 2 : (en.kind === 'tank' ? 1.5 : 1) * (en.isElite ? 1.25 : 1);
        const spr = Pixel.enemy(en);
        const flap = en.body === 'swarm' ? 70 : 160;
        const bob = (en.aggro && en.stunTimer <= 0 && !(en.attackAnim > 0)) ? Math.floor(now / flap + en.x) % 2 : 0;
        const top = drawSprite(spr, en.x + ox * PX, en.y + oy * PX, k, p.x < en.x, bob, en.hitFlash > 0 || fuseFlash);

        // Griffures sur le héros au moment de l'impact au corps-à-corps
        if (!en.isRanged && en.attackAnim > 0 && en.attackAnim < 0.17) {
            const hx = L(p.x), hy = L(p.y) - 4;
            for (let i = -1; i <= 1; i++) pxLine(hx - 3 + i * 3, hy - 4, Math.PI * 0.35, 8, i ? en.color : '#ffffff');
        }

        if (en.stunTimer > 0) {
            g.fillStyle = '#fde047';
            for (let i = 0; i < 3; i++) g.fillRect(Math.round(x + Math.cos(now * 0.008 + i * 2.1) * 5), top - 2, 1, 1);
        }

        const bw = Math.round(en.radius * 2.2 / PX), bx = x - (bw >> 1), by = top - 4;
        g.fillStyle = '#000000';
        g.fillRect(bx - 1, by - 1, bw + 2, 4);
        g.fillStyle = '#450a0a';
        g.fillRect(bx, by, bw, 2);
        g.fillStyle = en.isBoss ? '#f97316' : '#ef4444';
        g.fillRect(bx, by, Math.round(bw * Math.max(0, en.hp / en.maxHp)), 2);

        if (en.isBoss) light(x, y, 30, en.color, 0.3);
        if (en.isBoss || en.isElite) label(en.name, x, by - 2, en.isBoss ? '#fdba74' : '#fde047');
    });

    // --- Héros : fente + arme active animée (mêlée ou distance) ---
    const cls = CLASSES[State.hero.classId];
    const prog = p.swingAnim > 0 ? Math.min(1, 1 - p.swingAnim / 0.24) : -1; // 0 → 1 pendant l'attaque
    const attacking = prog >= 0;
    const rangedOn = State.hero.activeWeapon === 'ranged' && !!State.hero.equipment.ranged;
    const lunge = attacking ? Math.sin(prog * Math.PI) * (rangedOn ? -2 : 3) : 0;
    const flip = Math.cos(p.facing) < 0;
    const heroTop = drawSprite(
        Pixel.humanoid(cls.color, HERO_HAIR),
        p.x + Math.cos(p.facing) * lunge * PX, p.y + Math.sin(p.facing) * lunge * PX,
        1, flip, p.moving && !attacking ? Math.floor(now / 120) % 2 : 0, p.hitFlash > 0
    );
    const hx = L(p.x) + Math.round(Math.cos(p.facing) * (lunge + 3));
    const hy = heroTop + 10 + Math.round(Math.sin(p.facing) * 2);

    if (rangedOn) {
        // Arc tendu perpendiculaire à la visée ; la corde se relâche au tir
        const perp = p.facing + Math.PI / 2;
        g.fillStyle = '#a16207';
        for (let t = -4; t <= 4; t++) {
            const bend = 2 - (t * t) / 8;
            g.fillRect(Math.round(hx + Math.cos(perp) * t + Math.cos(p.facing) * bend), Math.round(hy + Math.sin(perp) * t + Math.sin(p.facing) * bend), 1, 1);
        }
        const pull = attacking ? 0 : -2;
        const mx = hx + Math.cos(p.facing) * pull, my = hy + Math.sin(p.facing) * pull;
        g.fillStyle = '#e5e7eb';
        [-4, 4].forEach(t => {
            const ex = hx + Math.cos(perp) * t, ey = hy + Math.sin(perp) * t;
            for (let i = 0; i <= 4; i++) g.fillRect(Math.round(ex + (mx - ex) * i / 4), Math.round(ey + (my - ey) * i / 4), 1, 1);
        });
        if (!attacking) pxLine(Math.round(mx), Math.round(my), p.facing, 5, '#d6d3d1');
        if (attacking && prog < 0.4) light(hx + Math.cos(p.facing) * 4, hy, 12, '#fde68a', 0.6);
    } else {
        const ease = attacking ? 1 - (1 - prog) * (1 - prog) : 0;
        const a = attacking ? p.facing - 1.4 + 2.8 * ease : p.facing + (flip ? -0.7 : 0.7);
        if (attacking) {
            // Traînée de la lame
            for (let s = p.facing - 1.4; s < a; s += 0.08) {
                g.globalAlpha = 0.25 + 0.6 * (s - (p.facing - 1.4)) / 2.8;
                g.fillStyle = '#fef3c7';
                g.fillRect(Math.round(hx + Math.cos(s) * 11), Math.round(hy + Math.sin(s) * 11), 2, 1);
                g.fillRect(Math.round(hx + Math.cos(s) * 9), Math.round(hy + Math.sin(s) * 9), 1, 1);
            }
            g.globalAlpha = 1;
        }
        pxLine(hx, hy, a, attacking ? 11 : 7, attacking ? '#f8fafc' : '#a1a1aa');
        g.fillStyle = '#78350f';
        g.fillRect(hx - 1, hy - 1, 2, 2);
    }
    g.globalAlpha = 1;
    light(L(p.x), L(p.y), 70, '#fff7ed', 0.12);

    // --- Projectiles ---
    w.projectiles.forEach(prj => {
        const x = L(prj.x), y = L(prj.y), s = Math.max(1, Math.round(prj.radius / PX));
        if (prj.fromHero) {
            const ang = Math.atan2(prj.vy, prj.vx);
            pxLine(x - Math.round(Math.cos(ang) * 6), y - Math.round(Math.sin(ang) * 6), ang, 6, '#a16207');
            g.fillStyle = '#f8fafc';
            g.fillRect(x, y, 1, 1);
            g.fillRect(x - Math.round(Math.cos(ang)), y - Math.round(Math.sin(ang)), 1, 1);
            light(x, y, 8, prj.color, 0.35);
            return;
        }
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
        light(x, y, 10 + s * 4, prj.color, 0.7);
    });

    // --- Ondes de choc ---
    FX.rings.forEach(rg => {
        const t = 1 - rg.life / rg.max;
        const rad = Math.max(1, L(rg.radius) * (1 - (1 - t) * (1 - t)));
        g.globalAlpha = 1 - t;
        g.strokeStyle = rg.color;
        g.lineWidth = 2;
        g.beginPath();
        g.ellipse(L(rg.x), L(rg.y), rad, rad * 0.7, 0, 0, Math.PI * 2);
        g.stroke();
        light(L(rg.x), L(rg.y), rad + 6, rg.color, 0.5 * (1 - t));
    });
    g.globalAlpha = 1;

    // --- Particules (poussière normale, étincelles additives) ---
    w.particles.forEach(pt => {
        g.globalCompositeOperation = pt.dust ? 'source-over' : 'lighter';
        g.fillStyle = pt.color;
        g.globalAlpha = Math.max(0, Math.min(1, pt.life * (pt.dust ? 1.2 : 2.5)));
        g.fillRect(L(pt.x), L(pt.y), 1, 1);
    });
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;

    // --- Éclairage dynamique : obscurité trouée par les sources de lumière (donjons) ---
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (!town) {
        const lc = lightCtx;
        lc.globalCompositeOperation = 'source-over';
        lc.clearRect(0, 0, lw, lh);
        lc.fillStyle = look.dark;
        lc.fillRect(0, 0, lw, lh);
        lc.globalCompositeOperation = 'destination-out';
        lights.forEach(li => {
            const x = li.x - camX, y = li.y - camY, r = li.r * 1.3;
            const gr = lc.createRadialGradient(x, y, 0, x, y, r);
            gr.addColorStop(0, 'rgba(0,0,0,1)');
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            lc.fillStyle = gr;
            lc.fillRect(x - r, y - r, r * 2, r * 2);
        });
        g.drawImage(lightCanvas, 0, 0);
    }

    // --- Lueurs colorées additives ---
    g.globalCompositeOperation = 'lighter';
    lights.forEach(li => {
        const x = li.x - camX, y = li.y - camY;
        const gr = g.createRadialGradient(x, y, 0, x, y, li.r);
        gr.addColorStop(0, li.col);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalAlpha = li.a * (town ? 0.5 : 0.6);
        g.fillStyle = gr;
        g.fillRect(x - li.r, y - li.r, li.r * 2, li.r * 2);
    });

    // --- Poussières / lucioles d'ambiance ---
    g.fillStyle = town ? '#fef9c3' : (look.mote || accentCol);
    for (let i = 0; i < (town ? 18 : 36); i++) {
        const sp = 0.003 * (1 + i % 3);
        const mx = ((i * 97.3 + now * sp * (i % 2 ? 1 : -1)) % lw + lw) % lw;
        const my = ((i * 61.7 - now * sp * (look.rise ? 3 : 0.6) + Math.sin(now * 0.001 + i) * 8) % lh + lh) % lh;
        g.globalAlpha = 0.25 + 0.25 * Math.sin(now * 0.003 + i * 1.7);
        g.fillRect(Math.round(mx), Math.round(my), 1, 1);
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;

    // --- Vignette légère ---
    const vg = g.createRadialGradient(lw / 2, lh / 2, Math.min(lw, lh) * 0.35, lw / 2, lh / 2, Math.max(lw, lh) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = vg;
    g.fillRect(0, 0, lw, lh);

    // Flash rouge quand le héros est touché
    if (p.hitFlash > 0) {
        g.fillStyle = 'rgba(220,38,38,' + (p.hitFlash * 0.9) + ')';
        g.fillRect(0, 0, lw, 2);
        g.fillRect(0, lh - 2, lw, 2);
        g.fillRect(0, 0, 2, lh);
        g.fillRect(lw - 2, 0, 2, lh);
    }

    ctx.drawImage(lowCanvas, 0, 0, lw * PX, lh * PX);

    // --- Textes à pleine résolution (police lisible avec contour) ---
    w.floatingTexts.forEach(ft => label(ft.text, L(ft.x), L(ft.y), ft.color, ft.big ? 16 : 8));
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
