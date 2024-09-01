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
const PRONE_IMG = 'systems/hm3/images/icons/svg/falling.svg';
const SHOCK_IMG = 'systems/hm3/images/icons/svg/shock.svg';
const STUMBLE_IMG = 'icons/svg/falling.svg';

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

const PRONE_CREATE_MACRO = `await ChatMessage.create({
  speaker,
  content: "<p>You're lying on the floor. Getting up takes <b>one action</b>.</p><p><b>All</b> opponents gain +20 on <b>all</b> attack and defence rolls against you.</p>",
});`;

const PRONE_TURN_START_MACRO = `const PRONE = 'Prone';
const PRONE_IMG = 'icons/svg/falling.svg';
await Requestor.request({
  title: PRONE,
  description:
    "<p>You're still lying on the floor. Getting up takes <b>one action</b>.</p><p>If you remain on the ground, <b>all</b> opponents gain +20 on <b>all</b> attack and defence rolls against you.</p>",
  img: PRONE_IMG,
  limit: Requestor.LIMIT.OPTION,
  buttonData: [
    {
      label: 'Rise',
      command: async function () {
        const effect = actor.effects.contents.find((v) => v.name === PRONE);
        if (effect) {
          effect.delete();
          await ChatMessage.create({
            speaker,
            content: 'You got up successfully.',
          });
        }
      },
      scope: { PRONE: PRONE, speaker: speaker },
    },
    {
      label: 'Ignore',
      command: async function () {
        await ChatMessage.create({
          speaker,
          content: 'Ok, you remain lying on the floor.',
        });
      },
      scope: { speaker: speaker },
    },
  ],
});`;

let dialogEditor = new Dialog({
    title: 'Prone',
    buttons: {
        none: {
            label: `None`,
            callback: () => {
                const effect = getEffectByName(PRONE, A);
                if (effect) effect.delete();
                dialogEditor.render(true);
            }
        },

        prone: {
            label: PRONE,
            callback: () => {
                const effect = getEffectByName(PRONE, A);
                if (!effect) {
                    const activeEffectData = {
                        label: PRONE,
                        icon: PRONE_IMG,
                        duration: {
                            startTurn: game.combat.system.turn,
                            startRound: game.combat.system.round,
                            rounds: 99
                        },
                        flags: {effectmacro: {onCreate: {script: PRONE_CREATE_MACRO}, onTurnStart: {script: PRONE_EACH_TURN_MACRO}}},
                        changes: []
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
