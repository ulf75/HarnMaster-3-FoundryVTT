// @ts-check

import {ActorHM3} from './actor/actor';
import {displayChatActionButtons, outnumberedConditions} from './combat';
import {checkExpiredActiveEffects, checkStartedActiveEffects} from './effect';
import {ItemType} from './hm3-types';
import {createHM3Macro} from './macros';
import {Mutex} from './mutex';
import {beautify} from './utility';

export function initializeFoundryHooks() {
    Hooks.on('hotbarDrop', (bar, data, slot) => createHM3Macro(data, slot));

    Hooks.on('renderPause', (_app, html) => html.find('img').attr('src', 'systems/hm3/images/png/HMLogo.png'));

    // Since HM3 does not have the concept of rolling for initiative,
    // this hook simply prepopulates the initiative value. This ensures
    // that no die roll is needed.
    Hooks.on('preCreateCombatant', (combat, combatant, options, id) => {
        if (!combatant.initiative) {
            let token = canvas?.tokens?.get(combatant.tokenId);
            combatant.initiative = token?.actor?.system.initiative;
        }
    });

    // If the combatant is not already in combat, roll initiative
    Hooks.on('createCombatant', (combatant, options, id) => {
        if (combatant.testUserPermission(game.user, 'OWNER')) combatant.rollInitiative();
    });

    Hooks.on('updateCombat', async (combat, updateData) => {
        return updateOutnumbered({hook: 'updateCombat'});
    });

    Hooks.on('updateCombatant', async (combatant, info, updateData, userId) => {
        return updateOutnumbered({hook: 'updateCombatant'});
    });

    Hooks.on('createActiveEffect', async (activeEffect, info, userId) => {
        return updateOutnumbered({aeName: activeEffect.name, hook: 'createActiveEffect'});
    });

    Hooks.on('deleteActiveEffect', async (activeEffect, info, userId) => {
        return updateOutnumbered({aeName: activeEffect.name, hook: 'deleteActiveEffect'});
    });

    Hooks.on('dropCanvasData', async (canvas, data) => {
        if (data.type === 'Item') {
            const targetToken = canvas?.tokens?.placeables.find((t) => t.bounds.contains(data.x, data.y));
            if (!targetToken) return;

            const actor = targetToken.actor;
            if (!actor) return;

            const item = await Item.fromDropData(data);
            if (!item) return;

            await actor.createEmbeddedDocuments('Item', [item.toObject()]);

            ui.notifications?.info(`"${item.name}" was added to ${targetToken.name}.`);
        }
    });

    // Actors also have a Bio image
    Hooks.on('getActorDirectoryEntryContext', (html, menuItems) => {
        menuItems.unshift({
            name: 'View Bio Artwork',
            icon: `<i class="fas fa-image"></i>`,
            callback: async (html) => {
                const actor = game.actors?.get(html.data('documentId'));
                new ImagePopout(actor.system.bioImage, {
                    title: actor.name,
                    uuid: actor.uuid
                }).render(true);
            },
            condition: (html) => {
                const actor = game.actors?.get(html.data('documentId'));
                return game.user?.isGM && actor?.system?.bioImage;
            }
        });
    });

    Hooks.on('renderChatMessage', (app, html, data) => {
        // Display action buttons
        displayChatActionButtons(app, html, data);
    });

    Hooks.on('renderChatLog', (app, html, data) => ActorHM3.chatListeners(html));

    Hooks.on('renderChatPopout', (app, html, data) => ActorHM3.chatListeners(html));

    /**
     * Active Effects need to expire at certain times, so keep track of that here
     */
    Hooks.on('updateWorldTime', async (currentTime, change) => {
        await checkStartedActiveEffects();
        // Disable any expired active effects (WorldTime-based durations).
        await checkExpiredActiveEffects();
    });

    Hooks.on('updateCombat', async (combat, updateData) => {
        await checkStartedActiveEffects();
        // Called when the combat object is updated.  Possibly because of a change in round
        // or turn. updateData will have specifics of what changed.
        await checkExpiredActiveEffects();
    });

    Hooks.on('createItem', async (item, info, userId) => {
        if (item.type === ItemType.EFFECT) {
            if (item.system.selfDestroy && item.parent instanceof Actor) {
                item.effects.forEach((effect) => {
                    if (!effect.getFlag('effectmacro', 'onDisable.script'))
                        effect.setFlag(
                            'effectmacro',
                            'onDisable.script',
                            beautify(`
                      const item = fromUuidSync('${item.uuid}');
                      if (item) {
                        if (item.effects.contents.filter((e)=>e.disabled).length === item.effects.size) {
                          item.delete();
                        }
                      }`)
                        );
                });
            }
        }
    });

    Hooks.on('preUpdateMacro', async (macro, updateData, options, userId) => {
        if (updateData.command) updateData.command = beautify(updateData.command);
    });
}

let outMutex = new Mutex();
/**
 * Update outnumbered status for combatants
 * @param {Object} options -
 * @param {string} [options.aeName='true'] - The name of the active effect
 * @param {string} [options.hook='nohook'] - The name of the active effect
 * @returns {Promise<boolean>}
 */
async function updateOutnumbered({aeName = 'true', hook = 'nohook'} = {}) {
    if (game.combat?.started && game.user?.isGM) {
        if (aeName === 'true' || outnumberedConditions().includes(aeName)) {
            return outMutex.runExclusive(async () => {
                console.info(`HM3 | Run updateOutnumbered (aeName = ${aeName}, hook = ${hook})`);
                const {changed, tokens} = await updateOutnumbered();
                if (changed) Hooks.call('hm3.onOutnumberedChanged', tokens, aeName, hook);
                Hooks.call('hm3.onOutnumbered', aeName, hook);
                return true;
            });
        }
        Hooks.call('hm3.onOutnumbered', aeName, hook);
    }

    return true;
}
