const SECONDARY = 'Secondary Hand';
const SECONDARY_IMG = 'systems/hm3/images/icons/svg/arm-sling.svg';
const INDEFINITE = Number.MAX_SAFE_INTEGER;

if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error('Please select ONE token!');
    return null;
}

const token = canvas.tokens.controlled[0];

let dialogEditor = new Dialog({
    title: SECONDARY,
    buttons: {
        none: {
            label: `None`,
            callback: () => {
                game.hm3.macros.getActiveEffect(token, SECONDARY, true)?.delete();
                dialogEditor.render(true);
            }
        },

        secondary: {
            label: SECONDARY,
            callback: () => {
                game.hm3.macros.createActiveEffect(
                    {
                        label: SECONDARY,
                        icon: SECONDARY_IMG,
                        token,
                        type: 'GameTime',
                        seconds: INDEFINITE,
                        flags: {
                            effectmacro: {
                                onEachTurn: {
                                    script: `
                                    const token = canvas.tokens.get('${token.id}');
                                    await game.hm3.GmSays("<b>" + token.name + "</b> fights with the <b>Secondary Hand</b>, and gets -10 on <b>All</b> attack rolls.", "Combat 3 & 11");
                                    `
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
