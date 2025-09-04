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

    let effect;
    if (owner instanceof Actor)
        effect = li.dataset.effectId ? owner.allApplicableEffects().find((e) => e.id === li.dataset.effectId) : null;
    if (owner instanceof Item) effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;

    switch (action) {
        case 'create':
            const dlgTemplate = 'systems/hm3/templates/dialog/active-effect-start.hbs';
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
            if (effect.parent instanceof Item && effect.parent?.parent instanceof Actor)
                return ui.notifications.info(
                    `This effect (${effect.name}) originates from an item (${effect.parent.name}) and cannot be deleted.`
                );
            return new Dialog({
                title: 'Delete Active Effect',
                content:
                    '<p>Are you sure?</p><p>This active effect will be permanently deleted and cannot be recovered.</p>',
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

export async function checkStartedActiveEffects() {
    const actors = utility.getRelevantActors();
    for (let actor of actors) {
        if (actor.allApplicableEffects(true)?.length) {
            const aeStarted = await setAEStatus(actor);
            actor.sheet.conditionalRender({aeStarted});
        }
    }

    // // Handle game actors first
    // for (let actor of game.actors.values()) {
    //     if (actor.player?.active && actor.isOwner && actor.allApplicableEffects(true)?.length) {
    //         const aeStarted = await setAEStatus(actor);
    //         actor.sheet.conditionalRender({aeStarted});
    //     }
    // }

    // // Next, handle tokens (only unlinked tokens)
    // for (let token of canvas.tokens.ownedTokens.values()) {
    //     if (!token.document.actorLink && token.actor?.allApplicableEffects(true)?.length) {
    //         const aeStarted = await setAEStatus(token.actor);
    //         token.actor.sheet.conditionalRender({aeStarted});
    //     }
    // }
}

async function setAEStatus(actor) {
    let aeStarted = false;
    for (const effect of actor.allApplicableEffects(true)) {
        if (effect.system.status === undefined) {
            if (effect.started) {
                await effect.update({'system.status': 'Running'});
                aeStarted = true;
            } else await effect.update({'system.status': 'Pending'});
        } else if (effect.system.status === 'Pending') {
            if (effect.started) {
                await effect.update({'system.status': 'Running'});
                aeStarted = true;
            }
        } else if (effect.system.status === 'Started') {
            // rename
            await effect.update({'system.status': 'Running'});
        }
    }
    return aeStarted;
}

/**
 * This function searches all actors and tokens that are owned
 * by the user and disables them if their duration has expired.
 */
export async function checkExpiredActiveEffects() {
    const actors = utility.getRelevantActors();
    for (let actor of actors) {
        if (actor.allApplicableEffects(true)?.length) {
            const aeDisabled = await disableExpiredAE(actor);
            actor.sheet.conditionalRender({aeDisabled});
        }
    }

    // // Handle game actors first
    // for (let actor of game.actors.values()) {
    //     if (actor.player?.active && actor.isOwner && actor.allApplicableEffects(true)?.length) {
    //         const aeDisabled = await disableExpiredAE(actor);
    //         actor.sheet.conditionalRender({aeDisabled});
    //     }
    // }

    // // Next, handle tokens (only unlinked tokens)
    // for (let token of canvas.tokens.ownedTokens.values()) {
    //     if (!token.document.actorLink && token.actor?.allApplicableEffects(true)?.length) {
    //         const aeDisabled = await disableExpiredAE(token.actor);
    //         token.actor.sheet.conditionalRender({aeDisabled});
    //     }
    // }
}

/**
 * Checks all of the active effects for a single actor and disables
 * them if their duration has expired.
 *
 * @param {ActorHM3} actor
 */
async function disableExpiredAE(actor) {
    let changed = false;
    for (let effect of actor.allApplicableEffects(true)) {
        if (!effect.disabled) {
            const duration = effect.duration;
            if (duration.type !== 'none') {
                if (duration.remaining <= 0) {
                    await effect.update({'disabled': true, 'system.status': 'Ended'});
                    changed = true;
                }
            }
        }
    }
    return changed;
}
