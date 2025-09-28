// @ts-check
import {Condition} from '../../module/hm3-types';
import {BaseTestHM3} from '../hm3-basetest';

export class ShockTestCase extends BaseTestHM3 {
    CENTER = {x: 7870, y: 14258};

    /** @override */
    async _postSetup() {
        await this._createActor('Actor.XCCoFJojZ90dmPkL', 'Alon');
        await this._createActor('Actor.qwQu4gHnNxZCSwkp', 'Halsey');
    }

    /** @override */
    async _test() {
        let success = true;
        const t1 = await this._dropActor(this.actors.get('Alon'), this.CENTER);
        const t2 = await this._dropActor(this.actors.get('Alice'), this.CENTER, this.SOUTH_EAST);
        const t3 = await this._dropActor(this.actors.get('Bob'), this.CENTER, this.NORTH_WEST);
        const t4 = await this._dropActor(this.actors.get('Halsey'), this.CENTER, this.SOUTH);

        await this._startCombat();

        await t4.addCondition(Condition.DISTRACTED);
        await t3.addCondition(Condition.SHOCKED);

        console.assert(t3.combatant.isDefeated, 'Combatant is NOT defeated: %O', t3.combatant);

        return success;
    }
}
