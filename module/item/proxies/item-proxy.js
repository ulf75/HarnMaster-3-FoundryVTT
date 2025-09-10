export class ItemProxy {
    constructor(item) {
        this._item = item;
        // this._actorProxy = null;
    }

    get item() {
        return this._item;
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

    get name() {
        return this._item.name;
    }

    get img() {
        return this._item.img;
    }

    get uuid() {
        return this._item.uuid;
    }

    get type() {
        return this._item.type;
    }

    get subtype() {
        return this._item.system.type ?? this.type;
    }

    get description() {
        return this._item.system.description;
    }

    get notes() {
        return this._item.system.notes;
    }

    get source() {
        return this._item.system.source;
    }

    get hasDescription() {
        return this.description && this.description.length > 0;
    }
}
