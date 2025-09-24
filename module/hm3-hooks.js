// @ts-check

import {TokenDocumentHM3} from './hm3-token';
import {Condition, ItemType} from './hm3-types';

export function initHM3Hooks() {
    Hooks.on('hm3.onMount', async (actor, steed) => {
        if (!actor.testUserPermission(game.user, 'OWNER') || !steed.testUserPermission(game.user, 'OWNER')) return;

        await actor.update({'system.mounted': true});
        actor.prepareData();
        const riding = actor.items.find((item) => item.type === ItemType.SKILL && item.name.includes('Riding'));
        riding.sheet.render();

        const rider = steed.items.find((item) => item.type === ItemType.MISCGEAR && item.name.includes('Rider'));
        await rider?.delete();
        await Item.create(
            {
                img: actor.img,
                name: 'Rider/' + actor.name,
                system: {
                    actorUuid: actor.uuid,
                    type: 'Rider',
                    weight: actor.proxy.weight + actor.proxy.totalGearWeight
                },
                type: ItemType.MISCGEAR
            },
            {parent: steed}
        );
    });

    Hooks.on('hm3.onUnmount', async (actor, steed) => {
        if (!actor.testUserPermission(game.user, 'OWNER') || !steed.testUserPermission(game.user, 'OWNER')) return;

        await actor.update({'system.mounted': false});
        actor.prepareData();
        const riding = actor.items.find((item) => item.type === ItemType.SKILL && item.name.includes('Riding'));
        riding.sheet.render();

        const rider = steed.items.find((item) => item.type === ItemType.MISCGEAR && item.name.includes('Rider'));
        await rider?.delete();
    });

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
