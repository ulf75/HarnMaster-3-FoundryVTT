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
                const effect = game.hm3.macros.getActiveEffect(token, BERSERK, true);
                if (effect) {
                    effect.delete();
                } else {
                    ui.notifications.info(`${token.name} is not BERSERK.`);
                }
                dialogEditor.render(true);
            }
        },

        berserk: {
            label: BERSERK,
            callback: async () => {
                if (token.hasCondition(BERSERK)) {
                    ui.notifications.info(`${token.name} is already BERSERK.`);
                } else {
                    game.hm3.macros.createCondition(token, BERSERK);
                }
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
