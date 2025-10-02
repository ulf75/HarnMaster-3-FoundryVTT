// @ts-check
import {ArcaneType, ItemType} from '../../hm3-types';
import {truncate} from '../../utility';
import {ItemDataModel} from './item-data-model';

const {ArrayField, BooleanField, HTMLField, NumberField, SchemaField, StringField} = foundry.data.fields;
/**
 * @abstract
 */
export class GearDataModel extends ItemDataModel {
    /** @override */
    static defineSchema() {
        return this.mergeSchema(super.defineSchema(), {
            arcane: new SchemaField({
                charges: new NumberField({initial: -1, integer: true, min: -1}),
                ego: new NumberField({initial: 0, integer: true, min: 0, max: 18}),
                isAttuned: new BooleanField({initial: false}),
                isOwnerAware: new BooleanField({initial: false}),
                major: new SchemaField({
                    power1: new StringField({}),
                    power2: new StringField({}),
                    power3: new StringField({}),
                    power4: new StringField({}),
                    power5: new StringField({})
                }),
                minor: new StringField({}),
                morality: new NumberField({initial: -1, integer: true, min: -1, max: 18}),
                naturalPersonality: new BooleanField({initial: false}),
                needsAttunement: new BooleanField({initial: false}),
                type: new StringField({initial: ArcaneType.MINOR})
            }),
            container: new StringField({initial: ''}),
            isCarried: new BooleanField({initial: true}),
            isEquipped: new BooleanField({initial: true}),
            quantity: new NumberField({initial: 1, min: 0, integer: true}),
            value: new NumberField({initial: 0, min: 0}),
            weight: new NumberField({initial: 0, min: 0})
        });
    }

    /**
     * @type {boolean}
     * @override
     */
    get hasValue() {
        return true;
    }

    /**
     * Truncated weight
     * @type {number}
     */
    get weightT() {
        // @ts-expect-error
        return truncate(this.weight, 3);
    }
    /**
     * @type {string}
     */
    get label() {
        const gearTypes = {
            'armorgear': 'Armour',
            'containergear': 'Container',
            'effectgear': 'Effect',
            'miscgear': 'Misc. Gear',
            'missilegear': 'Missile Wpn',
            'weapongear': 'Melee Wpn'
        };
        const t = this.type || gearTypes[this.item.type];
        return t === 'Misc' ? 'Misc. Gear' : t;
    }
    /**
     * @type {string}
     */
    get ariaLabelEquip() {
        if (this.item.type === ItemType.ARMORGEAR)
            return this.isEquipped ? `Doff ${this.item.name}` : `Don ${this.item.name}`;
        return this.isEquipped ? `Unequip ${this.item.name}` : `Equip ${this.item.name}`;
    }
    /**
     * @type {string}
     */
    get ariaLabelCarry() {
        return this.isCarried ? `Drop ${this.item.name}` : `Carry ${this.item.name}`;
    }
    /**
     * @type {{label: string, key: string}[]}
     */
    get containers() {
        const containers = [{label: 'On Person', key: 'on-person'}];

        // NOTE: Containers are not allowed in other containers.
        // So if this item is a container, don't show any other containers.
        if (this.actor && this.item.type !== ItemType.CONTAINERGEAR) {
            this.actor.items.forEach((item) => {
                if (item.type === ItemType.CONTAINERGEAR) {
                    containers.push({label: item.name, key: item.id ?? ''});
                }
            });
        }
        return containers;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
    }

    /** @override */
    prepareDerivedData() {
        super.prepareDerivedData();
    }
}
