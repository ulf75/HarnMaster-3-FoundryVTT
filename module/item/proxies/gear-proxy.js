// @ts-check
import {ItemType} from '../../hm3-types';
import {truncate} from '../../utility';
import {ItemProxy} from './item-proxy';

export class GearProxy extends ItemProxy {
    /**
     * @type {string}
     */
    get cls() {
        return super.cls + '-gear';
    }
    /**
     * @type {string}
     */
    get container() {
        return this.item.system.container;
    }
    /**
     * @type {boolean}
     */
    get hasValue() {
        return true;
    }
    /**
     * @type {boolean}
     */
    get isArtifact() {
        return this.item.isArtifact;
    }
    /**
     * @type {boolean}
     */
    get isCarried() {
        return this.item.system.isCarried;
    }
    /**
     * @type {boolean}
     */
    get isEquipped() {
        return this.item.system.isEquipped;
    }
    /**
     * @type {boolean}
     */
    get isMajorArtifact() {
        return this.item.isMajorArtifact;
    }
    /**
     * @type {boolean}
     */
    get isMinorArtifact() {
        return this.item.isMinorArtifact;
    }
    /**
     * @type {number}
     */
    get quantity() {
        return this.item.system.quantity;
    }
    /**
     * @type {number}
     */
    get value() {
        return this.item.system.value;
    }
    /**
     * @type {number}
     */
    get weight() {
        return this.item.system.weight;
    }
    /**
     * @type {number}
     */
    get weightT() {
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
        const t = this.item.system.type || gearTypes[this.type];
        return t === 'Misc' ? 'Misc. Gear' : t;
    }
    /**
     * @type {string}
     */
    get ariaLabelEquip() {
        if (this.type === ItemType.ARMORGEAR) return this.isEquipped ? `Doff ${this.name}` : `Don ${this.name}`;
        return this.isEquipped ? `Unequip ${this.name}` : `Equip ${this.name}`;
    }
    /**
     * @type {string}
     */
    get ariaLabelCarry() {
        return this.isCarried ? `Drop ${this.name}` : `Carry ${this.name}`;
    }
    /**
     * @type {{label: string, key: string}[]}
     */
    get containers() {
        const containers = [{label: 'On Person', key: 'on-person'}];
        // Containers are not allowed in other containers.  So if this item is a container,
        // don't show any other containers.

        if (this.actor && this.type !== ItemType.CONTAINERGEAR) {
            this.actor.proxies.forEach((item) => {
                if (item.type === ItemType.CONTAINERGEAR) {
                    containers.push({label: item.name, key: item.id});
                }
            });
        }
        return containers;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.off('keyup', '.gear-name-filter');
        html.on('keyup', '.gear-name-filter', (ev) => {
            this.gearNameFilter = $(ev.currentTarget).val();
            const lcGearNameFilter = this.gearNameFilter.toLowerCase();
            let gearItems = html.find('.gear-item');
            for (let gear of gearItems) {
                const gearName = gear.getAttribute('data-item-name');
                if (lcGearNameFilter) {
                    if (gearName.toLowerCase().includes(lcGearNameFilter)) {
                        $(gear).show();
                    } else {
                        $(gear).hide();
                    }
                } else {
                    $(gear).show();
                }
            }
        });
    }
}
