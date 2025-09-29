// @ts-check
import {Condition} from '../../module/hm3-types';
import {BaseTestHM3} from '../hm3-basetest';

export class ConditionTestCase extends BaseTestHM3 {
    CENTER = {x: 7870, y: 14258};

    /** @override */
    async _test() {
        let success = true;

        const t = await this._dropActor(this.actors.get('Alice'), this.CENTER);

        const d = await t.addCondition(Condition.DISTRACTED);
        console.info('Adding condition: %s to token: %s', Condition.DISTRACTED, t.name);
        console.assert(d && d instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', d);
        const b = await t.addCondition(Condition.BERSERK);
        console.assert(b && b instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', b);
        console.info('Adding condition: %s to token: %s', Condition.BERSERK, t.name);
        const u = await t.addCondition(Condition.UNCONSCIOUS);
        console.info('Adding condition: %s to token: %s', Condition.UNCONSCIOUS, t.name);
        console.assert(u && u instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', u);
        console.assert(t.hasCondition(Condition.PRONE), 'Combatant is NOT prone: %O', t);
        const s = await t.addCondition(Condition.SECONDARY_HAND);
        console.info('Adding condition: %s to token: %s', Condition.SECONDARY_HAND, t.name);
        console.assert(s && s instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', s);

        await t.deleteCondition(Condition.PRONE);

        return success;
    }
}
