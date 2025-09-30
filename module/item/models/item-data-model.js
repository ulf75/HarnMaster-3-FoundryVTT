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

// @ts-check
const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class ItemDataModel extends foundry.abstract.TypeDataModel {
    /** @override */
    static defineSchema() {
        return {
            description: new HTMLField({initial: '', label: 'Description'}),
            notes: new HTMLField({initial: ''}),
            sort: new NumberField({initial: 0}),
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
        return this.type ?? this.parent.type;
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
        ].includes(this.type);
    }
    /**
     * @type {boolean}
     */
    get canBeEsotericCombat() {
        return [ItemType.INVOCATION, ItemType.PSIONIC, ItemType.SKILL, ItemType.SPELL].includes(this.type);
    }
    /**
     * @type {boolean}
     */
    get isEsotericCombat() {
        return (
            hm3.config.esotericCombatItems.attack.includes(this.name) ||
            hm3.config.esotericCombatItems.defense.includes(this.name)
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
        // @ts-expect-error
        return (
            this.actor?.items.find(
                (item) => item.type === ItemType.SKILL && item.name.toLowerCase().includes(name.toLowerCase())
            ) ?? null
        );
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
