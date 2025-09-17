// @ts-check
import {Condition, ItemType} from '../../hm3-types';
import {HM6Check, truncate} from '../../utility';
import {ActorHM3} from '../actor';
import {ActorProxy} from './actor-proxy';

/**
 * @class
 * @abstract
 * @extends ActorProxy
 */
export class LivingProxy extends ActorProxy {
    /**
     * @type {string}
     */
    get biography() {
        return this.actor.system.biography;
    }
    /**
     * @type {number}
     */
    get damageDie() {
        return 6;
    }
    /**
     * @type {number}
     */
    get dodge() {
        return (
            this.actor.system.v2.dodge ??
            this._applySpecificActiveEffect('system.v2.dodge', this.Skill('Dodge')?.EML ?? 0)
        );
    }
    /**
     * @type {number}
     */
    get fatigue() {
        return this.actor.system.fatigue ?? 0;
    }
    /**
     * @type {string}
     */
    get gender() {
        return this.actor.system.gender ?? 'Male';
    }
    /**
     * @type {number}
     */
    get initiative() {
        return (
            this.actor.system.v2.initiative ??
            this._applySpecificActiveEffect('system.v2.initiative', this.Skill('Initiative')?.EML ?? 0)
        );
    }
    /**
     * @type {number}
     */
    get load() {
        return truncate(this.totalGearWeight, 0);
    }
    /**
     * @type {number}
     */
    get loadRating() {
        return this.actor.system.loadRating ?? 0;
    }
    get mounted() {
        return this.actor.system.mounted ?? false;
    }
    /**
     * @type {{base: number, effective:number}}
     */
    get move() {
        return this._calcAbility('system.move', true);
    }
    get shockIndex() {
        return {
            value: this.isInanimate
                ? Math.max(100 - Math.round(100 * (this.IP / this.endurance)), 0)
                : ActorHM3.normProb(this.endurance, this.UP * 3.5, this.UP),
            max: 100
        };
    }
    /**
     * @type {number}
     */
    get size() {
        return Number(this.actor.system.size) || 6;
    }
    /**
     * @type {string}
     */
    get species() {
        return this.actor.system.species;
    }

    //
    // Abilities
    //

    /**
     * @type {{base: number, effective:number}}
     */
    get strength() {
        return this._calcAbility('system.abilities.strength', true);
    }
    /**
     * @type {{base: number, effective:number}}
     */
    get stamina() {
        return this._calcAbility('system.abilities.stamina', true);
    }
    /**
     * @type {{base: number, effective:number}}
     */
    get dexterity() {
        return this._calcAbility('system.abilities.dexterity', true);
    }
    /**
     * @type {{base: number, effective:number}}
     */
    get agility() {
        return this._calcAbility('system.abilities.agility', true);
    }
    /**
     * @type {{base: number, effective:number}}
     */
    get intelligence() {
        return this._calcAbility('system.abilities.intelligence', false);
    }
    /**
     * @type {{base: number, effective:number}}
     */
    get aura() {
        return this._calcAbility('system.abilities.aura', false);
    }
    /**
     * @type {{base: number, effective:number}}
     */
    get will() {
        return this._calcAbility('system.abilities.will', false);
    }
    /**
     * @type {{base: number, effective:number}}
     */
    get eyesight() {
        return this._calcAbility('system.abilities.eyesight', false);
    }
    /**
     * @type {{base: number, effective:number}}
     */
    get hearing() {
        return this._calcAbility('system.abilities.hearing', false);
    }
    /**
     * @type {{base: number, effective:number}}
     */
    get smell() {
        return this._calcAbility('system.abilities.smell', false);
    }
    /**
     * @type {{base: number, effective:number}}
     */
    get voice() {
        return this._calcAbility('system.abilities.voice', false);
    }
    /**
     * @type {{base: number, effective:number}}
     */
    get comeliness() {
        return this._calcAbility('system.abilities.comeliness', null);
    }
    /**
     * @type {{base: number, effective:number}}
     */
    get morality() {
        return this._calcAbility('system.abilities.morality', null);
    }
    /**
     * @type {number}
     */
    get STR() {
        return this.strength.effective;
    }
    /**
     * @type {number}
     */
    get STA() {
        return this.stamina.effective;
    }
    /**
     * @type {number}
     */
    get DEX() {
        return this.dexterity.effective;
    }
    /**
     * @type {number}
     */
    get AGL() {
        return this.agility.effective;
    }
    /**
     * @type {number}
     */
    get INT() {
        return this.intelligence.effective;
    }
    /**
     * @type {number}
     */
    get AUR() {
        return this.aura.effective;
    }
    /**
     * @type {number}
     */
    get WIL() {
        return this.will.effective;
    }
    /**
     * @type {number}
     */
    get EYE() {
        return this.eyesight.effective;
    }
    /**
     * @type {number}
     */
    get HRG() {
        return this.hearing.effective;
    }
    /**
     * @type {number}
     */
    get SML() {
        return this.smell.effective;
    }
    /**
     * @type {number}
     */
    get VOI() {
        return this.voice.effective;
    }
    /**
     * @type {number}
     */
    get CML() {
        return this.comeliness.effective;
    }
    /**
     * @type {number}
     */
    get MOR() {
        return this.morality.effective;
    }
    /**
     * @type {number}
     */
    get END() {
        return this.endurance;
    }
    /**
     * @type {number}
     */
    get MOV() {
        return this.move.effective;
    }

