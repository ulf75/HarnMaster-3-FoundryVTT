export class TestCase extends game.hm3.BaseTest {
    CENTER = {x: 7870, y: 14258};
    async _postSetup() {
        await this._createActor('Actor.XCCoFJojZ90dmPkL', 'Alon');
        await this._createActor('Actor.qwQu4gHnNxZCSwkp', 'Halsey');
    }

    async _test() {
        const t1 = await this._dropActor(this.actors.get('Alon'), this.CENTER);
        const t2 = await this._dropActor(this.actors.get('Alice'), this.CENTER, this.SOUTH_EAST);
        const t3 = await this._dropActor(this.actors.get('Bob'), this.CENTER, this.NORTH_WEST);
        const t4 = await this._dropActor(this.actors.get('Halsey'), this.CENTER, this.SOUTH);

        await this._startCombat();

        await t4.addCondition(game.hm3.Condition.DISTRACTED);
        await t3.addCondition(game.hm3.Condition.SHOCKED);

        // await this._wait(3000);

        console.assert(t3.combatant.isDefeated, 'Combatant is NOT defeated: %O', t3.combatant);
    }
}
