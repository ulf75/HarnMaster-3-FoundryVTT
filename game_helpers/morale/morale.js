const BERSERK = game.hm3.enums.Condition.BERSERK;
const BROKEN = game.hm3.enums.Condition.BROKEN;
const CAUTIOUS = game.hm3.enums.Condition.CAUTIOUS;
const DESPERATE = game.hm3.enums.Condition.DESPERATE;
const EMPOWERED = game.hm3.enums.Condition.EMPOWERED;

let dialogEditor = new Dialog(
    {
        title: 'Morale',
        buttons: {
            normal: {
                label: `Normal`,
                callback: async () => {
                    if (canvas.tokens.controlled.length !== 1) {
                        ui.notifications.error('Please select ONE token!');
                    } else {
                        const token = canvas.tokens.controlled[0];
                        token.deleteAllMoraleConditions();
                    }
                    dialogEditor.render(true);
                }
            },

            berserk: {
                label: BERSERK,
                callback: async () => {
                    if (canvas.tokens.controlled.length !== 1) {
                        ui.notifications.error('Please select ONE token!');
                    } else {
                        const token = canvas.tokens.controlled[0];
                        await token.addCondition(BERSERK);
                    }
                    dialogEditor.render(true);
                }
            },

            broken: {
                label: BROKEN,
                callback: async () => {
                    if (canvas.tokens.controlled.length !== 1) {
                        ui.notifications.error('Please select ONE token!');
                    } else {
                        const token = canvas.tokens.controlled[0];
                        await token.addCondition(BROKEN);
                    }
                    dialogEditor.render(true);
                }
            },

            cautious: {
                label: CAUTIOUS,
                callback: async () => {
                    if (canvas.tokens.controlled.length !== 1) {
                        ui.notifications.error('Please select ONE token!');
                    } else {
                        const token = canvas.tokens.controlled[0];
                        await token.addCondition(CAUTIOUS);
                    }
                    dialogEditor.render(true);
                }
            },

            desperate: {
                label: DESPERATE,
                callback: async () => {
                    if (canvas.tokens.controlled.length !== 1) {
                        ui.notifications.error('Please select ONE token!');
                    } else {
                        const token = canvas.tokens.controlled[0];
                        await token.addCondition(DESPERATE);
                    }
                    dialogEditor.render(true);
                }
            },

            empowered: {
                label: EMPOWERED,
                callback: async () => {
                    if (canvas.tokens.controlled.length !== 1) {
                        ui.notifications.error('Please select ONE token!');
                    } else {
                        const token = canvas.tokens.controlled[0];
                        await token.addCondition(EMPOWERED);
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
    },
    {width: 500}
);

dialogEditor.render(true);
