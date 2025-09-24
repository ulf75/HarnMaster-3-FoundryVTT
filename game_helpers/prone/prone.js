let dialogEditor = new Dialog({
    title: hm3.Condition.PRONE,
    buttons: {
        prone: {
            label: hm3.Condition.PRONE,
            callback: async () => {
                canvas?.tokens?.controlled.forEach((token) => {
                    token.addCondition(hm3.Condition.PRONE);
                });
                dialogEditor.render(true);
            }
        },

        rise: {
            label: `Rise`,
            callback: async () => {
                canvas?.tokens?.controlled.forEach((token) => {
                    token.deleteCondition(hm3.Condition.PRONE);
                });
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
