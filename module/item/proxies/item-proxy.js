export class ItemProxy {
    constructor(item) {
        this._item = item;
    }

    get item() {
        return this._item;
    }

    get actor() {
        return this._item.actor;
    }

    get id() {
        return this._item.id;
    }

    get name() {
        return this._item.name;
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

    get hasDescription() {
        return this.description && this.description.length > 0;
    }
}
