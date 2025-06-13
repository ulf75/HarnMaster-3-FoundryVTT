const MIN_MS = 50; // minimum wait time in milliseconds
const SLOWMO = 1; // 1 = normal speed, 2 = half speed, etc.

export class BaseTestHM3 {
    NORTH = {dx: 0, dy: -1};
    NORTH_EAST = {dx: 1, dy: -1};
    NORTH_WEST = {dx: -1, dy: -1};
    SOUTH = {dx: 0, dy: 1};
    SOUTH_EAST = {dx: 1, dy: 1};
    SOUTH_WEST = {dx: -1, dy: 1};

    GM_USER_ID = 'uWIcxMD0zdnOha1B';
    ALICE_USER_ID = 'tzYR3eEvJND21kVc';
    INEN_USER_ID = 'ok0UravePcb5JK70';

    actors = new Map();
    tokens = new Map();

    async _prerequisites() {
        return true;
    }

    async _preSetup() {}
    async _postSetup() {}

    async _preTest() {}
    async _test() {}
    async _postTest() {}

    async _preTeardown() {}
    async _postTeardown() {}

    /**
     * Sets up the test environment, including deleting existing messages and combat, creating default actors, and preparing the console.
     * @private
     * @returns {Promise<boolean>} Returns true if setup was successful, false otherwise.
     */
    async #setup() {
        try {
            await this._preSetup();
        } catch (error) {
            console.error('Error in pre-setup:', error);
            return false;
        }

        try {
            console.log = () => {};
            console.debug = () => {};
            console.trace = () => {};

            await ChatMessage.deleteDocuments(game.messages.contents.map((m) => m.id));
            await game.combat?.delete();

            game.togglePause(false, true);

            // some default actors
            this.actors.set('Alice', await this._createActor('Actor.JTK0gIOv6PfxeE1P', 'Alice'));
            this.actors.set('Bob', await this._createActor('Actor.6WYZs3HBnOOg3YXQ', 'Bob'));
            this.actors.set('Inen', await this._createActor('Actor.xbdJx9yLoAAC6xUb', 'Inen'));
        } catch (error) {
            console.error('Error during setup:', error);
            return false;
        }

        try {
            await this._postSetup();
        } catch (error) {
            console.error('Error in post-setup:', error);
            return false;
        }

