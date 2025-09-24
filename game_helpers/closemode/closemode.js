let dialogEditor = new Dialog({
    title: hm3.Condition.CLOSE_MODE,
    buttons: {
        closemode: {
            label: hm3.Condition.CLOSE_MODE,
            callback: async () => {
                canvas?.tokens?.controlled.forEach((token) => {
                    token.addCondition(hm3.Condition.CLOSE_MODE);
                });
                dialogEditor.render(true);
            }
        },

        none: {
            label: `None`,
            callback: async () => {
                canvas?.tokens?.controlled.forEach((token) => {
                    token.deleteCondition(hm3.Condition.CLOSE_MODE);
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
