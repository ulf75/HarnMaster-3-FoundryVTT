// @ts-check
import {ItemType} from '../../hm3-types';

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

const {ArrayField, BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
/**
 * @abstract
 */
export class ItemDataModel extends foundry.abstract.TypeDataModel {
    /** @override */
    static defineSchema() {
        return {
            description: new HTMLField({initial: '', label: 'Description'}),
            notes: new HTMLField({initial: ''}),
            sort: new NumberField({initial: 0, integer: true, min: 0}),
            source: new HTMLField({initial: ''}),
            type: new StringField()
        };
    }

    /**
     * @type {Actor | null}
     */
    get actor() {
        return this.item.parent;
    }

    /**
     * @type {Item}
     */
    get item() {
        return this.parent;
    }

    /**
     * @type {string}
     */
    get subtype() {
        // @ts-expect-error
        return this.type ?? this.item.type;
    }

    /**
     * @type {boolean}
     */
    get visible() {
        return true;
    }

    /**
     * @type {boolean}
     */
    get canBeArtifact() {
        return [
            ItemType.ARMORGEAR,
            ItemType.CONTAINERGEAR,
            ItemType.MISCGEAR,
            ItemType.MISSILEGEAR,
            ItemType.WEAPONGEAR
        ].includes(this.item.type);
    }
    /**
     * @type {boolean}
     */
    get canBeEsotericCombat() {
        return [ItemType.INVOCATION, ItemType.PSIONIC, ItemType.SKILL, ItemType.SPELL].includes(this.item.type);
    }
    /**
     * @type {boolean}
     */
    get isEsotericCombat() {
        return (
            hm3.config.esotericCombatItems.attack.includes(this.item.name) ||
            hm3.config.esotericCombatItems.defense.includes(this.item.name)
        );
    }
    /**
     * @type {boolean}
     */
    get hasValue() {
        return false;
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
