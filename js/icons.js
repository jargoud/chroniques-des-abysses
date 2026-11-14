'use strict';

// ==================== ICÔNES GÉNÉRÉES (interface, talents, biomes, artefacts) ====================
// Dessins 16×16 en unités logiques, rendus par Art.render (HD lissé ou pixel art) : remplacent les émojis.
// Une clé absente ici renvoie au dessin d'objet de même nom via Art.ICON_ALIAS (ex. 'shield' → 'Écu de Fer').
Object.assign(Art, {
    ICON_ALIAS: {
        sword: 'Épée Longue', dagger: 'Dague Acérée', axe: 'Hache de Guerre', shield: 'Écu de Fer',
        bow: 'Arc Long', mail: 'Cuirasse de Mailles', gauntlet: 'Gantelets Rivetés'
    },

    potion(d, col) {
        d.rr(6.2, 1, 3.6, 2, 0.6, '#a16207');
        d.rr(6.6, 2.8, 2.8, 3, 0.4, '#cbd5e1');
        d.ell(8, 10.5, 5, 4.8, '#cbd5e1');
        d.ell(8, 11, 4.2, 3.9, col);
        d.ell(6, 9.4, 0.9, 1.4, 'rgba(255,255,255,0.6)');
    },

    gem(d, col) {
        d.poly([[1, 6.5], [15, 6.5], [8, 15]], col);
        d.poly([[4, 3], [12, 3], [15, 6.5], [1, 6.5]], this.shade(col, 0.35));
        const dk = this.shade(col, -0.5);
        [[4, 3, 6, 6.5], [12, 3, 10, 6.5], [6, 6.5, 8, 15], [10, 6.5, 8, 15]].forEach(([a, b, c, e]) => d.line(a, b, c, e, 0.3, dk));
        d.dot(5.5, 4.6, 0.5, '#ffffff', true);
    },

    speaker(d) {
        d.poly([[2, 6], [5, 6], [9, 2.5], [9, 13.5], [5, 10], [2, 10]], '#d4d4d8');
    }
});

