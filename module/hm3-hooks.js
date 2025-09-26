// @ts-check

import {LivingProxy} from './actor/proxies/living-proxy';
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
         * @param {LivingProxy} aproxy
         * @returns
         */
        async (aproxy) => {
            if (
                !game.user ||
                !aproxy.actor.testUserPermission(game.user, 'OWNER') ||
                !aproxy.steed?.actor.testUserPermission(game.user, 'OWNER')
            )
                return;

            await aproxy.actor.update({'system.mounted': true});
            // aproxy.actor.prepareData();
            const riding = aproxy.Skill('Riding');
            riding.item.sheet?.render();

            const rider = aproxy.steed.proxies.find(
                (item) => item.type === ItemType.MISCGEAR && item.name.includes('Rider')
            );
            await rider?.item.delete();
            await Item.create(
                {
                    img: aproxy.img,
                    name: 'Rider/' + aproxy.name,
                    system: {
                        actorUuid: aproxy.uuid,
                        type: 'Rider',
                        weight: aproxy.weight + aproxy.totalGearWeight
                    },
                    type: ItemType.MISCGEAR
                },
                {parent: aproxy.steed.actor}
            );
        }
    );

    Hooks.on(
        'hm3.onDismount',

        /**
         *
         * @param {LivingProxy} aproxy
         * @returns
         */
        async (aproxy) => {
            if (
                !game.user ||
                !aproxy.actor.testUserPermission(game.user, 'OWNER') ||
                !aproxy.steed?.actor.testUserPermission(game.user, 'OWNER')
            )
                return;

            await aproxy.actor.update({'system.mounted': false});
            // aproxy.actor.prepareData();
            const riding = aproxy.Skill('Riding');
            riding.item.sheet?.render();

            const rider = aproxy.steed.proxies.find(
                (item) => item.type === ItemType.MISCGEAR && item.name.includes('Rider')
            );
            await rider?.item.delete();
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
