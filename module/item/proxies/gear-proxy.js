// @ts-check
import {ArcanePower, ArcaneType, ItemType, SkillType} from '../../hm3-types';
import {truncate} from '../../utility';
import {ItemProxy} from './item-proxy';

/**
 * @class
 * @abstract
 * @extends ItemProxy
 */
export class GearProxy extends ItemProxy {
    /**
     * @type {string}
     * @override
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
        return this.item.system.arcane?.isArtifact ?? false;
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
        return this.isArtifact && this.item.system.arcane?.type === 'Major';
    }
    /**
     * @type {boolean}
     */
    get isMinorArtifact() {
        return this.isArtifact && this.item.system.arcane?.type === 'Minor';
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
    /**
     * @type {{key: string}[]}
     */
    get combatSkills() {
        const combatSkills = [];

        if (this.actor) {
            if (this.item.type === ItemType.WEAPONGEAR) {
                // For weapons, we add a "None" item to the front of the list
                // as a default (in case no other combat skill applies)
                combatSkills.push({key: 'None'});
            } else {
                // For missiles, we add the "Throwing" skill to the front
                // of the list as a default (in case no other combat
                // skill applies)
                combatSkills.push({key: 'Throwing'});
            }

            this.actor.itemTypes.skill.forEach((item) => {
                if (item.system.type === SkillType.COMBAT) {
                    const lcName = item.name.toLowerCase();
                    // Ignore the 'Dodge' and 'Initiative' skills,
                    // since you never want a weapon based on those skills.
                    if (!(lcName.includes('initiative') || lcName.includes('dodge') || lcName.includes('riding'))) {
                        combatSkills.push({key: item.name});
                    }
                }
            });
        }
        return combatSkills;
    }
    /**
     * @type {{power: ArcanePower}[]}
     */
    get powers() {
        if (this.isMinorArtifact) return [this.item.system.arcane.minor];
        else if (this.isMajorArtifact)
            return [
                this.item.system.arcane.major.power1,
                this.item.system.arcane.major.power2,
                this.item.system.arcane.major.power3,
                this.item.system.arcane.major.power4,
                this.item.system.arcane.major.power5
            ];
        else return [];
    }
    /**
     * @type {ArcaneType}
     */
    get arcaneType() {
        return this.item.system.arcane.type ?? ArcaneType.MINOR;
    }
    /**
     * @type {boolean}
     */
    get needsAttunement() {
        return this.item.system.arcane.needsAttunement ?? false;
    }
    /**
     * @type {boolean}
     */
    get isAttuned() {
        return this.item.system.arcane.isAttuned ?? false;
    }
    /**
     * @type {boolean}
     */
    get isOwnerAware() {
        return this.item.system.arcane.isOwnerAware ?? false;
    }
    /**
     * @type {{}}
     */
    get arcane() {
        return this.item.system.arcane;
    }
    /**
     * @type {number}
     */
    get charges() {
        return this.item.system.arcane.charges ?? -1;
    }
    /**
     * @type {number}
     */
    get morality() {
        return this.item.system.arcane.morality ?? -1;
    }
    /**
     * @type {boolean}
     */
    get naturalPersonality() {
        return this.item.system.arcane.naturalPersonality ?? false;
    }
    /**
     * @type {number}
     */
    get EGO() {
        return this.item.system.arcane.ego ?? 0;
    }

    /**
     * Check if the item has an arcane power.
     * @param {ArcanePower} power - The power to check for.
     * @returns {boolean} True if the item has the specified arcane power, false otherwise.
     * */
    hasArcanePower(power) {
        return !!this.getArcanePower(power);
    }

    /**
     * Get the arcane power object for the specified power.
     * @param {ArcanePower} power - The power to get.
     * @returns {{power: ArcanePower, duration: string, isOwnerAware: boolean} | null} The arcane power object or null if not found.
     * */
    getArcanePower(power) {
        if (this.isArtifact) {
            const arcane = this.powers.find((p) => p.power.startsWith(power));
            if (arcane)
                return foundry.utils.mergeObject(
                    arcane,
                    hm3.config.arcanePowers.find((p) => p.key === arcane.power)
                );
            else return {power: ArcanePower.NONE, duration: 'Permanent', isOwnerAware: false};
        }
        return null;
    }

    /**
     * @param {JQuery} html
     * @override
     */
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
                    if (gearName && gearName.toLowerCase().includes(lcGearNameFilter)) {
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
