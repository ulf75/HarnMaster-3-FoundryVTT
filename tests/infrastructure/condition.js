import {BaseTestHM3} from '../hm3-basetest';

export class ConditionTestCase extends BaseTestHM3 {
    CENTER = {x: 7870, y: 14258};

    async _test() {
        const t = await this._dropActor(this.actors.get('Alice'), this.CENTER);

        const d = await t.addCondition(game.hm3.Condition.DISTRACTED);
        console.info('Adding condition: %s to token: %s', game.hm3.Condition.DISTRACTED, t.name);
        console.assert(d && d instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', d);
        const b = await t.addCondition(game.hm3.Condition.BERSERK);
        console.assert(b && b instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', b);
        console.info('Adding condition: %s to token: %s', game.hm3.Condition.BERSERK, t.name);
        const u = await t.addCondition(game.hm3.Condition.UNCONSCIOUS);
        console.info('Adding condition: %s to token: %s', game.hm3.Condition.UNCONSCIOUS, t.name);
        console.assert(u && u instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', u);
        console.assert(t.hasCondition(game.hm3.Condition.PRONE), 'Combatant is NOT prone: %O', t);
        const s = await t.addCondition(game.hm3.Condition.SECONDARY_HAND);
        console.info('Adding condition: %s to token: %s', game.hm3.Condition.SECONDARY_HAND, t.name);
        console.assert(s && s instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', s);

        await t.deleteCondition(game.hm3.Condition.PRONE);
    }
}
