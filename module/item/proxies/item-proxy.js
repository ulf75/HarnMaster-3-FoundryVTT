// @ts-check
import {ActorProxy} from '../../actor/proxies/actor-proxy';
import {ItemType, SkillType} from '../../hm3-types';
import {ItemHM3} from '../item';

/**
 * @class
 * @abstract
 */
export class ItemProxy {
    /** @type {ItemHM3} */
    #item;

    /**
     *
     * @param {ItemHM3} item
     */
    constructor(item) {
        this.#item = item;
    }

    /**
     * @type {string}
     */
    get cls() {
        return 'itemv2';
    }
    /**
     * @type {Actor}
     */
    get actor() {
        return this.item.actor;
    }
    /**
     * @type {ActorProxy}
     */
    get actorProxy() {
        return this.actor.proxy;
    }
    /**
     * @type {string}
     */
    get id() {
        return this.item.id;
    }
    /**
     * @type {string}
     */
    get img() {
        return this.item.img;
    }
    /**
     * @type {Item}
     */
    get item() {
        return this.#item;
    }
    /**
     * @type {string}
     */
    get name() {
        return this.item.name;
    }
    /**
     * @type {ItemType}
     */
    get type() {
        return this.item.type;
    }
    get sort() {
        return this.item.sort || 0;
    }
    /**
     * @type {string}
     */
    get uuid() {
        return this.item.uuid;
    }
    /**
     * @type {boolean}
     */
    get visible() {
        return true;
    }

    /**
     * @type {string}
     */
    get description() {
        return this.item.system.description;
    }
    /**
     * @type {boolean}
     */
    get hasDescription() {
        return !!this.description && this.description.length > 0;
    }
    /**
     * @type {string}
     */
    get notes() {
        return this.item.system.notes;
    }
    /**
     * @type {string}
     */
    get source() {
        return this.item.system.source;
    }
    /**
     * @type {SkillType | ItemType}
     */
    get subtype() {
        return this.item.system.type ?? this.type;
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

    Skill(name) {
        return this.actor.proxies.find(
            (item) => item.type === ItemType.SKILL && item.name.toLowerCase().includes(name.toLowerCase())
        );
    }

    activateListeners(html) {}
}
