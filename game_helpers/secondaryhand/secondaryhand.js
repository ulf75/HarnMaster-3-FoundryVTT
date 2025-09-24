let dialogEditor = new Dialog({
    title: hm3.Condition.SECONDARY_HAND,
    buttons: {
        second: {
            label: hm3.Condition.SECONDARY_HAND,
            callback: async () => {
                canvas?.tokens?.controlled.forEach((token) => {
                    token.addCondition(hm3.Condition.SECONDARY_HAND);
                });
                dialogEditor.render(true);
            }
        },

        none: {
            label: `None`,
            callback: async () => {
                canvas?.tokens?.controlled.forEach((token) => {
                    token.deleteCondition(hm3.Condition.SECONDARY_HAND);
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
