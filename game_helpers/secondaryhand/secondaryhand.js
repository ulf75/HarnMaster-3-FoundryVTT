const CLOSE = 'Close Mode';
const FUMBLE = 'Fumble';
const OUTNUMBERED21 = 'Outnumbered 2:1';
const OUTNUMBERED31 = 'Outnumbered 3:1';
const OUTNUMBERED41 = 'Outnumbered 4:1';
const OUTNUMBERED51 = 'Outnumbered 5:1';
const PRONE = 'Prone';
const SECONDARY = 'Secondary Hand';
const SHOCK = 'Shock';
const STUMBLE = 'Stumble';

const CLOSE_IMG = 'systems/hm3/images/icons/svg/spiked-wall.svg';
const FUMBLE_IMG = 'modules/hm3-automation/icons/drop-weapon.svg';
const OUTNUMBERED_IMG = 'systems/hm3/images/icons/svg/backup.svg';
const PRONE_IMG = 'icons/svg/falling.svg';
const SECONDARY_IMG = 'systems/hm3/images/icons/svg/arm-sling.svg';
const SHOCK_IMG = 'systems/hm3/images/icons/svg/shock.svg';
const STUMBLE_IMG = 'systems/hm3/images/icons/svg/falling.svg';

async function toChat(speaker, content) {
    await ChatMessage.create({
        speaker,
        content
    });
}

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
        const outnEffects = A.effects.contents.filter((v) => v.name.startsWith('Outnumbered'));
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

const T = canvas.tokens.controlled[0];
const A = T.actor;

let dialogEditor = new Dialog({
    title: SECONDARY,
    buttons: {
        none: {
            label: `None`,
            callback: () => {
                const effect = getEffectByName(SECONDARY, A);
                if (effect) effect.delete();
                dialogEditor.render(true);
            }
        },

        secondary: {
            label: SECONDARY,
            callback: () => {
                const effect = getEffectByName(SECONDARY, A);
                console.log(effect?.toJSON());
                if (!effect) {
                    const activeEffectData = {
                        label: SECONDARY,
                        icon: SECONDARY_IMG,
                        duration: {
                            startTurn: game.combat.system.turn,
                            startRound: game.combat.system.round,
                            rounds: 99
                        },
                        flags: {
                            effectmacro: {
                                onEachTurn: {
                                    script: `await ChatMessage.create({
  speaker,
  content: "<p>You're fighting with your secondary hand. You get -10 on all attack rolls.</p>",
});`
                                }
                            }
                        },
                        changes: [
                            {key: 'system.eph.meleeAMLMod', mode: 2, priority: null, value: '-10'}
                            // { key: 'system.eph.meleeDMLMod', mode: 2, priority: null, value: '-10' },
                        ]
                    };
                    ActiveEffect.create(activeEffectData, {parent: A});
                }
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
