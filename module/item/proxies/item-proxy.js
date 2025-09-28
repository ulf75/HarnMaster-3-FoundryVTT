// @ts-check
import {ActorHM3} from '../../actor/actor';
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
     * @type {ActorHM3 | null}
     */
    get actor() {
        return this.item.actor;
    }
    /**
     * @type {ActorProxy | null}
     */
    get aproxy() {
        return this.actor?.proxy ?? null;
    }
    /**
     * @type {string | null}
     */
    get id() {
        return this.item.id;
    }
    /**
     * @type {string | null}
     */
    get img() {
        return this.item.img;
    }
    /**
     * @type {ItemHM3}
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
    /**
     * @type {number}
     */
    get sort() {
        return this.item.sort || 0;
    }
    /**
     * @type {ChatMessage.SpeakerData}
     */
    get speaker() {
        // @ts-expect-error
        return ChatMessage.getSpeaker({actor: this.actor});
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

    get config() {
        return hm3.config;
    }
    /**
     * @type {string}
     */
    get description() {
        return this.item.system.description ?? '';
    }
    /**
     * @type {boolean}
     */
    get hasDescription() {
        return this.description.length > 0;
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
    /**
     * @type {boolean}
     */
    get isEsotericCombat() {
        return (
            this.config.esotericCombatItems.attack.includes(this.name) ||
            this.config.esotericCombatItems.defense.includes(this.name)
        );
    }

    /**
     *
     * @param {string} name
     * @returns {import('./skill-proxy').SkillProxy | null}
     */
    Skill(name) {
        // @ts-expect-error
        return (
            this.actor?.proxies.find(
                (item) => item.type === ItemType.SKILL && item.name.toLowerCase().includes(name.toLowerCase())
            ) ?? null
        );
    }

    /**
     * Prepare data for the Document. This method is called automatically by the DataModel#_initialize workflow.
     * This method provides an opportunity for Document classes to define special data preparation logic.
     * The work done by this method should be idempotent. There are situations in which prepareData may be called more
     * than once.
     */
    prepareData() {
        // @ts-expect-error
        this.item.system.v2 = {};
    }

    /**
     * After rendering, activate event listeners which provide interactivity for the Application.
     * This is where user-defined Application subclasses should attach their event-handling logic.
     * @param {JQuery} html
     */
    activateListeners(html) {}
}
