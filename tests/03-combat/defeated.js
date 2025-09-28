// @ts-check
import {Condition} from '../../module/hm3-types';
import {BaseTestHM3} from '../hm3-basetest';

const CENTER = {x: 7870, y: 14258};

export class DefeatedTestCase extends BaseTestHM3 {
    /** @override */
    async _postSetup() {
        await this._createActor('Actor.XCCoFJojZ90dmPkL', 'Alon');
    }

    /** @override */
    async _test() {
        let success = true;
        const alice = await this._dropActor(this.actors.get('Alice'), CENTER);
        const alon = await this._dropActor(this.actors.get('Alon'), CENTER, this.NORTH);
        const bob = await this._dropActor(this.actors.get('Bob'), CENTER, this.SOUTH);

        await this._startCombat();

        await alice.actor.update({'system.fatigue': 3});
        await alice.addCondition(Condition.UNCONSCIOUS);

        // not yet defeated
        console.assert(
            alice.actor.proxy.shockIndex.value >= hm3.CONST.COMBAT.SHOCK_INDEX_THRESHOLD && !alice.combatant.isDefeated,
            `HM3 ASSERT | Combatant ${alice.name} IS defeated (Shock Index: ${alice.actor.proxy.shockIndex.value}).`,
            alice.combatant
        );

        await this._resetAllConditions(alice);

        await alice.actor.update({'system.fatigue': 5});
        await alice.addCondition(Condition.UNCONSCIOUS);
        await alon.addCondition(Condition.SHOCKED);
        await bob.addCondition(Condition.DYING);

        console.assert(
            alice.actor.proxy.shockIndex.value < hm3.CONST.COMBAT.SHOCK_INDEX_THRESHOLD && !alice.combatant.isDefeated,
            `HM3 ASSERT | Combatant ${alice.name} IS defeated (Shock Index: ${alice.actor.proxy.shockIndex.value}).`,
            alice.combatant
        );
        console.assert(
            alon.combatant.isDefeated,
            `HM3 ASSERT | Combatant ${alon.name} is NOT defeated.`,
            alon.combatant
        );
        console.assert(bob.combatant.isDefeated, `HM3 ASSERT | Combatant ${bob.name} is NOT defeated.`, bob.combatant);

        await this._resetAllConditions(bob);

        await bob.actor.update({'system.fatigue': 6});
        await bob.addCondition(Condition.UNCONSCIOUS);

        console.assert(
            bob.actor.proxy.shockIndex.value < hm3.CONST.COMBAT.SHOCK_INDEX_THRESHOLD && bob.combatant.isDefeated,
            `HM3 ASSERT | Combatant ${bob.name} is NOT defeated (Shock Index: ${bob.actor.proxy.shockIndex.value}).`,
            bob.combatant
        );

        await this._resetAllConditions(bob);

        await bob.actor.update({'system.fatigue': 3});
        await bob.addCondition(Condition.UNCONSCIOUS);
        await bob.actor.update({'system.fatigue': 6});

        // wait for all hooks settled
        await new Promise((resolve) => {
            // @ts-expect-error
            Hooks.once('hm3.onShockIndexReduced2', () => resolve(true));
            setTimeout(() => resolve(false), 2000);
        });

        console.assert(
            bob.actor.proxy.shockIndex.value < hm3.CONST.COMBAT.SHOCK_INDEX_THRESHOLD && bob.combatant.isDefeated,
            `HM3 ASSERT | Combatant ${bob.name} is NOT defeated (Shock Index: ${bob.actor.proxy.shockIndex.value}).`,
            bob.combatant
        );

        return success;
    }
}
