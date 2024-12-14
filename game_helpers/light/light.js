if (canvas.tokens.controlled.length !== 1 && canvas.lighting.controlled.length !== 1) {
    ui.notifications.error('Please select ONE token or light source!');
    return null;
}

const light = canvas.lighting.controlled[0];

let dialogEditor = new Dialog({
    title: `Light Picker`,
    buttons: {
        none: {
            label: `None`,
            callback: () => {
                token?.document.update({light: {dim: 0, bright: 0, color: '#000000', alpha: 1, animation: {type: 'none'}}});
                light?.document.update({config: {dim: 0, bright: 0, color: '#000000', alpha: 1, animation: {type: 'none'}}});
                dialogEditor.render(true);
            }
        },
        candle: {
            label: `Candle`,
            callback: () => {
                token?.document.update({
                    light: {dim: 15, bright: 10, color: '#ff830f', alpha: 0.5, angle: 360, animation: {type: 'torch', speed: 25, intensity: 3}}
                });
                light?.document.update({
                    config: {dim: 15, bright: 10, color: '#ff830f', alpha: 0.5, angle: 360, animation: {type: 'flame', speed: 25, intensity: 3}}
                });
                dialogEditor.render(true);
            }
        },
        torch: {
            label: `Torch`,
            callback: () => {
                token?.document.update({
                    light: {dim: 40, bright: 20, color: '#ff830f', alpha: 0.5, angle: 360, animation: {type: 'torch', speed: 5, intensity: 5}}
                });
                light?.document.update({
                    config: {dim: 40, bright: 20, color: '#ff830f', alpha: 0.5, angle: 360, animation: {type: 'flame', speed: 5, intensity: 5}}
                });
                dialogEditor.render(true);
            }
        },
        lamp: {
            label: `Lamp`,
            callback: () => {
                token?.document.update({
                    light: {dim: 45, bright: 15, color: '#ffa200', alpha: 0.5, angle: 360, animation: {type: 'torch', speed: 3, intensity: 3}}
                });
                light?.document.update({
                    config: {dim: 45, bright: 15, color: '#ffa200', alpha: 0.5, angle: 360, animation: {type: 'flame', speed: 3, intensity: 3}}
                });
                dialogEditor.render(true);
            }
        },
        hoodedOpen: {
            label: `HoodedLantern(O)`,
            callback: () => {
                token?.document.update({
                    light: {dim: 60, bright: 30, color: '#ffa200', alpha: 0.5, angle: 360, animation: {type: 'torch', speed: 3, intensity: 3}}
                });
                light?.document.update({
                    config: {dim: 60, bright: 30, color: '#ffa200', alpha: 0.5, angle: 360, animation: {type: 'flame', speed: 3, intensity: 3}}
                });
                dialogEditor.render(true);
            }
        },
        hoodedClosed: {
            label: `HoodedLantern(C)`,
            callback: () => {
                token?.document.update({
                    light: {dim: 5, bright: 0, color: '#ffa200', alpha: 0.5, angle: 360, animation: {type: 'torch', speed: 3, intensity: 3}}
                });
                dialogEditor.render(true);
            }
        },
        campFire: {
            label: `CampFire`,
            callback: () => {
                light?.document.update({
                    config: {dim: 60, bright: 30, color: '#ff830f', alpha: 0.5, angle: 360, animation: {type: 'flame', speed: 4, intensity: 4}}
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