    //
    // Derived Stats
    //

    /**
     * Maximum weight carried
     * @type {{max: number, value: number}}
     */
    get capacity() {
        return {max: this.loadRating + this.endurance * 10, value: this.totalGearWeight};
    }
    /**
     *  Endurance
     * @type {number}
     */
    get endurance() {
        const ML = this.Skill('Condition')?.ML;
        return (
            this.actor.system.v2.endurance ??
            this._applySpecificActiveEffect(
                'system.v2.endurance',
                Math.round(ML ? ML / 5 : (this.strength.base + this.stamina.base + this.will.base) / 3)
            )
        );
    }
    // Encumbrance
    get encumbrance() {
        return Math.floor(Math.max(this.totalGearWeight - this.loadRating, 0) / this.END);
    }
    // Encumbrance Penalty
    get EP() {
        return (
            this.actor.system.v2.encumbrancePenalty ??
            this._applySpecificActiveEffect(
                'system.v2.encumbrancePenalty',
                this.mounted ? Math.round(this.encumbrance / 2) : this.encumbrance
            )
        );
    }
    // Fatigue Penalty
    get FP() {
        return (
            this.actor.system.v2.fatiguePenalty ??
            this._applySpecificActiveEffect(
                'system.v2.fatiguePenalty',
                this.mounted ? Math.round(this.fatigue / 2) : this.fatigue
            )
        );
    }
    /**
     * Injury Penalty
     * @type {number}
     */
    get IP() {
        return (
            this.actor.system.v2.injuryPenalty ??
            this._applySpecificActiveEffect(
                'system.v2.injuryPenalty',
                this.proxies
                    .filter((item) => item.type === ItemType.INJURY)
                    .reduce((partialSum, item) => partialSum + item.IL, 0)
            )
        );
    }
    /**
     *  Universal Penalty
     * @type {number}
     */
    get UP() {
        return (
            this.actor.system.v2.universalPenalty ??
            this._applySpecificActiveEffect('system.v2.universalPenalty', this.IP + this.FP)
        );
    }
    /**
     * Physical Penalty
     * @type {number}
     */
    get PP() {
        return (
            this.actor.system.v2.physicalPenalty ??
            this._applySpecificActiveEffect('system.v2.physicalPenalty', this.UP + this.EP)
        );
    }

    /**
     * @type {boolean}
     */
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

    //
    // Conditions
    //

    /**
     * @type {boolean}
     */
    get isInanimate() {
        return this.actor.hasCondition(Condition.INANIMATE);
    }

    /**
     * @param {string} ability
     * @param {boolean | null} isPhysical
     * @returns {{base: number, effective:number}}
     */
    _calcAbility(ability, isPhysical) {
        const ctx = this;
        // @ts-expect-error
        const prop = foundry.utils.getProperty(this.actor, ability)?.base || 0;
        let v2Ability = ability.replace('abilities', 'v2');
        if (v2Ability === 'system.move') v2Ability = 'system.v2.move';
        // @ts-expect-error
        const value = foundry.utils.getProperty(v2Ability);
        return {
            get base() {
                return prop;
            },
            get effective() {
                return (
                    value ??
                    ctx._applySpecificActiveEffect(
                        v2Ability,
                        HM6Check(prop - (isPhysical === null ? 0 : isPhysical ? ctx.PP : ctx.UP))
                    )
                );
            }
        };
    }
}
