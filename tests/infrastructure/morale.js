export class TestCase extends game.hm3.BaseTest {
    CENTER = {x: 7870, y: 14258};

    async _test() {
        const token = await this._dropActor(this.actors.get('Alice'), this.CENTER);

        const berserk = await token.addCondition(game.hm3.Condition.BERSERK);
        console.info('Adding condition: %s to token: %s', game.hm3.Condition.BERSERK, token.name);
        console.assert(berserk && berserk instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', berserk);

        const broken = await token.addCondition(game.hm3.Condition.BROKEN);
        console.info('Adding condition: %s to token: %s', game.hm3.Condition.BROKEN, token.name);
        console.assert(broken && broken instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', broken);
        console.assert(!token.hasCondition(game.hm3.Condition.BERSERK), 'Token DOES have condition: %s', game.hm3.Condition.BERSERK);

        const c = await token.addCondition(game.hm3.Condition.CAUTIOUS);
        console.info('Adding condition: %s to token: %s', game.hm3.Condition.CAUTIOUS, token.name);
        console.assert(c && c instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', c);
        console.assert(!token.hasCondition(game.hm3.Condition.BROKEN), 'Token DOES have condition: %s', game.hm3.Condition.BROKEN);

        const d = await token.addCondition(game.hm3.Condition.DESPERATE);
        console.info('Adding condition: %s to token: %s', game.hm3.Condition.DESPERATE, token.name);
        console.assert(d && d instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', d);
        console.assert(!token.hasCondition(game.hm3.Condition.CAUTIOUS), 'Token DOES have condition: %s', game.hm3.Condition.CAUTIOUS);

        const e = await token.addCondition(game.hm3.Condition.EMPOWERED);
        console.info('Adding condition: %s to token: %s', game.hm3.Condition.EMPOWERED, token.name);
        console.assert(e && e instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', e);
        console.assert(!token.hasCondition(game.hm3.Condition.DESPERATE), 'Token DOES have condition: %s', game.hm3.Condition.DESPERATE);

        const w = await token.addCondition(game.hm3.Condition.WEAKENED);
        console.info('Adding condition: %s to token: %s', game.hm3.Condition.WEAKENED, token.name);
        console.assert(w && w instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', w);
        console.assert(!token.hasCondition(game.hm3.Condition.EMPOWERED), 'Token DOES have condition: %s', game.hm3.Condition.EMPOWERED);

        console.assert(game.hm3.resolveMap.size === 0, 'Resolve map is NOT empty: %O', game.hm3.resolveMap);
    }
}
