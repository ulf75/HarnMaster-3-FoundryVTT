const BERSERK = 'Berserk';

if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error('Please select ONE token!');
    return null;
}

const token = canvas.tokens.controlled[0];

let dialogEditor = new Dialog({
    title: 'Berserk',
    buttons: {
        normal: {
            label: `Normal`,
            callback: async () => {
                game.hm3.macros.getActiveEffect(token, BERSERK, true)?.delete();
                dialogEditor.render(true);
            }
        },

        berserk: {
            label: BERSERK,
            callback: async () => {
                game.hm3.macros.createCondition(token, BERSERK);
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
