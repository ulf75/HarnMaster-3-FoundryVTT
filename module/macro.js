const supportedHooks = ['preUpdateToken', 'hm3.onInjuryRoll', 'refreshToken'];

/**
 * Manage Macro instances through the Actor Sheet via macro control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
export async function onManageMacro(event, owner) {
    event.preventDefault();
    const a = event.currentTarget;
    const li = a.closest('li');
    const clickOnName = !!li.firstElementChild?.className?.includes('macro-name');
    const action = clickOnName ? 'edit' : a.dataset.action;
    let macro = li.dataset.macroId ? game.macros.get(li.dataset.macroId) : null;
    switch (action) {
        case 'create':
            if (!owner.system.macrolist) owner.system.macrolist = [];

            const mdata = {name: `New macro`, type: 'script', scope: 'global'};
            macro = await Macro.create(mdata);
            await macro.setFlag('hm3', 'trigger', 'manual');
            owner.system.macrolist.push(macro);

            return renderMacroDialog('Create Macro', macro, owner);

        case 'edit':
            return renderMacroDialog('Edit Macro', macro, owner);

        case 'delete':
            return new Dialog({
                title: 'Delete Macro',
                content: '<p>Are you sure?</p><p>This macro will be permanently deleted and cannot be recovered.</p>',
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: 'Yes',
                        callback: async (html) => {
                            // update macrolist
                            const filteredArray = owner.system.macrolist.filter((m) => m._id !== macro.id);
                            await owner.update({'system.macrolist': filteredArray});

                            await macro.delete();
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
 * @param {*} title
 * @param {*} macro
 * @param {*} owner
 */
async function renderMacroDialog(title, macro, owner) {
    const html = await renderTemplate('systems/hm3/templates/dialog/macro-config.html', {
        macroScopes: CONST.MACRO_SCOPES.map((s) => ({value: s, label: s})),
        macroTypes: game.documentTypes.Macro.map((t) => ({
            value: t,
            label: game.i18n.localize(CONFIG.Macro.typeLabels[t]),
            disabled: t === 'script' && !game.user.can('MACRO_SCRIPT')
        })),
        data: macro,
        triggerTypes: [
            {value: 'legacy', label: 'Legacy'},
            {value: 'manual', label: 'Manual'},
            {value: 'hm3.onInjuryRoll', label: 'On Injury Roll'},
            {value: 'preUpdateToken', label: 'Pre Update Token'},
            {value: 'refreshToken', label: 'Refresh Token'}
        ],
        trigger: macro.getFlag('hm3', 'trigger')
    });

    // Create the dialog window
    new Dialog(
        {
            title,
            content: html,
            buttons: {
                save: {
                    icon: '<i class="fas fa-save"></i>',
                    label: 'Save Macro',
                    callback: async (html) => save(html, macro, owner)
                },
                execute: {
                    icon: '<i class="fas fa-dice-d20"></i>',
                    label: 'Execute Macro',
                    disabled: !(macro.getFlag('hm3', 'trigger') === 'manual' && macro.canExecute),
                    callback: async (html) => {
                        await save(html, macro, owner);
                        if (macro.canExecute) macro.execute();
                    }
                }
            },
            default: 'save',
            render: (html) => {
                // only manual macros can be executed
                html[0].childNodes[1][3].onchange = () => {
                    html[2].childNodes[3].disabled = !(html[0].childNodes[1][3].value === 'manual' && macro.canExecute);
                };
            }
            // close: (html) => console.log('This always is logged no matter which option is chosen')
        },
        {
            /*jQuery: false,*/
            width: 560,
            height: 572,
            resizable: true
        }
    ).render(true);
}

/**
 * TODO
 * @param {*} html
 * @param {*} macro
 * @param {*} owner
 */
async function save(html, macro, owner) {
    const form = html[0].querySelector('form');
    const formdata = new FormDataExtended(form).object;

    // update macro
    await macro.setFlag('hm3', 'trigger', formdata.trigger);
    await macro.update({
        'command': formdata.command,
        'img': formdata.img,
        'name': formdata.name,
        'type': formdata.type
    });

    // update macrolist
    const filteredArray = owner.system.macrolist.filter((m) => m._id !== macro.id);
    filteredArray.push(macro);
    await owner.update({'system.macrolist': filteredArray});
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
        game.actors.get(actorId).system?.macrolist?.forEach(async (m) => {
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