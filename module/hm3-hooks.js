// @ts-check

import {ActorHM3} from './actor/actor';
import {TokenDocumentHM3} from './hm3-token';
import {Condition, ItemType} from './hm3-types';

/**
 *
 */
export async function registerHM3Hooks() {
    Hooks.on(
        'hm3.onMount',
        /**
         *
         * @param {ActorHM3} actor
         * @param {ActorHM3} steed
         * @returns
         */
        async (actor, steed) => {
            if (
                !game.user ||
                !actor.testUserPermission(game.user, 'OWNER') ||
                !steed.testUserPermission(game.user, 'OWNER')
            )
                return;

            await actor.update({'system.mounted': true});
            const riding = actor.system.Skill('Riding');
            riding.sheet?.render();

            const rider = steed.items.find((item) => item.type === ItemType.MISCGEAR && item.name.includes('Rider'));
            await rider?.delete();
            await Item.create(
                {
                    img: actor.img,
                    name: 'Rider/' + actor.name,
                    system: {
                        actorUuid: actor.uuid,
                        type: 'Rider',
                        weight: actor.system.weight + actor.system.totalGearWeight
                    },
                    type: ItemType.MISCGEAR
                },
                {parent: steed}
            );
        }
    );

    Hooks.on(
        'hm3.onDismount',

        /**
         *
         * @param {ActorHM3} actor
         * @param {ActorHM3} steed
         * @returns
         */
        async (actor, steed) => {
            if (
                !game.user ||
                !actor.testUserPermission(game.user, 'OWNER') ||
                !steed.testUserPermission(game.user, 'OWNER')
            )
                return;

            await actor.update({'system.mounted': false});
            const riding = actor.system.Skill('Riding');
            riding.sheet?.render();

            const rider = steed.items.find((item) => item.type === ItemType.MISCGEAR && item.name.includes('Rider'));
            await rider?.delete();
        }
    );

    Hooks.on('hm3.onShockIndexReduced', async (actor, old, current) => {
        if (game.combat?.started && actor.parent instanceof TokenDocumentHM3 && !actor.parent.player) {
            if (actor.parent.hasCondition(Condition.UNCONSCIOUS) && actor.testUserPermission(game.user, 'OWNER')) {
                await actor.parent.deleteCondition(Condition.UNCONSCIOUS);
                await actor.parent.addCondition(Condition.UNCONSCIOUS);
                Hooks.call('hm3.onShockIndexReduced2', actor, old, current);
            }
        }
    });
}

/**
 *
 */
export async function registerHM3GMHooks() {
    if (!game.user?.isGM) return;
}
