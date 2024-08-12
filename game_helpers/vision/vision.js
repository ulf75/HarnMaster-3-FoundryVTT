if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error('Please select ONE token!');
    return null;
}

let dialogEditor = new Dialog({
    title: `VisionPicker`,
    buttons: {
        none: {
            label: `Dark`,
            callback: () => {
                token.document.update({sight: {enabled: true, visionMode: 'basic', range: 1}});
                dialogEditor.render(true);
            }
        },
        vision5: {
            label: `V 5`,
            callback: () => {
                token.document.update({sight: {enabled: true, visionMode: 'basic', range: 5}});
                dialogEditor.render(true);
            }
        },
        vision10: {
            label: `V 10`,
            callback: () => {
                token.document.update({sight: {enabled: true, visionMode: 'basic', range: 10}});
                dialogEditor.render(true);
            }
        },
        vision20: {
            label: `V 20`,
            callback: () => {
                token.document.update({sight: {enabled: true, visionMode: 'basic', range: 20}});
                dialogEditor.render(true);
            }
        },
        blind: {
            label: `Blinded`,
            callback: () => {
                token.document.update({sight: {enabled: false, visionMode: 'basic', range: 0}});
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
