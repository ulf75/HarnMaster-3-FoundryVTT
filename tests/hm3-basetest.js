export class HarnMasterBaseTest {
    _Alice = null;
    _Bob = null;

    async _preSetup() {}
    async _postSetup() {}

    async _preTest() {}
    async _test() {}
    async _postTest() {}

    async _preTeardown() {}
    async _postTeardown() {}

    async #setup() {
        await this._preSetup();

        // some default actors
        this._Alice = await this._createActor('Actor.JTK0gIOv6PfxeE1P', 'Alice');
        this._Bob = await this._createActor('Actor.6WYZs3HBnOOg3YXQ', 'Bob');

        await this._postSetup();
    }

    async start() {
        await this.#setup();

        await this._preTest();
        await this._test();
        await this._postTest();

        await this.#teardown();
    }

    async #teardown() {
        await this._preTeardown();

        await this._Alice.delete();
        await this._Bob.delete();

        await this._postTeardown();
    }

    /**
     *
     * @param {string} actorUuid
     * @param {string} name
     * @param {Object} options
     * @returns
     */
    async _createActor(actorUuid, name, options = {}) {
        const actor = await fromUuid(actorUuid);
        const actorObject = actor.toObject();

        actorObject.name = name;
        actorObject.folder = null;

        return Actor.create(actorObject);
    }
}
