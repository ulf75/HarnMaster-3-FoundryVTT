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

    get subtype() {
        return this.type ?? this.parent.type;
    }

    /**
     * @type {boolean}
     */
    get visible() {
        return true;
    }

    static mergeSchema(a, b) {
        Object.assign(a, b);
        return a;
    }
}
