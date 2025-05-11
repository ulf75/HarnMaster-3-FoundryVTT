const OUTNUMBERED21 = 'Outnumbered 2:1';
const OUTNUMBERED31 = 'Outnumbered 3:1';
const OUTNUMBERED41 = 'Outnumbered 4:1';
const OUTNUMBERED51 = 'Outnumbered 5:1';
const OUTNUMBERED61 = 'Outnumbered 6:1';
const OUTNUMBERED_IMG = 'systems/hm3/images/icons/svg/backup.svg';
const INDEFINITE = Number.MAX_SAFE_INTEGER;

if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error('Please select ONE token!');
    return null;
}

const token = canvas.tokens.controlled[0];

let dialogEditor = new Dialog({
    title: 'Outnumbered',
    buttons: {
        none: {
            label: `None`,
            callback: async () => {
                await game.hm3.macros.getActiveEffect(token, game.hm3.Condition.OUTNUMBERED, false)?.delete();
                dialogEditor.render(true);
            }
        },

        out21: {
            label: OUTNUMBERED21,
            callback: async () => {
                const outnumbered = 2;
                const label = `${game.hm3.Condition.OUTNUMBERED} ${outnumbered}:1`;
                if (!token.hasCondition(label)) {
                    await game.hm3.macros.getActiveEffect(token, game.hm3.Condition.OUTNUMBERED, false)?.delete();
                    await token.addCondition(game.hm3.Condition.OUTNUMBERED, {outnumbered});
                }
                dialogEditor.render(true);
            }
        },

        out31: {
            label: OUTNUMBERED31,
            callback: async () => {
                const outnumbered = 3;
                const label = `${game.hm3.Condition.OUTNUMBERED} ${outnumbered}:1`;
                if (!token.hasCondition(label)) {
                    await game.hm3.macros.getActiveEffect(token, game.hm3.Condition.OUTNUMBERED, false)?.delete();
                    await token.addCondition(game.hm3.Condition.OUTNUMBERED, {outnumbered});
                }
                dialogEditor.render(true);
            }
        },

        out41: {
            label: OUTNUMBERED41,
            callback: async () => {
                const outnumbered = 4;
                const label = `${game.hm3.Condition.OUTNUMBERED} ${outnumbered}:1`;
                if (!token.hasCondition(label)) {
                    await game.hm3.macros.getActiveEffect(token, game.hm3.Condition.OUTNUMBERED, false)?.delete();
                    await token.addCondition(game.hm3.Condition.OUTNUMBERED, {outnumbered});
                }
                dialogEditor.render(true);
            }
        },

        out51: {
            label: OUTNUMBERED51,
            callback: async () => {
                const outnumbered = 5;
                const label = `${game.hm3.Condition.OUTNUMBERED} ${outnumbered}:1`;
                if (!token.hasCondition(label)) {
                    await game.hm3.macros.getActiveEffect(token, game.hm3.Condition.OUTNUMBERED, false)?.delete();
                    await token.addCondition(game.hm3.Condition.OUTNUMBERED, {outnumbered});
                }
                dialogEditor.render(true);
            }
        },

        out61: {
            label: OUTNUMBERED61,
            callback: async () => {
                const outnumbered = 6;
                const label = `${game.hm3.Condition.OUTNUMBERED} ${outnumbered}:1`;
                if (!token.hasCondition(label)) {
                    await game.hm3.macros.getActiveEffect(token, game.hm3.Condition.OUTNUMBERED, false)?.delete();
                    await token.addCondition(game.hm3.Condition.OUTNUMBERED, {outnumbered});
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
