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

        await alice.actor.update({'system.fatigue': 3});
        await alice.addCondition(game.hm3.Condition.UNCONSCIOUS);

        // not yet defeated
        console.assert(
            alice.actor.system.shockIndex.value >= game.hm3.CONST.COMBAT.SHOCK_INDEX_THRESHOLD && !alice.combatant.isDefeated,
            `HM3 ASSERT | Combatant ${alice.name} IS defeated (Shock Index: ${alice.actor.system.shockIndex.value}).`,
            alice.combatant
        );

        await this._resetAllConditions(alice);

        await alice.actor.update({'system.fatigue': 5});
        await alice.addCondition(game.hm3.Condition.UNCONSCIOUS);
        await alon.addCondition(game.hm3.Condition.SHOCKED);
        await bob.addCondition(game.hm3.Condition.DYING);

        console.assert(
            alice.actor.system.shockIndex.value < game.hm3.CONST.COMBAT.SHOCK_INDEX_THRESHOLD && !alice.combatant.isDefeated,
            `HM3 ASSERT | Combatant ${alice.name} IS defeated (Shock Index: ${alice.actor.system.shockIndex.value}).`,
            alice.combatant
        );
        console.assert(alon.combatant.isDefeated, `HM3 ASSERT | Combatant ${alon.name} is NOT defeated.`, alon.combatant);
        console.assert(bob.combatant.isDefeated, `HM3 ASSERT | Combatant ${bob.name} is NOT defeated.`, bob.combatant);

        await this._resetAllConditions(bob);

        await bob.actor.update({'system.fatigue': 6});
        await bob.addCondition(game.hm3.Condition.UNCONSCIOUS);

        console.assert(
            bob.actor.system.shockIndex.value < game.hm3.CONST.COMBAT.SHOCK_INDEX_THRESHOLD && bob.combatant.isDefeated,
            `HM3 ASSERT | Combatant ${bob.name} is NOT defeated (Shock Index: ${bob.actor.system.shockIndex.value}).`,
            bob.combatant
        );

        await this._resetAllConditions(bob);

        await bob.actor.update({'system.fatigue': 3});
        await bob.addCondition(game.hm3.Condition.UNCONSCIOUS);
        await bob.actor.update({'system.fatigue': 6});

        // wait for all hooks settled
        await new Promise((resolve) => Hooks.once('hm3.onShockIndexReduced2', () => resolve()));

        console.assert(
            bob.actor.system.shockIndex.value < game.hm3.CONST.COMBAT.SHOCK_INDEX_THRESHOLD && bob.combatant.isDefeated,
            `HM3 ASSERT | Combatant ${bob.name} is NOT defeated (Shock Index: ${bob.actor.system.shockIndex.value}).`,
            bob.combatant
        );
    }
}
