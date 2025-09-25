// @ts-check

import {TokenHM3} from './hm3-token';
import {Condition} from './hm3-types';

export async function registerDragRulerHook() {
    // @ts-expect-error
    Hooks.once('dragRuler.ready', (SpeedProvider) => {
        class HarnMaster3SpeedProvider extends SpeedProvider {
            get colors() {
                return [
                    {
                        id: 'creep',
                        default: 0x000098, // dark blue
                        name: 'hm3.speed-provider.creep'
                    },
                    {
                        id: 'walk',
                        default: 0x1e88e5, // blue
                        name: 'hm3.speed-provider.walk'
                    },
                    {
                        id: 'jog',
                        default: 0x6aa84f, // green
                        name: 'hm3.speed-provider.jog'
                    },
                    {
                        id: 'run',
                        default: 0xffc107, // yellow
                        name: 'hm3.speed-provider.run'
                    },
                    {
                        id: 'sprint',
                        default: 0xf24d11, // orange
                        // default: 0xd81b60, // red
                        name: 'hm3.speed-provider.sprint'
                    }
                ];
            }

            get defaultUnreachableColor() {
                return 0x000000;
            }

            /**
             * @param {TokenHM3} token - The token to check movement
             * */
            getRanges(token) {
                const move = Math.max(token.actor?.system.move.effective, 1);
                const creep = {range: 5 * Math.max(Math.round(move / 3 + Number.EPSILON), 1), color: 'creep'};
                const walk = {range: 5 * Math.max(Math.round(move / 2 + Number.EPSILON), 2), color: 'walk'};
                const jog = {range: 5 * Math.max(Math.round(move + Number.EPSILON), 4), color: 'jog'};
                const run = {range: 5 * Math.max(Math.round(2 * move + Number.EPSILON), 8), color: 'run'};
                const sprint = {range: 5 * Math.max(Math.round(3 * move + Number.EPSILON), 12), color: 'sprint'};

                // Conditions
                const grappled = token.hasCondition(Condition.GRAPPLED);
                const inanimate = token.hasCondition(Condition.INANIMATE);
                const prone = token.hasCondition(Condition.PRONE);
                const shocked = token.hasCondition(Condition.SHOCKED);
                const stunned = token.hasCondition(Condition.STUNNED);
                const unconscious = token.hasCondition(Condition.UNCONSCIOUS);

                if (inanimate) {
                    return [creep, walk, jog, run, sprint];
                }

                // No movement at all
                if (grappled || stunned || unconscious) {
                    return [{range: -1, color: 'creep'}];
                }

                if (prone || shocked || token.actor?.system.shockIndex.value < 20) {
                    return [creep, walk];
                }

                if (token.hasGreviousLegInjuries()) {
                    return [creep, walk, jog, run];
                }

                return [creep, walk, jog, run, sprint];
            }
        }

        // @ts-expect-error
        dragRuler.registerSystem('hm3', HarnMaster3SpeedProvider);
    });
}
