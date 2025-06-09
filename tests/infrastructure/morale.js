export class TestCase extends game.hm3.BaseTest {
    async _test() {
        const Center = {x: 7870, y: 14258};
        const Condition = game.hm3.Condition;
        const token = await this._dropActor(this.actors.get('Alice'), Center);

        const berserk = await token.addCondition(Condition.BERSERK);
        console.info('Adding condition: %s to token: %s', Condition.BERSERK, token.name);
        console.assert(berserk && berserk instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', berserk);

        const broken = await token.addCondition(Condition.BROKEN);
        console.info('Adding condition: %s to token: %s', Condition.BROKEN, token.name);
        console.assert(broken && broken instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', broken);
        console.assert(!token.hasCondition(Condition.BERSERK), 'Token DOES have condition: %s', Condition.BERSERK);

        const cautious = await token.addCondition(Condition.CAUTIOUS);
        console.info('Adding condition: %s to token: %s', Condition.CAUTIOUS, token.name);
        console.assert(cautious && cautious instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', cautious);
        console.assert(!token.hasCondition(Condition.BROKEN), 'Token DOES have condition: %s', Condition.BROKEN);

        const desperate = await token.addCondition(Condition.DESPERATE);
        console.info('Adding condition: %s to token: %s', Condition.DESPERATE, token.name);
        console.assert(desperate && desperate instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', desperate);
        console.assert(!token.hasCondition(Condition.CAUTIOUS), 'Token DOES have condition: %s', Condition.CAUTIOUS);

        const empowered = await token.addCondition(Condition.EMPOWERED);
        console.info('Adding condition: %s to token: %s', Condition.EMPOWERED, token.name);
        console.assert(empowered && empowered instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', empowered);
        console.assert(!token.hasCondition(Condition.DESPERATE), 'Token DOES have condition: %s', Condition.DESPERATE);

        const weakened = await token.addCondition(Condition.WEAKENED);
        console.info('Adding condition: %s to token: %s', Condition.WEAKENED, token.name);
        console.assert(weakened && weakened instanceof ActiveEffect, 'Condition is NOT an ActiveEffect: %O', weakened);
        console.assert(!token.hasCondition(Condition.EMPOWERED), 'Token DOES have condition: %s', Condition.EMPOWERED);
    }
}
