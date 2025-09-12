import {ItemType} from '../../hm3-types';
import {truncate} from '../../utility';
import {ActorProxy} from './actor-proxy';

class Ability {
    _ability = null;
    _actor = null;
    _penalty = null;
    constructor(ability, actor, penalty) {
        this._ability = ability;
        this._actor = actor;
        this._penalty = penalty;
    }

    get base() {
        return this._getDescendantProp(this._actor, this._ability).base || 0;
    }
    get effective() {
        const p = this._penalty ? this._getDescendantProp(this._actor.proxy, this._penalty) : 0;
        return this.HM6Check(this.base - p);
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
        return this.Skill('Dodge')?.EML ?? 0;
    }
    get fatigue() {
        return this._actor.system.fatigue ?? 0;
    }
    get gender() {
        return this._actor.system.gender ?? 'Male';
    }
    get initiative() {
        return this.Skill('Initiative')?.EML ?? 0;
    }
    get loadRating() {
        return this._actor.system.loadRating ?? 0;
    }
    get mounted() {
        return this._actor.system.mounted ?? false;
    }
    get move() {
        return this._ability('system.move', 'PP');
    }
    get shockIndex() {
        return {value: this._actor.system.shockIndex.value, max: 100};
    }
    get size() {
        return this._actor.system.size || 6;
    }
    get species() {
        return this._actor.system.species;
    }

    //
    // Abilities
    //
    get strength() {
        return this._ability('system.abilities.strength', 'PP');
    }
    get stamina() {
        return this._ability('system.abilities.stamina', 'PP');
    }
    get dexterity() {
        return this._ability('system.abilities.dexterity', 'PP');
    }
    get agility() {
        return this._ability('system.abilities.agility', 'PP');
    }
    get intelligence() {
        return this._ability('system.abilities.intelligence', 'UP');
    }
    get aura() {
        return this._ability('system.abilities.aura', 'UP');
    }
    get will() {
        return this._ability('system.abilities.will', 'UP');
    }
    get eyesight() {
        return this._ability('system.abilities.eyesight', 'UP');
    }
    get hearing() {
        return this._ability('system.abilities.hearing', 'UP');
    }
    get smell() {
        return this._ability('system.abilities.smell', 'UP');
    }
    get voice() {
        return this._ability('system.abilities.voice', 'UP');
    }
    get comeliness() {
        return this._ability('system.abilities.comeliness');
    }
    get morality() {
        return this._ability('system.abilities.morality');
    }
    get STR() {
        return this.strength.effective;
    }
    get STA() {
        return this.stamina.effective;
    }
    get DEX() {
        return this.dexterity.effective;
    }
    get AGL() {
        return this.agility.effective;
    }
    get INT() {
        return this.intelligence.effective;
    }
    get AUR() {
        return this.aura.effective;
    }
    get WIL() {
        return this.will.effective;
    }
    get EYE() {
        return this.eyesight.effective;
    }
    get HRG() {
        return this.hearing.effective;
    }
    get SML() {
        return this.smell.effective;
    }
    get VOI() {
        return this.voice.effective;
    }
    get CML() {
        return this.comeliness.effective;
    }
    get MOR() {
        return this.morality.effective;
    }
    get END() {
        return this.endurance;
    }
    get MOV() {
        return this.move.effective;
    }

    //
    // Derived Stats
    //

    get capacity() {
        return {max: this.loadRating + this.endurance * 10, value: this.totalGearWeight};
    }

    // Endurance
    get endurance() {
        const ML = this.Skill('Condition')?.ML;
        return Math.round(ML ? ML / 5 : (this.strength.base + this.stamina.base + this.will.base) / 3);
    }
    // Encumbrance
    get encumbrance() {
        return Math.floor(Math.max(this.totalGearWeight - this.loadRating, 0) / this.END);
    }
    // Encumbrance Penalty
    get EP() {
        return this.mounted ? Math.round(this.encumbrance / 2) : this.encumbrance;
    }
    // Fatigue Penalty
    get FP() {
        return this.mounted ? Math.round(this.fatigue / 2) : this.fatigue;
    }
    // Injury Penalty
    get IP() {
        return this.proxies
            .filter((item) => item.type === ItemType.INJURY)
            .reduce((partialSum, item) => partialSum + item.IL, 0);
    }
    // Universal Penalty
    get UP() {
        return this.IP + this.FP;
    }
    // Physical Penalty
    get PP() {
        return this.UP + this.EP;
    }

    get totalArmorWeight() {
        return truncate(
            this.proxies
                .filter((item) => item.type === ItemType.ARMORGEAR && item.isCarried)
                .reduce((partialSum, item) => partialSum + item.quantity * item.weight, 0)
        );
    }

    get totalMiscGearWeight() {
        return truncate(
            this.proxies
                .filter(
                    (item) =>
                        (item.type === ItemType.MISCGEAR || item.type === ItemType.CONTAINERGEAR) && item.isCarried
                )
                .reduce((partialSum, item) => partialSum + item.quantity * item.weight, 0)
        );
    }

    get totalMissileWeight() {
        return truncate(
            this.proxies
                .filter((item) => item.type === ItemType.MISSILEGEAR && item.isCarried)
                .reduce((partialSum, item) => partialSum + item.quantity * item.weight, 0)
        );
    }

    get totalWeaponWeight() {
        return truncate(
            this.proxies
                .filter((item) => item.type === ItemType.WEAPONGEAR && item.isCarried)
                .reduce((partialSum, item) => partialSum + item.quantity * item.weight, 0)
        );
    }

    get totalGearWeight() {
        return truncate(
            this.totalArmorWeight + this.totalMiscGearWeight + this.totalMissileWeight + this.totalWeaponWeight
        );
    }

    get hasSteed() {
        return !!this.Skill('Riding')?.actorUuid;
    }

    get steed() {
        return this.hasSteed ? fromUuidSync(this.Skill('Riding').actorUuid) : null;
    }

    get containers() {
        // Setup the fake container entry for "On Person" container
        const containers = {
            'on-person': {
                'name': 'On Person',
                'type': ItemType.CONTAINERGEAR,

                'container': 'on-person',
                'collapsed': this.actor.getFlag('hm3', 'onPersonContainerCollapsed') || false,
                'capacity': {
                    'max': this.capacity.max,
                    'value': this.capacity.value
                }
            }
        };

        this.proxies.forEach((item) => {
            if (item.type === ItemType.CONTAINERGEAR) {
                containers[item.id] = item;
            }
        });

        return containers;
    }

    _ability(path, penalty = null) {
        return new Ability(path, this._actor, penalty);
    }
}
