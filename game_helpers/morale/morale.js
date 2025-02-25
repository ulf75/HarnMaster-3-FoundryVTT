const BERSERK = game.hm3.enums.Condition.BERSERK;
const BROKEN = game.hm3.enums.Condition.BROKEN;
const CAUTIOUS = game.hm3.enums.Condition.CAUTIOUS;
const DESPERATE = game.hm3.enums.Condition.DESPERATE;

if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error('Please select ONE token!');
    return null;
}

const token = canvas.tokens.controlled[0];

let dialogEditor = new Dialog({
    title: 'Morale',
    buttons: {
        normal: {
            label: `Normal`,
            callback: async () => {
                game.hm3.macros.getActiveEffect(token, BERSERK, true)?.delete();
                game.hm3.macros.getActiveEffect(token, BROKEN, true)?.delete();
                game.hm3.macros.getActiveEffect(token, CAUTIOUS, true)?.delete();
                game.hm3.macros.getActiveEffect(token, DESPERATE, true)?.delete();
                dialogEditor.render(true);
            }
        },

        berserk: {
            label: BERSERK,
            callback: async () => {
                game.hm3.macros.getActiveEffect(token, BROKEN, true)?.delete();
                game.hm3.macros.getActiveEffect(token, CAUTIOUS, true)?.delete();
                game.hm3.macros.getActiveEffect(token, DESPERATE, true)?.delete();
                game.hm3.macros.createCondition(token, BERSERK);
                dialogEditor.render(true);
            }
        },

        broken: {
            label: BROKEN,
            callback: async () => {
                game.hm3.macros.getActiveEffect(token, BERSERK, true)?.delete();
                game.hm3.macros.getActiveEffect(token, CAUTIOUS, true)?.delete();
                game.hm3.macros.getActiveEffect(token, DESPERATE, true)?.delete();
                game.hm3.macros.createCondition(token, BROKEN);
                dialogEditor.render(true);
            }
        },

        cautious: {
            label: CAUTIOUS,
            callback: async () => {
                game.hm3.macros.getActiveEffect(token, BERSERK, true)?.delete();
                game.hm3.macros.getActiveEffect(token, BROKEN, true)?.delete();
                game.hm3.macros.getActiveEffect(token, DESPERATE, true)?.delete();
                game.hm3.macros.createCondition(token, CAUTIOUS);
                dialogEditor.render(true);
            }
        },

        desperate: {
            label: DESPERATE,
            callback: async () => {
                game.hm3.macros.getActiveEffect(token, BERSERK, true)?.delete();
                game.hm3.macros.getActiveEffect(token, BROKEN, true)?.delete();
                game.hm3.macros.getActiveEffect(token, CAUTIOUS, true)?.delete();
                game.hm3.macros.createCondition(token, DESPERATE);
                dialogEditor.render(true);
            }
        },

        close: {
            label: `Exit`
        }
    },
    default: 'close',
    close: () => {}
});

dialogEditor.render(true);
