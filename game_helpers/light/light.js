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
                token?.document.update({light: {dim: 0, bright: 0, color: '#000000', alpha: 1, attenuation: 0.5, animation: {type: 'none'}}});
                light?.document.update({config: {dim: 0, bright: 0, color: '#000000', alpha: 1, attenuation: 0.5, animation: {type: 'none'}}});
                dialogEditor.render(true);
            }
        },
        candle: {
            label: `Candle`,
            callback: () => {
                token?.document.update({
                    light: {
                        alpha: 0.25,
                        angle: 360,
                        animation: {type: 'torch', speed: 25, intensity: 5},
                        attenuation: 0.7,
                        bright: 10,
                        color: '#ff830f',
                        dim: 15
                    }
                });
                light?.document.update({
                    config: {
                        alpha: 0.25,
                        angle: 360,
                        animation: {type: 'flame', speed: 25, intensity: 3},
                        attenuation: 0.7,
                        bright: 10,
                        color: '#ff830f',
                        dim: 15
                    }
                });
                dialogEditor.render(true);
            }
        },
        torch: {
            label: `Torch`,
            callback: () => {
                token?.document.update({
                    light: {
                        alpha: 0.25,
                        angle: 360,
                        animation: {type: 'torch', speed: 6, intensity: 10},
                        attenuation: 0.7,
                        bright: 20,
                        color: '#ff830f',
                        dim: 40
                    }
                });
                light?.document.update({
                    config: {
                        alpha: 0.25,
                        angle: 360,
                        animation: {type: 'flame', speed: 5, intensity: 5},
                        attenuation: 0.7,
                        bright: 20,
                        color: '#ff830f',
                        dim: 40
                    }
                });
                dialogEditor.render(true);
            }
        },
        lamp: {
            label: `Lamp`,
            callback: () => {
                token?.document.update({
                    light: {
                        alpha: 0.25,
                        angle: 360,
                        animation: {type: 'torch', speed: 3, intensity: 3},
                        attenuation: 0.5,
                        bright: 15,
                        color: '#ffa200',
                        dim: 45
                    }
                });
                light?.document.update({
                    config: {
                        alpha: 0.25,
                        angle: 360,
                        animation: {type: 'flame', speed: 3, intensity: 3},
                        attenuation: 0.5,
                        bright: 15,
                        color: '#ffa200',
                        dim: 45
                    }
                });
                dialogEditor.render(true);
            }
        },
        hoodedOpen: {
            label: `HoodedLantern(O)`,
            callback: () => {
                token?.document.update({
                    light: {
                        alpha: 0.25,
                        angle: 360,
                        animation: {type: 'torch', speed: 3, intensity: 3},
                        attenuation: 0.5,
                        bright: 30,
                        color: '#ffa200',
                        dim: 60
                    }
                });
                light?.document.update({
                    config: {
                        alpha: 0.25,
                        angle: 360,
                        animation: {type: 'flame', speed: 3, intensity: 3},
                        attenuation: 0.5,
                        bright: 30,
                        color: '#ffa200',
                        dim: 60
                    }
                });
                dialogEditor.render(true);
            }
        },
        hoodedClosed: {
            label: `HoodedLantern(C)`,
            callback: () => {
                token?.document.update({
                    light: {
                        alpha: 0.25,
                        angle: 360,
                        animation: {type: 'torch', speed: 3, intensity: 3},
                        attenuation: 0.5,
                        bright: 0,
                        color: '#ffa200',
                        dim: 5
                    }
                });
                dialogEditor.render(true);
            }
        },
        campFire: {
            label: `CampFire`,
            callback: () => {
                light?.document.update({
                    config: {
                        alpha: 0.25,
                        angle: 360,
                        animation: {type: 'flame', speed: 5, intensity: 6},
                        attenuation: 0.7,
                        bright: 30,
                        color: '#ff830f',
                        dim: 60
                    }
                });
                dialogEditor.render(true);
            }
        },
        moon: {
            label: `Moon`,
            callback: () => {
                light?.document.update({
                    config: {
                        alpha: 0.25,
                        angle: 360,
                        animation: {type: 'fog', speed: 1, intensity: 1},
                        attenuation: 1,
                        bright: 0,
                        color: '#484956',
                        dim: 60
                    }
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
