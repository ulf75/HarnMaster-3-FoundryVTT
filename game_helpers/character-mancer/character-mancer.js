if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error('Please select ONE token!');
    return null;
}

const T = canvas.tokens.controlled[0];
const A = T.actor;

let dialogEditor = new Dialog({
    title: 'Charactermancer',
    buttons: {
        off: {
            label: `Off`,
            callback: () => {
                A.unsetFlag('hm3', 'CharacterMancer');
                dialogEditor.render(true);
            }
        },

        on: {
            label: 'On',
            callback: () => {
                A.setFlag('hm3', 'CharacterMancer', true);
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
