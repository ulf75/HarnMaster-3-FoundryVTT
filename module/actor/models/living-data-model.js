// @ts-check
import {ItemType} from '../../hm3-types';
import {ActorDataModel} from './actor-data-model';

const {ArrayField, BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
/**
 * @abstract
 */
export class LivingDataModel extends ActorDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            abilities: new SchemaField({
                strength: new SchemaField({
                    base: new NumberField({initial: 0, integer: true, min: 0}),
                    effective: new NumberField({initial: 0, integer: true, min: 0}),
                    modified: new NumberField({initial: 0, integer: true, min: 0})
                }),
                stamina: new SchemaField({
                    base: new NumberField({initial: 0, integer: true, min: 0}),
                    effective: new NumberField({initial: 0, integer: true, min: 0}),
                    modified: new NumberField({initial: 0, integer: true, min: 0})
                }),
                dexterity: new SchemaField({
                    base: new NumberField({initial: 0, integer: true, min: 0}),
                    effective: new NumberField({initial: 0, integer: true, min: 0}),
                    modified: new NumberField({initial: 0, integer: true, min: 0})
                }),
                agility: new SchemaField({
                    base: new NumberField({initial: 0, integer: true, min: 0}),
                    effective: new NumberField({initial: 0, integer: true, min: 0}),
                    modified: new NumberField({initial: 0, integer: true, min: 0})
                }),
                intelligence: new SchemaField({
                    base: new NumberField({initial: 0, integer: true, min: 0}),
                    effective: new NumberField({initial: 0, integer: true, min: 0}),
                    modified: new NumberField({initial: 0, integer: true, min: 0})
                }),
                aura: new SchemaField({
                    base: new NumberField({initial: 0, integer: true, min: 0}),
                    effective: new NumberField({initial: 0, integer: true, min: 0}),
                    modified: new NumberField({initial: 0, integer: true, min: 0})
                }),
                will: new SchemaField({
                    base: new NumberField({initial: 0, integer: true, min: 0}),
                    effective: new NumberField({initial: 0, integer: true, min: 0}),
                    modified: new NumberField({initial: 0, integer: true, min: 0})
                }),
                eyesight: new SchemaField({
                    base: new NumberField({initial: 0, integer: true, min: 0}),
                    effective: new NumberField({initial: 0, integer: true, min: 0}),
                    modified: new NumberField({initial: 0, integer: true, min: 0})
                }),
                hearing: new SchemaField({
                    base: new NumberField({initial: 0, integer: true, min: 0}),
                    effective: new NumberField({initial: 0, integer: true, min: 0}),
                    modified: new NumberField({initial: 0, integer: true, min: 0})
                }),
                smell: new SchemaField({
                    base: new NumberField({initial: 0, integer: true, min: 0}),
                    effective: new NumberField({initial: 0, integer: true, min: 0}),
                    modified: new NumberField({initial: 0, integer: true, min: 0})
                }),
                voice: new SchemaField({
                    base: new NumberField({initial: 0, integer: true, min: 0}),
                    effective: new NumberField({initial: 0, integer: true, min: 0}),
                    modified: new NumberField({initial: 0, integer: true, min: 0})
                }),
                comeliness: new SchemaField({
                    base: new NumberField({initial: 0, integer: true, min: 0}),
                    effective: new NumberField({initial: 0, integer: true, min: 0}),
                    modified: new NumberField({initial: 0, integer: true, min: 0})
                }),
                morality: new SchemaField({
                    base: new NumberField({initial: 0, integer: true, min: 0}),
                    effective: new NumberField({initial: 0, integer: true, min: 0}),
                    modified: new NumberField({initial: 0, integer: true, min: 0})
                })
            }),
            biography: new HTMLField({}),
            condition: new NumberField({initial: 0, integer: true, min: 0}),
            dodge: new NumberField({initial: 0, integer: true, min: 0}),
            encumbrance: new NumberField({initial: 0, integer: true, min: 0}),
            endurance: new NumberField({initial: 0, integer: true, min: 0}),
            fatigue: new NumberField({initial: 0, integer: true, min: 0}),
            gender: new StringField({initial: 'Male', choices: ['Male', 'Female']}),
            initiative: new NumberField({initial: 0, integer: true, min: 0}),
            loadRating: new NumberField({initial: 0, integer: true, min: 0}),
            mounted: new BooleanField({initial: false}),
            move: new SchemaField({
                base: new NumberField({initial: 0, integer: true, min: 0}),
                effective: new NumberField({initial: 0, integer: true, min: 0}),
                modified: new NumberField({initial: 0, integer: true, min: 0})
            }),
            physicalPenalty: new NumberField({initial: 0, integer: true, min: 0}),
            totalInjuryLevels: new NumberField({initial: 0, integer: true, min: 0}),
            universalPenalty: new NumberField({initial: 0, integer: true, min: 0}),
            shockIndex: new SchemaField({
                max: new NumberField({initial: 100, readonly: true}),
                value: new NumberField({initial: 100, integer: true, min: 0, max: 100})
            }),
            species: new StringField({initial: ''})
        });
    }

    /**
     * @type {number}
     */
    get damageDie() {
        return 6;
    }

    /**
     * **Effective** Strength
     * @type {number}
     */
    get STR() {
        // @ts-expect-error
        return this.abilities.strength.effective;
    }
    /**
     * **Effective** Stamina
     * @type {number}
     */
    get STA() {
        // @ts-expect-error
        return this.abilities.stamina.effective;
    }
    /**
     * **Effective** Dexterity
     * @type {number}
     */
    get DEX() {
        // @ts-expect-error
        return this.abilities.dexterity.effective;
    }
    /**
     * @type {number}
     */
    get AGL() {
        // @ts-expect-error
        return this.abilities.agility.effective;
    }
    /**
     * **Effective** Intelligence
     * @type {number}
     */
    get INT() {
        // @ts-expect-error
        return this.abilities.intelligence.effective;
    }
    /**
     * @type {number}
     */
    get AUR() {
        // @ts-expect-error
        return this.abilities.aura.effective;
    }
    /**
     * @type {number}
     */
    get WIL() {
        // @ts-expect-error
        return this.abilities.will.effective;
    }
    /**
     * @type {number}
     */
    get EYE() {
        // @ts-expect-error
        return this.abilities.eyesight.effective;
    }
    /**
     * @type {number}
     */
    get HRG() {
        // @ts-expect-error
        return this.abilities.hearing.effective;
    }
    /**
     * @type {number}
     */
    get SML() {
        // @ts-expect-error
        return this.abilities.smell.effective;
    }
    /**
     * @type {number}
     */
    get VOI() {
        // @ts-expect-error
        return this.abilities.voice.effective;
    }
    /**
     * @type {number}
     */
    get CML() {
        // @ts-expect-error
        return this.abilities.comeliness.effective;
    }
    /**
     * @type {number}
     */
    get MOR() {
        // @ts-expect-error
        return this.abilities.morality.effective;
    }
    /**
     * Endurance
     * @type {number}
     */
    get END() {
        return this.Endurance;
    }
    /**
     * **Effective** Move
     * @type {number}
     */
    get MOV() {
        // @ts-expect-error
        return this.move.effective;
    }

    /**
     * Maximum weight carried
     * @type {{max: number, value: number}}
     */
    get capacity() {
        // @ts-expect-error
        return {max: this.loadRating + this.END * 10, value: this.totalGearWeight};
    }
    /**
     * Endurance
     * @type {number}
     */
    get Endurance() {
        // @ts-expect-error
        const ML = this.Skill('Condition')?.ML;
        return Math.round(
            // @ts-expect-error
            ML ? ML / 5 : (this.abilities.strength.base + this.abilities.stamina.base + this.abilities.will.base) / 3
        );
    }
    /**
     * Encumbrance
     * @type {number}
     */
    get Encumbrance() {
        // @ts-expect-error
        return Math.floor(Math.max(this.totalGearWeight - this.loadRating, 0) / this.END);
    }
    /**
     * Load
     * @type {number}
     */
    get load() {
        return Math.ceil(this.totalGearWeight);
    }

    /**
     * @type {number}
     */
    get Condition() {
        // @ts-expect-error
        return this.Skill('Condition')?.system.EML ?? 0;
    }
    /**
     * @type {number}
     */
    get Dodge() {
        // @ts-expect-error
        return this.Skill('Dodge')?.system.EML ?? 0;
    }

    /**
     * Encumbrance Penalty
     * @type {number}
     */
    get EP() {
        // @ts-expect-error
        return this.mounted ? Math.round(this.Encumbrance / 2) : this.Encumbrance;
    }
    /**
     * Fatigue Penalty
     * @type {number}
     */
    get FP() {
        // @ts-expect-error
        return this.mounted ? Math.round(this.fatigue / 2) : this.fatigue;
    }
    /**
     * Injury Penalty
     * @type {number}
     */
    get IP() {
        return (
            this.actor.items
                .filter((item) => item.type === ItemType.INJURY)
                // @ts-expect-error
                .reduce((partialSum, item) => partialSum + item.system.injuryLevel, 0)
        );
    }
    /**
     * Universal Penalty
     * @type {number}
     */
    get UP() {
        return this.IP + this.FP;
    }
    /**
     * Physical Penalty
     * @type {number}
     */
    get PP() {
        return this.UP + this.EP;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();

        // Initialize derived attributes
        this.abilities.strength.effective = 0;
        this.abilities.stamina.effective = 0;
        this.abilities.dexterity.effective = 0;
        this.abilities.agility.effective = 0;
        this.abilities.intelligence.effective = 0;
        this.abilities.aura.effective = 0;
        this.abilities.will.effective = 0;
        this.abilities.eyesight.effective = 0;
        this.abilities.hearing.effective = 0;
        this.abilities.smell.effective = 0;
        this.abilities.voice.effective = 0;
        this.abilities.comeliness.effective = 0;
        this.abilities.morality.effective = 0;
        this.abilities.strength.modified = 0;
        this.abilities.stamina.modified = 0;
        this.abilities.dexterity.modified = 0;
        this.abilities.agility.modified = 0;
        this.abilities.intelligence.modified = 0;
        this.abilities.aura.modified = 0;
        this.abilities.will.modified = 0;
        this.abilities.eyesight.modified = 0;
        this.abilities.hearing.modified = 0;
        this.abilities.smell.modified = 0;
        this.abilities.voice.modified = 0;
        this.abilities.comeliness.modified = 0;
        this.abilities.morality.modified = 0;
        this.condition = this.Condition;
        this.dodge = this.Dodge;
        this.encumbrance = this.Encumbrance;
        this.endurance = this.Endurance;
        this.initiative = 0;
        this.move.effective = 0;
        this.physicalPenalty = this.PP;
        this.totalInjuryLevels = this.IP;
        this.universalPenalty = this.UP;

        // Setup temporary work values masking the base values
        const eph = (this.actor.system.eph = {});
        eph.move = this.move.base;
        eph.fatigue = this.fatigue;
        eph.strength = this.abilities.strength.base;
        eph.stamina = this.abilities.stamina.base;
        eph.dexterity = this.abilities.dexterity.base;
        eph.agility = this.abilities.agility.base;
        eph.eyesight = this.abilities.eyesight.base;
        eph.hearing = this.abilities.hearing.base;
        eph.smell = this.abilities.smell.base;
        eph.voice = this.abilities.voice.base;
        eph.intelligence = this.abilities.intelligence.base;
        eph.will = this.abilities.will.base;
        eph.aura = this.abilities.aura.base;
        eph.morality = this.abilities.morality.base;
        eph.comeliness = this.abilities.comeliness.base;
        eph.endurance = this.endurance;

        eph.meleeAMLMod = 0;
        eph.meleeDMLMod = 0;
        eph.missileAMLMod = 0;
        eph.outnumbered = 0;
        eph.commSkillsMod = 0;
        eph.physicalSkillsMod = 0;
        eph.combatSkillsMod = 0;
        eph.craftSkillsMod = 0;
        eph.ritualSkillsMod = 0;
        eph.magicSkillsMod = 0;
        eph.psionicTalentsMod = 0;
        eph.itemAMLMod = 0;
        eph.itemDMLMod = 0;
        eph.itemEMLMod = 0;
        eph.itemCustomMod = 0;
        eph.unhorsing = 0;
    }

    /** @override */
    prepareDerivedData() {
        super.prepareDerivedData();
    }
}
