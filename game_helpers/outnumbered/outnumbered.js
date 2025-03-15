const OUTNUMBERED21 = 'Outnumbered 2:1';
const OUTNUMBERED31 = 'Outnumbered 3:1';
const OUTNUMBERED41 = 'Outnumbered 4:1';
const OUTNUMBERED51 = 'Outnumbered 5:1';
const OUTNUMBERED61 = 'Outnumbered 6:1';
const OUTNUMBERED_IMG = 'systems/hm3/images/icons/svg/backup.svg';
const INDEFINITE = Number.MAX_SAFE_INTEGER;

function getEffectByName(name, actor) {
    if (!!actor) {
        return actor.effects.contents.find((v) => v.name === name);
    }
}

async function createEffectAsync(effectData, actor) {
    if (!!effectData && !!actor) {
        return ActiveEffect.create(effectData, {parent: actor});
    }
}

async function deleteEffectAsync(effect) {
    if (!!effect) {
        return effect.delete();
    }
}

async function deleteOutnumberedEffectsAsync(actor) {
    if (!!actor) {
        const outnEffects = actor.effects.contents.filter((v) => v.name.startsWith('Outnumbered'));
        await Promise.all(
            outnEffects.map(async (effect) => {
                await deleteEffectAsync(effect);
            })
        );
    }
}

async function createOutnumberedEffectAsync(effectData, actor) {
    if (!!effectData && !!actor) {
        await deleteOutnumberedEffectsAsync(actor);
        await createEffectAsync(effectData, actor);
    }
}

if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error('Please select ONE token!');
    return null;
}

const token = canvas.tokens.controlled[0];
const actor = token.actor;

let dialogEditor = new Dialog({
    title: 'Outnumbered',
    buttons: {
        none: {
            label: `None`,
            callback: () => {
                deleteOutnumberedEffectsAsync(actor);
                dialogEditor.render(true);
            }
        },

        out21: {
            label: OUTNUMBERED21,
            callback: () => {
                createOutnumberedEffectAsync(
                    {
                        label: OUTNUMBERED21,
                        icon: OUTNUMBERED_IMG,
                        duration: {
                            startTurn: game.combat.system.turn,
                            startRound: game.combat.system.round,
                            rounds: 99
                        },
                        flags: {
                            effectmacro: {
                                onTurnStart: {
                                    script: `
                                    const token = canvas.tokens.get('${token.id}');
                                    const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
                                    if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> is <b>Outnumbered 2:1</b>, and gets -10 on <b>All</b> defense rolls including counterattack.", "Combat 11");
                                    `
                                }
                            }
                        },
                        changes: [{key: 'system.eph.outnumbered', mode: 2, priority: null, value: '2'}]
                    },
                    actor
                );
                dialogEditor.render(true);
            }
        },

        out31: {
            label: OUTNUMBERED31,
            callback: () => {
                createOutnumberedEffectAsync(
                    {
                        label: OUTNUMBERED31,
                        icon: OUTNUMBERED_IMG,
                        duration: {
                            startTurn: game.combat.system.turn,
                            startRound: game.combat.system.round,
                            rounds: 99
                        },
                        flags: {
                            effectmacro: {
                                onTurnStart: {
                                    script: `
                                    const token = canvas.tokens.get('${token.id}');
                                    const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
                                    if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> is <b>Outnumbered 3:1</b>, and gets -20 on <b>All</b> defense rolls including counterattack.", "Combat 11");
                                    `
                                }
                            }
                        },
                        changes: [{key: 'system.eph.outnumbered', mode: 2, priority: null, value: '3'}]
                    },
                    actor
                );
                dialogEditor.render(true);
            }
        },

        out41: {
            label: OUTNUMBERED41,
            callback: () => {
                createOutnumberedEffectAsync(
                    {
                        label: OUTNUMBERED41,
                        icon: OUTNUMBERED_IMG,
                        duration: {
                            startTurn: game.combat.system.turn,
                            startRound: game.combat.system.round,
                            rounds: 99
                        },
                        flags: {
                            effectmacro: {
                                onTurnStart: {
                                    script: `
                                    const token = canvas.tokens.get('${token.id}');
                                    const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
                                    if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> is <b>Outnumbered 4:1</b>, and gets -30 on <b>All</b> defense rolls including counterattack.", "Combat 11");
                                    `
                                }
                            }
                        },
                        changes: [{key: 'system.eph.outnumbered', mode: 2, priority: null, value: '4'}]
                    },
                    actor
                );
                dialogEditor.render(true);
            }
        },

        out51: {
            label: OUTNUMBERED51,
            callback: () => {
                createOutnumberedEffectAsync(
                    {
                        label: OUTNUMBERED51,
                        icon: OUTNUMBERED_IMG,
                        duration: {
                            startTurn: game.combat.system.turn,
                            startRound: game.combat.system.round,
                            rounds: 99
                        },
                        flags: {
                            effectmacro: {
                                onTurnStart: {
                                    script: `
                                    const token = canvas.tokens.get('${token.id}');
                                    const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
                                    if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> is <b>Outnumbered 5:1</b>, and gets -40 on <b>All</b> defense rolls including counterattack.", "Combat 11");
                                    `
                                }
                            }
                        },
                        changes: [{key: 'system.eph.outnumbered', mode: 2, priority: null, value: '5'}]
                    },
                    actor
                );
                dialogEditor.render(true);
            }
        },

        out61: {
            label: OUTNUMBERED61,
            callback: () => {
                createOutnumberedEffectAsync(
                    {
                        label: OUTNUMBERED61,
                        icon: OUTNUMBERED_IMG,
                        duration: {
                            startTurn: game.combat.system.turn,
                            startRound: game.combat.system.round,
                            rounds: 99
                        },
                        flags: {
                            effectmacro: {
                                onTurnStart: {
                                    script: `
                                    const token = canvas.tokens.get('${token.id}');
                                    const unconscious = token.hasCondition(game.hm3.enums.Condition.UNCONSCIOUS);
                                    if (!unconscious) await game.hm3.GmSays("<b>" + token.name + "</b> is <b>Outnumbered 6:1</b>, and gets -50 on <b>All</b> defense rolls including counterattack.", "Combat 11");
                                    `
                                }
                            }
                        },
                        changes: [{key: 'system.eph.outnumbered', mode: 2, priority: null, value: '6'}]
                    },
                    actor
                );
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