Object.assign(Art.ICONS, {
    warrior(d, g) {
        [Math.PI / 4, -Math.PI / 4].forEach(a => {
            g.save(); g.translate(8, 8); g.rotate(a); this.sword(d, -9, 1.8, 5); g.restore();
        });
    },
    hero(d, g) { g.drawImage(this.hero(0), 1.5, 0, 13, 16); },
    camp(d) {
        d.rr(0.5, 13.5, 15, 1.8, 0.6, '#57534e');
        d.poly([[8, 2], [15, 14], [1, 14]], '#b45309');
        d.poly([[8, 6], [11, 14], [5, 14]], '#1c1917');
        d.line(8, 2, 8, 0.5, 0.5, '#78350f');
        d.poly([[8, 0.5], [11, 1.3], [8, 2.1]], '#dc2626');
    },
    coin(d) {
        d.ell(8, 8, 6.5, 6.5, '#ca8a04');
        d.ell(8, 8, 4.8, 4.8, '#facc15');
        d.rr(7.2, 4.6, 1.6, 6.8, 0.5, '#a16207');
        d.dot(5.6, 5.4, 0.6, '#fef9c3', true);
    },
    gear(d, g) {
        for (let i = 0; i < 8; i++) {
            g.save(); g.translate(8, 8); g.rotate(i * Math.PI / 4); d.rr(-1.3, -7.4, 2.6, 3, 0.4, '#9ca3af'); g.restore();
        }
        d.ell(8, 8, 5.1, 5.1, '#9ca3af');
        this.hole(g, 8, 8, 2, 2);
    },
    heart(d, g) {
        d.path(() => {
            g.moveTo(8, 14.5); g.bezierCurveTo(-2, 8, 2, 0.5, 8, 4.5); g.bezierCurveTo(14, 0.5, 18, 8, 8, 14.5);
        }, '#dc2626', [1, 2, 15, 14.5]);
        d.ell(5, 5.6, 1.3, 0.8, 'rgba(255,255,255,0.5)');
    },
    flame(d, g) {
        d.path(() => {
            g.moveTo(8, 1); g.quadraticCurveTo(13, 6, 12.5, 10.5); g.quadraticCurveTo(12, 15, 8, 15);
            g.quadraticCurveTo(4, 15, 3.5, 10.5); g.quadraticCurveTo(3.5, 7, 6, 5); g.quadraticCurveTo(6, 8, 7.5, 8.5);
            g.quadraticCurveTo(6.5, 4, 8, 1);
        }, '#f97316', [3.5, 1, 12.5, 15]);
        d.path(() => {
            g.moveTo(8, 7); g.quadraticCurveTo(11, 10, 10.5, 12); g.quadraticCurveTo(10, 14.5, 8, 14.5);
            g.quadraticCurveTo(6, 14.5, 5.5, 12); g.quadraticCurveTo(5.5, 10, 8, 7);
        }, '#fde047', [5.5, 7, 10.5, 14.5], { noEdge: true });
    },
    talents(d) {
        d.rr(7, 8, 2, 7, 0.5, '#7c4a1e');
        d.ell(5, 8.5, 3, 2.5, '#15803d');
        d.ell(11, 8.5, 3, 2.5, '#15803d');
        d.ell(8, 6, 5.5, 4.5, '#16a34a');
        [[6, 5], [10.5, 6.5], [8, 3], [4.5, 8.5]].forEach(([x, y]) => d.dot(x, y, 0.55, '#fde047', true));
    },
    skull(d) {
        d.rr(5, 10, 6, 4.5, 1, '#ece6da');
        d.ell(8, 7, 6, 5.6, '#ece6da');
        d.ell(5.6, 7.6, 1.6, 1.8, '#1c1917', { noEdge: true });
        d.ell(10.4, 7.6, 1.6, 1.8, '#1c1917', { noEdge: true });
        d.poly([[8, 9.4], [8.9, 11], [7.1, 11]], '#1c1917', { noEdge: true });
        [6.5, 8, 9.5].forEach(x => d.line(x, 12.2, x, 14.4, 0.4, '#57534e'));
    },
    trophy(d) {
        d.line(3.4, 3, 4.6, 7.5, 0.9, '#eab308', 0.4, 4.5);
        d.line(12.6, 3, 11.4, 7.5, 0.9, '#eab308', 15.6, 4.5);
        d.poly([[3, 2], [13, 2], [12, 7], [10, 9.5], [6, 9.5], [4, 7]], '#facc15');
        d.rr(7.2, 9.4, 1.6, 3.2, 0.4, '#ca8a04');
        d.rr(4.5, 12.4, 7, 2.6, 0.8, '#a16207');
        d.line(5.6, 3, 6, 6.6, 0.5, 'rgba(255,255,255,0.6)');
    },
    pause(d) {
        d.ell(8, 8, 7.4, 7.4, '#3f3f46');
        d.rr(4.6, 4, 2.4, 8, 0.8, '#e5e7eb');
        d.rr(9, 4, 2.4, 8, 0.8, '#e5e7eb');
    },
    sound(d) {
        this.speaker(d);
        d.line(11, 5.5, 11, 10.5, 0.8, '#d4d4d8', 12.8, 8);
        d.line(12.8, 3.5, 12.8, 12.5, 0.8, '#d4d4d8', 15.6, 8);
    },
    mute(d) {
        this.speaker(d);
        d.line(11, 5.5, 15, 10.5, 1, '#ef4444');
        d.line(15, 5.5, 11, 10.5, 1, '#ef4444');
    },
    palette(d, g) {
        d.ell(8, 8.5, 7, 6, '#d6a96b');
        this.hole(g, 10.5, 11.6, 1.4, 1.4);
        [[4.4, 7.4, '#ef4444'], [6.8, 4.6, '#facc15'], [10.4, 4.8, '#3b82f6'], [12.6, 8, '#22c55e']].forEach(([x, y, c]) => d.ell(x, y, 1.3, 1.3, c));
    },
    save(d, g) {
        d.rr(2, 10, 6, 5, 1.5, '#1e3a8a');
        d.rr(3.5, 8.8, 3, 1.6, 0.4, '#334155');
        d.path(() => { g.moveTo(5, 10); g.quadraticCurveTo(9, 2, 15, 1); g.quadraticCurveTo(13, 7, 5, 10); }, '#f5f5f4', [5, 1, 15, 10]);
        d.line(5, 10, 14, 1.6, 0.35, '#a8a29e', 9.5, 4.5);
    },
    door(d) {
        d.rr(3, 1.5, 10, 14, 4, '#7c4a1e');
        d.over(() => [6.3, 9.7].forEach(x => d.line(x, 1, x, 16, 0.4, '#3f2a1d')));
        d.rr(3, 5.5, 10, 1, 0.2, '#57534e');
        d.rr(3, 11, 10, 1, 0.2, '#57534e');
        d.ell(10.8, 9, 0.8, 0.8, '#facc15');
    },
    potionHp(d) { this.potion(d, '#dc2626'); },
    potionRage(d) { this.potion(d, '#f97316'); },
    lock(d) {
        d.line(5, 7.5, 11, 7.5, 1.4, '#9ca3af', 8, -1.5);
        d.rr(3, 7, 10, 8, 1.5, '#eab308');
        d.ell(8, 10.3, 1.1, 1.1, '#1c1917', { noEdge: true });
        d.rr(7.5, 10.5, 1, 2.6, 0.3, '#1c1917', { noEdge: true });
    },
    gem(d) { this.gem(d, '#22d3ee'); },
    emerald(d) { this.gem(d, '#22c55e'); },
    abyss(d) { this.gem(d, '#be123c'); },
    check(d) {
        d.line(3, 8.5, 6.5, 12, 2, '#22c55e');
        d.line(6.5, 12, 13, 4, 2, '#22c55e');
    },
    burst(d) {
        const pts = [];
        for (let i = 0; i < 16; i++) {
            const a = i * Math.PI / 8, r = i % 2 ? 3.4 : 7.6;
            pts.push([8 + Math.cos(a) * r, 8 + Math.sin(a) * r]);
        }
        d.poly(pts, '#f97316');
        d.ell(8, 8, 2.8, 2.8, '#fde047');
    },
    cactus(d) {
        d.rr(2.5, 5.5, 2.6, 5.5, 1.3, '#16a34a');
        d.rr(2.5, 9.2, 5, 2, 1, '#16a34a');
        d.rr(10.9, 3.5, 2.6, 5.5, 1.3, '#16a34a');
        d.rr(8.5, 7.2, 5, 2, 1, '#16a34a');
        d.rr(6.2, 1.5, 3.6, 13.5, 1.8, '#15803d');
        [[7, 4], [9, 6.5], [7, 9], [9, 11.5], [3.8, 7], [12.2, 5]].forEach(([x, y]) => d.dot(x, y, 0.35, '#dcfce7'));
    },
    horn(d, g) {
        d.path(() => {
            g.moveTo(2, 12); g.quadraticCurveTo(7, 12.5, 12, 3); g.lineTo(14.6, 5.4);
            g.quadraticCurveTo(8.5, 15, 2, 14.6); g.closePath();
        }, '#e7e5e4', [2, 3, 14.6, 14.6]);
        d.ell(13.3, 4.2, 2.1, 1.2, '#ca8a04', { rot: 0.75 });
        d.ell(2, 13.3, 1, 1.3, '#a16207');
        d.line(4, 12.6, 11.5, 6.5, 0.4, '#78350f', 4, 6.5);
    },
    tower(d) {
        d.rr(4, 4, 8, 11, 0.3, '#9ca3af');
        [3.5, 7, 10.5].forEach(x => d.rr(x, 1.5, 2, 3, 0.2, '#9ca3af'));
        d.rr(3.5, 4, 9, 1.2, 0.2, '#6b7280');
        d.rr(6.5, 10, 3, 5, 1.5, '#1c1917', { noEdge: true });
        d.rr(7.3, 6, 1.4, 2.4, 0.5, '#1c1917', { noEdge: true });
    },
    blood(d, g) {
        d.path(() => {
            g.moveTo(8, 1.5); g.quadraticCurveTo(14, 9, 12.5, 11.5); g.quadraticCurveTo(10.5, 15, 8, 15);
            g.quadraticCurveTo(5.5, 15, 3.5, 11.5); g.quadraticCurveTo(2, 9, 8, 1.5);
        }, '#b91c1c', [3, 1.5, 13, 15]);
        d.ell(6, 10.5, 0.9, 1.6, 'rgba(255,255,255,0.45)');
    },
    whirl(d) {
        [[8, 2.8, 6.4, 1.7], [8.6, 5.8, 5, 1.5], [8, 8.8, 3.8, 1.3], [8.7, 11.6, 2.6, 1.1], [8.2, 14, 1.4, 0.9]]
            .forEach(([x, y, rx, ry]) => d.ell(x, y, rx, ry, '#94a3b8'));
        d.line(3, 2.8, 12, 3.4, 0.4, '#f1f5f9');
        d.line(5, 6, 12, 6.2, 0.4, '#f1f5f9');
    },
    volcano(d) {
        d.poly([[1, 15], [6, 5], [10, 5], [15, 15]], '#57534e');
        d.rr(6, 4.3, 4, 1.4, 0.6, '#f97316');
        d.line(8, 5, 6.5, 12, 1, '#f97316', 9, 9);
        [[5, 2.5], [8, 1.3], [11, 2.5]].forEach(([x, y]) => d.ell(x, y, 0.9, 0.9, '#fb923c'));
    },
    feather(d, g) {
        d.path(() => { g.moveTo(3, 14); g.quadraticCurveTo(4, 4, 13.5, 1.5); g.quadraticCurveTo(12, 10, 3, 14); }, '#e0f2fe', [3, 1.5, 13.5, 14]);
        d.line(3, 14, 12.8, 2.2, 0.45, '#64748b', 6.5, 6.5);
    },
    dash(d) {
        d.line(1, 5, 8, 5, 1, '#cbd5e1');
        d.line(2.5, 8.5, 10, 8.5, 1.2, '#cbd5e1');
        d.line(1, 12, 7.5, 12, 1, '#cbd5e1');
        [[10.5, 5, 2.6, 2], [13, 8.5, 2.4, 2.4], [10, 12, 2.2, 1.8]].forEach(([x, y, rx, ry]) => d.ell(x, y, rx, ry, '#e2e8f0'));
    },
    eye(d, g) {
        d.path(() => { g.moveTo(1, 8); g.quadraticCurveTo(8, 1, 15, 8); g.quadraticCurveTo(8, 15, 1, 8); }, '#f5f5f4', [1, 4, 15, 12]);
        d.ell(8, 8, 3, 3, '#ca8a04');
        d.ell(8, 8, 1, 2.4, '#0c0a09', { noEdge: true });
        d.dot(9, 6.8, 0.5, '#ffffff', true);
    },
    arrowRain(d) {
        [[5, 3, 2.5, 1.8], [9, 2.4, 3.5, 2.2], [12.2, 3.4, 2.5, 1.7]].forEach(([x, y, rx, ry]) => d.ell(x, y, rx, ry, '#64748b'));
        [[4, 5.5], [8, 7], [12, 5.8]].forEach(([x, y]) => {
            d.line(x, y, x, y + 6.5, 0.6, '#8b5a2b');
            d.poly([[x, y + 8.6], [x - 1.2, y + 6.2], [x + 1.2, y + 6.2]], '#d4d4d8');
            d.poly([[x, y + 1.2], [x - 1, y - 0.2], [x + 1, y - 0.2]], '#dc2626');
        });
    },
    chains(d, g) {
        [[3.6, 12.4, 1], [6.3, 9.7, -1], [9, 7, 1], [11.7, 4.3, -1]].forEach(([x, y, s]) => {
            d.ell(x, y, 2.8, 1.6, '#9ca3af', { rot: s * Math.PI / 4 });
            g.save(); g.globalCompositeOperation = 'destination-out';
            g.beginPath(); g.ellipse(x, y, 1.6, 0.55, s * Math.PI / 4, 0, Math.PI * 2); g.fill(); g.restore();
        });
    },
    coffin(d) {
        d.poly([[6, 1], [10, 1], [13, 5], [11, 15], [5, 15], [3, 5]], '#78350f');
        d.rr(7.3, 4, 1.4, 8, 0.3, '#facc15');
        d.rr(5.5, 6, 5, 1.4, 0.3, '#facc15');
    },
    pyramid(d) {
        d.rr(0, 13.4, 16, 2.2, 0.6, '#e7c27a');
        d.poly([[8, 2], [15, 14], [1, 14]], '#d6a64a');
        d.poly([[8, 2], [15, 14], [8, 14]], '#b7862f', { noEdge: true });
        d.over(() => [6, 9, 12].forEach(y => d.line(0, y, 16, y, 0.3, '#8a6a35')));
    },
    torii(d) {
        d.rr(3.5, 4, 1.6, 11, 0.3, '#dc2626');
        d.rr(10.9, 4, 1.6, 11, 0.3, '#dc2626');
        d.rr(2.5, 6, 11, 1.3, 0.3, '#dc2626');
        d.rr(1, 2, 14, 1.8, 0.6, '#b91c1c');
        d.rr(0.5, 1.2, 15, 1, 0.4, '#1c1917');
    },
    palm(d) {
        d.line(8, 15, 9.5, 6, 1.6, '#92400e', 7, 10);
        [-2.6, -1.9, -1.2, -0.4, 0.4].forEach(a =>
            d.ell(9.5 + Math.cos(a) * 3.6, 5.5 + Math.sin(a) * 3, 4, 1.3, '#16a34a', { rot: a }));
        [[-2.9], [-0.1]].forEach(([a]) => d.ell(9.5 + Math.cos(a) * 3.6, 5.5 + Math.sin(a) * 2.2 + 1.5, 3.6, 1.2, '#15803d', { rot: a + 0.5 }));
        d.ell(9, 7, 0.9, 0.9, '#78350f');
        d.ell(10.6, 7.2, 0.9, 0.9, '#78350f');
    },
    pine(d) {
        d.rr(7, 13, 2, 2.6, 0.4, '#78350f');
        d.poly([[8, 7], [15, 14], [1, 14]], '#14532d');
        d.poly([[8, 3.5], [13.5, 10], [2.5, 10]], '#166534');
        d.poly([[8, 1], [12, 6], [4, 6]], '#15803d');
    },
    orb(d) {
        d.rr(4, 12, 8, 3, 1, '#78350f');
        d.ell(8, 7.5, 5.5, 5.5, '#7c3aed');
        d.line(5, 8.5, 10, 5.5, 0.6, '#c4b5fd', 8, 9.5);
        d.ell(6, 5.4, 1.2, 0.9, 'rgba(255,255,255,0.6)');
    },
    snowflake(d, g) {
        for (let a = 0; a < 3; a++) {
            g.save(); g.translate(8, 8); g.rotate(a * Math.PI / 3);
            d.line(0, -7, 0, 7, 0.9, '#7dd3fc');
            [[-4.5, -1], [4.5, 1]].forEach(([y, s]) => {
                d.line(0, y, -2, y - s * 1.8, 0.7, '#bae6fd');
                d.line(0, y, 2, y - s * 1.8, 0.7, '#bae6fd');
            });
            g.restore();
        }
        d.dot(8, 8, 0.8, '#e0f2fe', true);
    },
    bolt(d) {
        d.poly([[9.5, 1], [3, 9], [7.5, 9], [6, 15], [13, 6.5], [8.5, 6.5], [11, 1]], '#facc15');
    },
    runeStone(d) {
        d.poly([[3, 13], [2, 7], [5, 3], [11, 2.5], [14, 7], [13, 13]], '#78716c');
        d.line(8, 4.5, 8, 11.5, 0.6, '#fb923c');
        d.line(8, 6, 10.5, 4.5, 0.6, '#fb923c');
        d.line(8, 8, 5.5, 6.5, 0.6, '#fb923c');
    }
});
