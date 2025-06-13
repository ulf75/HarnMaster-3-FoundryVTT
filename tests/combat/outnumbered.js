const CENTER = {x: 7870, y: 14258};

export class TestCase extends game.hm3.BaseTest {
    async _postSetup() {
        await this._createActor('Actor.XCCoFJojZ90dmPkL', 'Alon');
    }

    async _test() {
        const Condition = game.hm3.Condition;
        const alice = await this._dropActor(this.actors.get('Alice'), CENTER);
        const alon = await this._dropActor(this.actors.get('Alon'), CENTER, this.NORTH);
        const bob = await this._dropActor(this.actors.get('Bob'), CENTER, this.SOUTH);

        await this._startCombat();

        console.assert(alice.hasCondition(Condition.OUTNUMBERED + ' 2:1'), `HM3 ASSERT | Combatant ${alice.name} is NOT outnumbered.`, alice);
        console.assert(!alon.hasCondition(Condition.OUTNUMBERED), `HM3 ASSERT | Combatant ${alon.name} IS outnumbered.`, alon);
        console.assert(!bob.hasCondition(Condition.OUTNUMBERED), `HM3 ASSERT | Combatant ${bob.name} IS outnumbered.`, bob);

        await alon.addCondition(Condition.PRONE);

        console.assert(!alice.hasCondition(Condition.OUTNUMBERED), `HM3 ASSERT | Combatant ${alice.name} IS outnumbered.`, alice);
        console.assert(!alon.hasCondition(Condition.OUTNUMBERED), `HM3 ASSERT | Combatant ${alon.name} IS outnumbered.`, alon);
        console.assert(!bob.hasCondition(Condition.OUTNUMBERED), `HM3 ASSERT | Combatant ${bob.name} IS outnumbered.`, bob);
    }
}
