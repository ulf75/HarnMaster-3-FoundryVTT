const FIRE_COLOR = '#ad641f'; // #eccd8b  | #ff9500 | #ff830f | #ad641f
const LAMP_COLOR = '#eccd8b'; // #ffa200
const MOON_COLOR = '#484956'; // #484956

const LIGHT_ALPHA = 0.75;
const LIGHT_ANIM_TYPE = 'torch'; // flame | torch
const LIGHT_ATTENUATION = 0.6;
const TOKEN_ALPHA = 0.75;
const TOKEN_ANIM_TYPE = 'torch'; // flame | torch
const TOKEN_ATTENUATION = 0.6;

const NONE = 'none';

const CANDLE = [1, 2];
const TORCH = [4, 8];
const LAMP = [2, 4];
const LANTERN = [4, 8];
const BRAZIER = [5, 10];
const CAMP_FIRE = [6, 12];

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
                token?.document.update({
                    light: {dim: 0, bright: 0, color: '#000000', alpha: 1, attenuation: 0.5, animation: {type: 'none'}}
                });
                light?.document.update({
                    config: {dim: 0, bright: 0, color: '#000000', alpha: 1, attenuation: 0.5, animation: {type: 'none'}}
                });
                dialogEditor.render(true);
            }
        },
        candle: {
            label: `Candle`,
            callback: () => {
                token?.document.update({
                    light: {
                        alpha: TOKEN_ALPHA,
                        angle: 360,
                        animation: {type: TOKEN_ANIM_TYPE, speed: 15, intensity: 3},
                        attenuation: TOKEN_ATTENUATION,
                        bright: 5 * CANDLE[0],
                        color: FIRE_COLOR,
                        dim: 5 * CANDLE[1]
                    }
                });
                light?.document.update({
                    config: {
                        alpha: LIGHT_ALPHA,
                        angle: 360,
                        animation: {type: LIGHT_ANIM_TYPE, speed: 15, intensity: 3},
                        attenuation: LIGHT_ATTENUATION,
                        bright: 5 * CANDLE[0],
                        color: FIRE_COLOR,
                        dim: 5 * CANDLE[1]
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
                        alpha: TOKEN_ALPHA,
                        angle: 360,
                        animation: {type: TOKEN_ANIM_TYPE, speed: 4, intensity: 4},
                        attenuation: TOKEN_ATTENUATION,
                        bright: 5 * TORCH[0],
                        color: FIRE_COLOR,
                        dim: 5 * TORCH[1]
                    }
                });
                light?.document.update({
                    config: {
                        alpha: LIGHT_ALPHA,
                        angle: 360,
                        animation: {type: LIGHT_ANIM_TYPE, speed: 4, intensity: 4},
                        attenuation: LIGHT_ATTENUATION,
                        bright: 5 * TORCH[0],
                        color: FIRE_COLOR,
                        dim: 5 * TORCH[1]
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
                        alpha: TOKEN_ALPHA,
                        angle: 360,
                        animation: {type: TOKEN_ANIM_TYPE, speed: 3, intensity: 3},
                        attenuation: TOKEN_ATTENUATION,
                        bright: 5 * LAMP[0],
                        color: LAMP_COLOR,
                        dim: 5 * LAMP[1]
                    }
                });
                light?.document.update({
                    config: {
                        alpha: LIGHT_ALPHA,
                        angle: 360,
                        animation: {type: LIGHT_ANIM_TYPE, speed: 3, intensity: 3},
                        attenuation: LIGHT_ATTENUATION,
                        bright: 5 * LAMP[0],
                        color: LAMP_COLOR,
                        dim: 5 * LAMP[1]
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
                        alpha: TOKEN_ALPHA,
                        angle: 360,
                        animation: {type: TOKEN_ANIM_TYPE, speed: 3, intensity: 3},
                        attenuation: TOKEN_ATTENUATION,
                        bright: 5 * LANTERN[0],
                        color: LAMP_COLOR,
                        dim: 5 * LANTERN[1]
                    }
                });
                light?.document.update({
                    config: {
                        alpha: LIGHT_ALPHA,
                        angle: 360,
                        animation: {type: LIGHT_ANIM_TYPE, speed: 3, intensity: 3},
                        attenuation: LIGHT_ATTENUATION,
                        bright: 5 * LANTERN[0],
                        color: LAMP_COLOR,
                        dim: 5 * LANTERN[1]
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
                        animation: {type: NONE},
                        attenuation: TOKEN_ATTENUATION,
                        bright: 0,
                        color: LAMP_COLOR,
                        dim: 2
                    }
                });
                light?.document.update({
                    config: {
                        alpha: 0.25,
                        angle: 360,
                        animation: {type: NONE},
                        attenuation: LIGHT_ATTENUATION,
                        bright: 0,
                        color: LAMP_COLOR,
                        dim: 2
                    }
                });
                dialogEditor.render(true);
            }
        },
        brazier: {
            label: `Brazier`,
            callback: () => {
                token?.document.update({
                    light: {
                        alpha: TOKEN_ALPHA,
                        angle: 360,
                        animation: {type: TOKEN_ANIM_TYPE, speed: 4, intensity: 3},
                        attenuation: TOKEN_ATTENUATION,
                        bright: 5 * BRAZIER[0],
                        color: FIRE_COLOR,
                        dim: 5 * BRAZIER[1]
                    }
                });
                light?.document.update({
                    config: {
                        alpha: LIGHT_ALPHA,
                        angle: 360,
                        animation: {type: LIGHT_ANIM_TYPE, speed: 4, intensity: 3},
                        attenuation: LIGHT_ATTENUATION,
                        bright: 5 * BRAZIER[0],
                        color: FIRE_COLOR,
                        dim: 5 * BRAZIER[1]
                    }
                });
                dialogEditor.render(true);
            }
        },
        campFire: {
            label: `CampFire`,
            callback: () => {
                token?.document.update({
                    light: {
                        alpha: TOKEN_ALPHA,
                        angle: 360,
                        animation: {type: TOKEN_ANIM_TYPE, speed: 4, intensity: 3},
                        attenuation: TOKEN_ATTENUATION,
                        bright: 5 * CAMP_FIRE[0],
                        color: FIRE_COLOR,
                        dim: 5 * CAMP_FIRE[1]
                    }
                });
                light?.document.update({
                    config: {
                        alpha: LIGHT_ALPHA,
                        angle: 360,
                        animation: {type: LIGHT_ANIM_TYPE, speed: 4, intensity: 3},
                        attenuation: LIGHT_ATTENUATION,
                        bright: 5 * CAMP_FIRE[0],
                        color: FIRE_COLOR,
                        dim: 5 * CAMP_FIRE[1]
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
