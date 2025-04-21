/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
export async function onManageActiveEffect(event, owner) {
    event.preventDefault();
    const a = event.currentTarget;
    const li = a.closest('li');
    const action = a.dataset.action;
    const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
    switch (action) {
        case 'create':
            const dlgTemplate = 'systems/hm3/templates/dialog/active-effect-start.html';
            const dialogData = {
                gameTime: game.time.worldTime
            };
            if (game.combat) {
                dialogData.combatId = game.combat.id;
                dialogData.combatRound = game.combat.round;
                dialogData.combatTurn = game.combat.turn;
            }
            const html = await renderTemplate(dlgTemplate, dialogData);

            // Create the dialog window
            return Dialog.prompt({
                title: 'Select Start Time',
                content: html,
                label: 'OK',
                callback: async (html) => {
                    const form = html.querySelector('#active-effect-start');
                    const fd = new FormDataExtended(form);
                    const formdata = fd.object;
                    const startType = formdata.startType;

                    const aeData = {
                        label: 'New Effect',
                        icon: 'icons/svg/aura.svg',
                        origin: owner.uuid
                    };
                    if (startType === 'nowGameTime') {
                        aeData['duration.startTime'] = dialogData.gameTime;
                        aeData['duration.seconds'] = 1;
                    } else if (startType === 'nowCombat') {
                        aeData['duration.combat'] = dialogData.combatId;
                        aeData['duration.startRound'] = dialogData.combatRound;
                        aeData['duration.startTurn'] = dialogData.combatTurn;
                        aeData['duration.rounds'] = 1;
                        aeData['duration.turns'] = 0;
                    }
                    return ActiveEffect.create(aeData, {parent: owner});
                },
                options: {jQuery: false}
            });

        case 'edit':
            return effect.sheet.render(true);

        case 'delete':
            return new Dialog({
                title: 'Delete Active Effect',
                content: '<p>Are you sure?</p><p>This active effect will be permanently deleted and cannot be recovered.</p>',
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: 'Yes',
                        callback: async (html) => {
                            await effect.delete();
                        }
                    },
                    no: {
                        icon: '<i class="fas fa-times"></i>',
                        label: 'No',
                        callback: async (html) => {}
                    }
                },
                default: 'yes'
            }).render(true);

        case 'toggle':
            if (isItemEffectInactive(effect)) return;
            const updateData = {};
            if (effect.disabled) {
                // Enable the Active Effect
                updateData['disabled'] = false;

                // Also set the timer to start now
                updateData['duration.startTime'] = game.time.worldTime;
                if (game.combat) {
                    updateData['duration.startRound'] = game.combat.round;
                    updateData['duration.startTurn'] = game.combat.turn;
                }
            } else {
                // Disable the Active Effect
                updateData['disabled'] = true;
            }
            return effect.update(updateData);

        case 'void':
        default:
            break;
    }
}

/**
 * This function searches all actors and tokens that are owned
 * by the user and disables them if their duration has expired.
 */
export async function checkExpiredActiveEffects() {
    // Handle game actors first
    for (let actor of game.actors.values()) {
        if (actor.isOwner && actor.effects?.size) {
            await disableExpiredAE(actor);
            actor.sheet.render();
        }
    }

    // Next, handle tokens (only unlinked tokens)
    for (let token of canvas.tokens.ownedTokens.values()) {
        if (!token.document.actorLink && token.actor?.effects?.size) {
            await disableExpiredAE(token.actor);
        }
    }
}

/**
 * Checks all of the active effects for a single actor and disables
 * them if their duration has expired.
 *
 * @param {Actor} actor
 */
async function disableExpiredAE(actor) {
    for (let effect of actor.effects.values()) {
        if (!effect.disabled) {
            const duration = effect.duration;
            if (duration.type !== 'none') {
                if (duration.remaining <= 0) {
                    await effect.update({'disabled': true});
                }
            }
        }
    }
}

/**
 * Returns an info object when the active effect param is originally from an item, undefined otherwise.
 * @param {HarnMasterActiveEffect} effect the active effect
 * @returns Info object or undefined
 */
export function getItemEffect(effect) {
    if (effect.origin?.length) {
        const origin = foundry.utils.parseUuid(effect.origin);
        if (origin.primaryType === 'Actor' && origin.type === 'Item') {
            const origItem = game.actors.get(origin.primaryId).items.get(origin.id);
            const inactive = !origItem?.system.isCarried || !origItem?.system.isEquipped;

            return {origin, origItem, inactive};
        }
    }
}

/**
 * Returns true when the active effect param is originally from an item, false otherwise.
 * @param {HarnMasterActiveEffect} effect the active effect
 * @returns true when the active effect param is originally from an item
 */
export function isItemEffect(effect) {
    return !!getItemEffect(effect);
}

/**
 * Returns true when the active effect param is originally from an item and this item is
 * carried and equipped, false otherwise.
 * @param {HarnMasterActiveEffect} effect the active effect
 * @returns true when the item is carried and equipped
 */
export function isItemEffectInactive(effect) {
    const ie = getItemEffect(effect);
    return ie ? ie.inactive : false;
}
