let dialogEditor = new Dialog(
    {
        title: `VisionPicker`,
        buttons: {
            none: {
                label: `Dark`,
                callback: () => {
                    canvas.tokens.controlled.forEach((token) => {
                        token.document.update({sight: {enabled: true, visionMode: 'basic', range: 1}});
                    });
                    dialogEditor.render(true);
                }
            },
            vision5: {
                label: `V 5`,
                callback: () => {
                    canvas.tokens.controlled.forEach((token) => {
                        token.document.update({sight: {enabled: true, visionMode: 'basic', range: 5}});
                    });
                    dialogEditor.render(true);
                }
            },
            vision10: {
                label: `V 10`,
                callback: () => {
                    canvas.tokens.controlled.forEach((token) => {
                        token.document.update({sight: {enabled: true, visionMode: 'basic', range: 10}});
                    });
                    dialogEditor.render(true);
                }
            },
            vision20: {
                label: `V 20`,
                callback: () => {
                    canvas.tokens.controlled.forEach((token) => {
                        token.document.update({sight: {enabled: true, visionMode: 'basic', range: 20}});
                    });
                    dialogEditor.render(true);
                }
            },
            vision30: {
                label: `V 30`,
                callback: () => {
                    canvas.tokens.controlled.forEach((token) => {
                        token.document.update({sight: {enabled: true, visionMode: 'basic', range: 30}});
                    });
                    dialogEditor.render(true);
                }
            },
            vision50: {
                label: `V 50`,
                callback: () => {
                    canvas.tokens.controlled.forEach((token) => {
                        token.document.update({sight: {enabled: true, visionMode: 'basic', range: 50}});
                    });
                    dialogEditor.render(true);
                }
            },
            vision100: {
                label: `V 100`,
                callback: () => {
                    canvas.tokens.controlled.forEach((token) => {
                        token.document.update({sight: {enabled: true, visionMode: 'basic', range: 100}});
                    });
                    dialogEditor.render(true);
                }
            },
            vision200: {
                label: `V 200`,
                callback: () => {
                    canvas.tokens.controlled.forEach((token) => {
                        token.document.update({sight: {enabled: true, visionMode: 'basic', range: 200}});
                    });
                    dialogEditor.render(true);
                }
            },
            vision500: {
                label: `V 500`,
                callback: () => {
                    canvas.tokens.controlled.forEach((token) => {
                        token.document.update({sight: {enabled: true, visionMode: 'basic', range: 500}});
                    });
                    dialogEditor.render(true);
                }
            },
            vision1000: {
                label: `V 1000`,
                callback: () => {
                    canvas.tokens.controlled.forEach((token) => {
                        token.document.update({sight: {enabled: true, visionMode: 'basic', range: 1000}});
                    });
                    dialogEditor.render(true);
                }
            },
            dull10: {
                label: `Dull 10`,
                callback: () => {
                    canvas.tokens.controlled.forEach((token) => {
                        token.document.update({
                            light: {
                                alpha: 1,
                                angle: 360,
                                animation: {type: 'none'},
                                attenuation: 0.5,
                                bright: 0,
                                color: '#000000',
                                dim: 10
                            },
                            sight: {enabled: true, visionMode: 'basic', range: 0}
                        });
                    });
                    dialogEditor.render(true);
                }
            },
            dull20: {
                label: `Dull 20`,
                callback: () => {
                    canvas.tokens.controlled.forEach((token) => {
                        token.document.update({
                            light: {
                                alpha: 1,
                                angle: 360,
                                animation: {type: 'none'},
                                attenuation: 0.5,
                                bright: 0,
                                color: '#000000',
                                dim: 20
                            },
                            sight: {enabled: true, visionMode: 'basic', range: 0}
                        });
                    });
                    dialogEditor.render(true);
                }
            },
            dull30: {
                label: `Dull 30`,
                callback: () => {
                    canvas.tokens.controlled.forEach((token) => {
                        token.document.update({
                            light: {
                                alpha: 1,
                                angle: 360,
                                animation: {type: 'none'},
                                attenuation: 0.5,
                                bright: 0,
                                color: '#000000',
                                dim: 30
                            },
                            sight: {enabled: true, visionMode: 'basic', range: 0}
                        });
                    });
                    dialogEditor.render(true);
                }
            },
            dull40: {
                label: `Dull 40`,
                callback: () => {
                    canvas.tokens.controlled.forEach((token) => {
                        token.document.update({
                            light: {
                                alpha: 1,
                                angle: 360,
                                animation: {type: 'none'},
                                attenuation: 0.5,
                                bright: 0,
                                color: '#000000',
                                dim: 40
                            },
                            sight: {enabled: true, visionMode: 'basic', range: 0}
                        });
                    });
                    dialogEditor.render(true);
                }
            },
            blind: {
                label: `Blinded`,
                callback: () => {
                    canvas.tokens.controlled.forEach((token) => {
                        token.document.update({sight: {enabled: false, visionMode: 'basic', range: 0}});
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
    },
    {width: 470}
);
dialogEditor.render(true);
