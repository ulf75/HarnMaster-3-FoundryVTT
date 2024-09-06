const PRONE = 'Prone';
const PRONE_IMG = 'systems/hm3/images/icons/svg/falling.svg';

/**
 *
 * @param {Actor} actor
 * @returns
 */
export async function createProneCondition(actor) {
    if (!actor) return;

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
        const effect = game.actors.get('${actor.id}').effects.contents.find((v) => v.name === PRONE);
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

    return {
        effectData: {
            label: PRONE,
            actor,
            icon: PRONE_IMG,
            type: 'GameTime',
            seconds: null,
            flags: {effectmacro: {onCreate: {script: PRONE_CREATE_MACRO}, onTurnStart: {script: PRONE_TURN_START_MACRO}}}
        },
        changes: [],
        options: {unique: true}
    };
}
