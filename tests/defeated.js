const CENTER = {x: 7870, y: 14258};

export class TestCase extends game.hm3.BaseTest {
    async _postSetup() {
        await this._createActor('Actor.XCCoFJojZ90dmPkL', 'Alon');
    }

    async _test() {
        const alice = await this._dropActor(this.actors.get('Alice'), CENTER);
        const alon = await this._dropActor(this.actors.get('Alon'), CENTER, this.NORTH);
        const bob = await this._dropActor(this.actors.get('Bob'), CENTER, this.SOUTH);

        await this._startCombat();
        await alice.actor.update({'system.fatigue': 4});
        await alice.addCondition(game.hm3.Condition.UNCONSCIOUS);
        await alon.addCondition(game.hm3.Condition.SHOCKED);
        await this._wait();

        console.assert(
            alice.actor.system.shockIndex.value < game.hm3.CONST.COMBAT.SHOCK_INDEX_THRESHOLD && alice.combatant.isDefeated,
            `HM3 ASSERT | Combatant ${alice.name} is NOT defeated (Shock Index: ${alice.actor.system.shockIndex.value}).`,
            alice.combatant
        );
        console.assert(alon.combatant.isDefeated, `HM3 ASSERT | Combatant ${alon.name} is NOT defeated.`, alon.combatant);
        console.assert(bob.combatant.isDefeated, `HM3 ASSERT | Combatant ${bob.name} is NOT defeated.`, bob.combatant);
    }
}
