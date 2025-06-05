const CENTER = {x: 7870, y: 14258};

export class TestCase extends game.hm3.BaseTest {
    async _prerequisites() {
        if (!game.users.get(this.ALICE_USER_ID).active) return 'Alice user is not active';
        if (!game.users.get(this.INEN_USER_ID).active) return 'Inen user is not active';
        return true;
    }

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
        console.assert(defButtonsGm.length === 4, 'Expected 4 defend buttons, found: %O', defButtonsGm);
        console.assert(defButtonsAlice.length === 4, 'Expected 4 defend buttons, found: %O', defButtonsAlice);
        console.assert(defButtonsInen.length === 0, 'Expected 0 defend buttons, found: %O', defButtonsInen);
        const messageNr = new Map(defButtonsGm).get('Dodge').messageNr;

        // ACF / DCF
        let res = await this._defAction('Dodge', {messageNr, roll: [100, 100], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(!res[0].dta, 'DTA true');
        console.assert(!res[0].hasAttackHit, 'Attack hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(res[0].isAtkStumbleRoll, 'No Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(res[0].isDefStumbleRoll, 'No Def Stumble');

        // ACF / DMF
        res = await this._defAction('Dodge', {messageNr, roll: [100, 99], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(!res[0].dta, 'DTA true');
        console.assert(!res[0].hasAttackHit, 'Attack hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(res[0].isAtkStumbleRoll, 'No Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(!res[0].isDefStumbleRoll, 'Def Stumble');

        // ACF / DMS
        res = await this._defAction('Dodge', {messageNr, roll: [100, 1], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(res[0].dta, 'DTA false');
        console.assert(!res[0].hasAttackHit, 'Attack hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(!res[0].isAtkStumbleRoll, 'Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(!res[0].isDefStumbleRoll, 'Def Stumble');

        // ACF / DCS
        res = await this._defAction('Dodge', {messageNr, roll: [100, 5], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(res[0].dta, 'DTA false');
        console.assert(!res[0].hasAttackHit, 'Attack hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(!res[0].isAtkStumbleRoll, 'Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(!res[0].isDefStumbleRoll, 'Def Stumble');

        // AMF / DCF
        res = await this._defAction('Dodge', {messageNr, roll: [99, 100], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(!res[0].dta, 'DTA true');
        console.assert(!res[0].hasAttackHit, 'Attack hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(!res[0].isAtkStumbleRoll, 'Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(res[0].isDefStumbleRoll, 'No Def Stumble');

        // AMF / DMF
        res = await this._defAction('Dodge', {messageNr, roll: [99, 99], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(!res[0].dta, 'DTA true');
        console.assert(!res[0].hasAttackHit, 'Attack hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(!res[0].isAtkStumbleRoll, 'Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(!res[0].isDefStumbleRoll, 'Def Stumble');

        // AMF / DMS
        res = await this._defAction('Dodge', {messageNr, roll: [99, 1], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(!res[0].dta, 'DTA true');
        console.assert(!res[0].hasAttackHit, 'Attack hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(!res[0].isAtkStumbleRoll, 'Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(!res[0].isDefStumbleRoll, 'Def Stumble');

        // AMF / DCS
        res = await this._defAction('Dodge', {messageNr, roll: [99, 5], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(res[0].dta, 'DTA false');
        console.assert(!res[0].hasAttackHit, 'Attack hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(!res[0].isAtkStumbleRoll, 'Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(!res[0].isDefStumbleRoll, 'Def Stumble');

        // AMS / DCF
        res = await this._defAction('Dodge', {messageNr, roll: [1, 100], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(!res[0].dta, 'DTA true');
        console.assert(res[0].hasAttackHit, 'Attack does not hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(!res[0].isAtkStumbleRoll, 'Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(!res[0].isDefStumbleRoll, 'Def Stumble');

        // AMS / DMF
        res = await this._defAction('Dodge', {messageNr, roll: [1, 99], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(!res[0].dta, 'DTA true');
        console.assert(res[0].hasAttackHit, 'Attack does not hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(!res[0].isAtkStumbleRoll, 'Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(!res[0].isDefStumbleRoll, 'Def Stumble');

        // AMS / DMS
        res = await this._defAction('Dodge', {messageNr, roll: [1, 1], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(!res[0].dta, 'DTA true');
        console.assert(!res[0].hasAttackHit, 'Attack hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(!res[0].isAtkStumbleRoll, 'Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(!res[0].isDefStumbleRoll, 'Def Stumble');

        // AMS / DCS
        res = await this._defAction('Dodge', {messageNr, roll: [1, 5], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(!res[0].dta, 'DTA true');
        console.assert(!res[0].hasAttackHit, 'Attack hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(!res[0].isAtkStumbleRoll, 'Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(!res[0].isDefStumbleRoll, 'Def Stumble');

        // ACS / DCF
        res = await this._defAction('Dodge', {messageNr, roll: [5, 100], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(!res[0].dta, 'DTA true');
        console.assert(res[0].hasAttackHit, 'Attack does not hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(!res[0].isAtkStumbleRoll, 'Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(!res[0].isDefStumbleRoll, 'Def Stumble');

        // ACS / DCF
        res = await this._defAction('Dodge', {messageNr, roll: [5, 100], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(!res[0].dta, 'DTA true');
        console.assert(res[0].hasAttackHit, 'Attack does not hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(!res[0].isAtkStumbleRoll, 'Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(!res[0].isDefStumbleRoll, 'Def Stumble');

        // ACS / DMF
        res = await this._defAction('Dodge', {messageNr, roll: [5, 99], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(!res[0].dta, 'DTA true');
        console.assert(res[0].hasAttackHit, 'Attack does not hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(!res[0].isAtkStumbleRoll, 'Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(!res[0].isDefStumbleRoll, 'Def Stumble');

        // ACS / DMS
        res = await this._defAction('Dodge', {messageNr, roll: [5, 1], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(!res[0].dta, 'DTA true');
        console.assert(res[0].hasAttackHit, 'Attack does not hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(!res[0].isAtkStumbleRoll, 'Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(!res[0].isDefStumbleRoll, 'Def Stumble');

        // ACS / DCS
        res = await this._defAction('Dodge', {messageNr, roll: [5, 5], userId: this.ALICE_USER_ID, unsetTAFlag: true});
        console.assert(!res[0].dta, 'DTA true');
        console.assert(!res[0].hasAttackHit, 'Attack hit');
        console.assert(!res[0].isAtkFumbleRoll, 'Atk Fumble');
        console.assert(!res[0].isAtkStumbleRoll, 'Atk Stumble');
        console.assert(!res[0].isDefFumbleRoll, 'Def Fumble');
        console.assert(!res[0].isDefStumbleRoll, 'Def Stumble');
    }
}
