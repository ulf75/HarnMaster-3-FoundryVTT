const CENTER = {x: 7870, y: 14258};

export class TestCase extends game.hm3.BaseTest {
    async _test() {
        const alice = await this._dropActor(this.actors.get('Alice'), CENTER);
        const bob = await this._dropActor(this.actors.get('Bob'), CENTER, this.SOUTH);

        await this._startCombat();

        game.user.updateTokenTargets([alice.id]);

        await game.hm3.macros.weaponAttack('Broadsword', true);
        // await this._wait();
        const defButtonsGm = await this._defButtonsFromChatMsg(this.GM_USER_ID);
        const defButtonsAlice = await this._defButtonsFromChatMsg(this.ALICE_USER_ID);
        const defButtonsInen = await this._defButtonsFromChatMsg(this.INEN_USER_ID);
        console.assert(defButtonsGm.size === 4, 'Expected 4 defend buttons, found: %O', defButtonsGm);
        console.assert(defButtonsAlice.size === 4, 'Expected 4 defend buttons, found: %O', defButtonsAlice);
        console.assert(defButtonsInen.size === 0, 'Expected 0 defend buttons, found: %O', defButtonsInen);

        // const res = await this._defResult('Dodge', defButtonsGm, [99, 1]);

        await this._wait();
    }
}
