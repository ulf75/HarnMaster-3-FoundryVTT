import {ItemType} from '../../hm3-types';

export class ItemProxy {
    constructor(item) {
        this._item = item;
    }

    get cls() {
        return 'itemv2';
    }
    get actor() {
        return this._item.actor;
    }
    get actorProxy() {
        return this._item.actor.proxy;
    }
    get id() {
        return this._item.id;
    }
    get img() {
        return this._item.img;
    }
    get item() {
        return this._item;
    }
    get name() {
        return this._item.name;
    }
    get type() {
        return this._item.type;
    }
    get sort() {
        return this._item.sort || 0;
    }
    get uuid() {
        return this._item.uuid;
    }
    get visible() {
        return true;
    }

    get description() {
        return this._item.system.description;
    }
    get hasDescription() {
        return this.description && this.description.length > 0;
    }
    get notes() {
        return this._item.system.notes;
    }
    get source() {
        return this._item.system.source;
    }
    get subtype() {
        return this._item.system.type ?? this.type;
    }

    get canBeArtifact() {
        return [
            ItemType.ARMORGEAR,
            ItemType.CONTAINERGEAR,
            ItemType.MISCGEAR,
            ItemType.MISSILEGEAR,
            ItemType.WEAPONGEAR
        ].includes(this.type);
    }

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
