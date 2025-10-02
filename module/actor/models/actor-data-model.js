// @ts-check
import {ItemType} from '../../hm3-types';
import {truncate} from '../../utility';
import {ActorHM3} from '../actor';

// BooleanField
// gmOnly = false
// hint = ''
// initial = false
// label = ''
// nullable = false
// readonly = false
// required = true

// NumberField
// choices = undefined
// gmOnly = false
// hint = ''
// initial = null
// integer = false
// label = ''
// max = undefined
// min = undefined
// nullable = true
// positive = false
// readonly = false
// required = false
// step = undefined

// HTMLField
// blank = true
// choices = undefined
// gmOnly = false
// hint = ''
// initial = ƒ initial() The initial value depends on the field configuration
// label = ''
// nullable = false
// readonly = false
// required = true
// textSearch = false
// trim = true

// StringField
// blank = true
// choices = undefined
// gmOnly = false
// hint = ''
// initial = ƒ initial() The initial value depends on the field configuration
// label = ''
// nullable = false
// readonly = false
// required = false
// textSearch = false
// trim = true

const {
    ArrayField,
    BooleanField,
    FilePathField,
    HTMLField,
    IntegerSortField,
    NumberField,
    ObjectField,
    SchemaField,
    SetField,
    StringField
} = foundry.data.fields;
/**
 * @abstract
 */
export class ActorDataModel extends foundry.abstract.TypeDataModel {
    /** @override */
    static defineSchema() {
        return {
            bioImage: new FilePathField({required: false, categories: ['IMAGE']}),
            description: new HTMLField({initial: '', label: 'Description'})
        };
    }

    /**
     * @type {ActorHM3}
     */
    get actor() {
        return this.parent;
    }

    /**
     * @type {number}
     */
    get totalArmorWeight() {
        return truncate(
            this.actor.items
                .filter((item) => item.type === ItemType.ARMORGEAR && item.system.isCarried)
                .reduce((partialSum, item) => partialSum + item.system.quantity * item.system.weight, 0)
        );
    }
    /**
     * @type {number}
     */
    get totalMiscGearWeight() {
        return truncate(
            this.actor.items
                .filter(
                    (item) =>
                        (item.type === ItemType.MISCGEAR || item.type === ItemType.CONTAINERGEAR) &&
                        item.system.isCarried
                )
                .reduce((partialSum, item) => partialSum + item.system.quantity * item.system.weight, 0)
        );
    }
    /**
     * @type {number}
     */
    get totalMissileWeight() {
        return truncate(
            this.actor.items
                .filter((item) => item.type === ItemType.MISSILEGEAR && item.system.isCarried)
                .reduce((partialSum, item) => partialSum + item.system.quantity * item.system.weight, 0)
        );
    }
    /**
     * @type {number}
     */
    get totalWeaponWeight() {
        return truncate(
            this.actor.items
                .filter((item) => item.type === ItemType.WEAPONGEAR && item.system.isCarried)
                .reduce((partialSum, item) => partialSum + item.system.quantity * item.system.weight, 0)
        );
    }
    /**
     * @type {number}
     */
    get totalGearWeight() {
        return truncate(
            this.totalArmorWeight + this.totalMiscGearWeight + this.totalMissileWeight + this.totalWeaponWeight
        );
    }

    /**
     *
     * @param {string} name
     * @returns {Item | null}
     */
    Skill(name) {
        return (
            this.actor?.items.find(
                (item) => item.type === ItemType.SKILL && item.name.toLowerCase().includes(name.toLowerCase())
            ) ?? null
        );
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
    }

    /** @override */
    prepareDerivedData() {
        super.prepareDerivedData();
    }

    /**
     *
     * @param {Object} a
     * @param {Object} b
     * @returns
     */
    static mergeSchema(a, b) {
        Object.assign(a, b);
        return a;
    }
}
