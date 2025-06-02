const CENTER = {x: 7870, y: 14258};

export class TestCase extends game.hm3.BaseTest {
    async _test() {
        const alice = await this._dropActor(this.actors.get('Alice'), CENTER);
        const bob = await this._dropActor(this.actors.get('Bob'), CENTER, this.SOUTH);

        await this._startCombat();

        game.user.updateTokenTargets([alice.id]);

        await game.hm3.macros.weaponAttack('Broadsword', true);
        const defButtons = this._defButtonsFromChatMsg();
        console.assert(defButtons.size === 4, 'Expected 4 attack button, found: %O', defButtons);

        const res = await this._defResult('Dodge', defButtons, [99, 1]);

        await this._wait(1000);
    }
}
