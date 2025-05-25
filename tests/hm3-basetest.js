const SLOWMO = 3;

export class BaseTestHM3 {
    NORTH = {dx: 0, dy: -1};
    NORTH_EAST = {dx: 1, dy: -1};
    NORTH_WEST = {dx: -1, dy: -1};
    SOUTH = {dx: 0, dy: 1};
    SOUTH_EAST = {dx: 1, dy: 1};
    SOUTH_WEST = {dx: -1, dy: 1};

    actors = new Map();
    tokens = new Map();

    async _preSetup() {}
    async _postSetup() {}

    async _preTest() {}
    async _test() {}
    async _postTest() {}

    async _preTeardown() {}
    async _postTeardown() {}

    async #setup() {
        try {
            await this._preSetup();
        } catch (error) {
            return false;
        }

        try {
            console.log = () => {};
            console.debug = () => {};
            console.trace = () => {};

            await ChatMessage.deleteDocuments(game.messages.contents.map((m) => m.id));

            // some default actors
            this.actors.set('Alice', await this._createActor('Actor.JTK0gIOv6PfxeE1P', 'Alice'));
            this.actors.set('Bob', await this._createActor('Actor.6WYZs3HBnOOg3YXQ', 'Bob'));
        } catch (error) {
            return false;
        }

        try {
            await this._postSetup();
        } catch (error) {
            return false;
        }

        return true;
    }

    async start() {
        let success = await this.#setup();

        if (success) {
            try {
                await this._preTest();
            } catch (error) {
                success = false;
            }
            try {
                await this._wait(200);
                if (success) await this._test();
                await this._wait(200);
            } catch (error) {
                success = false;
            }
            try {
                if (success) await this._postTest();
            } catch (error) {}
        }

        return (await this.#teardown()) && success;
    }

    async #teardown() {
        let success = true;
        try {
            await this._preTeardown();
        } catch (error) {
            success = false;
        }

        try {
            for (const token of this.tokens.values()) await token.delete();
            for (const actor of this.actors.values()) await actor.delete();

            this.actors.clear();
            this.tokens.clear();

            if (game.combat) await game.combat.delete();
        } catch (error) {
            success = false;
        }

        try {
            await this._postTeardown();
        } catch (error) {
            success = false;
        }

        return success;
    }

    /**
     *
     * @param {string} actorUuid
     * @param {string} name
     * @param {Object} options
     * @returns {TokenHM3}
     */
    async _createActor(actorUuid, name, options = {}) {
        const actor = fromUuidSync(actorUuid);
        const actorObject = actor.toObject();

        actorObject.name = name;
        actorObject.folder = null;
        delete actorObject.flags['scene-packer'];

        this.actors.set(name, await Actor.create(actorObject));
        return this.actors.get(name);
    }

    async _dropActor(actor, data, dir = {dx: 0, dy: 0}) {
        data.uuid = actor.uuid;
        data.type = 'Actor';

        const tokenDoc = await canvas.tokens._onDropActorData({altKey: false, shiftKey: false}, data);
        this.tokens.set(tokenDoc.name, tokenDoc);

        await this._move(tokenDoc.object, dir);

        return tokenDoc.object;
    }

    async _move(token, dir = {dx: 0, dy: 0}) {
        token.control({releaseOthers: true});
        await game.canvas.activeLayer.moveMany(dir);
    }

    async _resetAllConditions(token) {
        Object.values(game.hm3.Condition).forEach((condition) => {
            token.deleteCondition(condition);
        });
        await token.combatant?.update({defeated: false});
        token.actor.toggleStatusEffect('dead', {active: false});
        token.actor.toggleStatusEffect('unconscious', {active: false});
        token.toggleVisibility({active: true});
        await this._wait();
    }

    async _startCombat() {
        await TokenDocument.createCombatants(this.tokens.values());
        await this._wait();
        await game.combat.startCombat();
        await this._wait();
    }

    /**
     *
     * @param {number} ms
     * @returns
     */
    async _wait(ms = 500) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, SLOWMO * ms);
        });
    }
}