        return true;
    }

    /**
     * Starts the test by setting up the environment, running pre-test and post-test hooks, and tearing down the environment after the test.
     * @returns {Promise<boolean>} Returns true if the test was successful, false otherwise.
     */
    async start() {
        const pre = await this._prerequisites();
        if (pre !== true) {
            ui.notifications.error('Prerequisites not met, skipping test: ' + pre);
            return false;
        }

        let success = await this.#setup();

        if (success) {
            try {
                await this._preTest();
            } catch (error) {
                success = false;
                console.error('Error in pre-test:', error);
            }
            try {
                await this._wait();
                if (success) await this._test();
                await this._wait();
            } catch (error) {
                success = false;
                console.error('Error during test execution:', error);
            }
            try {
                if (success) await this._postTest();
            } catch (error) {
                console.error('Error in post-test:', error);
            }
        }

        await this._wait();
        success = (await this.#teardown()) && success;

        return success;
    }

    /**
     * Cleans up the test environment, deleting actors and tokens, and resetting combat.
     * @private
     * @returns {Promise<boolean>} Returns true if teardown was successful, false otherwise.
     */
    async #teardown() {
        let success = true;
        try {
            await this._preTeardown();
        } catch (error) {
            success = false;
            console.error('Error in pre-teardown:', error);
        }

        try {
            await game.combat?.delete();

            for (const token of this.tokens.values()) await token.delete();
            for (const actor of this.actors.values()) await actor.delete();

            this.actors.clear();
            this.tokens.clear();

            game.togglePause(true, true);
        } catch (error) {
            success = false;
            console.error('Error during teardown:', error);
        }

        try {
            await this._postTeardown();
        } catch (error) {
            success = false;
            console.error('Error in post-teardown:', error);
        }

        return success;
    }

    /**
     * Retrieves the defend buttons from a chat message by its number.
     * @param {number} messageNr - The index of the chat message to retrieve buttons from.
     * @returns {Array<Array<string, Object>>} An array of defend buttons with their associated data.
     */
    static DefButtonsFromChatMsgProxy(messageNr) {
        const html = document.createElement('div');
        html.innerHTML = game.messages.contents[messageNr].content;
        const htmlDefButtons = html.getElementsByClassName('card-buttons')[0].firstElementChild;

        return Array.from(htmlDefButtons.children)
            .filter((button) => {
                const actor = button.dataset.visibleActorId ? game.actors.get(button.dataset.visibleActorId) : null;
                if (!actor || !actor.isOwner) {
                    return false;
                }
                return true;
            })
            .map((button) => {
                return [
                    button.innerHTML,
                    {
                        action: button.dataset.action,
                        aim: button.dataset.aim,
                        aspect: button.dataset.aspect,
                        atkTokenId: button.dataset.atkTokenId,
                        button,
                        defTokenId: button.dataset.defTokenId,
                        effAml: button.dataset.effAml,
                        grappleAtk: button.dataset.grappleAtk,
                        impactMod: button.dataset.impactMod,
                        messageNr,
                        visibleActorId: button.dataset.visibleActorId,
                        weapon: button.dataset.weapon,
                        weaponType: button.dataset.weaponType
                    }
                ];
            });
    }

    /**
     * Retrieves the defend buttons from the latest chat message for a specific user.
     * @param {string} userId - The ID of the user to retrieve defend buttons for.
     * @param {number} messageNr - The index of the chat message to retrieve buttons from (default is the last message).
     * @returns {Promise<Map<string, Object>>} A map of defend buttons with their associated data.
     */
    async _defButtonsFromChatMsg(userId = game.user.id, messageNr = game.messages.contents.length - 1) {
        return game.hm3.socket.executeAsUser('defButtonsFromChatMsg', userId, messageNr);
    }

    static async DefActionProxy(def, {messageNr, roll}) {
        if (!['Block', 'Counterstrike', 'Dodge', 'Ignore'].includes(def)) return null;
        const defButtons = BaseTestHM3.DefButtonsFromChatMsgProxy(messageNr);
        const button = new Map(defButtons).get(def)?.button;
        if (!button) return null;

        game.hm3.Roll.D100_RESULTS.push(...roll);

        button.onclick = async (event) => {
            return CONFIG.Actor.documentClass._onChatCardAction({
                altKey: true,
                currentTarget: button,
                preventDefault: () => event.preventDefault()
            });
        };

        return Promise.all([
            new Promise((resolve) => {
                Hooks.once(`hm3.on${def}Resume`, (result) => {
                    resolve(result);
                });
            }),
            button.click()
        ]);
    }

    async _defAction(def, {messageNr = game.messages.contents.length - 1, unsetTAFlag = false, userId = game.user.id, roll = []} = {}) {
        if (unsetTAFlag) await game.hm3.socket.executeAsGM('unsetTAFlag');
        return game.hm3.socket.executeAsUser('defAction', userId, def, {messageNr, roll});
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
        actorObject.prototypeToken.name = name;
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
        await Promise.allSettled([game.canvas.activeLayer.moveMany(dir), this._wait(Math.max(SLOWMO * MIN_MS, 300) / SLOWMO)]);
    }

    /**
     * Resets all conditions on the token, including combatant status and visibility.
     * @param {TokenHM3} token - The token to reset conditions for.
     * @returns {Promise<void>}
     */
    async _resetAllConditions(token) {
        await Promise.all(
            Object.values(game.hm3.Condition).map(async (condition) => {
                await token.deleteCondition(condition);
            })
        );

        await token.combatant?.update({defeated: false});

        await token.toggleVisibility({active: true});
    }

    async _startCombat() {
        await TokenDocument.createCombatants(this.tokens.values());
        await game.combat.startCombat();
    }

    /**
     *
     * @param {number} ms
     * @returns
     */
    async _wait(ms = MIN_MS) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, SLOWMO * ms);
        });
    }
}
