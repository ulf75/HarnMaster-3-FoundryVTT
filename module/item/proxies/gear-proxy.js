import {ItemType} from '../../hm3-types';
import {truncate} from '../../utility';
import {ItemProxy} from './item-proxy';

export class GearProxy extends ItemProxy {
    get cls() {
        return super.cls + '-gear';
    }
    get container() {
        return this._item.system.container;
    }
    get hasValue() {
        return true;
    }
    get isArtifact() {
        return this._item.isArtifact;
    }
    get isCarried() {
        return this._item.system.isCarried;
    }
    get isEquipped() {
        return this._item.system.isEquipped;
    }
    get isMajorArtifact() {
        return this._item.isMajorArtifact;
    }
    get isMinorArtifact() {
        return this._item.isMinorArtifact;
    }
    get quantity() {
        return this._item.system.quantity;
    }
    get value() {
        return this._item.system.value;
    }
    get weight() {
        return this._item.system.weight;
    }
    get weightT() {
        return truncate(this.weight, 3);
    }

    get label() {
        const gearTypes = {
            'armorgear': 'Armour',
            'containergear': 'Container',
            'effectgear': 'Effect',
            'miscgear': 'Misc. Gear',
            'missilegear': 'Missile Wpn',
            'weapongear': 'Melee Wpn'
        };
        const t = this._item.system.type || gearTypes[this.type];
        return t === 'Misc' ? 'Misc. Gear' : t;
    }

    get ariaLabelEquip() {
        if (this.type === ItemType.ARMORGEAR) return this.isEquipped ? `Doff ${this.name}` : `Don ${this.name}`;
        return this.isEquipped ? `Unequip ${this.name}` : `Equip ${this.name}`;
    }

    get ariaLabelCarry() {
        return this.isCarried ? `Drop ${this.name}` : `Carry ${this.name}`;
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
