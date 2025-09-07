import {BaseTestHM3} from '../hm3-basetest';

export class ZonesTestCase extends BaseTestHM3 {
    async _postSetup() {
        await this._createActor('Actor.XCCoFJojZ90dmPkL', 'Alon');
    }

    async _test() {
        const CENTER = {x: 7870, y: 14258};
        const alice = await this._dropActor(this.actors.get('Alice'), CENTER);
        const alon = await this._dropActor(this.actors.get('Alon'), CENTER, this.SOUTH);
        const bob = await this._dropActor(this.actors.get('Bob'), CENTER, this.NORTH);
        await this._move(alon, this.SOUTH);
        await this._move(bob, this.NORTH);

        await this._startCombat();

        // Check initial engagement zones
        console.assert(alice.hasEngagementZone(), 'Token has NO Engagement Zone: %O', alice);
        console.assert(alice.hasReactionZone(), 'Token has NO Reaction Zone: %O', alice);
        console.assert(!alice.isEngaged(), 'Token IS engaged: %O', alice);
        console.assert(!alice.isEngaged(true), 'Token IS exclusively engaged: %O', alice);
        console.assert(bob.hasEngagementZone(), 'Token has NO Engagement Zone: %O', bob);
        console.assert(bob.hasReactionZone(), 'Token has NO Reaction Zone: %O', bob);
        console.assert(!bob.isEngaged(), 'Token IS engaged: %O', bob);
        console.assert(!bob.isEngaged(true), 'Token IS exclusively engaged: %O', bob);

        // Move Bob into Alice's engagement zone
        await this._move(bob, this.SOUTH);
        console.assert(alice.hasEngagementZone(), 'Token has NO Engagement Zone: %O', alice);
        console.assert(!alice.hasReactionZone(), 'Token HAS a Reaction Zone: %O', alice);
        console.assert(alice.isEngaged(), 'Token is NOT engaged: %O', alice);
        console.assert(alice.isEngaged(true), 'Token is NOT exclusively engaged: %O', alice);
        console.assert(bob.hasEngagementZone(), 'Token has NO Engagement Zone: %O', bob);
        console.assert(!bob.hasReactionZone(), 'Token HAS a Reaction Zone: %O', bob);
        console.assert(bob.isEngaged(), 'Token is NOT engaged: %O', bob);
        console.assert(bob.isEngaged(true), 'Token is NOT exclusively engaged: %O', bob);

        // Bob goes prone
        await bob.addCondition(game.hm3.Condition.PRONE);
        console.assert(alice.hasEngagementZone(), 'Token has NO Engagement Zone: %O', alice);
        console.assert(alice.hasReactionZone(), 'Token has NO Reaction Zone: %O', alice);
        console.assert(!alice.isEngaged(), 'Token IS engaged: %O', alice);
        console.assert(!alice.isEngaged(true), 'Token IS exclusively engaged: %O', alice);
        console.assert(!bob.hasEngagementZone(), 'Token HAS a Engagement Zone: %O', bob);
        console.assert(!bob.hasReactionZone(), 'Token HAS a Reaction Zone: %O', bob);
        console.assert(bob.isEngaged(), 'Token is NOT engaged: %O', bob);
        console.assert(bob.isEngaged(true), 'Token is NOT exclusively engaged: %O', bob);

        // Move Alon into Alice's engagement zone
        await this._move(alon, this.NORTH);
        console.assert(alice.hasEngagementZone(), 'Token has NO Engagement Zone: %O', alice);
        console.assert(!alice.hasReactionZone(), 'Token HAS a Reaction Zone: %O', alice);
        console.assert(alice.isEngaged(), 'Token is NOT engaged: %O', alice);
        console.assert(alice.isEngaged(true), 'Token is NOT exclusively engaged: %O', alice);

        // Bob rises
        await bob.deleteCondition(game.hm3.Condition.PRONE);
        console.assert(alice.hasEngagementZone(), 'Token has NO Engagement Zone: %O', alice);
        console.assert(!alice.hasReactionZone(), 'Token HAS a Reaction Zone: %O', alice);
        console.assert(alice.isEngaged(), 'Token is NOT engaged: %O', alice);
        console.assert(!alice.isEngaged(true), 'Token IS exclusively engaged: %O', alice);
        console.assert(!bob.isEngaged(true), 'Token IS exclusively engaged: %O', bob);
        console.assert(!alon.isEngaged(true), 'Token IS exclusively engaged: %O', alon);
        console.assert(bob.isEngaged(), 'Token is NOT engaged: %O', bob);
        console.assert(alon.isEngaged(), 'Token is NOT engaged: %O', alon);
        console.assert(
            alice.hasCondition(game.hm3.Condition.OUTNUMBERED + ' 2:1'),
            'Token has NO Outnumbered condition: %O',
            alice
        );
    }
}
