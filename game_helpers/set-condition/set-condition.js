const content = (html) => `
<div>
<label for="condition">Choose a Condition:</label>
<select name="condition" id="condition">
${html}
</select>
</div>
`;

if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error('Please select ONE token!');
    return null;
}

const token = canvas.tokens.controlled[0];

let dialogEditor = new Dialog({
    title: 'Set Condition',
    content: content(
        Object.values(game.hm3.enums.Condition)
            .map((value) => `<option value="${value}">${value}</option>`)
            .join('\n')
    ),
    buttons: {
        set: {
            label: 'Set',
            callback: (html) => {
                if (canvas.tokens.controlled.length !== 1) {
                    ui.notifications.error('Please select ONE token!');
                } else {
                    const token = canvas.tokens.controlled[0];
                    const cond = html.find('#condition')[0];
                    const condition = cond.options[cond.selectedIndex].text;
                    token.addCondition(condition);
                }
                dialogEditor.render(true);
            }
        },
        reset: {
            label: 'Reset',
            callback: (html) => {
                if (canvas.tokens.controlled.length !== 1) {
                    ui.notifications.error('Please select ONE token!');
                } else {
                    const token = canvas.tokens.controlled[0];
                    const cond = html.find('#condition')[0];
                    const condition = cond.options[cond.selectedIndex].text;
                    token.deleteCondition(condition);
                }
                dialogEditor.render(true);
            }
        },
        resetAll: {
            label: 'Reset All',
            callback: () => {
                if (canvas.tokens.controlled.length !== 1) {
                    ui.notifications.error('Please select ONE token!');
                } else {
                    const token = canvas.tokens.controlled[0];
                    Object.values(game.hm3.enums.Condition).forEach((condition) => {
                        token.deleteCondition(condition);
                    });
                }
                dialogEditor.render(true);
            }
        },
        cancel: {
            label: 'Cancel'
        }
    },
    default: 'set',
    close: () => {}
});

dialogEditor.render(true);
