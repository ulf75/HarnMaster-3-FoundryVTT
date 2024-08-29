import * as utility from './utility.js';

const supportedHooks = [
    'combatRound',
    'combatStart',
    'combatTurn',
    'combatTurnChange',
    'hm3.onAbilityRollD100',
    'hm3.onAbilityRollD6',
    'hm3.onActorPrepareBaseData',
    'hm3.onActorPrepareDerivedData',
    'hm3.onBlockResume',
    'hm3.onDamageRoll',
    'hm3.onDodgeResume',
    'hm3.onDodgeRoll',
    'hm3.onFumbleRoll',
    'hm3.onHealingRoll',
    'hm3.onIgnoreResume',
    'hm3.onInjuryRoll',
    'hm3.onShockRoll',
    'hm3.onStumbleRoll',
    'hm3.preInjuryRoll',
    'pauseGame',
    'preUpdateToken',
    'targetToken',
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
            const mdata = {name: `New macro`, type: 'script', scope: 'global'};
            macro = await Macro.create(mdata);
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
    supportedHooks.forEach((hook) => {
        Hooks.on(hook, (...args) => executeHooks(...args, hook));
    });
}

/**
 * TODO
 * @param  {...any} args
 */
function executeHooks(...args) {
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
                    const asyncFunction = macro.command.includes('await') ? 'async' : ''; // TODO
                    const macroTokens = canvas.scene.tokens.contents.filter((t) => t.actor.id === actorId);
                    await macro.execute({
                        macroActor: macroTokens[0].actor,
                        macroTokens,
                        allOtherTokens: canvas.scene.tokens.contents.filter((t) => t.actor.id !== actorId),
                        triggerArgs: args,
                        macros: game.hm3.macros
                    });
                }
            }
        });
    });
}
