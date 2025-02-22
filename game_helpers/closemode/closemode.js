const CLOSE = 'Close Mode';
const CLOSE_IMG = 'systems/hm3/images/icons/svg/spiked-wall.svg';
const INDEFINITE = Number.MAX_SAFE_INTEGER;

if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error('Please select ONE token!');
    return null;
}

const token = canvas.tokens.controlled[0];

let dialogEditor = new Dialog({
    title: CLOSE,
    buttons: {
        none: {
            label: `None`,
            callback: () => {
                game.hm3.macros.getActiveEffect(token, CLOSE, true)?.delete();
                dialogEditor.render(true);
            }
        },

        close_mode: {
            label: CLOSE,
            callback: () => {
                game.hm3.macros.createActiveEffect(
                    {
                        label: CLOSE,
                        icon: CLOSE_IMG,
                        token,
                        type: 'GameTime',
                        seconds: INDEFINITE,
                        flags: {
                            effectmacro: {
                                onTurnStart: {
                                    script: `await ChatMessage.create({
speaker,
content: "<p>You're in close mode. You get -10 on all attack rolls.</p>",
});`
                                }
                            }
                        }
                    },
                    [{key: 'eph.meleeAMLMod', mode: 2, value: '-10'}],
                    {
                        unique: true
                    }
                );

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
