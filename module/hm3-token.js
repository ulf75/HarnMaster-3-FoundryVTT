import * as macros from './macros.js';
import {Mutex} from './mutex.js';

let tokenMutex;

/**
 * Extend the base Token.
 * @extends {Token}
 */
export class HarnMasterToken extends Token {
    constructor(...args) {
        super(...args);
        if (!tokenMutex) tokenMutex = new Mutex();
    }

    /** @override */
    _onClickLeft(event) {
        if (event.shiftKey && event.ctrlKey) super._onClickLeft2(event);
        else super._onClickLeft(event);
    }

    /** @override */
    _onClickRight(event) {
        if (event.shiftKey && event.ctrlKey) super._onClickRight2(event);
        else super._onClickRight(event);
    }

    /**
     *
     * @param {Condition} condition
     * @returns
     */
    async addCondition(condition) {
        return macros.createCondition(this, condition);
    }

    /**
     *
     * @param {Condition} condition
     * @returns
     */
    hasCondition(condition) {
        return macros.hasActiveEffect(this, condition, true);
    }

    /**
     *
     * @param {Condition} condition
     * @returns
     */
    getCondition(condition) {
        return macros.getActiveEffect(this, condition, true);
    }

    /**
     *
     * @param {Condition} condition
     * @param {number} [postpone=0]
     * @returns
     */
    async disableCondition(condition, postpone = 0) {
        if (postpone > 0) {
            // avoid race conditions
            setTimeout(() => tokenMutex.runExclusive(async () => await this.getCondition(condition)?.update({disabled: true})), postpone);
        } else {
            return this.getCondition(condition)?.update({disabled: true});
        }
    }

    /**
     * Deletes a condition from a token.
     * @param {Condition} condition
     * @param {number} [postpone=0]
     * @returns
     */
    async deleteCondition(condition, postpone = 0) {
        if (postpone > 0) {
            // avoid race conditions
            setTimeout(() => tokenMutex.runExclusive(async () => await this.getCondition(condition)?.delete()), postpone);
        } else {
            return this.getCondition(condition)?.delete();
        }
    }

    /**
     *
     * @returns true, if token belongs to a player
     */
    hasPlayer() {
        return this.actor.hasPlayerOwner();
    }

    /**
     *
     */
    get player() {
        return game.users.find((u) => !u.isGM && this.actor.testUserPermission(u, 'OWNER')) || null;
    }

    hasInjury(id) {
        return !!token.actor.items.find((i) => i.id === id);
    }

    pronoun(capital = false) {
        const p = () => {
            if (!this.actor.system.gender) return 'It';
            return this.actor.system.gender === 'Male' ? 'His' : 'Her';
        };
        return capital ? p() : p().toLowerCase();
    }

    async toggleVisibility(options = {}) {
        let isHidden = options?.active !== undefined ? options.active : this.document.hidden;
        const tokens = this.controlled ? canvas.tokens.controlled : [this];
        const updates = tokens.map((t) => {
            return {_id: t.id, hidden: !isHidden};
        });
        return canvas.scene.updateEmbeddedDocuments('Token', updates);
    }
}

export class HarnMasterTokenDocument extends TokenDocument {
    /**
     *
     * @param {Condition} condition
     * @returns
     */
    async addCondition(condition) {
        return this.object.addCondition(condition);
    }

    /**
     *
     * @param {Condition} condition
     * @returns
     */
    hasCondition(condition) {
        return this.object.hasCondition(condition);
    }

    /**
     *
     * @param {Condition} condition
     * @returns
     */
    getCondition(condition) {
        return this.object.getCondition(condition);
    }

    /**
     *
     * @param {Condition} condition
     * @param {number} [postpone=0]
     * @returns
     */
    async disableCondition(condition, postpone = 0) {
        return this.object.disableCondition(condition, postpone);
    }

    /**
     * Deletes a condition from a token.
     * @param {Condition} condition
     * @param {number} [postpone=0]
     * @returns
     */
    async deleteCondition(condition, postpone = 0) {
        return this.object.deleteCondition(condition, postpone);
    }

    hasPlayer() {
        return this.object.hasPlayer();
    }

    get player() {
        return this.object.player;
    }

    hasInjury(id) {
        return this.object.hasInjury(id);
    }

    pronoun(capital = false) {
        return this.object.pronoun(capital);
    }

    async toggleVisibility(options = {}) {
        return this.object.toggleVisibility(options);
    }
}
