'use strict';

// ==================== 10. CONTRÔLES CLAVIER & SOURIS ====================
window.addEventListener('pointerdown', () => Sound.init());

window.addEventListener('keydown', e => {
    State.keys[e.code] = true;
    Sound.init();

    if (State.screen === 'start') {
        if (document.activeElement && document.activeElement.tagName === 'INPUT') {
            if (e.code === 'Enter') {
                e.preventDefault();
                Game.startNewGame();
            }
            return;
        }
        if (e.code === 'Enter') {
            e.preventDefault();
            Game.startNewGame();
        }
        return;
    }

    if (State.activeModal) {
        if (e.code === 'Escape') {
            e.preventDefault();
            if (State.activeModal === 'campModal') UI.toggleModal('pauseModal');
            else UI.closeModals();
            return;
        }
        // Depuis le menu du camp : fiche, talents et sac restent accessibles au clavier
        if (State.activeModal === 'campModal') {
            const shortcut = { KeyC: 'characterModal', KeyK: 'skillsModal', KeyI: 'inventoryModal' }[e.code];
            if (shortcut) { UI.toggleModal(shortcut); return; }
            if (e.code === 'KeyM') { Sound.toggleMute(); return; }
        }
        if (e.code === 'ArrowDown' || e.code === 'ArrowRight' || e.code === 'KeyS' || e.code === 'KeyD') {
            e.preventDefault();
            State.modalFocusIdx++;
            UI.applyModalFocus();
            return;
        }
        if (e.code === 'ArrowUp' || e.code === 'ArrowLeft' || e.code === 'KeyW' || e.code === 'KeyZ' || e.code === 'KeyA' || e.code === 'KeyQ') {
            e.preventDefault();
            State.modalFocusIdx--;
            UI.applyModalFocus();
            return;
        }
        if (e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            const items = UI.getFocusableItems();
            if (items[State.modalFocusIdx]) {
                items[State.modalFocusIdx].click();
                setTimeout(() => UI.applyModalFocus(), 20);
            }
            return;
        }
        if (e.code === 'KeyX' || e.code === 'Delete') {
            const items = UI.getFocusableItems();
            const focused = items[State.modalFocusIdx];
            if (focused && focused.dataset.sellIdx !== undefined) {
                Game.sellItem(Number(focused.dataset.sellIdx));
                setTimeout(() => UI.applyModalFocus(), 20);
            } else if (focused && focused.dataset.bagIdx !== undefined) {
                State.hero.inventory.splice(Number(focused.dataset.bagIdx), 1);
                UI.renderInventoryModal();
                setTimeout(() => UI.applyModalFocus(), 20);
            }
            return;
        }
        return;
    }

    if (e.code === 'Escape') { UI.toggleModal('pauseModal'); return; }
    if (e.code === 'KeyC') UI.toggleModal('characterModal');
    else if (e.code === 'KeyK') UI.toggleModal('skillsModal');
    else if (e.code === 'KeyI') UI.toggleModal('inventoryModal');
    else if (e.code === 'KeyJ') UI.toggleModal('questsModal');
    else if (e.code === 'KeyM') Sound.toggleMute();
    else if (e.code === 'Tab') { e.preventDefault(); Game.swapWeapon(); }
    else if (e.code === 'KeyR') Combat.usePotion('hp');
    else if (e.code === 'KeyF') Combat.usePotion('mp');
    else if (e.code === 'Space') { e.preventDefault(); Combat.castSlot(0); }
    else if (e.code === 'Digit1') Combat.castSlot(1);
    else if (e.code === 'Digit2') Combat.castSlot(2);
    else if (e.code === 'Digit3') Combat.castSlot(3);
    else if (e.code === 'Digit4') Combat.castSlot(4);
    else if (e.code === 'KeyE' || e.code === 'Enter') Combat.interact();
});

window.addEventListener('keyup', e => {
    State.keys[e.code] = false;
});

canvas.addEventListener('mousemove', e => {
    State.mouse.x = e.clientX;
    State.mouse.y = e.clientY;
    State.mouse.active = true;
});

canvas.addEventListener('mousedown', e => {
    if (State.screen !== 'playing' || State.activeModal) return;
    State.mouse.active = true;
    if (e.button === 0) {
        State.mouse.leftDown = true;
        Combat.castSlot(0);
    } else if (e.button === 2) {
        Combat.castSlot(4);
    }
});

window.addEventListener('mouseup', e => {
    if (e.button === 0) State.mouse.leftDown = false;
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

let lastTimestamp = 0;
function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
    lastTimestamp = timestamp;

    updateSimulation(dt);
    renderWorld();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    UI.renderStartScreen();
    requestAnimationFrame(gameLoop);
});
