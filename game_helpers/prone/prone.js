const PRONE = 'Prone';

if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error('Please select ONE token!');
    return null;
}

const token = canvas.tokens.controlled[0];

let dialogEditor = new Dialog({
    title: 'Prone',
    buttons: {
        none: {
            label: `None`,
            callback: () => {
                const effect = game.hm3.macros.getActiveEffect(token, PRONE, true);
                if (effect) effect.delete();
                dialogEditor.render(true);
            }
        },

        prone: {
            label: PRONE,
            callback: () => {
                game.hm3.macros.createCondition(token, PRONE);
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
