import {ActorProxy} from './actor-proxy';

class Ability {
    _ability = '';
    _actor = null;
    _penalty = 0;
    constructor(ability, actor, penalty) {
        this._ability = ability;
        this._actor = actor;
        this._penalty = penalty;
    }

    get base() {
        return this._getDescendantProp(this._actor, this._ability).base || 0;
    }
    get effective() {
        return this.HM6Check(this.base - this._penalty);
    }

    HM6Check(value) {
        return Math.max(Math.round(value), 1);
    }

    _getDescendantProp(obj, desc) {
        var arr = desc.split('.');
        while (arr.length && (obj = obj[arr.shift()]));
        return obj;
    }
}

export class LivingProxy extends ActorProxy {
    get biography() {
        return this._actor.system.biography;
    }
    get dodge() {
        return this.proxies.find((item) => item.name === 'Dodge')?.EML || 0;
    }
    get gender() {
        return this._actor.system.gender;
    }
    get initiative() {
        return this.proxies.find((item) => item.name === 'Initiative')?.EML || 0;
    }
    get move() {
        return this._ability('system.move', this.PP);
    }
    get shockIndex() {
        return {value: this._actor.system.shockIndex.value, max: 100};
    }
    get size() {
        return this._actor.system.size;
    }
    get species() {
        return this._actor.system.species;
    }

    //
    // Abilities
    //
    get strength() {
        return this._ability('system.abilities.strength', this.PP);
    }
    get stamina() {
        return this._ability('system.abilities.stamina', this.PP);
    }
    get dexterity() {
        return this._ability('system.abilities.dexterity', this.PP);
    }
    get agility() {
        return this._ability('system.abilities.agility', this.PP);
    }
    get intelligence() {
        return this._ability('system.abilities.intelligence', this.UP);
    }
    get aura() {
        return this._ability('system.abilities.aura', this.UP);
    }
    get will() {
        return this._ability('system.abilities.will', this.UP);
    }
    get eyesight() {
        return this._ability('system.abilities.eyesight', this.UP);
    }
    get hearing() {
        return this._ability('system.abilities.hearing', this.UP);
    }
    get smell() {
        return this._ability('system.abilities.smell', this.UP);
    }
    get voice() {
        return this._ability('system.abilities.voice', this.UP);
    }
    get comeliness() {
        return this._ability('system.abilities.comeliness');
    }
    get morality() {
        return this._ability('system.abilities.morality');
    }
    get STR() {
        return this.strength;
    }
    get STA() {
        return this.stamina;
    }
    get DEX() {
        return this.dexterity;
    }
    get AGL() {
        return this.agility;
    }
    get INT() {
        return this.intelligence;
    }
    get AUR() {
        return this.aura;
    }
    get WIL() {
        return this.will;
    }
    get EYE() {
        return this.eyesight;
    }
    get HRG() {
        return this.hearing;
    }
    get SML() {
        return this.smell;
    }
    get VOI() {
        return this.voice;
    }
    get CML() {
        return this.comeliness;
    }
    get MOR() {
        return this.morality;
    }

    _ability(path, penalty = 0) {
        return new Ability(path, this._actor, penalty);
    }
}
