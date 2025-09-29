import {ItemType} from '../../hm3-types';

// @ts-check
const {BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
export class ItemDataModel extends foundry.abstract.TypeDataModel {
    /** @override */
    static defineSchema() {
        return {
            description: new StringField({initial: ''}),
            notes: new StringField({initial: ''}),
            source: new StringField({initial: ''}),
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
