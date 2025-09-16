import {Condition, ItemType} from '../../hm3-types';
import {HM6Check, truncate} from '../../utility';
import {ActorHM3} from '../actor';
import {ActorProxy} from './actor-proxy';

export class LivingProxy extends ActorProxy {
    /**
     * @type {string}
     */
    get biography() {
        return this._actor.system.biography;
    }
    /**
     * @type {string}
     */
    get damageDie() {
        return '6';
    }
    /**
     * @type {number}
     */
    get dodge() {
        return (
            this._actor.system.v2.dodge ??
            this.applySpecificActiveEffect('system.v2.dodge', this.Skill('Dodge')?.EML ?? 0)
        );
    }
    /**
     * @type {number}
     */
    get fatigue() {
        return this._actor.system.fatigue ?? 0;
    }
    /**
     * @type {string}
     */
    get gender() {
        return this._actor.system.gender ?? 'Male';
    }
    /**
     * @type {number}
     */
    get initiative() {
        return (
            this._actor.system.v2.initiative ??
            this.applySpecificActiveEffect('system.v2.initiative', this.Skill('Initiative')?.EML ?? 0)
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
        return this._actor.system.loadRating ?? 0;
    }
    get mounted() {
        return this._actor.system.mounted ?? false;
    }
    /**
     * @type {number}
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
        return Number(this._actor.system.size) || 6;
    }
    /**
     * @type {string}
     */
    get species() {
        return this._actor.system.species;
    }

    //
    // Abilities
    //
    get strength() {
        return this._calcAbility('system.abilities.strength', true);
    }
    get stamina() {
        return this._calcAbility('system.abilities.stamina', true);
    }
    get dexterity() {
        return this._calcAbility('system.abilities.dexterity', true);
    }
    get agility() {
        return this._calcAbility('system.abilities.agility', true);
    }
    get intelligence() {
        return this._calcAbility('system.abilities.intelligence', false);
    }
    get aura() {
        return this._calcAbility('system.abilities.aura', false);
    }
    get will() {
        return this._calcAbility('system.abilities.will', false);
    }
    get eyesight() {
        return this._calcAbility('system.abilities.eyesight', false);
    }
    get hearing() {
        return this._calcAbility('system.abilities.hearing', false);
    }
    get smell() {
        return this._calcAbility('system.abilities.smell', false);
    }
    get voice() {
        return this._calcAbility('system.abilities.voice', false);
    }
    get comeliness() {
        return this._calcAbility('system.abilities.comeliness', null);
    }
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
    // Endurance
    get endurance() {
        const ML = this.Skill('Condition')?.ML;
        return (
            this._actor.system.v2.endurance ??
            this.applySpecificActiveEffect(
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
            this._actor.system.v2.encumbrancePenalty ??
            this.applySpecificActiveEffect(
                'system.v2.encumbrancePenalty',
                this.mounted ? Math.round(this.encumbrance / 2) : this.encumbrance
            )
        );
    }
    // Fatigue Penalty
    get FP() {
        return (
            this._actor.system.v2.fatiguePenalty ??
            (this.isInanimate
                ? 0
                : this.applySpecificActiveEffect(
                      'system.v2.fatiguePenalty',
                      this.mounted ? Math.round(this.fatigue / 2) : this.fatigue
                  ))
        );
    }
    // Injury Penalty
    get IP() {
        return (
            this._actor.system.v2.injuryPenalty ??
            (this.isInanimate
                ? 0
                : this.applySpecificActiveEffect(
                      'system.v2.injuryPenalty',
                      this.proxies
                          .filter((item) => item.type === ItemType.INJURY)
                          .reduce((partialSum, item) => partialSum + item.IL, 0)
                  ))
        );
    }
    // Universal Penalty
    get UP() {
        return (
            this._actor.system.v2.universalPenalty ??
            this.applySpecificActiveEffect('system.v2.universalPenalty', this.IP + this.FP)
        );
    }
    // Physical Penalty
    get PP() {
        return (
            this._actor.system.v2.physicalPenalty ??
            this.applySpecificActiveEffect('system.v2.physicalPenalty', this.UP + this.EP)
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

    //
    // Conditions
    //
    get isInanimate() {
        return this.actor.hasCondition(Condition.INANIMATE);
    }

    _calcAbility(ability, isPhysical) {
        const ctx = this;
        const prop = foundry.utils.getProperty(this._actor, ability)?.base || 0;
        let v2Ability = ability.replace('abilities', 'v2');
        if (v2Ability === 'system.move') v2Ability = 'system.v2.move';
        const value = foundry.utils.getProperty(v2Ability);
        return {
            get base() {
                return prop;
            },
            get effective() {
                return (
                    value ??
                    ctx.applySpecificActiveEffect(
                        v2Ability,
                        HM6Check(prop - (isPhysical === null ? 0 : isPhysical ? ctx.PP : ctx.UP))
                    )
                );
            }
        };
    }
}
