import {Hook} from './hm3-types.js';
import * as utility from './utility.js';

const supportedHMHooks = Object.values(Hook);

const supportedFoundryHooks = [
    'applyTokenStatusEffect',
    'combatRound',
    'combatStart',
    'combatTurn',
    'combatTurnChange',
    'createToken',
    'pauseGame',
    'preUpdateToken',
    'targetToken',
    'updateCombatant',
    'updateToken',
    'updateWorldTime'
];

/**
 * Manage Macro instances through the Actor Sheet via macro control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
export async function onManageMacro(event, owner) {
    event.preventDefault();
    const a = event.currentTarget;
    const li = a.closest('li');
    const clickOnName = !!(li.firstElementChild?.className?.includes('macro-name') && a.dataset.action !== 'create' && a.dataset.action !== 'delete');
    const action = clickOnName ? 'edit' : a.dataset.action;
    let macro = li.dataset.macroId ? game.macros.get(li.dataset.macroId) : null;
    switch (action) {
        case 'create':
            macro = await Macro.create({name: `New macro`, type: 'script', scope: 'global', folder: owner.macrofolder});
            await macro.setFlag('hm3', 'trigger', 'manual');
            await macro.setFlag('hm3', 'ownerId', owner.id);

            return macro.sheet.render(true);

        case 'edit':
            return macro.sheet.render(true);

        case 'delete':
            return new Dialog({
                title: 'Delete Macro',
                content: '<p>Are you sure?</p><p>This macro will be permanently deleted and cannot be recovered.</p>',
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: 'Yes',
                        callback: async (html) => {
                            await macro.delete();
                            utility.getActorFromMacro(macro)?.sheet.render();
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
    }
}

/**
 * TODO
 */
export async function registerHooks() {
    [...supportedFoundryHooks, ...supportedHMHooks].forEach((hook) => {
        Hooks.on(hook, async (...args) => await executeHook(...args, hook));
    });
}

/**
 * TODO
 * @param  {...any} args
 */
async function executeHook(...args) {
    const hook = args.pop();

    await Promise.all(
        game.macros.contents.map(async (macro) => {
            const trigger = macro.getFlag('hm3', 'trigger');
            if (trigger === hook) {
                if (macro.canExecute) {
                    const actorId = macro.getFlag('hm3', 'ownerId') || null;
                    await macro.execute({
                        macroActor: game.actors.get(actorId) || null,
                        macroTokens: actorId ? canvas.scene.tokens.contents.filter((t) => t.actor.id === actorId) : null,
                        allOtherTokens: actorId ? canvas.scene.tokens.contents.filter((t) => t.actor.id !== actorId) : null,
                        triggerArgs: args, // original args from the hook
                        macros: game.hm3.macros // convenience
                    });
                }
            }
        })
    );
}
