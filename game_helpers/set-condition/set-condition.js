const content = (html) => `
<div>
<label for="condition">Choose a Condition:</label>
<select name="condition" id="condition">
${html}
</select>
</div>
`;

let dialogEditor = new Dialog({
    title: 'Set Condition',
    content: content(
        Object.values(game.hm3.Condition)
            .map((value) => `<option value="${value}">${value}</option>`)
            .join('\n')
    ),
    buttons: {
        set: {
            label: 'Set',
            callback: async (html) => {
                canvas.tokens.controlled.forEach((token) => {
                    const cond = html.find('#condition')[0];
                    const condition = cond.options[cond.selectedIndex].text;
                    token.addCondition(condition);
                });
                dialogEditor.render(true);
            }
        },
        reset: {
            label: 'Reset',
            callback: (html) => {
                canvas.tokens.controlled.forEach((token) => {
                    const cond = html.find('#condition')[0];
                    const condition = cond.options[cond.selectedIndex].text;
                    token.deleteCondition(condition);
                });
                dialogEditor.render(true);
            }
        },
        resetAll: {
            label: 'Reset All',
            callback: () => {
                canvas.tokens.controlled.forEach((token) => {
                    Object.values(game.hm3.Condition).forEach((condition) => {
                        token.deleteCondition(condition);
                    });
                    token.combatant?.update({defeated: false});
                    token.actor.toggleStatusEffect('dead', {active: false});
                    token.actor.toggleStatusEffect('unconscious', {active: false});
                    token.toggleVisibility({active: true});
                });
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
