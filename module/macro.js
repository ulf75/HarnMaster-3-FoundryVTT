import {Hook} from './hm3-types.js';
import * as utility from './utility.js';

const supportedHMHooks = Object.values(Hook);

const supportedFoundryHooks = [
    'combatRound',
    'combatStart',
    'combatTurn',
    'combatTurnChange',
    'pauseGame',
    'preUpdateToken',
    'targetToken',
    'updateToken',
    'updateWorldTime'
];

/**
 * Extend the base Macro.
 * @extends {Macro}
 */
export class HarnMasterMacro extends Macro {
    /**
     * Overrides the original implementation by allowing
     * to execute actor macros w/o limited ownership.
     * @returns True, if the user can execute this macro.
     * @override
     */
    get canExecute() {
        return super.canExecute || !!this.getFlag('hm3', 'ownerId');
    }
}

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
        Hooks.on(hook, (...args) => executeHook(...args, hook));
    });
}

/**
 * TODO
 * @param  {...any} args
 */
function executeHook(...args) {
    const hook = args.pop();

    const actors = new Set();
    canvas.scene?.tokens?.contents?.forEach((token) => {
        actors.add(token.actor.id);
    });
    Array.from(actors).forEach((actorId) => {
        game.actors.get(actorId).macrolist?.forEach(async (m) => {
            const macro = game.macros.get(m._id);
            const trigger = macro?.getFlag('hm3', 'trigger');
            if (trigger === hook) {
                if (macro.canExecute) {
                    // const asyncFunction = macro.command.includes('await') ? 'async' : ''; // TODO
                    const macroTokens = canvas.scene.tokens.contents.filter((t) => t.actor.id === actorId);
                    await macro.execute({
                        macroActor: macroTokens[0].actor,
                        macroTokens,
                        allOtherTokens: canvas.scene.tokens.contents.filter((t) => t.actor.id !== actorId),
                        triggerArgs: args, // original args from the hook
                        macros: game.hm3.macros // convenience
                    });
                }
            }
        });
    });
}
