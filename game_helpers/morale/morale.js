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
                token.getCondition(BERSERK)?.delete();
                token.getCondition(BROKEN)?.delete();
                token.getCondition(CAUTIOUS)?.delete();
                token.getCondition(DESPERATE)?.delete();
                dialogEditor.render(true);
            }
        },

        berserk: {
            label: BERSERK,
            callback: async () => {
                token.getCondition(BROKEN)?.delete();
                token.getCondition(CAUTIOUS)?.delete();
                token.getCondition(DESPERATE)?.delete();
                token.addCondition(BERSERK);
                dialogEditor.render(true);
            }
        },

        broken: {
            label: BROKEN,
            callback: async () => {
                token.getCondition(BERSERK)?.delete();
                token.getCondition(CAUTIOUS)?.delete();
                token.getCondition(DESPERATE)?.delete();
                token.addCondition(BROKEN);
                dialogEditor.render(true);
            }
        },

        cautious: {
            label: CAUTIOUS,
            callback: async () => {
                token.getCondition(BERSERK)?.delete();
                token.getCondition(BROKEN)?.delete();
                token.getCondition(DESPERATE)?.delete();
                token.addCondition(CAUTIOUS);
                dialogEditor.render(true);
            }
        },

        desperate: {
            label: DESPERATE,
            callback: async () => {
                token.getCondition(BERSERK)?.delete();
                token.getCondition(BROKEN)?.delete();
                token.getCondition(CAUTIOUS)?.delete();
                token.addCondition(DESPERATE);
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
